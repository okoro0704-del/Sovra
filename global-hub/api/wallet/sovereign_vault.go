// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Sovereign Vault Module
//
// Manages user SOV balances for biometric payments and integrity dividends.
// Simplified single-balance wallet for autonomous vitality-based transactions.

package wallet

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// SovereignVault represents a user's SOV balance
type SovereignVault struct {
	UserID    string    `json:"user_id"`
	DID       string    `json:"did"`              // did:sovra:{country}:{identifier}
	Balance   int64     `json:"balance"`          // uSOV
	Status    string    `json:"status"`           // "verified", "pending", "suspended"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// VaultTransaction represents a vault transaction
type VaultTransaction struct {
	TransactionID string                 `json:"transaction_id"`
	UserID        string                 `json:"user_id"`
	DID           string                 `json:"did"`
	Type          string                 `json:"type"`           // "credit", "debit"
	Amount        int64                  `json:"amount"`         // uSOV
	BalanceBefore int64                  `json:"balance_before"`
	BalanceAfter  int64                  `json:"balance_after"`
	Purpose       string                 `json:"purpose"`        // "fast_track", "standard", "integrity_dividend", etc.
	PFFHash       string                 `json:"pff_hash,omitempty"` // Associated PFF hash (for payments)
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	Timestamp     time.Time              `json:"timestamp"`
	Status        string                 `json:"status"`         // "success", "failed"
}

// SovereignVaultManager manages user vaults
type SovereignVaultManager struct {
	vaults       map[string]*SovereignVault
	transactions map[string]*VaultTransaction
	mu           sync.RWMutex
}

// NewSovereignVaultManager creates a new vault manager
func NewSovereignVaultManager() *SovereignVaultManager {
	return &SovereignVaultManager{
		vaults:       make(map[string]*SovereignVault),
		transactions: make(map[string]*VaultTransaction),
	}
}

// GetOrCreateVault gets or creates a vault for a user
func (svm *SovereignVaultManager) GetOrCreateVault(ctx context.Context, userID string, did string) (*SovereignVault, error) {
	svm.mu.Lock()
	defer svm.mu.Unlock()

	// Check if vault exists
	if vault, exists := svm.vaults[userID]; exists {
		return vault, nil
	}

	// Create new vault
	vault := &SovereignVault{
		UserID:    userID,
		DID:       did,
		Balance:   0,
		Status:    "pending", // Becomes "verified" after first successful PFF scan
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	svm.vaults[userID] = vault
	return vault, nil
}

// GetVault gets a vault by user ID
func (svm *SovereignVaultManager) GetVault(ctx context.Context, userID string) (*SovereignVault, error) {
	svm.mu.RLock()
	defer svm.mu.RUnlock()

	vault, exists := svm.vaults[userID]
	if !exists {
		return nil, fmt.Errorf("vault not found for user: %s", userID)
	}

	return vault, nil
}

// CreditVault credits a user's vault
func (svm *SovereignVaultManager) CreditVault(ctx context.Context, userID string, amount int64, purpose string) (string, error) {
	svm.mu.Lock()
	defer svm.mu.Unlock()

	vault, exists := svm.vaults[userID]
	if !exists {
		return "", fmt.Errorf("vault not found for user: %s", userID)
	}

	// Record balance before
	balanceBefore := vault.Balance

	// Credit balance
	vault.Balance += amount
	vault.UpdatedAt = time.Now()

	// Create transaction record
	txID := uuid.New().String()
	tx := &VaultTransaction{
		TransactionID: txID,
		UserID:        userID,
		DID:           vault.DID,
		Type:          "credit",
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  vault.Balance,
		Purpose:       purpose,
		Timestamp:     time.Now(),
		Status:        "success",
	}

	svm.transactions[txID] = tx

	return txID, nil
}

// DebitVault debits a user's vault
func (svm *SovereignVaultManager) DebitVault(ctx context.Context, userID string, amount int64, purpose string, pffHash string) (string, error) {
	svm.mu.Lock()
	defer svm.mu.Unlock()

	vault, exists := svm.vaults[userID]
	if !exists {
		return "", fmt.Errorf("vault not found for user: %s", userID)
	}

	// Check sufficient balance
	if vault.Balance < amount {
		return "", fmt.Errorf("insufficient balance: have %d uSOV, need %d uSOV", vault.Balance, amount)
	}

	// Record balance before
	balanceBefore := vault.Balance

	// Debit balance
	vault.Balance -= amount
	vault.UpdatedAt = time.Now()

	// Create transaction record
	txID := uuid.New().String()
	tx := &VaultTransaction{
		TransactionID: txID,
		UserID:        userID,
		DID:           vault.DID,
		Type:          "debit",
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  vault.Balance,
		Purpose:       purpose,
		PFFHash:       pffHash,
		Timestamp:     time.Now(),
		Status:        "success",
	}

	svm.transactions[txID] = tx

	return txID, nil
}

// GetVerifiedDIDs returns all DIDs with "verified" status
// Used by dividend distributor to determine eligible recipients
func (svm *SovereignVaultManager) GetVerifiedDIDs(ctx context.Context) ([]string, error) {
	svm.mu.RLock()
	defer svm.mu.RUnlock()

	var verifiedDIDs []string
	for _, vault := range svm.vaults {
		if vault.Status == "verified" {
			verifiedDIDs = append(verifiedDIDs, vault.DID)
		}
	}

	return verifiedDIDs, nil
}

// UpdateVaultStatus updates a vault's status
func (svm *SovereignVaultManager) UpdateVaultStatus(ctx context.Context, userID string, status string) error {
	svm.mu.Lock()
	defer svm.mu.Unlock()

	vault, exists := svm.vaults[userID]
	if !exists {
		return fmt.Errorf("vault not found for user: %s", userID)
	}

	// Validate status
	validStatuses := map[string]bool{
		"pending":   true,
		"verified":  true,
		"suspended": true,
	}

	if !validStatuses[status] {
		return fmt.Errorf("invalid status: %s", status)
	}

	vault.Status = status
	vault.UpdatedAt = time.Now()

	return nil
}

// GetTransactionHistory gets transaction history for a user
func (svm *SovereignVaultManager) GetTransactionHistory(ctx context.Context, userID string, limit int) ([]*VaultTransaction, error) {
	svm.mu.RLock()
	defer svm.mu.RUnlock()

	var userTxs []*VaultTransaction
	for _, tx := range svm.transactions {
		if tx.UserID == userID {
			userTxs = append(userTxs, tx)
		}
	}

	// In production, sort by timestamp (most recent first)
	if len(userTxs) > limit && limit > 0 {
		userTxs = userTxs[:limit]
	}

	return userTxs, nil
}

// GetVaultByDID gets a vault by DID
func (svm *SovereignVaultManager) GetVaultByDID(ctx context.Context, did string) (*SovereignVault, error) {
	svm.mu.RLock()
	defer svm.mu.RUnlock()

	for _, vault := range svm.vaults {
		if vault.DID == did {
			return vault, nil
		}
	}

	return nil, fmt.Errorf("vault not found for DID: %s", did)
}

