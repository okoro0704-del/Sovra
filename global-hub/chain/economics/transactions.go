// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
//
// Package economics implements the Proxy Payment Protocol for third-party fee payments.
// This allows airports, airlines, and other entities to pay PFF verification fees on behalf
// of travelers while ensuring the traveler still receives credit for being verified.

package economics

import (
	"context"
	"fmt"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/google/uuid"
)

// Status codes for proxy payment protocol
const (
	STATUS_INSUFFICIENT_FUNDS_PROXY_REQUIRED = "insufficient_funds_proxy_required"
	STATUS_VERIFIED_PASSAGE_SUCCESS          = "verified_passage_success"
	STATUS_PROXY_PAYMENT_SUCCESS             = "proxy_payment_success"
	STATUS_SUFFICIENT_FUNDS                  = "sufficient_funds"
)

// ProxyPaymentRequest represents a request for third-party payment
type ProxyPaymentRequest struct {
	TravelerDID string    // DID of the traveler being verified
	ProxyDID    string    // DID of the entity paying (airport, airline, etc.)
	Fee         int64     // Fee amount in uSOV
	PFFHash     string    // Hash of the PFF verification
	Timestamp   time.Time // Request timestamp
}

// ProxyPaymentResult represents the result of a proxy payment
type ProxyPaymentResult struct {
	TransactionID       string    // Unique transaction ID
	TravelerDID         string    // DID of the traveler
	ProxyDID            string    // DID of the proxy payer
	Fee                 int64     // Fee amount in uSOV
	TravelerStatus      string    // Status: "verified_passage_success"
	ProxyBalanceBefore  int64     // Proxy balance before payment
	ProxyBalanceAfter   int64     // Proxy balance after payment
	FourPillarsSplit    bool      // Confirms ExecuteFourWaySplit triggered
	VitalianRecordID    string    // ID of the Vitalian record created
	Timestamp           time.Time // Transaction timestamp
}

// VitalianRecord represents a traveler's verification record
// This tracks verification history independently of who paid
type VitalianRecord struct {
	RecordID            string    // Unique record ID
	TravelerDID         string    // DID of the traveler
	VerificationStatus  string    // Status: "verified_passage_success"
	PaymentMethod       string    // "self" or "proxy"
	ProxyDID            string    // DID of proxy payer (if proxy payment)
	TransactionID       string    // Associated transaction ID
	PFFHash             string    // Hash of the PFF verification
	Timestamp           time.Time // Verification timestamp
}

// BalanceCheckResult represents the result of a balance check
type BalanceCheckResult struct {
	HasSufficientFunds bool   // True if balance >= required fee
	Status             string // Status code
	CurrentBalance     int64  // Current balance in uSOV
	RequiredFee        int64  // Required fee in uSOV
	Shortfall          int64  // Amount short (if insufficient)
}

// VaultManager interface for wallet operations
type VaultManager interface {
	GetVault(ctx context.Context, userID string) (*SovereignVault, error)
	DebitVault(ctx context.Context, userID string, amount int64, purpose string, pffHash string) (string, error)
}

// SovereignVault represents a user's wallet
type SovereignVault struct {
	UserID    string
	DID       string
	Balance   int64
	Status    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// ProxyPaymentProtocol implements the proxy payment system
type ProxyPaymentProtocol struct {
	vaultMgr        VaultManager
	economicsKernel *QuadraticSovereignSplit
	vitalianRecords map[string]*VitalianRecord // In-memory storage (use DB in production)
}

// NewProxyPaymentProtocol creates a new proxy payment protocol instance
func NewProxyPaymentProtocol(vaultMgr VaultManager, economicsKernel *QuadraticSovereignSplit) *ProxyPaymentProtocol {
	return &ProxyPaymentProtocol{
		vaultMgr:        vaultMgr,
		economicsKernel: economicsKernel,
		vitalianRecords: make(map[string]*VitalianRecord),
	}
}

// CheckBalanceBeforeTransaction validates user has sufficient funds
// Returns STATUS_INSUFFICIENT_FUNDS_PROXY_REQUIRED if balance < fee
//
// PARAMETERS:
// - ctx: Context
// - userDID: DID of the user
// - requiredFee: Required fee amount in uSOV
//
// RETURNS:
// - BalanceCheckResult with status and balance information
func (ppp *ProxyPaymentProtocol) CheckBalanceBeforeTransaction(
	ctx context.Context,
	userDID string,
	requiredFee int64,
) (*BalanceCheckResult, error) {
	// Get user vault
	vault, err := ppp.vaultMgr.GetVault(ctx, userDID)
	if err != nil {
		return &BalanceCheckResult{
			HasSufficientFunds: false,
			Status:             STATUS_INSUFFICIENT_FUNDS_PROXY_REQUIRED,
			CurrentBalance:     0,
			RequiredFee:        requiredFee,
			Shortfall:          requiredFee,
		}, fmt.Errorf("vault not found for DID %s: %w", userDID, err)
	}

	// Check if balance is sufficient
	if vault.Balance < requiredFee {
		return &BalanceCheckResult{
			HasSufficientFunds: false,
			Status:             STATUS_INSUFFICIENT_FUNDS_PROXY_REQUIRED,
			CurrentBalance:     vault.Balance,
			RequiredFee:        requiredFee,
			Shortfall:          requiredFee - vault.Balance,
		}, nil
	}

	return &BalanceCheckResult{
		HasSufficientFunds: true,
		Status:             STATUS_SUFFICIENT_FUNDS,
		CurrentBalance:     vault.Balance,
		RequiredFee:        requiredFee,
		Shortfall:          0,
	}, nil
}

// ExecuteProxyPayment handles third-party payment on behalf of traveler
// Debits proxy (airport) wallet, credits traveler's verification record
//
// PROXY HANDSHAKE LOGIC:
// 1. Debit airport/airline wallet for the full fee
// 2. Create verification record for traveler (credit for being verified)
// 3. Trigger ExecuteFourWaySplit for fee distribution
// 4. Mark traveler as Verified_Passage_Success
//
// PARAMETERS:
// - ctx: Cosmos SDK context
// - travelerDID: DID of the traveler being verified
// - proxyDID: DID of the entity paying (airport, airline, etc.)
// - fee: Fee amount in uSOV
// - pffHash: Hash of the PFF verification
//
// RETURNS:
// - ProxyPaymentResult with transaction details
func (ppp *ProxyPaymentProtocol) ExecuteProxyPayment(
	ctx sdk.Context,
	travelerDID string,
	proxyDID string,
	fee int64,
	pffHash string,
) (*ProxyPaymentResult, error) {
	// 1. Get proxy (airport) vault and check balance
	proxyVault, err := ppp.vaultMgr.GetVault(context.Background(), proxyDID)
	if err != nil {
		return nil, fmt.Errorf("proxy vault not found for DID %s: %w", proxyDID, err)
	}

	if proxyVault.Balance < fee {
		return nil, fmt.Errorf("proxy has insufficient funds: balance=%d, required=%d", proxyVault.Balance, fee)
	}

	proxyBalanceBefore := proxyVault.Balance

	// 2. DEBIT AIRPORT WALLET: Deduct fee from proxy's Sovereign_Vault
	txID, err := ppp.vaultMgr.DebitVault(
		context.Background(),
		proxyDID,
		fee,
		fmt.Sprintf("proxy_payment_for_traveler_%s", travelerDID),
		pffHash,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to debit proxy wallet: %w", err)
	}

	// 3. CREATE VITALIAN RECORD: Credit traveler's verification record
	vitalianRecordID, err := ppp.RecordVitalianPassage(ctx, travelerDID, proxyDID, txID, pffHash)
	if err != nil {
		return nil, fmt.Errorf("failed to create Vitalian record: %w", err)
	}

	// 4. TRIGGER FOUR PILLARS SPLIT: Ensure ExecuteFourWaySplit distributes fees
	feeCoins := sdk.NewCoins(sdk.NewCoin("usov", sdk.NewInt(fee)))
	err = ppp.economicsKernel.ExecuteFourWaySplit(ctx, feeCoins, "fee_collector")
	if err != nil {
		return nil, fmt.Errorf("failed to execute four-way split: %w", err)
	}

	// 5. Get updated proxy balance
	proxyVaultAfter, _ := ppp.vaultMgr.GetVault(context.Background(), proxyDID)
	proxyBalanceAfter := proxyVaultAfter.Balance

	// 6. Return result
	return &ProxyPaymentResult{
		TransactionID:      txID,
		TravelerDID:        travelerDID,
		ProxyDID:           proxyDID,
		Fee:                fee,
		TravelerStatus:     STATUS_VERIFIED_PASSAGE_SUCCESS,
		ProxyBalanceBefore: proxyBalanceBefore,
		ProxyBalanceAfter:  proxyBalanceAfter,
		FourPillarsSplit:   true,
		VitalianRecordID:   vitalianRecordID,
		Timestamp:          time.Now(),
	}, nil
}

// RecordVitalianPassage marks traveler as verified even when proxy paid
// This ensures travel history stays clean regardless of payment method
//
// VITALIAN RECORD LOGIC:
// - Creates verification record for traveler
// - Marks as STATUS_VERIFIED_PASSAGE_SUCCESS
// - Links to proxy payment transaction
// - Preserves travel history integrity
//
// PARAMETERS:
// - ctx: Cosmos SDK context
// - travelerDID: DID of the traveler
// - proxyDID: DID of the proxy payer
// - txID: Transaction ID of the proxy payment
// - pffHash: Hash of the PFF verification
//
// RETURNS:
// - Record ID of the created Vitalian record
func (ppp *ProxyPaymentProtocol) RecordVitalianPassage(
	ctx sdk.Context,
	travelerDID string,
	proxyDID string,
	txID string,
	pffHash string,
) (string, error) {
	// Create Vitalian record
	recordID := uuid.New().String()
	record := &VitalianRecord{
		RecordID:           recordID,
		TravelerDID:        travelerDID,
		VerificationStatus: STATUS_VERIFIED_PASSAGE_SUCCESS,
		PaymentMethod:      "proxy",
		ProxyDID:           proxyDID,
		TransactionID:      txID,
		PFFHash:            pffHash,
		Timestamp:          time.Now(),
	}

	// Store record (in-memory for now, use database in production)
	ppp.vitalianRecords[recordID] = record

	// Emit event for transparency
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			"vitalian_passage_recorded",
			sdk.NewAttribute("record_id", recordID),
			sdk.NewAttribute("traveler_did", travelerDID),
			sdk.NewAttribute("verification_status", STATUS_VERIFIED_PASSAGE_SUCCESS),
			sdk.NewAttribute("payment_method", "proxy"),
			sdk.NewAttribute("proxy_did", proxyDID),
			sdk.NewAttribute("transaction_id", txID),
			sdk.NewAttribute("pff_hash", pffHash),
		),
	)

	return recordID, nil
}

// GetVitalianRecord retrieves a Vitalian record by ID
func (ppp *ProxyPaymentProtocol) GetVitalianRecord(recordID string) (*VitalianRecord, error) {
	record, exists := ppp.vitalianRecords[recordID]
	if !exists {
		return nil, fmt.Errorf("Vitalian record not found: %s", recordID)
	}
	return record, nil
}

// GetTravelerVerificationHistory retrieves all verification records for a traveler
func (ppp *ProxyPaymentProtocol) GetTravelerVerificationHistory(travelerDID string) []*VitalianRecord {
	var records []*VitalianRecord
	for _, record := range ppp.vitalianRecords {
		if record.TravelerDID == travelerDID {
			records = append(records, record)
		}
	}
	return records
}

