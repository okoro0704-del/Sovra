// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Time-Locked Multisig Vault
//
// Implements Ghost-Proof vault for PROJECT_R_AND_D funds.
// Prevents single-person drainage through time-locks and multisig requirements.

package economics

import (
	"fmt"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Vault Configuration Constants
const (
	// MINIMUM_SIGNERS is the minimum number of signatures required for withdrawal
	MINIMUM_SIGNERS = 3

	// TOTAL_SIGNERS is the total number of authorized signers
	TOTAL_SIGNERS = 5

	// TIME_LOCK_PERIOD is the minimum time funds must be locked before withdrawal
	// Set to 30 days (720 hours)
	TIME_LOCK_PERIOD = 30 * 24 * time.Hour

	// VOTING_PERIOD is the time window for multisig voting on withdrawal proposals
	// Set to 7 days (168 hours)
	VOTING_PERIOD = 7 * 24 * time.Hour
)

// WithdrawalProposal represents a proposal to withdraw funds from R&D vault
type WithdrawalProposal struct {
	// ProposalID is the unique identifier for this proposal
	ProposalID uint64 `json:"proposal_id"`

	// Amount is the amount requested for withdrawal
	Amount sdk.Coins `json:"amount"`

	// Purpose is the reason for withdrawal (e.g., "Research Grant", "Development Funding")
	Purpose string `json:"purpose"`

	// Proposer is the DID of the person who created the proposal
	Proposer string `json:"proposer"`

	// CreatedAt is the timestamp when proposal was created
	CreatedAt time.Time `json:"created_at"`

	// VotingEndsAt is the timestamp when voting period ends
	VotingEndsAt time.Time `json:"voting_ends_at"`

	// Signatures is the list of DIDs who have signed this proposal
	Signatures []string `json:"signatures"`

	// Status is the current status of the proposal
	Status ProposalStatus `json:"status"`

	// ExecutedAt is the timestamp when proposal was executed (if approved)
	ExecutedAt *time.Time `json:"executed_at,omitempty"`
}

// ProposalStatus represents the status of a withdrawal proposal
type ProposalStatus string

const (
	// StatusPending means proposal is awaiting signatures
	StatusPending ProposalStatus = "pending"

	// StatusApproved means proposal has enough signatures and can be executed
	StatusApproved ProposalStatus = "approved"

	// StatusExecuted means proposal has been executed and funds withdrawn
	StatusExecuted ProposalStatus = "executed"

	// StatusRejected means proposal was rejected (voting period expired without enough signatures)
	StatusRejected ProposalStatus = "rejected"

	// StatusCancelled means proposal was cancelled by proposer
	StatusCancelled ProposalStatus = "cancelled"
)

// MultisigVault implements the time-locked multisig vault for R&D funds
type MultisigVault struct {
	bankKeeper BankKeeper
	
	// AuthorizedSigners is the list of DIDs authorized to sign withdrawal proposals
	AuthorizedSigners []string
	
	// Proposals is the map of proposal ID to withdrawal proposal
	Proposals map[uint64]*WithdrawalProposal
	
	// NextProposalID is the next available proposal ID
	NextProposalID uint64
}

// NewMultisigVault creates a new time-locked multisig vault
func NewMultisigVault(bk BankKeeper, authorizedSigners []string) *MultisigVault {
	if len(authorizedSigners) != TOTAL_SIGNERS {
		panic(fmt.Sprintf("multisig vault requires exactly %d authorized signers, got %d", TOTAL_SIGNERS, len(authorizedSigners)))
	}

	return &MultisigVault{
		bankKeeper:        bk,
		AuthorizedSigners: authorizedSigners,
		Proposals:         make(map[uint64]*WithdrawalProposal),
		NextProposalID:    1,
	}
}

// CreateWithdrawalProposal creates a new proposal to withdraw funds from R&D vault
// GHOST-PROOF: Requires multisig approval before execution
func (mv *MultisigVault) CreateWithdrawalProposal(ctx sdk.Context, proposer string, amount sdk.Coins, purpose string) (uint64, error) {
	// Validate proposer is an authorized signer
	if !mv.isAuthorizedSigner(proposer) {
		return 0, fmt.Errorf("proposer %s is not an authorized signer", proposer)
	}

	// Create new proposal
	proposalID := mv.NextProposalID
	mv.NextProposalID++

	now := ctx.BlockTime()
	proposal := &WithdrawalProposal{
		ProposalID:   proposalID,
		Amount:       amount,
		Purpose:      purpose,
		Proposer:     proposer,
		CreatedAt:    now,
		VotingEndsAt: now.Add(VOTING_PERIOD),
		Signatures:   []string{proposer}, // Proposer automatically signs
		Status:       StatusPending,
	}

	mv.Proposals[proposalID] = proposal

	ctx.Logger().Info("R&D Vault: Withdrawal proposal created",
		"proposal_id", proposalID,
		"amount", amount.String(),
		"purpose", purpose,
		"proposer", proposer,
	)

	return proposalID, nil
}

// SignProposal adds a signature to a withdrawal proposal
// GHOST-PROOF: Requires MINIMUM_SIGNERS signatures before approval
func (mv *MultisigVault) SignProposal(ctx sdk.Context, proposalID uint64, signer string) error {
	proposal, exists := mv.Proposals[proposalID]
	if !exists {
		return fmt.Errorf("proposal %d not found", proposalID)
	}

	// Validate signer is authorized
	if !mv.isAuthorizedSigner(signer) {
		return fmt.Errorf("signer %s is not authorized", signer)
	}

	// Check if already signed
	for _, sig := range proposal.Signatures {
		if sig == signer {
			return fmt.Errorf("signer %s has already signed this proposal", signer)
		}
	}

	// Check if voting period has expired
	if ctx.BlockTime().After(proposal.VotingEndsAt) {
		proposal.Status = StatusRejected
		return fmt.Errorf("voting period has expired for proposal %d", proposalID)
	}

	// Add signature
	proposal.Signatures = append(proposal.Signatures, signer)

	// Check if we have enough signatures
	if len(proposal.Signatures) >= MINIMUM_SIGNERS {
		proposal.Status = StatusApproved
	}

	return nil
}

// ExecuteProposal executes an approved withdrawal proposal
// GHOST-PROOF: Enforces time-lock period and multisig requirements
func (mv *MultisigVault) ExecuteProposal(ctx sdk.Context, proposalID uint64, executor string) error {
	proposal, exists := mv.Proposals[proposalID]
	if !exists {
		return fmt.Errorf("proposal %d not found", proposalID)
	}

	// Validate executor is authorized
	if !mv.isAuthorizedSigner(executor) {
		return fmt.Errorf("executor %s is not authorized", executor)
	}

	// Check proposal status
	if proposal.Status != StatusApproved {
		return fmt.Errorf("proposal %d is not approved (status: %s)", proposalID, proposal.Status)
	}

	// Enforce TIME_LOCK_PERIOD: Funds must be locked for minimum period
	timeSinceCreation := ctx.BlockTime().Sub(proposal.CreatedAt)
	if timeSinceCreation < TIME_LOCK_PERIOD {
		remainingTime := TIME_LOCK_PERIOD - timeSinceCreation
		return fmt.Errorf("time-lock period not met: %s remaining", remainingTime.String())
	}

	// Verify we have minimum signatures
	if len(proposal.Signatures) < MINIMUM_SIGNERS {
		return fmt.Errorf("insufficient signatures: %d/%d", len(proposal.Signatures), MINIMUM_SIGNERS)
	}

	// Execute withdrawal: Send funds from R&D vault to designated recipient
	// For now, send to global_protocol_treasury (can be customized per proposal)
	if err := mv.bankKeeper.SendCoinsFromModuleToModule(ctx, ProjectRnDVault, "global_protocol_treasury", proposal.Amount); err != nil {
		return fmt.Errorf("failed to execute withdrawal: %w", err)
	}

	// Update proposal status
	now := ctx.BlockTime()
	proposal.Status = StatusExecuted
	proposal.ExecutedAt = &now

	ctx.Logger().Info("R&D Vault: Withdrawal proposal executed",
		"proposal_id", proposalID,
		"amount", proposal.Amount.String(),
		"executor", executor,
		"signatures", len(proposal.Signatures),
	)

	// Emit event for transparency
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			"rnd_vault_withdrawal",
			sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", proposalID)),
			sdk.NewAttribute("amount", proposal.Amount.String()),
			sdk.NewAttribute("purpose", proposal.Purpose),
			sdk.NewAttribute("signatures", fmt.Sprintf("%d", len(proposal.Signatures))),
			sdk.NewAttribute("executor", executor),
		),
	)

	return nil
}

// GetProposal returns a withdrawal proposal by ID
func (mv *MultisigVault) GetProposal(proposalID uint64) (*WithdrawalProposal, error) {
	proposal, exists := mv.Proposals[proposalID]
	if !exists {
		return nil, fmt.Errorf("proposal %d not found", proposalID)
	}
	return proposal, nil
}

// GetVaultBalance returns the current balance of the R&D vault
func (mv *MultisigVault) GetVaultBalance(ctx sdk.Context) sdk.Coins {
	vaultAddr := mv.bankKeeper.GetModuleAddress(ProjectRnDVault)
	return mv.bankKeeper.GetAllBalances(ctx, vaultAddr)
}

// isAuthorizedSigner checks if a DID is an authorized signer
func (mv *MultisigVault) isAuthorizedSigner(did string) bool {
	for _, signer := range mv.AuthorizedSigners {
		if signer == did {
			return true
		}
	}
	return false
}

// BankKeeper interface extension for module address
type BankKeeper interface {
	SendCoinsFromModuleToModule(ctx sdk.Context, senderModule, recipientModule string, amt sdk.Coins) error
	SendCoinsFromModuleToAccount(ctx sdk.Context, senderModule string, recipientAddr sdk.AccAddress, amt sdk.Coins) error
	GetBalance(ctx sdk.Context, addr sdk.AccAddress, denom string) sdk.Coin
	GetAllBalances(ctx sdk.Context, addr sdk.AccAddress) sdk.Coins
	GetModuleAddress(moduleName string) sdk.AccAddress
}

