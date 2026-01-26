package billing

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// AutoSwapper handles automatic fiat-to-SOV conversion
type AutoSwapper struct {
	priceOracle *PriceOracle
	walletMgr   *WalletManager
}

// SwapRequest represents a fiat-to-SOV swap request
type SwapRequest struct {
	RequestID    string    `json:"request_id"`
	UserID       string    `json:"user_id"`
	UserType     string    `json:"user_type"` // "individual", "enterprise"
	Currency     string    `json:"currency"`
	FiatAmount   float64   `json:"fiat_amount"`
	PaymentMethod string   `json:"payment_method"` // "card", "bank_transfer", "mobile_money"
	Timestamp    time.Time `json:"timestamp"`
}

// SwapResult represents the result of a fiat-to-SOV swap
type SwapResult struct {
	RequestID       string    `json:"request_id"`
	UserID          string    `json:"user_id"`
	Currency        string    `json:"currency"`
	FiatAmount      float64   `json:"fiat_amount"`
	ExchangeRate    float64   `json:"exchange_rate"`    // uSOV per fiat unit
	USOVAmount      int64     `json:"usov_amount"`
	SOVAmount       float64   `json:"sov_amount"`
	WalletType      string    `json:"wallet_type"`      // "regular", "escrow"
	TransactionHash string    `json:"transaction_hash"`
	Status          string    `json:"status"`           // "success", "failed", "pending"
	Timestamp       time.Time `json:"timestamp"`
	ErrorMessage    string    `json:"error_message,omitempty"`
}

// NewAutoSwapper creates a new auto-swapper
func NewAutoSwapper(priceOracle *PriceOracle, walletMgr *WalletManager) *AutoSwapper {
	return &AutoSwapper{
		priceOracle: priceOracle,
		walletMgr:   walletMgr,
	}
}

// SwapFiatToSOV performs automatic fiat-to-SOV conversion
func (as *AutoSwapper) SwapFiatToSOV(ctx context.Context, req *SwapRequest) (*SwapResult, error) {
	// 1. Validate request
	if err := as.validateSwapRequest(req); err != nil {
		return &SwapResult{
			RequestID:    req.RequestID,
			UserID:       req.UserID,
			Status:       "failed",
			ErrorMessage: err.Error(),
			Timestamp:    time.Now(),
		}, err
	}

	// 2. Get current exchange rate from oracle
	rate, err := as.priceOracle.GetExchangeRate(ctx, req.Currency)
	if err != nil {
		return &SwapResult{
			RequestID:    req.RequestID,
			UserID:       req.UserID,
			Status:       "failed",
			ErrorMessage: fmt.Sprintf("Failed to get exchange rate: %v", err),
			Timestamp:    time.Now(),
		}, err
	}

	// 3. Calculate SOV amount
	uSOVAmount, err := as.priceOracle.CalculateSOVAmount(ctx, req.Currency, req.FiatAmount)
	if err != nil {
		return &SwapResult{
			RequestID:    req.RequestID,
			UserID:       req.UserID,
			Status:       "failed",
			ErrorMessage: fmt.Sprintf("Failed to calculate SOV amount: %v", err),
			Timestamp:    time.Now(),
		}, err
	}

	// 4. Determine wallet type based on user type
	walletType := "regular"
	if req.UserType == "enterprise" {
		walletType = "escrow"
	}

	// 5. Credit user's wallet
	var txHash string
	if walletType == "escrow" {
		// Enterprise users: credit to escrow wallet (restricted)
		txHash, err = as.walletMgr.CreditEscrow(ctx, req.UserID, uSOVAmount, "fiat_purchase")
	} else {
		// Individual users: credit to regular wallet (unrestricted)
		txHash, err = as.walletMgr.CreditRegular(ctx, req.UserID, uSOVAmount, "fiat_purchase")
	}

	if err != nil {
		return &SwapResult{
			RequestID:    req.RequestID,
			UserID:       req.UserID,
			Currency:     req.Currency,
			FiatAmount:   req.FiatAmount,
			Status:       "failed",
			ErrorMessage: fmt.Sprintf("Failed to credit wallet: %v", err),
			Timestamp:    time.Now(),
		}, err
	}

	// 6. Return successful swap result
	return &SwapResult{
		RequestID:       req.RequestID,
		UserID:          req.UserID,
		Currency:        req.Currency,
		FiatAmount:      req.FiatAmount,
		ExchangeRate:    rate.USOVPerUnit,
		USOVAmount:      uSOVAmount,
		SOVAmount:       float64(uSOVAmount) / 1000000.0,
		WalletType:      walletType,
		TransactionHash: txHash,
		Status:          "success",
		Timestamp:       time.Now(),
	}, nil
}

// validateSwapRequest validates a swap request
func (as *AutoSwapper) validateSwapRequest(req *SwapRequest) error {
	if req.UserID == "" {
		return fmt.Errorf("user_id is required")
	}

	if req.Currency == "" {
		return fmt.Errorf("currency is required")
	}

	if req.FiatAmount <= 0 {
		return fmt.Errorf("fiat_amount must be positive")
	}

	if req.UserType != "individual" && req.UserType != "enterprise" {
		return fmt.Errorf("user_type must be 'individual' or 'enterprise'")
	}

	// Validate minimum purchase amount (prevent spam)
	minAmounts := map[string]float64{
		"USD": 10.0,  // Minimum $10
		"NGN": 5000.0, // Minimum ₦5,000
		"EUR": 10.0,
		"GBP": 10.0,
	}

	if minAmount, exists := minAmounts[req.Currency]; exists {
		if req.FiatAmount < minAmount {
			return fmt.Errorf("minimum purchase amount for %s is %.2f", req.Currency, minAmount)
		}
	}

	return nil
}

