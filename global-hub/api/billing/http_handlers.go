package billing

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

// HTTPHandlers provides HTTP/REST endpoints for the billing gateway
type HTTPHandlers struct {
	gateway *BillingGateway
}

// NewHTTPHandlers creates new HTTP handlers
func NewHTTPHandlers(gateway *BillingGateway) *HTTPHandlers {
	return &HTTPHandlers{
		gateway: gateway,
	}
}

// RegisterRoutes registers all billing routes with an HTTP mux
func (h *HTTPHandlers) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/v1/billing/purchase", h.HandlePurchaseUnits)
	mux.HandleFunc("/v1/billing/wallet", h.HandleGetWallet)
	mux.HandleFunc("/v1/billing/rates", h.HandleGetExchangeRates)
	mux.HandleFunc("/v1/billing/transactions", h.HandleGetTransactions)
	mux.HandleFunc("/v1/billing/withdraw", h.HandleWithdraw)
	mux.HandleFunc("/v1/billing/stats", h.HandleGetStats)
}

// HandlePurchaseUnits handles POST /v1/billing/purchase
func (h *HTTPHandlers) HandlePurchaseUnits(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PurchaseUnitsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	resp, err := h.gateway.PurchaseUnits(ctx, &req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(resp)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// HandleGetWallet handles GET /v1/billing/wallet?user_id=xxx
func (h *HTTPHandlers) HandleGetWallet(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "user_id query parameter is required", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	wallet, err := h.gateway.GetWallet(ctx, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wallet)
}

// HandleGetExchangeRates handles GET /v1/billing/rates?currency=USD
func (h *HTTPHandlers) HandleGetExchangeRates(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := context.Background()
	currency := r.URL.Query().Get("currency")

	if currency != "" {
		// Get specific currency rate
		rate, err := h.gateway.GetExchangeRate(ctx, currency)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(rate)
	} else {
		// Get all rates
		rates, err := h.gateway.GetExchangeRates(ctx)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(rates)
	}
}

// HandleGetTransactions handles GET /v1/billing/transactions?user_id=xxx&limit=10
func (h *HTTPHandlers) HandleGetTransactions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "user_id query parameter is required", http.StatusBadRequest)
		return
	}

	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	ctx := context.Background()
	txs, err := h.gateway.GetTransactionHistory(ctx, userID, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(txs)
}

// HandleWithdraw handles POST /v1/billing/withdraw
func (h *HTTPHandlers) HandleWithdraw(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserID          string `json:"user_id"`
		Amount          int64  `json:"amount"`
		ExchangeAddress string `json:"exchange_address"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	txID, err := h.gateway.WithdrawToExchange(ctx, req.UserID, req.Amount, req.ExchangeAddress)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"transaction_id": txID,
		"status":         "success",
		"message":        fmt.Sprintf("Withdrawal of %d uSOV initiated", req.Amount),
	})
}

// HandleGetStats handles GET /v1/billing/stats
func (h *HTTPHandlers) HandleGetStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := context.Background()
	stats := h.gateway.GetBillingStats(ctx)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

