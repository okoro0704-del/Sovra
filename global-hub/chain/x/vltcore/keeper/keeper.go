// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// VLT_Core Security Module - Keeper
//
// The VLT_Core keeper implements the core security functions for Vitalized Ledger Technology:
// 1. Vitality_Anchor: Ensures every block contains valid PFF_Liveness_Proof
// 2. Consensus_of_Presence: 51% consensus mechanism for deepfake detection

package keeper

import (
	"encoding/binary"
	"fmt"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/tendermint/tendermint/libs/log"

	"github.com/sovrn-protocol/sovrn/x/vltcore/types"
)

// Keeper of the vltcore store
type Keeper struct {
	cdc            codec.BinaryCodec
	storeKey       sdk.StoreKey
	memKey         sdk.StoreKey
	stakingKeeper  types.StakingKeeper
	bankKeeper     types.BankKeeper
}

// NewKeeper creates a new vltcore Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey sdk.StoreKey,
	memKey sdk.StoreKey,
	stakingKeeper types.StakingKeeper,
	bankKeeper types.BankKeeper,
) Keeper {
	return Keeper{
		cdc:           cdc,
		storeKey:      storeKey,
		memKey:        memKey,
		stakingKeeper: stakingKeeper,
		bankKeeper:    bankKeeper,
	}
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", "x/"+types.ModuleName)
}

// ============================================================================
// VITALITY ANCHOR: Block Validation with PFF Liveness Proof
// ============================================================================

// Vitality_Anchor ensures no block can be added to the SOVRA chain unless it
// contains a valid PFF_Liveness_Proof.
//
// This is the core innovation of Vitalized Ledger Technology: every block must
// be anchored to real human vitality, not just computational work.
//
// AUTONOMOUS: This function executes automatically during block validation.
// No human intervention required.
func (k Keeper) Vitality_Anchor(ctx sdk.Context, txs []sdk.Tx) error {
	k.Logger(ctx).Info("VLT_Core: Vitality_Anchor validation started",
		"block_height", ctx.BlockHeight(),
		"num_txs", len(txs),
	)

	// Check if at least one transaction contains a valid PFF_Liveness_Proof
	hasValidProof := false
	var validProof *types.PFFLivenessProof

	for _, tx := range txs {
		// Extract PFF proof from transaction
		proof := k.extractPFFProof(ctx, tx)
		if proof == nil {
			continue
		}

		// Validate the PFF proof
		if err := k.validatePFFProof(ctx, proof); err != nil {
			k.Logger(ctx).Debug("VLT_Core: Invalid PFF proof found",
				"pff_hash", proof.PFFHash,
				"error", err.Error(),
			)
			continue
		}

		// Check if proof is blacklisted
		if k.IsBlacklisted(ctx, proof.PFFHash) {
			k.Logger(ctx).Warn("VLT_Core: Blacklisted PFF proof detected",
				"pff_hash", proof.PFFHash,
				"did", proof.DID,
			)

			// Emit rejection event
			ctx.EventManager().EmitEvent(
				sdk.NewEvent(
					types.EventTypePFFProofRejected,
					sdk.NewAttribute(types.AttributeKeyPFFHash, proof.PFFHash),
					sdk.NewAttribute(types.AttributeKeyDID, proof.DID),
					sdk.NewAttribute(types.AttributeKeyReason, "blacklisted"),
				),
			)
			continue
		}

		// Valid proof found!
		hasValidProof = true
		validProof = proof
		break
	}

	// Reject block if no valid proof found
	if !hasValidProof {
		k.Logger(ctx).Error("VLT_Core: Vitality_Anchor FAILED - No valid PFF_Liveness_Proof found",
			"block_height", ctx.BlockHeight(),
		)
		return fmt.Errorf("vitality anchor failed: block rejected - no valid PFF_Liveness_Proof found")
	}

	// Store the proof and mark as used
	k.storePFFProof(ctx, validProof)

	// Emit success event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeVitalityAnchor,
			sdk.NewAttribute(types.AttributeKeyPFFHash, validProof.PFFHash),
			sdk.NewAttribute(types.AttributeKeyDID, validProof.DID),
			sdk.NewAttribute(types.AttributeKeyBlockHeight, fmt.Sprintf("%d", ctx.BlockHeight())),
		),
	)

	k.Logger(ctx).Info("VLT_Core: Vitality_Anchor PASSED",
		"block_height", ctx.BlockHeight(),
		"pff_hash", validProof.PFFHash,
		"did", validProof.DID,
	)

	return nil
}

// validatePFFProof validates a PFF liveness proof
func (k Keeper) validatePFFProof(ctx sdk.Context, proof *types.PFFLivenessProof) error {
	// 1. Basic validation
	if err := proof.Validate(); err != nil {
		return fmt.Errorf("proof validation failed: %w", err)
	}

	// 2. Check if proof has already been used (replay attack prevention)
	if k.isPFFProofUsed(ctx, proof.PFFHash) {
		return fmt.Errorf("proof already used: replay attack detected")
	}

	// 3. Check if proof is expired
	if proof.IsExpired() {
		return fmt.Errorf("proof expired: older than 5 minutes")
	}

	// 4. Verify cryptographic signature (in production, verify against DID public key)
	// TODO: Implement full signature verification

	// 5. Check minimum liveness score (must be >= 70)
	if proof.LivenessScore < 70 {
		return fmt.Errorf("liveness score too low: %d (minimum 70)", proof.LivenessScore)
	}

	return nil
}

// extractPFFProof extracts a PFF liveness proof from a transaction
func (k Keeper) extractPFFProof(ctx sdk.Context, tx sdk.Tx) *types.PFFLivenessProof {
	// In production, this would parse the transaction messages to find PFF proof
	// For now, we return nil (proof extraction logic depends on tx structure)
	// TODO: Implement full proof extraction from MsgPFFVerification
	return nil
}

// storePFFProof stores a PFF proof and marks it as used
func (k Keeper) storePFFProof(ctx sdk.Context, proof *types.PFFLivenessProof) {
	store := ctx.KVStore(k.storeKey)

	// Update proof with block height
	proof.BlockHeight = ctx.BlockHeight()
	proof.Used = true

	// Store proof by hash
	key := append(types.PFFProofPrefix, []byte(proof.PFFHash)...)
	bz := k.cdc.MustMarshal(proof)
	store.Set(key, bz)
}

// isPFFProofUsed checks if a PFF proof has already been used
func (k Keeper) isPFFProofUsed(ctx sdk.Context, pffHash string) bool {
	store := ctx.KVStore(k.storeKey)
	key := append(types.PFFProofPrefix, []byte(pffHash)...)
	return store.Has(key)
}

// ============================================================================
// CONSENSUS OF PRESENCE: 51% Deepfake Detection Mechanism
// ============================================================================

// Consensus_of_Presence implements a 51% consensus mechanism for deepfake detection.
//
// If 51% or more of validator nodes flag a PFF scan as a "Potential Deepfake,"
// the transaction is blacklisted globally.
//
// AUTONOMOUS: This function executes automatically when validators submit votes.
// No human intervention required.
func (k Keeper) Consensus_of_Presence(ctx sdk.Context, pffHash string, vote types.DeepfakeVote) error {
	k.Logger(ctx).Info("VLT_Core: Consensus_of_Presence vote received",
		"pff_hash", pffHash,
		"validator", vote.Validator.String(),
		"is_deepfake", vote.IsDeepfake,
		"confidence", vote.Confidence,
	)

	// 1. Record the vote
	k.recordDeepfakeVote(ctx, vote)

	// 2. Get all votes for this PFF hash
	votes := k.getDeepfakeVotes(ctx, pffHash)

	// 3. Get total number of validator nodes
	totalNodes := k.getTotalValidatorNodes(ctx)
	if totalNodes == 0 {
		return fmt.Errorf("no validator nodes found")
	}

	// 4. Count deepfake votes
	deepfakeVotes := 0
	for _, v := range votes {
		if v.IsDeepfake {
			deepfakeVotes++
		}
	}

	// 5. Calculate percentage
	percentage := (deepfakeVotes * 100) / totalNodes

	k.Logger(ctx).Info("VLT_Core: Consensus_of_Presence vote tally",
		"pff_hash", pffHash,
		"deepfake_votes", deepfakeVotes,
		"total_nodes", totalNodes,
		"percentage", percentage,
	)

	// 6. If 51% or more flag as deepfake, blacklist globally
	if percentage >= 51 {
		k.Logger(ctx).Warn("VLT_Core: Consensus_of_Presence THRESHOLD REACHED - Blacklisting PFF hash",
			"pff_hash", pffHash,
			"deepfake_votes", deepfakeVotes,
			"total_nodes", totalNodes,
			"percentage", percentage,
		)

		// Add to global blacklist
		reason := fmt.Sprintf("Consensus: %d%% of validators flagged as deepfake (%d/%d)", percentage, deepfakeVotes, totalNodes)
		k.addToGlobalBlacklist(ctx, pffHash, reason, deepfakeVotes, totalNodes, "")

		// Emit blacklist event
		ctx.EventManager().EmitEvent(
			sdk.NewEvent(
				types.EventTypeConsensusBlacklist,
				sdk.NewAttribute(types.AttributeKeyPFFHash, pffHash),
				sdk.NewAttribute(types.AttributeKeyDeepfakeVotes, fmt.Sprintf("%d", deepfakeVotes)),
				sdk.NewAttribute(types.AttributeKeyTotalNodes, fmt.Sprintf("%d", totalNodes)),
				sdk.NewAttribute(types.AttributeKeyReason, reason),
			),
		)

		return nil
	}

	// Emit vote event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeDeepfakeVote,
			sdk.NewAttribute(types.AttributeKeyPFFHash, pffHash),
			sdk.NewAttribute(types.AttributeKeyValidator, vote.Validator.String()),
			sdk.NewAttribute("is_deepfake", fmt.Sprintf("%t", vote.IsDeepfake)),
			sdk.NewAttribute("confidence", fmt.Sprintf("%d", vote.Confidence)),
		),
	)

	return nil
}

// recordDeepfakeVote records a validator's deepfake vote
func (k Keeper) recordDeepfakeVote(ctx sdk.Context, vote types.DeepfakeVote) {
	store := ctx.KVStore(k.storeKey)

	// Create composite key: pffHash + validator address
	key := append(types.DeepfakeVotePrefix, []byte(vote.PFFHash)...)
	key = append(key, vote.Validator.Bytes()...)

	// Marshal and store
	bz := k.cdc.MustMarshal(&vote)
	store.Set(key, bz)
}

// getDeepfakeVotes retrieves all votes for a specific PFF hash
func (k Keeper) getDeepfakeVotes(ctx sdk.Context, pffHash string) []types.DeepfakeVote {
	store := ctx.KVStore(k.storeKey)
	prefix := append(types.DeepfakeVotePrefix, []byte(pffHash)...)

	iterator := sdk.KVStorePrefixIterator(store, prefix)
	defer iterator.Close()

	var votes []types.DeepfakeVote
	for ; iterator.Valid(); iterator.Next() {
		var vote types.DeepfakeVote
		k.cdc.MustUnmarshal(iterator.Value(), &vote)
		votes = append(votes, vote)
	}

	return votes
}

// getTotalValidatorNodes returns the total number of active validator nodes
func (k Keeper) getTotalValidatorNodes(ctx sdk.Context) int {
	validators := k.stakingKeeper.GetAllValidators(ctx)
	return len(validators)
}

// addToGlobalBlacklist adds a PFF hash to the global blacklist
func (k Keeper) addToGlobalBlacklist(ctx sdk.Context, pffHash, reason string, deepfakeVotes, totalValidators int, did string) {
	store := ctx.KVStore(k.storeKey)

	entry := types.BlacklistEntry{
		PFFHash:         pffHash,
		Reason:          reason,
		Timestamp:       ctx.BlockTime(),
		DeepfakeVotes:   deepfakeVotes,
		TotalValidators: totalValidators,
		DID:             did,
	}

	key := append(types.BlacklistPrefix, []byte(pffHash)...)
	bz := k.cdc.MustMarshal(&entry)
	store.Set(key, bz)

	k.Logger(ctx).Info("VLT_Core: PFF hash added to global blacklist",
		"pff_hash", pffHash,
		"reason", reason,
	)
}

// IsBlacklisted checks if a PFF hash is globally blacklisted
func (k Keeper) IsBlacklisted(ctx sdk.Context, pffHash string) bool {
	store := ctx.KVStore(k.storeKey)
	key := append(types.BlacklistPrefix, []byte(pffHash)...)
	return store.Has(key)
}

// GetBlacklistEntry retrieves a blacklist entry
func (k Keeper) GetBlacklistEntry(ctx sdk.Context, pffHash string) (*types.BlacklistEntry, bool) {
	store := ctx.KVStore(k.storeKey)
	key := append(types.BlacklistPrefix, []byte(pffHash)...)

	if !store.Has(key) {
		return nil, false
	}

	var entry types.BlacklistEntry
	bz := store.Get(key)
	k.cdc.MustUnmarshal(bz, &entry)

	return &entry, true
}

// SubmitDeepfakeVote allows a validator to submit a deepfake detection vote
// This is the public interface for validators to participate in Consensus of Presence
func (k Keeper) SubmitDeepfakeVote(
	ctx sdk.Context,
	pffHash string,
	validator sdk.ValAddress,
	isDeepfake bool,
	confidence uint8,
	reason string,
) error {
	// Validate validator exists
	if _, found := k.stakingKeeper.GetValidator(ctx, validator); !found {
		return fmt.Errorf("validator not found: %s", validator.String())
	}

	// Validate confidence (0-100)
	if confidence > 100 {
		return fmt.Errorf("invalid confidence: must be 0-100, got %d", confidence)
	}

	// Create vote
	vote := types.NewDeepfakeVote(pffHash, validator, isDeepfake, confidence, reason)

	// Process through Consensus_of_Presence
	return k.Consensus_of_Presence(ctx, pffHash, vote)
}

