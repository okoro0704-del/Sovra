// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Dynamic Burn Engine
//
// Implements autonomous fee distribution with dynamic burn rates based on supply equilibrium.
// Burn rate automatically adjusts from 1% to 1.5% when circulating supply exceeds threshold.

package ante

import (
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
	"github.com/cosmos/cosmos-sdk/x/auth/types"

	pfftypes "github.com/sovrn-protocol/sovrn/x/pff/types"
	minttypes "github.com/sovrn-protocol/sovrn/x/mint/types"
)

// BurnEngineDecorator implements the burn engine for verification fees
// SUPPLY EQUILIBRIUM: Dynamic burn rate (1% or 1.5%) based on circulating supply
// For every verification fee collected:
// - Burn 1% or 1.5% (dynamic) by sending to black hole address
// - Allocate remaining to National_Spoke_Pool and Global_Protocol_Treasury
type BurnEngineDecorator struct {
	bankKeeper    BankKeeper
	accountKeeper AccountKeeper
	mintKeeper    MintKeeper
}

// NewBurnEngineDecorator creates a new BurnEngineDecorator
func NewBurnEngineDecorator(ak AccountKeeper, bk BankKeeper, mk MintKeeper) BurnEngineDecorator {
	return BurnEngineDecorator{
		accountKeeper: ak,
		bankKeeper:    bk,
		mintKeeper:    mk,
	}
}

// AnteHandle implements the ante.Decorator interface
// This runs BEFORE the transaction is processed
func (bed BurnEngineDecorator) AnteHandle(ctx sdk.Context, tx sdk.Tx, simulate bool, next sdk.AnteHandler) (sdk.Context, error) {
	// Let the transaction proceed - we'll handle fees in PostHandle
	return next(ctx, tx, simulate)
}

// PostHandle implements the post-handler for fee distribution
// This runs AFTER the transaction is successfully processed
func (bed BurnEngineDecorator) PostHandle(ctx sdk.Context, tx sdk.Tx, simulate bool, success bool, next sdk.PostHandler) (sdk.Context, error) {
	// Only process fees if transaction was successful
	if !success || simulate {
		return next(ctx, tx, simulate, success)
	}

	// Check if this is a PFF verification transaction
	isPFFVerification := false
	var requesterDID string
	
	for _, msg := range tx.GetMsgs() {
		if pffMsg, ok := msg.(*pfftypes.MsgPFFVerification); ok {
			isPFFVerification = true
			requesterDID = pffMsg.RequesterDID
			break
		}
	}

	// Only apply burn engine to PFF verification transactions
	if !isPFFVerification {
		return next(ctx, tx, simulate, success)
	}

	// Get the fees collected from this transaction
	feeTx, ok := tx.(sdk.FeeTx)
	if !ok {
		return ctx, sdkerrors.Wrap(sdkerrors.ErrTxDecode, "Tx must be a FeeTx")
	}

	fees := feeTx.GetFee()
	if fees.IsZero() {
		// No fees to distribute
		return next(ctx, tx, simulate, success)
	}

	// Distribute fees according to burn engine rules
	if err := bed.distributeFees(ctx, fees, requesterDID); err != nil {
		return ctx, sdkerrors.Wrapf(err, "failed to distribute fees")
	}

	return next(ctx, tx, simulate, success)
}

// distributeFees implements the burn engine logic with DYNAMIC BURN RATE
// SUPPLY EQUILIBRIUM: Burn rate automatically adjusts from 1% to 1.5% based on supply
func (bed BurnEngineDecorator) distributeFees(ctx sdk.Context, fees sdk.Coins, requesterDID string) error {
	// Get current dynamic burn rate from Supply Equilibrium Controller
	// Returns 1% if supply < threshold, 1.5% if supply >= threshold
	burnRate := bed.mintKeeper.GetCurrentBurnRate(ctx)

	for _, fee := range fees {
		totalAmount := fee.Amount

		// Calculate dynamic burn amount (1% or 1.5%)
		burnAmount := totalAmount.ToDec().Mul(burnRate).TruncateInt()
		burnCoins := sdk.NewCoins(sdk.NewCoin(fee.Denom, burnAmount))

		// Remaining amount after burn
		remainingAmount := totalAmount.Sub(burnAmount)

		// Calculate 50% of remaining for National_Spoke_Pool
		spokeAmount := remainingAmount.MulRaw(50).QuoRaw(100)
		spokeCoins := sdk.NewCoins(sdk.NewCoin(fee.Denom, spokeAmount))

		// Calculate 50% of remaining for Global_Protocol_Treasury
		treasuryAmount := remainingAmount.Sub(spokeAmount)
		treasuryCoins := sdk.NewCoins(sdk.NewCoin(fee.Denom, treasuryAmount))

		// 1. Send burn amount to BLACK HOLE ADDRESS (verifiable dead wallet)
		blackHoleAddr, err := sdk.AccAddressFromBech32(minttypes.BLACK_HOLE_ADDRESS)
		if err != nil {
			return fmt.Errorf("failed to parse black hole address: %w", err)
		}

		if err := bed.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.FeeCollectorName, blackHoleAddr, burnCoins); err != nil {
			return fmt.Errorf("failed to send coins to black hole: %w", err)
		}

		// 2. Send to National_Spoke_Pool (DID-based routing)
		spokePoolName, err := bed.getSpokePoolFromDID(requesterDID)
		if err != nil {
			return fmt.Errorf("failed to get spoke pool from DID: %w", err)
		}

		if err := bed.bankKeeper.SendCoinsFromModuleToModule(ctx, types.FeeCollectorName, spokePoolName, spokeCoins); err != nil {
			return fmt.Errorf("failed to send coins to spoke pool: %w", err)
		}

		// 3. Send to Global_Protocol_Treasury
		if err := bed.bankKeeper.SendCoinsFromModuleToModule(ctx, types.FeeCollectorName, "global_protocol_treasury", treasuryCoins); err != nil {
			return fmt.Errorf("failed to send coins to treasury: %w", err)
		}

		// Emit event for fee distribution
		ctx.EventManager().EmitEvent(
			sdk.NewEvent(
				"fee_distribution",
				sdk.NewAttribute("total_amount", totalAmount.String()),
				sdk.NewAttribute("burn_rate", burnRate.String()),
				sdk.NewAttribute("burned", burnAmount.String()),
				sdk.NewAttribute("black_hole_address", minttypes.BLACK_HOLE_ADDRESS),
				sdk.NewAttribute("spoke_pool", spokeAmount.String()),
				sdk.NewAttribute("spoke_pool_name", spokePoolName),
				sdk.NewAttribute("treasury", treasuryAmount.String()),
			),
		)
	}

	return nil
}

// getSpokePoolFromDID extracts the country from DID and returns the spoke pool module name
func (bed BurnEngineDecorator) getSpokePoolFromDID(did string) (string, error) {
	country, err := pfftypes.ParseDIDCountry(did)
	if err != nil {
		return "", err
	}
	
	return pfftypes.GetSpokePoolAddress(country), nil
}

// BankKeeper defines the expected bank keeper interface
type BankKeeper interface {
	SendCoinsFromModuleToModule(ctx sdk.Context, senderModule, recipientModule string, amt sdk.Coins) error
	SendCoinsFromModuleToAccount(ctx sdk.Context, senderModule string, recipientAddr sdk.AccAddress, amt sdk.Coins) error
	BurnCoins(ctx sdk.Context, moduleName string, amt sdk.Coins) error
}

// AccountKeeper defines the expected account keeper interface
type AccountKeeper interface {
	GetModuleAddress(moduleName string) sdk.AccAddress
}

// MintKeeper defines the expected mint keeper interface
type MintKeeper interface {
	GetCurrentBurnRate(ctx sdk.Context) sdk.Dec
}

