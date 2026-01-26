// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// VLT_Core Security Module - Expected Keeper Interfaces

package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"
)

// StakingKeeper defines the expected staking keeper interface
// Used to get validator information for consensus voting
type StakingKeeper interface {
	// GetAllValidators returns all validators
	GetAllValidators(ctx sdk.Context) []stakingtypes.Validator

	// GetValidator returns a validator by operator address
	GetValidator(ctx sdk.Context, addr sdk.ValAddress) (stakingtypes.Validator, bool)

	// GetValidatorByConsAddr returns a validator by consensus address
	GetValidatorByConsAddr(ctx sdk.Context, consAddr sdk.ConsAddress) (stakingtypes.Validator, bool)

	// TotalBondedTokens returns the total bonded tokens
	TotalBondedTokens(ctx sdk.Context) sdk.Int
}

// BankKeeper defines the expected bank keeper interface
// Used for potential slashing of malicious validators
type BankKeeper interface {
	SendCoinsFromModuleToAccount(ctx sdk.Context, senderModule string, recipientAddr sdk.AccAddress, amt sdk.Coins) error
	SendCoinsFromAccountToModule(ctx sdk.Context, senderAddr sdk.AccAddress, recipientModule string, amt sdk.Coins) error
	BurnCoins(ctx sdk.Context, moduleName string, amt sdk.Coins) error
}

