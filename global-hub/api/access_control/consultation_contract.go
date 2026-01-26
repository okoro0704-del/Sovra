// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Consultation Smart Contract
//
// Implements escrow-based professional consultation system.
// Citizens hire professionals for 50 SOV, payment held until service delivery.

package access_control

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ConsultationStatus represents the status of a consultation
type ConsultationStatus string

const (
	StatusPending    ConsultationStatus = "pending"     // Payment in escrow, awaiting service
	StatusInProgress ConsultationStatus = "in_progress" // Professional working on consultation
	StatusCompleted  ConsultationStatus = "completed"   // Service delivered, payment released
	StatusDisputed   ConsultationStatus = "disputed"    // Dispute raised by citizen
	StatusCancelled  ConsultationStatus = "cancelled"   // Cancelled before completion
	StatusRefunded   ConsultationStatus = "refunded"    // Payment refunded to citizen
)

// ConsultationContract represents a smart contract for professional consultation
type ConsultationContract struct {
	ContractID       string             `json:"contract_id"`
	CitizenDID       string             `json:"citizen_did"`
	ProfessionalDID  string             `json:"professional_did"`
	ProfessionalRole ProfessionalRole   `json:"professional_role"`
	ServiceType      string             `json:"service_type"`      // e.g., "Legal advice", "Financial audit"
	Description      string             `json:"description"`       // Consultation details
	Fee              int64              `json:"fee"`               // uSOV (default: 50 SOV = 50,000,000 uSOV)
	EscrowBalance    int64              `json:"escrow_balance"`    // Current balance in escrow
	Status           ConsultationStatus `json:"status"`
	CreatedAt        time.Time          `json:"created_at"`
	StartedAt        *time.Time         `json:"started_at,omitempty"`
	CompletedAt      *time.Time         `json:"completed_at,omitempty"`
	DeliveryProof    string             `json:"delivery_proof,omitempty"` // Hash of delivered document/signature
	CitizenSignature []byte             `json:"citizen_signature,omitempty"` // Citizen's acceptance signature
	DisputeReason    string             `json:"dispute_reason,omitempty"`
}

// ConsultationResult represents the result of a consultation action
type ConsultationResult struct {
	ContractID    string             `json:"contract_id"`
	Status        ConsultationStatus `json:"status"`
	Message       string             `json:"message"`
	EscrowBalance int64              `json:"escrow_balance"`
	Timestamp     time.Time          `json:"timestamp"`
}

// WalletManager interface for wallet operations
type WalletManager interface {
	DebitRegular(ctx context.Context, userID string, amount int64, purpose string) (string, error)
	CreditRegular(ctx context.Context, userID string, amount int64, purpose string) (string, error)
}

// ConsultationSmartContract manages consultation contracts with escrow
type ConsultationSmartContract struct {
	contracts     map[string]*ConsultationContract
	walletManager WalletManager
	mu            sync.RWMutex
}

// NewConsultationSmartContract creates a new consultation smart contract manager
func NewConsultationSmartContract(walletManager WalletManager) *ConsultationSmartContract {
	return &ConsultationSmartContract{
		contracts:     make(map[string]*ConsultationContract),
		walletManager: walletManager,
	}
}

// HireProfessional creates a new consultation contract and locks payment in escrow
//
// SMART CONTRACT LOGIC:
// 1. Citizen initiates consultation request
// 2. 50 SOV deducted from citizen's wallet
// 3. Payment held in escrow (contract balance)
// 4. Professional delivers service
// 5. Citizen confirms delivery
// 6. Payment released to professional
//
// PARAMETERS:
// - citizenDID: Citizen's decentralized identifier
// - professionalDID: Professional's decentralized identifier
// - professional: Certified professional details
// - serviceType: Type of service requested
// - description: Detailed description of consultation needs
func (csc *ConsultationSmartContract) HireProfessional(
	ctx context.Context,
	citizenDID string,
	professionalDID string,
	professional *CertifiedProfessional,
	serviceType string,
	description string,
) (*ConsultationContract, error) {
	csc.mu.Lock()
	defer csc.mu.Unlock()

	// 1. Validate professional's license
	if !professional.IsLicenseValid() {
		return nil, fmt.Errorf("professional license expired or inactive")
	}

	// 2. Calculate fee (default: 50 SOV)
	const DefaultConsultationFee = 50_000_000 // 50 SOV in uSOV
	fee := DefaultConsultationFee

	// 3. Debit citizen's wallet (payment goes to escrow)
	txID, err := csc.walletManager.DebitRegular(ctx, citizenDID, fee, "consultation_escrow")
	if err != nil {
		return nil, fmt.Errorf("failed to debit citizen wallet: %w", err)
	}

	// 4. Create consultation contract
	contract := &ConsultationContract{
		ContractID:       uuid.New().String(),
		CitizenDID:       citizenDID,
		ProfessionalDID:  professionalDID,
		ProfessionalRole: professional.Role,
		ServiceType:      serviceType,
		Description:      description,
		Fee:              fee,
		EscrowBalance:    fee, // Full payment in escrow
		Status:           StatusPending,
		CreatedAt:        time.Now(),
	}

	csc.contracts[contract.ContractID] = contract

	fmt.Printf("✅ Consultation Contract Created\n")
	fmt.Printf("   Contract ID: %s\n", contract.ContractID)
	fmt.Printf("   Citizen: %s\n", citizenDID)
	fmt.Printf("   Professional: %s (%s)\n", professionalDID, professional.Role)
	fmt.Printf("   Fee: %.6f SOV (in escrow)\n", float64(fee)/1_000_000)
	fmt.Printf("   Transaction ID: %s\n", txID)

	return contract, nil
}

// StartConsultation marks the consultation as in progress
func (csc *ConsultationSmartContract) StartConsultation(
	ctx context.Context,
	contractID string,
	professionalDID string,
) (*ConsultationResult, error) {
	csc.mu.Lock()
	defer csc.mu.Unlock()

	contract, exists := csc.contracts[contractID]
	if !exists {
		return nil, fmt.Errorf("contract not found: %s", contractID)
	}

	// Validate professional
	if contract.ProfessionalDID != professionalDID {
		return nil, fmt.Errorf("unauthorized: only assigned professional can start consultation")
	}

	// Validate status
	if contract.Status != StatusPending {
		return nil, fmt.Errorf("invalid status: contract must be pending")
	}

	// Update status
	now := time.Now()
	contract.Status = StatusInProgress
	contract.StartedAt = &now

	return &ConsultationResult{
		ContractID:    contractID,
		Status:        StatusInProgress,
		Message:       "Consultation started successfully",
		EscrowBalance: contract.EscrowBalance,
		Timestamp:     time.Now(),
	}, nil
}

// DeliverService marks the service as delivered by the professional
//
// DELIVERY LOGIC:
// 1. Professional uploads digital advice/signature
// 2. Delivery proof (document hash) recorded
// 3. Status changed to completed
// 4. Awaiting citizen confirmation
func (csc *ConsultationSmartContract) DeliverService(
	ctx context.Context,
	contractID string,
	professionalDID string,
	deliveryProof string, // Hash of delivered document/signature
) (*ConsultationResult, error) {
	csc.mu.Lock()
	defer csc.mu.Unlock()

	contract, exists := csc.contracts[contractID]
	if !exists {
		return nil, fmt.Errorf("contract not found: %s", contractID)
	}

	// Validate professional
	if contract.ProfessionalDID != professionalDID {
		return nil, fmt.Errorf("unauthorized: only assigned professional can deliver service")
	}

	// Validate status
	if contract.Status != StatusInProgress {
		return nil, fmt.Errorf("invalid status: contract must be in progress")
	}

	// Validate delivery proof
	if deliveryProof == "" {
		return nil, fmt.Errorf("delivery proof required")
	}

	// Update contract
	now := time.Now()
	contract.Status = StatusCompleted
	contract.CompletedAt = &now
	contract.DeliveryProof = deliveryProof

	// AUTONOMOUS PAYMENT RELEASE: Release escrow to professional
	_, err := csc.walletManager.CreditRegular(ctx, professionalDID, contract.EscrowBalance, "consultation_payment")
	if err != nil {
		return nil, fmt.Errorf("failed to release payment: %w", err)
	}

	// Clear escrow balance
	contract.EscrowBalance = 0

	fmt.Printf("✅ Service Delivered & Payment Released\n")
	fmt.Printf("   Contract ID: %s\n", contractID)
	fmt.Printf("   Professional: %s\n", professionalDID)
	fmt.Printf("   Payment: %.6f SOV\n", float64(contract.Fee)/1_000_000)
	fmt.Printf("   Delivery Proof: %s\n", deliveryProof)

	return &ConsultationResult{
		ContractID:    contractID,
		Status:        StatusCompleted,
		Message:       "Service delivered and payment released to professional",
		EscrowBalance: 0,
		Timestamp:     time.Now(),
	}, nil
}

// ConfirmDelivery allows citizen to confirm service delivery (optional)
func (csc *ConsultationSmartContract) ConfirmDelivery(
	ctx context.Context,
	contractID string,
	citizenDID string,
	citizenSignature []byte,
) (*ConsultationResult, error) {
	csc.mu.Lock()
	defer csc.mu.Unlock()

	contract, exists := csc.contracts[contractID]
	if !exists {
		return nil, fmt.Errorf("contract not found: %s", contractID)
	}

	// Validate citizen
	if contract.CitizenDID != citizenDID {
		return nil, fmt.Errorf("unauthorized: only contract citizen can confirm delivery")
	}

	// Validate status
	if contract.Status != StatusCompleted {
		return nil, fmt.Errorf("invalid status: contract must be completed")
	}

	// Record citizen's acceptance signature
	contract.CitizenSignature = citizenSignature

	return &ConsultationResult{
		ContractID:    contractID,
		Status:        StatusCompleted,
		Message:       "Delivery confirmed by citizen",
		EscrowBalance: contract.EscrowBalance,
		Timestamp:     time.Now(),
	}, nil
}

// RaiseDispute allows citizen to dispute the service delivery
func (csc *ConsultationSmartContract) RaiseDispute(
	ctx context.Context,
	contractID string,
	citizenDID string,
	disputeReason string,
) (*ConsultationResult, error) {
	csc.mu.Lock()
	defer csc.mu.Unlock()

	contract, exists := csc.contracts[contractID]
	if !exists {
		return nil, fmt.Errorf("contract not found: %s", contractID)
	}

	// Validate citizen
	if contract.CitizenDID != citizenDID {
		return nil, fmt.Errorf("unauthorized: only contract citizen can raise dispute")
	}

	// Validate status (can only dispute completed contracts)
	if contract.Status != StatusCompleted {
		return nil, fmt.Errorf("invalid status: can only dispute completed contracts")
	}

	// Update status
	contract.Status = StatusDisputed
	contract.DisputeReason = disputeReason

	fmt.Printf("⚠️  Dispute Raised\n")
	fmt.Printf("   Contract ID: %s\n", contractID)
	fmt.Printf("   Reason: %s\n", disputeReason)
	fmt.Printf("   Escrow Balance: %.6f SOV (held pending resolution)\n", float64(contract.EscrowBalance)/1_000_000)

	return &ConsultationResult{
		ContractID:    contractID,
		Status:        StatusDisputed,
		Message:       fmt.Sprintf("Dispute raised: %s", disputeReason),
		EscrowBalance: contract.EscrowBalance,
		Timestamp:     time.Now(),
	}, nil
}

// CancelContract cancels a pending contract and refunds the citizen
func (csc *ConsultationSmartContract) CancelContract(
	ctx context.Context,
	contractID string,
	citizenDID string,
) (*ConsultationResult, error) {
	csc.mu.Lock()
	defer csc.mu.Unlock()

	contract, exists := csc.contracts[contractID]
	if !exists {
		return nil, fmt.Errorf("contract not found: %s", contractID)
	}

	// Validate citizen
	if contract.CitizenDID != citizenDID {
		return nil, fmt.Errorf("unauthorized: only contract citizen can cancel")
	}

	// Validate status (can only cancel pending contracts)
	if contract.Status != StatusPending {
		return nil, fmt.Errorf("invalid status: can only cancel pending contracts")
	}

	// Refund citizen
	_, err := csc.walletManager.CreditRegular(ctx, citizenDID, contract.EscrowBalance, "consultation_refund")
	if err != nil {
		return nil, fmt.Errorf("failed to refund citizen: %w", err)
	}

	// Update contract
	contract.Status = StatusRefunded
	contract.EscrowBalance = 0

	return &ConsultationResult{
		ContractID:    contractID,
		Status:        StatusRefunded,
		Message:       "Contract cancelled and payment refunded",
		EscrowBalance: 0,
		Timestamp:     time.Now(),
	}, nil
}

// GetContract retrieves a consultation contract
func (csc *ConsultationSmartContract) GetContract(ctx context.Context, contractID string) (*ConsultationContract, error) {
	csc.mu.RLock()
	defer csc.mu.RUnlock()

	contract, exists := csc.contracts[contractID]
	if !exists {
		return nil, fmt.Errorf("contract not found: %s", contractID)
	}

	return contract, nil
}

// GetCitizenContracts retrieves all contracts for a citizen
func (csc *ConsultationSmartContract) GetCitizenContracts(ctx context.Context, citizenDID string) ([]*ConsultationContract, error) {
	csc.mu.RLock()
	defer csc.mu.RUnlock()

	var contracts []*ConsultationContract
	for _, contract := range csc.contracts {
		if contract.CitizenDID == citizenDID {
			contracts = append(contracts, contract)
		}
	}

	return contracts, nil
}

// GetProfessionalContracts retrieves all contracts for a professional
func (csc *ConsultationSmartContract) GetProfessionalContracts(ctx context.Context, professionalDID string) ([]*ConsultationContract, error) {
	csc.mu.RLock()
	defer csc.mu.RUnlock()

	var contracts []*ConsultationContract
	for _, contract := range csc.contracts {
		if contract.ProfessionalDID == professionalDID {
			contracts = append(contracts, contract)
		}
	}

	return contracts, nil
}

