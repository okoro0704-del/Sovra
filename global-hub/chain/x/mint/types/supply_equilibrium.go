// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Supply Equilibrium Controller
//
// Implements dynamic burn rate adjustment and minting caps to maintain supply equilibrium.
// Automatically increases burn rate when circulating supply exceeds threshold.

package types

import (
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Supply Equilibrium Constants
const (
	// MAX_TOTAL_SUPPLY is the absolute maximum supply that can ever exist
	// This is a hardcoded limit that can NEVER be exceeded
	// Set to 1 billion SOV (1,000,000,000 SOV = 1,000,000,000,000,000 uSOV)
	MAX_TOTAL_SUPPLY = int64(1_000_000_000_000_000) // 1 billion SOV in uSOV

	// SUPPLY_THRESHOLD is the circulating supply threshold for dynamic burn rate
	// When supply exceeds this, burn rate increases from 1% to 1.5%
	// Set to 500 million SOV (50% of max supply)
	SUPPLY_THRESHOLD = int64(500_000_000_000_000) // 500 million SOV in uSOV

	// BASE_BURN_RATE is the default transaction burn rate (1%)
	BASE_BURN_RATE = "0.01" // 1%

	// ELEVATED_BURN_RATE is the increased burn rate when supply exceeds threshold (1.5%)
	ELEVATED_BURN_RATE = "0.015" // 1.5%

	// BLACK_HOLE_ADDRESS is the verifiable dead wallet where burned tokens are sent
	// This address has no known private key and tokens sent here are permanently locked
	// Format: sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead
	BLACK_HOLE_ADDRESS = "sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead"
)

// SupplyEquilibriumParams defines parameters for supply equilibrium control
type SupplyEquilibriumParams struct {
	// MaxTotalSupply is the absolute maximum supply (hardcoded, immutable)
	MaxTotalSupply sdk.Int `json:"max_total_supply"`

	// SupplyThreshold is the threshold for dynamic burn rate adjustment
	SupplyThreshold sdk.Int `json:"supply_threshold"`

	// BaseBurnRate is the default burn rate (1%)
	BaseBurnRate sdk.Dec `json:"base_burn_rate"`

	// ElevatedBurnRate is the increased burn rate (1.5%)
	ElevatedBurnRate sdk.Dec `json:"elevated_burn_rate"`

	// BlackHoleAddress is the dead wallet for burned tokens
	BlackHoleAddress string `json:"black_hole_address"`

	// IsEquilibriumEnabled enables/disables supply equilibrium control
	IsEquilibriumEnabled bool `json:"is_equilibrium_enabled"`
}

// DefaultSupplyEquilibriumParams returns default supply equilibrium parameters
func DefaultSupplyEquilibriumParams() SupplyEquilibriumParams {
	baseBurnRate, _ := sdk.NewDecFromStr(BASE_BURN_RATE)
	elevatedBurnRate, _ := sdk.NewDecFromStr(ELEVATED_BURN_RATE)

	return SupplyEquilibriumParams{
		MaxTotalSupply:       sdk.NewInt(MAX_TOTAL_SUPPLY),
		SupplyThreshold:      sdk.NewInt(SUPPLY_THRESHOLD),
		BaseBurnRate:         baseBurnRate,
		ElevatedBurnRate:     elevatedBurnRate,
		BlackHoleAddress:     BLACK_HOLE_ADDRESS,
		IsEquilibriumEnabled: true,
	}
}

// Validate validates supply equilibrium parameters
func (sep SupplyEquilibriumParams) Validate() error {
	if sep.MaxTotalSupply.IsNegative() || sep.MaxTotalSupply.IsZero() {
		return fmt.Errorf("max total supply must be positive")
	}

	if sep.SupplyThreshold.IsNegative() {
		return fmt.Errorf("supply threshold cannot be negative")
	}

	if sep.SupplyThreshold.GT(sep.MaxTotalSupply) {
		return fmt.Errorf("supply threshold cannot exceed max total supply")
	}

	if sep.BaseBurnRate.IsNegative() || sep.BaseBurnRate.GT(sdk.OneDec()) {
		return fmt.Errorf("base burn rate must be between 0 and 1")
	}

	if sep.ElevatedBurnRate.IsNegative() || sep.ElevatedBurnRate.GT(sdk.OneDec()) {
		return fmt.Errorf("elevated burn rate must be between 0 and 1")
	}

	if sep.ElevatedBurnRate.LT(sep.BaseBurnRate) {
		return fmt.Errorf("elevated burn rate must be >= base burn rate")
	}

	if sep.BlackHoleAddress == "" {
		return fmt.Errorf("black hole address cannot be empty")
	}

	return nil
}

// SupplyEquilibriumController manages supply equilibrium logic
type SupplyEquilibriumController struct {
	params SupplyEquilibriumParams
}

// NewSupplyEquilibriumController creates a new supply equilibrium controller
func NewSupplyEquilibriumController(params SupplyEquilibriumParams) *SupplyEquilibriumController {
	return &SupplyEquilibriumController{
		params: params,
	}
}

// CanMint checks if minting is allowed based on current supply
// Returns error if minting would exceed MAX_TOTAL_SUPPLY
func (sec *SupplyEquilibriumController) CanMint(currentSupply sdk.Int, mintAmount sdk.Int) error {
	if !sec.params.IsEquilibriumEnabled {
		return nil // Equilibrium control disabled
	}

	newSupply := currentSupply.Add(mintAmount)

	if newSupply.GT(sec.params.MaxTotalSupply) {
		return fmt.Errorf(
			"minting rejected: would exceed MAX_TOTAL_SUPPLY (%s). Current: %s, Attempted mint: %s",
			sec.params.MaxTotalSupply.String(),
			currentSupply.String(),
			mintAmount.String(),
		)
	}

	return nil
}

// GetCurrentBurnRate returns the current burn rate based on circulating supply
// Returns BASE_BURN_RATE (1%) if supply < threshold
// Returns ELEVATED_BURN_RATE (1.5%) if supply >= threshold
func (sec *SupplyEquilibriumController) GetCurrentBurnRate(circulatingSupply sdk.Int) sdk.Dec {
	if !sec.params.IsEquilibriumEnabled {
		return sec.params.BaseBurnRate
	}

	if circulatingSupply.GTE(sec.params.SupplyThreshold) {
		return sec.params.ElevatedBurnRate
	}

	return sec.params.BaseBurnRate
}

// GetSupplyStatus returns the current supply status
func (sec *SupplyEquilibriumController) GetSupplyStatus(circulatingSupply sdk.Int) SupplyStatus {
	percentOfMax := circulatingSupply.Mul(sdk.NewInt(100)).Quo(sec.params.MaxTotalSupply)
	percentOfThreshold := circulatingSupply.Mul(sdk.NewInt(100)).Quo(sec.params.SupplyThreshold)

	return SupplyStatus{
		CirculatingSupply:   circulatingSupply,
		MaxTotalSupply:      sec.params.MaxTotalSupply,
		SupplyThreshold:     sec.params.SupplyThreshold,
		CurrentBurnRate:     sec.GetCurrentBurnRate(circulatingSupply),
		PercentOfMax:        percentOfMax.Int64(),
		PercentOfThreshold:  percentOfThreshold.Int64(),
		IsAboveThreshold:    circulatingSupply.GTE(sec.params.SupplyThreshold),
		RemainingMintable:   sec.params.MaxTotalSupply.Sub(circulatingSupply),
	}
}

// SupplyStatus represents the current supply status
type SupplyStatus struct {
	CirculatingSupply  sdk.Int `json:"circulating_supply"`
	MaxTotalSupply     sdk.Int `json:"max_total_supply"`
	SupplyThreshold    sdk.Int `json:"supply_threshold"`
	CurrentBurnRate    sdk.Dec `json:"current_burn_rate"`
	PercentOfMax       int64   `json:"percent_of_max"`
	PercentOfThreshold int64   `json:"percent_of_threshold"`
	IsAboveThreshold   bool    `json:"is_above_threshold"`
	RemainingMintable  sdk.Int `json:"remaining_mintable"`
}

