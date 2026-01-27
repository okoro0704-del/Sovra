// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Transparency Oracle
//
// Provides real-time visibility into all Four Pillars balances.
// Enables Vitalians to see where every kobo of transaction fees goes.

package transparency_oracle

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/sovrn-protocol/sovrn/chain/economics"
	minttypes "github.com/sovrn-protocol/sovrn/x/mint/types"
)

// TransparencyOracleService provides real-time balance tracking for Four Pillars
type TransparencyOracleService struct {
	bankKeeper BankKeeper
}

// NewTransparencyOracleService creates a new transparency oracle service
func NewTransparencyOracleService(bk BankKeeper) *TransparencyOracleService {
	return &TransparencyOracleService{
		bankKeeper: bk,
	}
}

// FourPillarsResponse represents the balances of all four pillars
type FourPillarsResponse struct {
	// Citizen Dividend Pool
	CitizenDividend CitizenDividendInfo `json:"citizen_dividend"`

	// Project R&D Vault
	ProjectRnD ProjectRnDInfo `json:"project_rnd"`

	// Nation Infrastructure Pool
	Infrastructure InfrastructureInfo `json:"infrastructure"`

	// Deflation Burn (Black Hole)
	DeflationBurn DeflationBurnInfo `json:"deflation_burn"`

	// Metadata
	Timestamp string `json:"timestamp"`
	ChainID   string `json:"chain_id"`
}

// CitizenDividendInfo represents citizen dividend pool information
type CitizenDividendInfo struct {
	PoolName      string `json:"pool_name"`
	BalanceUSOV   string `json:"balance_usov"`
	BalanceSOV    string `json:"balance_sov"`
	Percentage    string `json:"percentage"`
	Description   string `json:"description"`
}

// ProjectRnDInfo represents R&D vault information
type ProjectRnDInfo struct {
	VaultName     string `json:"vault_name"`
	BalanceUSOV   string `json:"balance_usov"`
	BalanceSOV    string `json:"balance_sov"`
	Percentage    string `json:"percentage"`
	Description   string `json:"description"`
	SecurityModel string `json:"security_model"`
}

// InfrastructureInfo represents infrastructure pool information
type InfrastructureInfo struct {
	PoolName    string `json:"pool_name"`
	BalanceUSOV string `json:"balance_usov"`
	BalanceSOV  string `json:"balance_sov"`
	Percentage  string `json:"percentage"`
	Description string `json:"description"`
}

// DeflationBurnInfo represents black hole information
type DeflationBurnInfo struct {
	Address     string `json:"address"`
	BalanceUSOV string `json:"balance_usov"`
	BalanceSOV  string `json:"balance_sov"`
	Percentage  string `json:"percentage"`
	Description string `json:"description"`
}

// GetFourPillarsBalances returns balances of all four pillars
func (tos *TransparencyOracleService) GetFourPillarsBalances(ctx sdk.Context) FourPillarsResponse {
	// Get Citizen Dividend Pool balance
	citizenAddr := tos.bankKeeper.GetModuleAddress(economics.CitizenDividendPool)
	citizenBalance := tos.bankKeeper.GetBalance(ctx, citizenAddr, "usov")

	// Get Project R&D Vault balance
	rndAddr := tos.bankKeeper.GetModuleAddress(economics.ProjectRnDVault)
	rndBalance := tos.bankKeeper.GetBalance(ctx, rndAddr, "usov")

	// Get Nation Infrastructure Pool balance
	infraAddr := tos.bankKeeper.GetModuleAddress(economics.NationInfrastructurePool)
	infraBalance := tos.bankKeeper.GetBalance(ctx, infraAddr, "usov")

	// Get Black Hole balance
	blackHoleAddr, _ := sdk.AccAddressFromBech32(minttypes.BLACK_HOLE_ADDRESS)
	blackHoleBalance := tos.bankKeeper.GetBalance(ctx, blackHoleAddr, "usov")

	return FourPillarsResponse{
		CitizenDividend: CitizenDividendInfo{
			PoolName:      economics.CitizenDividendPool,
			BalanceUSOV:   citizenBalance.Amount.String(),
			BalanceSOV:    convertToSOV(citizenBalance.Amount),
			Percentage:    "25%",
			Description:   "Distributed monthly to all verified DIDs",
		},
		ProjectRnD: ProjectRnDInfo{
			VaultName:     economics.ProjectRnDVault,
			BalanceUSOV:   rndBalance.Amount.String(),
			BalanceSOV:    convertToSOV(rndBalance.Amount),
			Percentage:    "25%",
			Description:   "Locked for protocol research and development",
			SecurityModel: "Time-Locked Multisig (3-of-5, 30-day lock)",
		},
		Infrastructure: InfrastructureInfo{
			PoolName:    economics.NationInfrastructurePool,
			BalanceUSOV: infraBalance.Amount.String(),
			BalanceSOV:  convertToSOV(infraBalance.Amount),
			Percentage:  "25%",
			Description: "Funds for national operations and infrastructure",
		},
		DeflationBurn: DeflationBurnInfo{
			Address:     minttypes.BLACK_HOLE_ADDRESS,
			BalanceUSOV: blackHoleBalance.Amount.String(),
			BalanceSOV:  convertToSOV(blackHoleBalance.Amount),
			Percentage:  "25%",
			Description: "Permanently burned tokens (deflationary pressure)",
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		ChainID:   ctx.ChainID(),
	}
}

// HandleGetFourPillars returns HTTP handler for /v1/transparency/pillars endpoint
func (tos *TransparencyOracleService) HandleGetFourPillars(ctx sdk.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		response := tos.GetFourPillarsBalances(ctx)

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-SOVRA-Protocol", "Quadratic-Sovereign-Split")
		w.Header().Set("X-SOVRA-Model", "Four-Pillars")
		json.NewEncoder(w).Encode(response)
	}
}

// convertToSOV converts uSOV to SOV (1 SOV = 1,000,000 uSOV)
func convertToSOV(uSOV sdk.Int) string {
	sov := uSOV.QuoRaw(1_000_000)
	remainder := uSOV.ModRaw(1_000_000)

	if remainder.IsZero() {
		return fmt.Sprintf("%s SOV", sov.String())
	}

	return fmt.Sprintf("%s.%06d SOV", sov.String(), remainder.Int64())
}

// BankKeeper defines the expected bank keeper interface
type BankKeeper interface {
	GetBalance(ctx sdk.Context, addr sdk.AccAddress, denom string) sdk.Coin
	GetAllBalances(ctx sdk.Context, addr sdk.AccAddress) sdk.Coins
	GetModuleAddress(moduleName string) sdk.AccAddress
}

