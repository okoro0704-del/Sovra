package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// MintKeeper defines the expected mint keeper interface
type MintKeeper interface {
	MintOnVerification(ctx sdk.Context, recipient sdk.AccAddress) error
}

// OracleKeeper defines the expected oracle keeper interface
type OracleKeeper interface {
	GetVerificationPrice(ctx sdk.Context) sdk.Coin
}

