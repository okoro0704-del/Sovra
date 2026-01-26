// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// VLT_Core Security Module - Error Definitions

package types

import (
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

var (
	ErrInvalidPFFHash          = sdkerrors.Register(ModuleName, 1, "invalid PFF hash")
	ErrPFFProofExpired         = sdkerrors.Register(ModuleName, 2, "PFF proof expired")
	ErrPFFProofAlreadyUsed     = sdkerrors.Register(ModuleName, 3, "PFF proof already used")
	ErrPFFProofBlacklisted     = sdkerrors.Register(ModuleName, 4, "PFF proof is blacklisted")
	ErrInvalidLivenessScore    = sdkerrors.Register(ModuleName, 5, "invalid liveness score")
	ErrInvalidSignature        = sdkerrors.Register(ModuleName, 6, "invalid signature")
	ErrNoValidatorFound        = sdkerrors.Register(ModuleName, 7, "validator not found")
	ErrInvalidConfidence       = sdkerrors.Register(ModuleName, 8, "invalid confidence value")
	ErrInvalidBlacklistReason  = sdkerrors.Register(ModuleName, 9, "invalid blacklist reason")
	ErrNoValidPFFProof         = sdkerrors.Register(ModuleName, 10, "no valid PFF liveness proof found in block")
)

