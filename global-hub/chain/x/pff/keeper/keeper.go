// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - PFF Verification Module
//
// This module processes AI-powered biometric verifications and triggers
// autonomous token minting. Part of the Vitalized Ledger Technology stack.

package keeper

import (
	"fmt"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/tendermint/tendermint/libs/log"

	"github.com/sovrn-protocol/sovrn/x/pff/types"
)

// Keeper of the pff store
type Keeper struct {
	cdc        codec.BinaryCodec
	storeKey   sdk.StoreKey
	mintKeeper types.MintKeeper
	oracleKeeper types.OracleKeeper
}

// NewKeeper creates a new pff Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey sdk.StoreKey,
	mintKeeper types.MintKeeper,
	oracleKeeper types.OracleKeeper,
) Keeper {
	return Keeper{
		cdc:          cdc,
		storeKey:     storeKey,
		mintKeeper:   mintKeeper,
		oracleKeeper: oracleKeeper,
	}
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", "x/"+types.ModuleName)
}

// ProcessPFFVerification processes a PFF verification request
// This is the main entry point for verification logic
func (k Keeper) ProcessPFFVerification(
	ctx sdk.Context,
	citizen sdk.AccAddress,
	pffHash string,
	requesterDID string,
	livenessData string,
	context string,
) error {
	// 1. Validate PFF hash (in production, this would check against stored hash)
	if err := k.validatePFFHash(ctx, citizen, pffHash); err != nil {
		return fmt.Errorf("PFF validation failed: %w", err)
	}

	// 2. Validate liveness data (anti-spoofing)
	if err := k.validateLivenessData(livenessData); err != nil {
		return fmt.Errorf("liveness check failed: %w", err)
	}

	// 3. Mint tokens on successful verification (10 uSOV)
	if err := k.mintKeeper.MintOnVerification(ctx, citizen); err != nil {
		return fmt.Errorf("minting failed: %w", err)
	}

	// 4. Store verification record
	if err := k.storeVerificationRecord(ctx, citizen, pffHash, requesterDID, context); err != nil {
		return fmt.Errorf("failed to store verification record: %w", err)
	}

	// 5. Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypePFFVerification,
			sdk.NewAttribute(types.AttributeKeyCitizen, citizen.String()),
			sdk.NewAttribute(types.AttributeKeyPFFHash, pffHash),
			sdk.NewAttribute(types.AttributeKeyRequesterDID, requesterDID),
			sdk.NewAttribute(types.AttributeKeyContext, context),
			sdk.NewAttribute(types.AttributeKeySuccess, "true"),
		),
	)

	k.Logger(ctx).Info(
		"PFF verification successful",
		"citizen", citizen.String(),
		"requester_did", requesterDID,
		"context", context,
	)

	return nil
}

// validatePFFHash validates the PFF hash against stored citizen data
func (k Keeper) validatePFFHash(ctx sdk.Context, citizen sdk.AccAddress, pffHash string) error {
	// TODO: In production, retrieve stored PFF hash from citizen registry and compare
	// For now, we accept any non-empty hash
	if len(pffHash) == 0 {
		return fmt.Errorf("PFF hash cannot be empty")
	}
	return nil
}

// validateLivenessData validates anti-spoofing liveness data
func (k Keeper) validateLivenessData(livenessData string) error {
	// TODO: In production, parse and validate liveness data
	// Check for motion detection, depth sensor, temperature, etc.
	// For now, we accept any data
	return nil
}

// storeVerificationRecord stores a verification record in the blockchain state
func (k Keeper) storeVerificationRecord(
	ctx sdk.Context,
	citizen sdk.AccAddress,
	pffHash string,
	requesterDID string,
	context string,
) error {
	store := ctx.KVStore(k.storeKey)
	
	// Create verification record
	record := types.VerificationRecord{
		Citizen:      citizen.String(),
		PFFHash:      pffHash,
		RequesterDID: requesterDID,
		Context:      context,
		Timestamp:    ctx.BlockTime().Unix(),
		BlockHeight:  ctx.BlockHeight(),
	}

	// Marshal and store
	bz := k.cdc.MustMarshal(&record)
	key := types.GetVerificationRecordKey(citizen, ctx.BlockHeight())
	store.Set(key, bz)

	return nil
}

// GetVerificationRecord retrieves a verification record
func (k Keeper) GetVerificationRecord(ctx sdk.Context, citizen sdk.AccAddress, blockHeight int64) (*types.VerificationRecord, error) {
	store := ctx.KVStore(k.storeKey)
	key := types.GetVerificationRecordKey(citizen, blockHeight)
	
	bz := store.Get(key)
	if bz == nil {
		return nil, fmt.Errorf("verification record not found")
	}

	var record types.VerificationRecord
	k.cdc.MustUnmarshal(bz, &record)
	
	return &record, nil
}

