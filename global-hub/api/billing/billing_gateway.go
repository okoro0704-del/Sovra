package billing

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// BillingGateway is the main billing service for SOVRN Hub
type BillingGateway struct {
	priceOracle *PriceOracle
	autoSwapper *AutoSwapper
	walletMgr   *WalletManager
}

// PurchaseUnitsRequest represents a request to purchase SOV units with fiat
type PurchaseUnitsRequest struct {
	UserID        string                 `json:"user_id"`
	UserType      string                 `json:"user_type"` // "individual", "enterprise"
	Currency      string                 `json:"currency"`
	FiatAmount    float64                `json:"fiat_amount"`
	PaymentMethod string                 `json:"payment_method"` // "card", "bank_transfer", "mobile_money"
	PaymentDetails map[string]interface{} `json:"payment_details,omitempty"`
}

// PurchaseUnitsResponse represents the response from a purchase request
type PurchaseUnitsResponse struct {
	PurchaseID      string    `json:"purchase_id"`
	UserID          string    `json:"user_id"`
	UserType        string    `json:"user_type"`
	Currency        string    `json:"currency"`
	FiatAmount      float64   `json:"fiat_amount"`
	ExchangeRate    float64   `json:"exchange_rate"`
	USOVAmount      int64     `json:"usov_amount"`
	SOVAmount       float64   `json:"sov_amount"`
	WalletType      string    `json:"wallet_type"`
	RegularBalance  int64     `json:"regular_balance"`
	EscrowBalance   int64     `json:"escrow_balance"`
	TotalBalance    int64     `json:"total_balance"`
	TransactionHash string    `json:"transaction_hash"`
	Status          string    `json:"status"`
	Timestamp       time.Time `json:"timestamp"`
	Message         string    `json:"message,omitempty"`
}

// NewBillingGateway creates a new billing gateway
func NewBillingGateway() *BillingGateway {
	priceOracle := NewPriceOracle()
	walletMgr := NewWalletManager()
	autoSwapper := NewAutoSwapper(priceOracle, walletMgr)

	return &BillingGateway{
		priceOracle: priceOracle,
		autoSwapper: autoSwapper,
		walletMgr:   walletMgr,
	}
}

// PurchaseUnits handles fiat-to-SOV purchases
// This is the main entry point for the billing gateway
func (bg *BillingGateway) PurchaseUnits(ctx context.Context, req *PurchaseUnitsRequest) (*PurchaseUnitsResponse, error) {
	purchaseID := uuid.New().String()

	// 1. Validate request
	if err := bg.validatePurchaseRequest(req); err != nil {
		return &PurchaseUnitsResponse{
			PurchaseID: purchaseID,
			UserID:     req.UserID,
			Status:     "failed",
			Message:    fmt.Sprintf("Validation failed: %v", err),
			Timestamp:  time.Now(),
		}, err
	}

	// 2. Ensure wallet exists
	wallet, err := bg.walletMgr.GetOrCreateWallet(ctx, req.UserID, req.UserType)
	if err != nil {
		return &PurchaseUnitsResponse{
			PurchaseID: purchaseID,
			UserID:     req.UserID,
			Status:     "failed",
			Message:    fmt.Sprintf("Failed to get/create wallet: %v", err),
			Timestamp:  time.Now(),
		}, err
	}

	// 3. Process simulated fiat payment
	// MOCK: In production, integrate with payment processors:
	// - Stripe (cards)
	// - Plaid (bank transfers)
	// - Flutterwave (mobile money in Africa)
	paymentSuccess, paymentErr := bg.processSimulatedPayment(ctx, req)
	if !paymentSuccess {
		return &PurchaseUnitsResponse{
			PurchaseID: purchaseID,
			UserID:     req.UserID,
			Status:     "failed",
			Message:    fmt.Sprintf("Payment failed: %v", paymentErr),
			Timestamp:  time.Now(),
		}, paymentErr
	}

	// 4. Auto-swap fiat to SOV
	swapReq := &SwapRequest{
		RequestID:     purchaseID,
		UserID:        req.UserID,
		UserType:      req.UserType,
		Currency:      req.Currency,
		FiatAmount:    req.FiatAmount,
		PaymentMethod: req.PaymentMethod,
		Timestamp:     time.Now(),
	}

	swapResult, err := bg.autoSwapper.SwapFiatToSOV(ctx, swapReq)
	if err != nil {
		return &PurchaseUnitsResponse{
			PurchaseID: purchaseID,
			UserID:     req.UserID,
			Status:     "failed",
			Message:    fmt.Sprintf("Swap failed: %v", err),
			Timestamp:  time.Now(),
		}, err
	}

	// 5. Get updated wallet balance
	updatedWallet, _ := bg.walletMgr.GetWallet(ctx, req.UserID)

	// 6. Build success response
	message := fmt.Sprintf("Successfully purchased %.6f SOV", swapResult.SOVAmount)
	if req.UserType == "enterprise" {
		message += " (credited to escrow wallet - restricted to PFF fees only)"
	}

	return &PurchaseUnitsResponse{
		PurchaseID:      purchaseID,
		UserID:          req.UserID,
		UserType:        req.UserType,
		Currency:        req.Currency,
		FiatAmount:      req.FiatAmount,
		ExchangeRate:    swapResult.ExchangeRate,
		USOVAmount:      swapResult.USOVAmount,
		SOVAmount:       swapResult.SOVAmount,
		WalletType:      swapResult.WalletType,
		RegularBalance:  updatedWallet.RegularBalance,
		EscrowBalance:   updatedWallet.EscrowBalance,
		TotalBalance:    updatedWallet.TotalBalance,
		TransactionHash: swapResult.TransactionHash,
		Status:          "success",
		Timestamp:       time.Now(),
		Message:         message,
	}, nil
}

// validatePurchaseRequest validates a purchase request
func (bg *BillingGateway) validatePurchaseRequest(req *PurchaseUnitsRequest) error {
	if req.UserID == "" {
		return fmt.Errorf("user_id is required")
	}

	if req.UserType != "individual" && req.UserType != "enterprise" {
		return fmt.Errorf("user_type must be 'individual' or 'enterprise'")
	}

	if req.Currency == "" {
		return fmt.Errorf("currency is required")
	}

	if req.FiatAmount <= 0 {
		return fmt.Errorf("fiat_amount must be positive")
	}

	if req.PaymentMethod == "" {
		return fmt.Errorf("payment_method is required")
	}

	return nil
}

// processSimulatedPayment simulates fiat payment processing
// MOCK: In production, integrate with real payment processors
func (bg *BillingGateway) processSimulatedPayment(ctx context.Context, req *PurchaseUnitsRequest) (bool, error) {
	// Simulate payment processing delay
	time.Sleep(100 * time.Millisecond)

	// MOCK: Always succeed for demonstration
	// In production, this would:
	// 1. Call Stripe/Flutterwave/Plaid API
	// 2. Verify payment details
	// 3. Process payment
	// 4. Handle webhooks for async confirmation
	// 5. Return payment status

	fmt.Printf("MOCK PAYMENT: Processing %s %.2f via %s\n", req.Currency, req.FiatAmount, req.PaymentMethod)

	// Simulate payment success
	return true, nil
}

// GetWallet returns a user's wallet
func (bg *BillingGateway) GetWallet(ctx context.Context, userID string) (*SovereignWallet, error) {
	return bg.walletMgr.GetWallet(ctx, userID)
}

// GetExchangeRates returns all current exchange rates
func (bg *BillingGateway) GetExchangeRates(ctx context.Context) (map[string]*ExchangeRate, error) {
	return bg.priceOracle.GetAllRates(ctx)
}

// GetExchangeRate returns the exchange rate for a specific currency
func (bg *BillingGateway) GetExchangeRate(ctx context.Context, currency string) (*ExchangeRate, error) {
	return bg.priceOracle.GetExchangeRate(ctx, currency)
}

// GetTransactionHistory returns transaction history for a user
func (bg *BillingGateway) GetTransactionHistory(ctx context.Context, userID string, limit int) ([]*WalletTransaction, error) {
	return bg.walletMgr.GetTransactionHistory(ctx, userID, limit)
}

// GetBillingStats returns billing gateway statistics
func (bg *BillingGateway) GetBillingStats(ctx context.Context) map[string]interface{} {
	walletStats := bg.walletMgr.GetWalletStats()

	return map[string]interface{}{
		"wallet_stats": walletStats,
		"oracle_status": map[string]interface{}{
			"last_update": bg.priceOracle.lastUpdate,
			"update_interval": bg.priceOracle.updateInterval.String(),
		},
	}
}

// WithdrawToExchange allows individual users to withdraw SOV to external exchange
// Enterprise users CANNOT withdraw escrow balance (anti-dumping)
func (bg *BillingGateway) WithdrawToExchange(ctx context.Context, userID string, amount int64, exchangeAddress string) (string, error) {
	wallet, err := bg.walletMgr.GetWallet(ctx, userID)
	if err != nil {
		return "", err
	}

	// Enterprise users can only withdraw from regular balance, NOT escrow
	if wallet.UserType == "enterprise" {
		if wallet.RegularBalance < amount {
			return "", fmt.Errorf("insufficient regular balance for withdrawal: have %d uSOV, need %d uSOV (escrow balance cannot be withdrawn)", wallet.RegularBalance, amount)
		}
	}

	// Debit regular wallet
	txID, err := bg.walletMgr.DebitRegular(ctx, userID, amount, "withdrawal_to_exchange")
	if err != nil {
		return "", err
	}

	// MOCK: In production, send tokens to exchange address via blockchain
	fmt.Printf("MOCK WITHDRAWAL: Sending %d uSOV to %s\n", amount, exchangeAddress)

	return txID, nil
}

// PayPFFFee pays a PFF verification fee
// This is called by the fast-track service when a verification occurs
func (bg *BillingGateway) PayPFFFee(ctx context.Context, userID string, feeAmount int64) (string, error) {
	return bg.walletMgr.PayPFFFeeSmart(ctx, userID, feeAmount)
}


