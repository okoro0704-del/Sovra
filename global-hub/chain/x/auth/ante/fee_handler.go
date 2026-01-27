// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Quadratic-Sovereign-Split Fee Handler
//
// Implements the Four Pillars economic model for fee distribution.
// Every kobo of transaction fees is split equally across four destinations:
// - 25% CITIZEN_DIVIDEND (distributed to all verified DIDs)
// - 25% PROJECT_R_AND_D (locked in time-locked multisig vault)
// - 25% NATION_INFRASTRUCTURE (for national operations)
// - 25% DEFLATION_BURN (sent to black hole address)

package ante

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
	"github.com/cosmos/cosmos-sdk/x/auth/types"

	"github.com/sovrn-protocol/sovrn/chain/economics"
	pfftypes "github.com/sovrn-protocol/sovrn/x/pff/types"
)

// BurnEngineDecorator implements the Quadratic-Sovereign-Split for verification fees
// FOUR PILLARS MODEL: Equal 25% distribution across all four destinations
// GHOST-PROOF: R&D funds routed to time-locked multisig vault
// TRANSPARENT: All distributions visible via Transparency Oracle
type BurnEngineDecorator struct {
	bankKeeper    BankKeeper
	accountKeeper AccountKeeper
	economicsKernel *economics.QuadraticSovereignSplit
}

// NewBurnEngineDecorator creates a new BurnEngineDecorator with Quadratic-Sovereign-Split
func NewBurnEngineDecorator(ak AccountKeeper, bk BankKeeper) BurnEngineDecorator {
	return BurnEngineDecorator{
		accountKeeper: ak,
		bankKeeper:    bk,
		economicsKernel: economics.NewQuadraticSovereignSplit(bk),
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

// distributeFees implements the Quadratic-Sovereign-Split logic
// FOUR PILLARS: Equal 25% distribution across all four destinations
func (bed BurnEngineDecorator) distributeFees(ctx sdk.Context, fees sdk.Coins, requesterDID string) error {
	// Execute Four-Way Split using economics kernel
	// This distributes fees across:
	// - 25% Citizen Dividend Pool
	// - 25% Project R&D Vault (time-locked multisig)
	// - 25% Nation Infrastructure Pool
	// - 25% Deflation Burn (black hole address)
	return bed.economicsKernel.ExecuteFourWaySplit(ctx, fees, types.FeeCollectorName)
}

// BankKeeper defines the expected bank keeper interface
type BankKeeper interface {
	SendCoinsFromModuleToModule(ctx sdk.Context, senderModule, recipientModule string, amt sdk.Coins) error
	SendCoinsFromModuleToAccount(ctx sdk.Context, senderModule string, recipientAddr sdk.AccAddress, amt sdk.Coins) error
	GetBalance(ctx sdk.Context, addr sdk.AccAddress, denom string) sdk.Coin
	GetAllBalances(ctx sdk.Context, addr sdk.AccAddress) sdk.Coins
	GetModuleAddress(moduleName string) sdk.AccAddress
}

// AccountKeeper defines the expected account keeper interface
type AccountKeeper interface {
	GetModuleAddress(moduleName string) sdk.AccAddress
}

