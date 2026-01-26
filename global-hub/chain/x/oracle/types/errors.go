package types

import (
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

// x/oracle module sentinel errors
var (
	ErrInsufficientVerificationFee = sdkerrors.Register(ModuleName, 1, "insufficient verification fee: expected 5 SOV (5,000,000 uSOV)")
)

