package types

import (
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
	paramtypes "github.com/cosmos/cosmos-sdk/x/params/types"
)

// Parameter store keys
var (
	KeyUsageBasedMinting = []byte("UsageBasedMinting")
	KeyMintPerVerification = []byte("MintPerVerification")
)

// ParamKeyTable for mint module
func ParamKeyTable() paramtypes.KeyTable {
	return paramtypes.NewKeyTable().RegisterParamSet(&Params{})
}

// Params defines the parameters for the mint module
type Params struct {
	// UsageBasedMinting enables usage-based minting (disables fixed inflation)
	UsageBasedMinting bool `protobuf:"varint,1,opt,name=usage_based_minting,json=usageBasedMinting,proto3" json:"usage_based_minting,omitempty"`
	
	// MintPerVerification is the amount of uSOV to mint per PFF verification
	// Default: 10 uSOV (0.00001 SOV)
	MintPerVerification sdk.Int `protobuf:"bytes,2,opt,name=mint_per_verification,json=mintPerVerification,proto3,customtype=github.com/cosmos/cosmos-sdk/types.Int" json:"mint_per_verification"`
}

// NewParams creates a new Params instance
func NewParams(usageBasedMinting bool, mintPerVerification sdk.Int) Params {
	return Params{
		UsageBasedMinting:   usageBasedMinting,
		MintPerVerification: mintPerVerification,
	}
}

// DefaultParams returns default mint parameters
// Usage-based minting is ENABLED, fixed inflation is DISABLED
func DefaultParams() Params {
	return NewParams(
		true,                    // Enable usage-based minting
		sdk.NewInt(10),          // 10 uSOV per verification
	)
}

// ParamSetPairs implements params.ParamSet
func (p *Params) ParamSetPairs() paramtypes.ParamSetPairs {
	return paramtypes.ParamSetPairs{
		paramtypes.NewParamSetPair(KeyUsageBasedMinting, &p.UsageBasedMinting, validateUsageBasedMinting),
		paramtypes.NewParamSetPair(KeyMintPerVerification, &p.MintPerVerification, validateMintPerVerification),
	}
}

// Validate validates the set of params
func (p Params) Validate() error {
	if err := validateUsageBasedMinting(p.UsageBasedMinting); err != nil {
		return err
	}
	if err := validateMintPerVerification(p.MintPerVerification); err != nil {
		return err
	}
	return nil
}

// String implements the Stringer interface
func (p Params) String() string {
	return fmt.Sprintf(`Mint Params:
  Usage Based Minting: %t
  Mint Per Verification: %s uSOV
`, p.UsageBasedMinting, p.MintPerVerification)
}

func validateUsageBasedMinting(i interface{}) error {
	_, ok := i.(bool)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}
	return nil
}

func validateMintPerVerification(i interface{}) error {
	v, ok := i.(sdk.Int)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v.IsNegative() {
		return fmt.Errorf("mint per verification cannot be negative: %s", v)
	}

	if v.IsZero() {
		return fmt.Errorf("mint per verification cannot be zero")
	}

	return nil
}

