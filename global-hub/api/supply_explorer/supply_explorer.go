// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Supply Explorer API
//
// Provides real-time visibility into circulating supply, burn rate, and black hole balance.
// Enables the world to see the supply shrinking in real-time on the SOVRA Explorer.

package supply_explorer

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
	minttypes "github.com/sovrn-protocol/sovrn/x/mint/types"
)

// SupplyExplorerService provides real-time supply tracking
type SupplyExplorerService struct {
	mintKeeper MintKeeper
	bankKeeper BankKeeper
}

// NewSupplyExplorerService creates a new supply explorer service
func NewSupplyExplorerService(mk MintKeeper, bk BankKeeper) *SupplyExplorerService {
	return &SupplyExplorerService{
		mintKeeper: mk,
		bankKeeper: bk,
	}
}

// SupplyExplorerResponse represents the public supply explorer data
type SupplyExplorerResponse struct {
	// Current Supply Metrics
	CirculatingSupply   string `json:"circulating_supply"`
	CirculatingSupplySOV string `json:"circulating_supply_sov"` // Human-readable (SOV)
	MaxTotalSupply      string `json:"max_total_supply"`
	MaxTotalSupplySOV   string `json:"max_total_supply_sov"`
	SupplyThreshold     string `json:"supply_threshold"`
	SupplyThresholdSOV  string `json:"supply_threshold_sov"`
	
	// Burn Metrics
	CurrentBurnRate     string `json:"current_burn_rate"`      // "0.01" or "0.015"
	CurrentBurnRatePercent string `json:"current_burn_rate_percent"` // "1%" or "1.5%"
	BlackHoleBalance    string `json:"black_hole_balance"`
	BlackHoleBalanceSOV string `json:"black_hole_balance_sov"`
	BlackHoleAddress    string `json:"black_hole_address"`
	
	// Supply Status
	PercentOfMax       int64  `json:"percent_of_max"`
	PercentOfThreshold int64  `json:"percent_of_threshold"`
	IsAboveThreshold   bool   `json:"is_above_threshold"`
	RemainingMintable  string `json:"remaining_mintable"`
	RemainingMintableSOV string `json:"remaining_mintable_sov"`
	
	// Metadata
	Timestamp time.Time `json:"timestamp"`
	ChainID   string    `json:"chain_id"`
}

// GetSupplyStatus returns the current supply status
func (ses *SupplyExplorerService) GetSupplyStatus(ctx sdk.Context) SupplyExplorerResponse {
	// Get supply status from mint keeper
	status := ses.mintKeeper.GetSupplyStatus(ctx)
	
	// Get black hole balance
	blackHoleBalance := ses.mintKeeper.GetBlackHoleBalance(ctx)
	
	// Convert burn rate to percentage
	burnRatePercent := status.CurrentBurnRate.MulInt64(100).String() + "%"
	
	return SupplyExplorerResponse{
		// Current Supply Metrics (uSOV)
		CirculatingSupply:   status.CirculatingSupply.String(),
		CirculatingSupplySOV: convertToSOV(status.CirculatingSupply),
		MaxTotalSupply:      status.MaxTotalSupply.String(),
		MaxTotalSupplySOV:   convertToSOV(status.MaxTotalSupply),
		SupplyThreshold:     status.SupplyThreshold.String(),
		SupplyThresholdSOV:  convertToSOV(status.SupplyThreshold),
		
		// Burn Metrics
		CurrentBurnRate:        status.CurrentBurnRate.String(),
		CurrentBurnRatePercent: burnRatePercent,
		BlackHoleBalance:       blackHoleBalance.String(),
		BlackHoleBalanceSOV:    convertToSOV(blackHoleBalance),
		BlackHoleAddress:       minttypes.BLACK_HOLE_ADDRESS,
		
		// Supply Status
		PercentOfMax:         status.PercentOfMax,
		PercentOfThreshold:   status.PercentOfThreshold,
		IsAboveThreshold:     status.IsAboveThreshold,
		RemainingMintable:    status.RemainingMintable.String(),
		RemainingMintableSOV: convertToSOV(status.RemainingMintable),
		
		// Metadata
		Timestamp: time.Now().UTC(),
		ChainID:   ctx.ChainID(),
	}
}

// HTTP Handlers

// HandleGetSupplyStatus handles GET /v1/supply/status
func (ses *SupplyExplorerService) HandleGetSupplyStatus(ctx sdk.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		status := ses.GetSupplyStatus(ctx)
		
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-SOVRA-Protocol", "VLT")
		w.Header().Set("X-SOVRA-Supply-Equilibrium", "Enabled")
		
		json.NewEncoder(w).Encode(status)
	}
}

// HandleGetBlackHoleBalance handles GET /v1/supply/black-hole
func (ses *SupplyExplorerService) HandleGetBlackHoleBalance(ctx sdk.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		blackHoleBalance := ses.mintKeeper.GetBlackHoleBalance(ctx)
		
		response := map[string]interface{}{
			"black_hole_address": minttypes.BLACK_HOLE_ADDRESS,
			"balance_usov":       blackHoleBalance.String(),
			"balance_sov":        convertToSOV(blackHoleBalance),
			"timestamp":          time.Now().UTC(),
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

// Helper Functions

// convertToSOV converts uSOV to SOV (1 SOV = 1,000,000 uSOV)
func convertToSOV(uSOV sdk.Int) string {
	sov := uSOV.QuoRaw(1_000_000)
	remainder := uSOV.ModRaw(1_000_000)
	
	if remainder.IsZero() {
		return fmt.Sprintf("%s SOV", sov.String())
	}
	
	return fmt.Sprintf("%s.%06d SOV", sov.String(), remainder.Int64())
}

// Expected Keepers

type MintKeeper interface {
	GetSupplyStatus(ctx sdk.Context) minttypes.SupplyStatus
	GetBlackHoleBalance(ctx sdk.Context) sdk.Int
	GetCurrentBurnRate(ctx sdk.Context) sdk.Dec
}

type BankKeeper interface {
	GetSupply(ctx sdk.Context, denom string) sdk.Coin
}

