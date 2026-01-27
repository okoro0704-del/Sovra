// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Transparency Oracle HTTP Handlers
//
// Provides HTTP endpoints for public visibility into Four Pillars balances.

package transparency_oracle

import (
	"encoding/json"
	"net/http"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/sovrn-protocol/sovrn/chain/economics"
	minttypes "github.com/sovrn-protocol/sovrn/x/mint/types"
)

// HandleGetCitizenDividend returns HTTP handler for /v1/transparency/citizen-dividend
func (tos *TransparencyOracleService) HandleGetCitizenDividend(ctx sdk.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		citizenAddr := tos.bankKeeper.GetModuleAddress(economics.CitizenDividendPool)
		balance := tos.bankKeeper.GetBalance(ctx, citizenAddr, "usov")

		response := map[string]interface{}{
			"pool_name":    economics.CitizenDividendPool,
			"balance_usov": balance.Amount.String(),
			"balance_sov":  convertToSOV(balance.Amount),
			"percentage":   "25%",
			"description":  "Distributed monthly to all verified DIDs",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

// HandleGetProjectRnD returns HTTP handler for /v1/transparency/project-rnd
func (tos *TransparencyOracleService) HandleGetProjectRnD(ctx sdk.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rndAddr := tos.bankKeeper.GetModuleAddress(economics.ProjectRnDVault)
		balance := tos.bankKeeper.GetBalance(ctx, rndAddr, "usov")

		response := map[string]interface{}{
			"vault_name":     economics.ProjectRnDVault,
			"balance_usov":   balance.Amount.String(),
			"balance_sov":    convertToSOV(balance.Amount),
			"percentage":     "25%",
			"description":    "Locked for protocol research and development",
			"security_model": "Time-Locked Multisig (3-of-5, 30-day lock)",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

// HandleGetInfrastructure returns HTTP handler for /v1/transparency/infrastructure
func (tos *TransparencyOracleService) HandleGetInfrastructure(ctx sdk.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		infraAddr := tos.bankKeeper.GetModuleAddress(economics.NationInfrastructurePool)
		balance := tos.bankKeeper.GetBalance(ctx, infraAddr, "usov")

		response := map[string]interface{}{
			"pool_name":    economics.NationInfrastructurePool,
			"balance_usov": balance.Amount.String(),
			"balance_sov":  convertToSOV(balance.Amount),
			"percentage":   "25%",
			"description":  "Funds for national operations and infrastructure",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

// HandleGetDeflation returns HTTP handler for /v1/transparency/deflation
func (tos *TransparencyOracleService) HandleGetDeflation(ctx sdk.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		blackHoleAddr, _ := sdk.AccAddressFromBech32(minttypes.BLACK_HOLE_ADDRESS)
		balance := tos.bankKeeper.GetBalance(ctx, blackHoleAddr, "usov")

		response := map[string]interface{}{
			"address":      minttypes.BLACK_HOLE_ADDRESS,
			"balance_usov": balance.Amount.String(),
			"balance_sov":  convertToSOV(balance.Amount),
			"percentage":   "25%",
			"description":  "Permanently burned tokens (deflationary pressure)",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

// RegisterTransparencyRoutes registers all transparency oracle HTTP routes
func RegisterTransparencyRoutes(mux *http.ServeMux, tos *TransparencyOracleService, ctx sdk.Context) {
	// Main endpoint: All four pillars
	mux.HandleFunc("/v1/transparency/pillars", tos.HandleGetFourPillars(ctx))

	// Individual pillar endpoints
	mux.HandleFunc("/v1/transparency/citizen-dividend", tos.HandleGetCitizenDividend(ctx))
	mux.HandleFunc("/v1/transparency/project-rnd", tos.HandleGetProjectRnD(ctx))
	mux.HandleFunc("/v1/transparency/infrastructure", tos.HandleGetInfrastructure(ctx))
	mux.HandleFunc("/v1/transparency/deflation", tos.HandleGetDeflation(ctx))
}

