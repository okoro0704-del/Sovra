// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Usage-Based Minting Module
//
// This module implements autonomous token minting triggered by AI-verified
// human vitality events (PFF verifications). No human intervention required.

package keeper

import (
	"fmt"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/tendermint/tendermint/libs/log"

	"github.com/sovrn-protocol/sovrn/x/mint/types"
)

// Keeper of the mint store
type Keeper struct {
	cdc              codec.BinaryCodec
	storeKey         sdk.StoreKey
	paramSpace       types.ParamSubspace
	bankKeeper       types.BankKeeper
	accountKeeper    types.AccountKeeper
	feeCollectorName string
}

// NewKeeper creates a new mint Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	key sdk.StoreKey,
	paramSpace types.ParamSubspace,
	ak types.AccountKeeper,
	bk types.BankKeeper,
	feeCollectorName string,
) Keeper {
	// ensure mint module account is set
	if addr := ak.GetModuleAddress(types.ModuleName); addr == nil {
		panic(fmt.Sprintf("%s module account has not been set", types.ModuleName))
	}

	// set KeyTable if it has not already been set
	if !paramSpace.HasKeyTable() {
		paramSpace = paramSpace.WithKeyTable(types.ParamKeyTable())
	}

	return Keeper{
		cdc:              cdc,
		storeKey:         key,
		paramSpace:       paramSpace,
		accountKeeper:    ak,
		bankKeeper:       bk,
		feeCollectorName: feeCollectorName,
	}
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", "x/"+types.ModuleName)
}

// GetParams returns the total set of mint parameters
func (k Keeper) GetParams(ctx sdk.Context) (params types.Params) {
	k.paramSpace.GetParamSet(ctx, &params)
	return params
}

// SetParams sets the mint parameters to the param space
func (k Keeper) SetParams(ctx sdk.Context, params types.Params) {
	k.paramSpace.SetParamSet(ctx, &params)
}

// SOVRA_Sovereign_Kernel: MintOnVerification
//
// Core ledger function for usage-based SOV token minting
// Mints tokens when a PFF verification is successfully processed
// This is the core of the usage-based minting logic
func (k Keeper) MintOnVerification(ctx sdk.Context, recipient sdk.AccAddress) error {
	params := k.GetParams(ctx)

	// Check if usage-based minting is enabled
	if !params.UsageBasedMinting {
		return fmt.Errorf("usage-based minting is disabled")
	}

	// Get the amount to mint (10 uSOV by default)
	mintAmount := params.MintPerVerification
	coins := sdk.NewCoins(sdk.NewCoin("usov", mintAmount))

	// Mint coins to the mint module account
	if err := k.bankKeeper.MintCoins(ctx, types.ModuleName, coins); err != nil {
		return err
	}

	// Send minted coins to the recipient (citizen who completed verification)
	if err := k.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.ModuleName, recipient, coins); err != nil {
		return err
	}

	// Emit event for minting
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			types.EventTypeMintOnVerification,
			sdk.NewAttribute(types.AttributeKeyRecipient, recipient.String()),
			sdk.NewAttribute(types.AttributeKeyAmount, mintAmount.String()),
			sdk.NewAttribute(sdk.AttributeKeyModule, types.ModuleName),
		),
	)

	k.Logger(ctx).Info(
		"[SOVRA_Sovereign_Kernel] Minted tokens on verification",
		"recipient", recipient.String(),
		"amount", mintAmount.String(),
	)

	return nil
}

// SOVRA_Sovereign_Kernel: GetMintingStats
//
// Core ledger function for querying token supply and minting statistics
// Returns statistics about minting activity
func (k Keeper) GetMintingStats(ctx sdk.Context) types.MintingStats {
	// Get total supply of uSOV
	supply := k.bankKeeper.GetSupply(ctx, "usov")

	return types.MintingStats{
		TotalSupply:         supply.Amount,
		UsageBasedMinting:   k.GetParams(ctx).UsageBasedMinting,
		MintPerVerification: k.GetParams(ctx).MintPerVerification,
	}
}

