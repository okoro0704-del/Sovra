package billing

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// WalletManager manages Sovereign Wallets with regular and escrow balances
type WalletManager struct {
	wallets map[string]*SovereignWallet
	mu      sync.RWMutex

	// Transaction history
	transactions map[string]*WalletTransaction
}

// SovereignWallet represents a user's wallet with regular and escrow balances
type SovereignWallet struct {
	UserID          string    `json:"user_id"`
	UserType        string    `json:"user_type"` // "individual", "enterprise"
	RegularBalance  int64     `json:"regular_balance"`  // uSOV - can be withdrawn
	EscrowBalance   int64     `json:"escrow_balance"`   // uSOV - restricted to PFF fees
	TotalBalance    int64     `json:"total_balance"`    // regular + escrow
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// WalletTransaction represents a wallet transaction
type WalletTransaction struct {
	TransactionID   string    `json:"transaction_id"`
	UserID          string    `json:"user_id"`
	Type            string    `json:"type"`            // "credit", "debit"
	WalletType      string    `json:"wallet_type"`     // "regular", "escrow"
	Amount          int64     `json:"amount"`          // uSOV
	BalanceBefore   int64     `json:"balance_before"`
	BalanceAfter    int64     `json:"balance_after"`
	Purpose         string    `json:"purpose"`         // "fiat_purchase", "pff_fee", "withdrawal", etc.
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
	Timestamp       time.Time `json:"timestamp"`
	Status          string    `json:"status"`          // "success", "failed", "pending"
}

// NewWalletManager creates a new wallet manager
func NewWalletManager() *WalletManager {
	return &WalletManager{
		wallets:      make(map[string]*SovereignWallet),
		transactions: make(map[string]*WalletTransaction),
	}
}

// GetOrCreateWallet gets or creates a wallet for a user
func (wm *WalletManager) GetOrCreateWallet(ctx context.Context, userID string, userType string) (*SovereignWallet, error) {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	// Check if wallet exists
	if wallet, exists := wm.wallets[userID]; exists {
		return wallet, nil
	}

	// Create new wallet
	wallet := &SovereignWallet{
		UserID:         userID,
		UserType:       userType,
		RegularBalance: 0,
		EscrowBalance:  0,
		TotalBalance:   0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	wm.wallets[userID] = wallet
	return wallet, nil
}

// GetWallet gets a wallet by user ID
func (wm *WalletManager) GetWallet(ctx context.Context, userID string) (*SovereignWallet, error) {
	wm.mu.RLock()
	defer wm.mu.RUnlock()

	wallet, exists := wm.wallets[userID]
	if !exists {
		return nil, fmt.Errorf("wallet not found for user: %s", userID)
	}

	return wallet, nil
}

// CreditRegular credits a user's regular wallet (unrestricted)
func (wm *WalletManager) CreditRegular(ctx context.Context, userID string, amount int64, purpose string) (string, error) {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	wallet, exists := wm.wallets[userID]
	if !exists {
		return "", fmt.Errorf("wallet not found for user: %s", userID)
	}

	// Record balance before
	balanceBefore := wallet.RegularBalance

	// Credit regular balance
	wallet.RegularBalance += amount
	wallet.TotalBalance += amount
	wallet.UpdatedAt = time.Now()

	// Create transaction record
	txID := uuid.New().String()
	tx := &WalletTransaction{
		TransactionID: txID,
		UserID:        userID,
		Type:          "credit",
		WalletType:    "regular",
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.RegularBalance,
		Purpose:       purpose,
		Timestamp:     time.Now(),
		Status:        "success",
	}

	wm.transactions[txID] = tx

	return txID, nil
}

// CreditEscrow credits a user's escrow wallet (restricted to PFF fees)
func (wm *WalletManager) CreditEscrow(ctx context.Context, userID string, amount int64, purpose string) (string, error) {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	wallet, exists := wm.wallets[userID]
	if !exists {
		return "", fmt.Errorf("wallet not found for user: %s", userID)
	}

	// Escrow is only for enterprise users
	if wallet.UserType != "enterprise" {
		return "", fmt.Errorf("escrow wallet is only available for enterprise users")
	}

	// Record balance before
	balanceBefore := wallet.EscrowBalance

	// Credit escrow balance
	wallet.EscrowBalance += amount
	wallet.TotalBalance += amount
	wallet.UpdatedAt = time.Now()

	// Create transaction record
	txID := uuid.New().String()
	tx := &WalletTransaction{
		TransactionID: txID,
		UserID:        userID,
		Type:          "credit",
		WalletType:    "escrow",
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.EscrowBalance,
		Purpose:       purpose,
		Timestamp:     time.Now(),
		Status:        "success",
	}

	wm.transactions[txID] = tx

	return txID, nil
}

// DebitRegular debits a user's regular wallet (for withdrawals, transfers, etc.)
func (wm *WalletManager) DebitRegular(ctx context.Context, userID string, amount int64, purpose string) (string, error) {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	wallet, exists := wm.wallets[userID]
	if !exists {
		return "", fmt.Errorf("wallet not found for user: %s", userID)
	}

	// Check sufficient balance
	if wallet.RegularBalance < amount {
		return "", fmt.Errorf("insufficient regular balance: have %d uSOV, need %d uSOV", wallet.RegularBalance, amount)
	}

	// Record balance before
	balanceBefore := wallet.RegularBalance

	// Debit regular balance
	wallet.RegularBalance -= amount
	wallet.TotalBalance -= amount
	wallet.UpdatedAt = time.Now()

	// Create transaction record
	txID := uuid.New().String()
	tx := &WalletTransaction{
		TransactionID: txID,
		UserID:        userID,
		Type:          "debit",
		WalletType:    "regular",
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.RegularBalance,
		Purpose:       purpose,
		Timestamp:     time.Now(),
		Status:        "success",
	}

	wm.transactions[txID] = tx

	return txID, nil
}

// DebitEscrow debits a user's escrow wallet (ONLY for PFF fees)
// This enforces the anti-dumping restriction for enterprise users
func (wm *WalletManager) DebitEscrow(ctx context.Context, userID string, amount int64, purpose string) (string, error) {
	wm.mu.Lock()
	defer wm.mu.Unlock()

	wallet, exists := wm.wallets[userID]
	if !exists {
		return "", fmt.Errorf("wallet not found for user: %s", userID)
	}

	// CRITICAL: Escrow can ONLY be used for PFF fees
	if purpose != "pff_fee" {
		return "", fmt.Errorf("escrow balance can only be used for PFF verification fees (attempted: %s)", purpose)
	}

	// Check sufficient balance
	if wallet.EscrowBalance < amount {
		return "", fmt.Errorf("insufficient escrow balance: have %d uSOV, need %d uSOV", wallet.EscrowBalance, amount)
	}

	// Record balance before
	balanceBefore := wallet.EscrowBalance

	// Debit escrow balance
	wallet.EscrowBalance -= amount
	wallet.TotalBalance -= amount
	wallet.UpdatedAt = time.Now()

	// Create transaction record
	txID := uuid.New().String()
	tx := &WalletTransaction{
		TransactionID: txID,
		UserID:        userID,
		Type:          "debit",
		WalletType:    "escrow",
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  wallet.EscrowBalance,
		Purpose:       purpose,
		Timestamp:     time.Now(),
		Status:        "success",
	}

	wm.transactions[txID] = tx

	return txID, nil
}

// PayPFFFeeSmart pays a PFF verification fee using the optimal wallet strategy
// For enterprise users: use escrow first, then regular
// For individual users: use regular only
func (wm *WalletManager) PayPFFFeeSmart(ctx context.Context, userID string, feeAmount int64) (string, error) {
	wallet, err := wm.GetWallet(ctx, userID)
	if err != nil {
		return "", err
	}

	// Check total balance
	if wallet.TotalBalance < feeAmount {
		return "", fmt.Errorf("insufficient total balance: have %d uSOV, need %d uSOV", wallet.TotalBalance, feeAmount)
	}

	var txID string

	if wallet.UserType == "enterprise" {
		// Enterprise: Use escrow first (anti-dumping enforcement)
		if wallet.EscrowBalance >= feeAmount {
			// Pay entirely from escrow
			txID, err = wm.DebitEscrow(ctx, userID, feeAmount, "pff_fee")
		} else if wallet.EscrowBalance > 0 {
			// Pay partially from escrow, rest from regular
			escrowAmount := wallet.EscrowBalance
			regularAmount := feeAmount - escrowAmount

			// Debit escrow
			_, err1 := wm.DebitEscrow(ctx, userID, escrowAmount, "pff_fee")
			if err1 != nil {
				return "", err1
			}

			// Debit regular
			txID, err = wm.DebitRegular(ctx, userID, regularAmount, "pff_fee")
		} else {
			// Pay entirely from regular
			txID, err = wm.DebitRegular(ctx, userID, feeAmount, "pff_fee")
		}
	} else {
		// Individual: Use regular wallet only
		txID, err = wm.DebitRegular(ctx, userID, feeAmount, "pff_fee")
	}

	return txID, err
}

// GetTransactionHistory gets transaction history for a user
func (wm *WalletManager) GetTransactionHistory(ctx context.Context, userID string, limit int) ([]*WalletTransaction, error) {
	wm.mu.RLock()
	defer wm.mu.RUnlock()

	var userTxs []*WalletTransaction
	for _, tx := range wm.transactions {
		if tx.UserID == userID {
			userTxs = append(userTxs, tx)
		}
	}

	// Sort by timestamp (most recent first)
	// In production, use proper sorting
	if len(userTxs) > limit {
		userTxs = userTxs[:limit]
	}

	return userTxs, nil
}

// GetWalletStats returns wallet statistics
func (wm *WalletManager) GetWalletStats() map[string]interface{} {
	wm.mu.RLock()
	defer wm.mu.RUnlock()

	totalWallets := len(wm.wallets)
	totalRegularBalance := int64(0)
	totalEscrowBalance := int64(0)
	enterpriseWallets := 0
	individualWallets := 0

	for _, wallet := range wm.wallets {
		totalRegularBalance += wallet.RegularBalance
		totalEscrowBalance += wallet.EscrowBalance

		if wallet.UserType == "enterprise" {
			enterpriseWallets++
		} else {
			individualWallets++
		}
	}

	return map[string]interface{}{
		"total_wallets":         totalWallets,
		"enterprise_wallets":    enterpriseWallets,
		"individual_wallets":    individualWallets,
		"total_regular_balance": totalRegularBalance,
		"total_escrow_balance":  totalEscrowBalance,
		"total_balance":         totalRegularBalance + totalEscrowBalance,
		"total_transactions":    len(wm.transactions),
	}
}
