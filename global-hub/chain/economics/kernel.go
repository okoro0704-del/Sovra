// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Quadratic-Sovereign-Split
//
// Implements the Four Pillars economic model for fee distribution.
// Every kobo of transaction fees is split equally across four destinations:
// - 25% CITIZEN_DIVIDEND (distributed to all verified DIDs)
// - 25% PROJECT_R_AND_D (locked in time-locked multisig vault)
// - 25% NATION_INFRASTRUCTURE (for national operations)
// - 25% DEFLATION_BURN (sent to black hole address)

package economics

import (
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
	minttypes "github.com/sovrn-protocol/sovrn/x/mint/types"
)

// Four Pillars Constants - Quadratic-Sovereign-Split
const (
	// CITIZEN_DIVIDEND: 25% of all fees distributed to verified citizens
	CITIZEN_DIVIDEND = 0.25

	// PROJECT_R_AND_D: 25% of all fees locked in time-locked multisig vault
	// Ghost-proof: Requires multiple signatures and time-lock to prevent drainage
	PROJECT_R_AND_D = 0.25

	// NATION_INFRASTRUCTURE: 25% of all fees for national operations
	NATION_INFRASTRUCTURE = 0.25

	// DEFLATION_BURN: 25% of all fees sent to black hole address
	// Creates deflationary pressure and increases scarcity
	DEFLATION_BURN = 0.25
)

// Module Account Names for Four Pillars
const (
	// CitizenDividendPool holds funds for distribution to verified DIDs
	CitizenDividendPool = "citizen_dividend_pool"

	// ProjectRnDVault is the time-locked multisig vault for R&D funds
	ProjectRnDVault = "project_rnd_vault"

	// NationInfrastructurePool holds funds for national operations
	NationInfrastructurePool = "nation_infrastructure_pool"

	// BlackHoleAddress is the verifiable dead wallet for burned tokens
	// Reuses the address from Supply Equilibrium Controller
	BlackHoleAddress = minttypes.BLACK_HOLE_ADDRESS
)

// QuadraticSovereignSplit implements the Four Pillars economic kernel
type QuadraticSovereignSplit struct {
	bankKeeper BankKeeper
}

// NewQuadraticSovereignSplit creates a new Four Pillars kernel
func NewQuadraticSovereignSplit(bk BankKeeper) *QuadraticSovereignSplit {
	return &QuadraticSovereignSplit{
		bankKeeper: bk,
	}
}

// ExecuteFourWaySplit distributes fees across all four pillars
// AUTONOMOUS: No human intervention required
// GHOST-PROOF: R&D funds routed to time-locked multisig vault
// TRANSPARENT: All distributions emit events for public visibility
func (qss *QuadraticSovereignSplit) ExecuteFourWaySplit(ctx sdk.Context, totalFee sdk.Coins, feeCollectorModule string) error {
	ctx.Logger().Info("SOVRA Economics: Executing Four-Way Split",
		"total_fee", totalFee.String(),
	)

	for _, fee := range totalFee {
		totalAmount := fee.Amount

		// Calculate 25% for each pillar
		citizenAmount := totalAmount.ToDec().Mul(sdk.MustNewDecFromStr("0.25")).TruncateInt()
		rndAmount := totalAmount.ToDec().Mul(sdk.MustNewDecFromStr("0.25")).TruncateInt()
		infraAmount := totalAmount.ToDec().Mul(sdk.MustNewDecFromStr("0.25")).TruncateInt()
		
		// Burn amount is remaining to handle rounding
		burnAmount := totalAmount.Sub(citizenAmount).Sub(rndAmount).Sub(infraAmount)

		// Create coin objects
		citizenCoins := sdk.NewCoins(sdk.NewCoin(fee.Denom, citizenAmount))
		rndCoins := sdk.NewCoins(sdk.NewCoin(fee.Denom, rndAmount))
		infraCoins := sdk.NewCoins(sdk.NewCoin(fee.Denom, infraAmount))
		burnCoins := sdk.NewCoins(sdk.NewCoin(fee.Denom, burnAmount))

		// 1. Send 25% to Citizen Dividend Pool
		if err := qss.bankKeeper.SendCoinsFromModuleToModule(ctx, feeCollectorModule, CitizenDividendPool, citizenCoins); err != nil {
			return fmt.Errorf("failed to send coins to citizen dividend pool: %w", err)
		}

		// 2. Send 25% to PROJECT_R_AND_D Vault (Ghost-Proof: Time-Locked Multisig)
		if err := qss.bankKeeper.SendCoinsFromModuleToModule(ctx, feeCollectorModule, ProjectRnDVault, rndCoins); err != nil {
			return fmt.Errorf("failed to send coins to R&D vault: %w", err)
		}

		// 3. Send 25% to Nation Infrastructure Pool
		if err := qss.bankKeeper.SendCoinsFromModuleToModule(ctx, feeCollectorModule, NationInfrastructurePool, infraCoins); err != nil {
			return fmt.Errorf("failed to send coins to infrastructure pool: %w", err)
		}

		// 4. Send 25% to Black Hole Address (DEFLATION_BURN)
		blackHoleAddr, err := sdk.AccAddressFromBech32(BlackHoleAddress)
		if err != nil {
			return fmt.Errorf("failed to parse black hole address: %w", err)
		}

		if err := qss.bankKeeper.SendCoinsFromModuleToAccount(ctx, feeCollectorModule, blackHoleAddr, burnCoins); err != nil {
			return fmt.Errorf("failed to send coins to black hole: %w", err)
		}

		// Emit transparency event for public visibility
		ctx.EventManager().EmitEvent(
			sdk.NewEvent(
				"quadratic_sovereign_split",
				sdk.NewAttribute("total_amount", totalAmount.String()),
				sdk.NewAttribute("citizen_dividend", citizenAmount.String()),
				sdk.NewAttribute("project_rnd", rndAmount.String()),
				sdk.NewAttribute("infrastructure", infraAmount.String()),
				sdk.NewAttribute("deflation_burn", burnAmount.String()),
				sdk.NewAttribute("black_hole_address", BlackHoleAddress),
				sdk.NewAttribute("split_model", "four_pillars"),
			),
		)

		ctx.Logger().Info("SOVRA Economics: Four-Way Split Complete",
			"citizen_dividend", citizenAmount.String(),
			"project_rnd", rndAmount.String(),
			"infrastructure", infraAmount.String(),
			"deflation_burn", burnAmount.String(),
		)
	}

	return nil
}

// BankKeeper defines the expected bank keeper interface
type BankKeeper interface {
	SendCoinsFromModuleToModule(ctx sdk.Context, senderModule, recipientModule string, amt sdk.Coins) error
	SendCoinsFromModuleToAccount(ctx sdk.Context, senderModule string, recipientAddr sdk.AccAddress, amt sdk.Coins) error
	GetBalance(ctx sdk.Context, addr sdk.AccAddress, denom string) sdk.Coin
	GetAllBalances(ctx sdk.Context, addr sdk.AccAddress) sdk.Coins
}

