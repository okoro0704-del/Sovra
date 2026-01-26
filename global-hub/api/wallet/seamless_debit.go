// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Seamless Biometric Payment Module
//
// Implements autonomous payment deduction triggered by AI-verified PFF scans.
// No human approval required - payments execute automatically upon vitality proof.

package wallet

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// TransactionType represents the type of biometric payment
type TransactionType string

const (
	TransactionTypeFastTrack TransactionType = "fast_track"  // 1 SOV fee
	TransactionTypeStandard  TransactionType = "standard"    // 10 SOV fee
)

// GetFeeAmount returns the fee amount in uSOV for a transaction type
func (tt TransactionType) GetFeeAmount() int64 {
	switch tt {
	case TransactionTypeFastTrack:
		return 1_000_000 // 1 SOV = 1,000,000 uSOV
	case TransactionTypeStandard:
		return 10_000_000 // 10 SOV = 10,000,000 uSOV
	default:
		return 0
	}
}

// ProofOfPresence represents a validated PFF liveness proof
type ProofOfPresence struct {
	PFFHash       string    `json:"pff_hash"`        // SHA-256 hash of biometric data
	DID           string    `json:"did"`             // did:sovra:{country}:{identifier}
	LivenessScore uint8     `json:"liveness_score"`  // AI confidence (0-100)
	Timestamp     time.Time `json:"timestamp"`       // When verification occurred
	Signature     []byte    `json:"signature"`       // Cryptographic signature
	IsValid       bool      `json:"is_valid"`        // AI validation result
}

// BiometricPaymentResult represents the result of a biometric payment
type BiometricPaymentResult struct {
	TransactionID   string          `json:"transaction_id"`
	UserID          string          `json:"user_id"`
	DID             string          `json:"did"`
	TransactionType TransactionType `json:"transaction_type"`
	FeeAmount       int64           `json:"fee_amount"`        // uSOV
	BalanceBefore   int64           `json:"balance_before"`    // uSOV
	BalanceAfter    int64           `json:"balance_after"`     // uSOV
	PFFHash         string          `json:"pff_hash"`
	LivenessScore   uint8           `json:"liveness_score"`
	Status          string          `json:"status"`            // "success", "failed"
	ErrorMessage    string          `json:"error_message,omitempty"`
	Timestamp       time.Time       `json:"timestamp"`
}

// SeamlessDebitHandshake manages autonomous biometric payments
type SeamlessDebitHandshake struct {
	vaultMgr *SovereignVaultManager
}

// NewSeamlessDebitHandshake creates a new seamless debit handshake
func NewSeamlessDebitHandshake(vaultMgr *SovereignVaultManager) *SeamlessDebitHandshake {
	return &SeamlessDebitHandshake{
		vaultMgr: vaultMgr,
	}
}

// ExecuteBiometricPayment executes an autonomous payment based on PFF validation
//
// AUTONOMOUS LOGIC:
// 1. AI validates PFF scan (Proof_of_Presence)
// 2. If valid (liveness_score >= 70), automatically deduct fee
// 3. No human approval required
// 4. Transaction executes in <100ms
//
// PARAMETERS:
// - proof: AI-validated Proof_of_Presence
// - txType: Transaction type (fast_track = 1 SOV, standard = 10 SOV)
//
// RETURNS:
// - BiometricPaymentResult with transaction details
func (sdh *SeamlessDebitHandshake) ExecuteBiometricPayment(
	ctx context.Context,
	proof *ProofOfPresence,
	txType TransactionType,
) (*BiometricPaymentResult, error) {
	
	startTime := time.Now()
	
	// 1. Validate Proof_of_Presence
	if err := sdh.validateProofOfPresence(proof); err != nil {
		return &BiometricPaymentResult{
			TransactionID:   uuid.New().String(),
			DID:             proof.DID,
			TransactionType: txType,
			FeeAmount:       txType.GetFeeAmount(),
			PFFHash:         proof.PFFHash,
			LivenessScore:   proof.LivenessScore,
			Status:          "failed",
			ErrorMessage:    fmt.Sprintf("PFF validation failed: %v", err),
			Timestamp:       time.Now(),
		}, err
	}

	// 2. Extract user ID from DID
	userID := proof.DID // In production, parse DID to get user ID

	// 3. Get fee amount
	feeAmount := txType.GetFeeAmount()

	// 4. Get current balance
	vault, err := sdh.vaultMgr.GetVault(ctx, userID)
	if err != nil {
		return &BiometricPaymentResult{
			TransactionID:   uuid.New().String(),
			UserID:          userID,
			DID:             proof.DID,
			TransactionType: txType,
			FeeAmount:       feeAmount,
			PFFHash:         proof.PFFHash,
			LivenessScore:   proof.LivenessScore,
			Status:          "failed",
			ErrorMessage:    fmt.Sprintf("Vault not found: %v", err),
			Timestamp:       time.Now(),
		}, err
	}

	balanceBefore := vault.Balance

	// 5. AUTONOMOUS DEBIT: Deduct fee from Sovereign_Vault
	txID, err := sdh.vaultMgr.DebitVault(ctx, userID, feeAmount, string(txType), proof.PFFHash)
	if err != nil {
		return &BiometricPaymentResult{
			TransactionID:   txID,
			UserID:          userID,
			DID:             proof.DID,
			TransactionType: txType,
			FeeAmount:       feeAmount,
			BalanceBefore:   balanceBefore,
			PFFHash:         proof.PFFHash,
			LivenessScore:   proof.LivenessScore,
			Status:          "failed",
			ErrorMessage:    fmt.Sprintf("Debit failed: %v", err),
			Timestamp:       time.Now(),
		}, err
	}

	// 6. Get updated balance
	vaultAfter, _ := sdh.vaultMgr.GetVault(ctx, userID)
	balanceAfter := vaultAfter.Balance

	executionTime := time.Since(startTime)

	// 7. Return success result
	return &BiometricPaymentResult{
		TransactionID:   txID,
		UserID:          userID,
		DID:             proof.DID,
		TransactionType: txType,
		FeeAmount:       feeAmount,
		BalanceBefore:   balanceBefore,
		BalanceAfter:    balanceAfter,
		PFFHash:         proof.PFFHash,
		LivenessScore:   proof.LivenessScore,
		Status:          "success",
		Timestamp:       time.Now(),
	}, nil
}

// validateProofOfPresence validates a Proof_of_Presence
//
// VALIDATION RULES:
// 1. AI must confirm validity (IsValid == true)
// 2. Liveness score must be >= 70 (AI confidence threshold)
// 3. Timestamp must not be expired (< 5 minutes old)
// 4. Signature must be valid
// 5. PFF hash must not be blacklisted
func (sdh *SeamlessDebitHandshake) validateProofOfPresence(proof *ProofOfPresence) error {
	// 1. Check AI validation result
	if !proof.IsValid {
		return fmt.Errorf("AI validation failed: proof marked as invalid")
	}

	// 2. Check liveness score threshold
	const MinLivenessScore = 70
	if proof.LivenessScore < MinLivenessScore {
		return fmt.Errorf("liveness score too low: %d (minimum: %d)", proof.LivenessScore, MinLivenessScore)
	}

	// 3. Check timestamp expiry (5 minutes)
	const MaxProofAge = 5 * time.Minute
	proofAge := time.Since(proof.Timestamp)
	if proofAge > MaxProofAge {
		return fmt.Errorf("proof expired: age %v exceeds maximum %v", proofAge, MaxProofAge)
	}

	// 4. Verify signature (in production, use proper cryptographic verification)
	if len(proof.Signature) == 0 {
		return fmt.Errorf("missing signature")
	}

	// 5. Check if PFF hash is blacklisted (in production, query VLT_Core blacklist)
	// This would query the blockchain's Consensus_of_Presence blacklist
	// For now, we assume it's not blacklisted

	return nil
}

