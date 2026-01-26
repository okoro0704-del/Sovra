// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Oracle Module
//
// Hardcoded price oracle for verification pricing (1 verification = 5 SOV units).
// Part of the autonomous economic system.

package keeper

import (
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/tendermint/tendermint/libs/log"

	"github.com/sovrn-protocol/sovrn/x/oracle/types"
)

// Keeper of the oracle store
type Keeper struct {
	cdc      codec.BinaryCodec
	storeKey sdk.StoreKey
}

// NewKeeper creates a new oracle Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey sdk.StoreKey,
) Keeper {
	return Keeper{
		cdc:      cdc,
		storeKey: storeKey,
	}
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", "x/"+types.ModuleName)
}

// GetVerificationPrice returns the hardcoded price for a single verification
// HARDCODED: 1 verification = 5 SOV = 5,000,000 uSOV
// This will be made dynamic in the future
func (k Keeper) GetVerificationPrice(ctx sdk.Context) sdk.Coin {
	// 5 SOV = 5,000,000 uSOV (1 SOV = 1,000,000 uSOV)
	return sdk.NewCoin("usov", sdk.NewInt(5000000))
}

// ValidateVerificationFee checks if the provided fee matches the required verification price
func (k Keeper) ValidateVerificationFee(ctx sdk.Context, fee sdk.Coins) error {
	requiredPrice := k.GetVerificationPrice(ctx)
	
	// Check if fee contains the required amount of uSOV
	feeAmount := fee.AmountOf("usov")
	if feeAmount.LT(requiredPrice.Amount) {
		return types.ErrInsufficientVerificationFee
	}

	return nil
}

