package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// MintingStats holds statistics about the minting module
type MintingStats struct {
	TotalSupply         sdk.Int `json:"total_supply"`
	UsageBasedMinting   bool    `json:"usage_based_minting"`
	MintPerVerification sdk.Int `json:"mint_per_verification"`
}

// NewMintingStats creates a new MintingStats instance
func NewMintingStats(totalSupply sdk.Int, usageBasedMinting bool, mintPerVerification sdk.Int) MintingStats {
	return MintingStats{
		TotalSupply:         totalSupply,
		UsageBasedMinting:   usageBasedMinting,
		MintPerVerification: mintPerVerification,
	}
}

