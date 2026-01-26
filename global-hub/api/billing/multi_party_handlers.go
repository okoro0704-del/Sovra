package billing

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

// MultiPartyHandlers provides HTTP endpoints for multi-party settlement
type MultiPartyHandlers struct {
	settlement *MultiPartySettlement
	invoiceGen *InvoiceGenerator
}

// NewMultiPartyHandlers creates new multi-party HTTP handlers
func NewMultiPartyHandlers(settlement *MultiPartySettlement, invoiceGen *InvoiceGenerator) *MultiPartyHandlers {
	return &MultiPartyHandlers{
		settlement: settlement,
		invoiceGen: invoiceGen,
	}
}

// RegisterRoutes registers all multi-party routes
func (h *MultiPartyHandlers) RegisterRoutes(mux *http.ServeMux) {
	// Corporate node management
	mux.HandleFunc("/v1/billing/nodes/register", h.HandleRegisterNode)
	mux.HandleFunc("/v1/billing/nodes/get", h.HandleGetNode)
	
	// Transaction management
	mux.HandleFunc("/v1/billing/transactions/create", h.HandleCreateTransaction)
	mux.HandleFunc("/v1/billing/transactions/settle", h.HandleSettleTransaction)
	mux.HandleFunc("/v1/billing/transactions/get", h.HandleGetTransaction)
	mux.HandleFunc("/v1/billing/transactions/node", h.HandleGetNodeTransactions)
	
	// Pricing
	mux.HandleFunc("/v1/billing/pricing/rules", h.HandleGetPricingRules)
	
	// Invoicing
	mux.HandleFunc("/v1/billing/invoices/generate", h.HandleGenerateInvoice)
	mux.HandleFunc("/v1/billing/invoices/get", h.HandleGetInvoice)
	mux.HandleFunc("/v1/billing/invoices/node", h.HandleGetNodeInvoices)
	mux.HandleFunc("/v1/billing/invoices/pay", h.HandlePayInvoice)
	mux.HandleFunc("/v1/billing/invoices/stats", h.HandleGetInvoiceStats)
}

// HandleRegisterNode handles POST /v1/billing/nodes/register
func (h *MultiPartyHandlers) HandleRegisterNode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var node CorporateNode
	if err := json.NewDecoder(r.Body).Decode(&node); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	ctx := context.Background()
	if err := h.settlement.RegisterCorporateNode(ctx, &node); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(node)
}

// HandleGetNode handles GET /v1/billing/nodes/get?node_id=xxx
func (h *MultiPartyHandlers) HandleGetNode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	nodeID := r.URL.Query().Get("node_id")
	if nodeID == "" {
		http.Error(w, "node_id query parameter is required", http.StatusBadRequest)
		return
	}
	
	ctx := context.Background()
	node, err := h.settlement.GetCorporateNode(ctx, nodeID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(node)
}

// HandleCreateTransaction handles POST /v1/billing/transactions/create
func (h *MultiPartyHandlers) HandleCreateTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		VerificationID string    `json:"verification_id"`
		EventType      EventType `json:"event_type"`
		AirportNodeID  string    `json:"airport_node_id,omitempty"`
		AirlineNodeID  string    `json:"airline_node_id,omitempty"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	ctx := context.Background()
	txCtx, err := h.settlement.CreateTransaction(
		ctx,
		req.VerificationID,
		req.EventType,
		req.AirportNodeID,
		req.AirlineNodeID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(txCtx)
}

// HandleSettleTransaction handles POST /v1/billing/transactions/settle
func (h *MultiPartyHandlers) HandleSettleTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		TransactionID string `json:"transaction_id"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	ctx := context.Background()
	if err := h.settlement.SettleTransaction(ctx, req.TransactionID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	// Get updated transaction
	txCtx, _ := h.settlement.GetTransaction(ctx, req.TransactionID)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "success",
		"message":     "Transaction settled successfully",
		"transaction": txCtx,
	})
}

// HandleGetTransaction handles GET /v1/billing/transactions/get?transaction_id=xxx
func (h *MultiPartyHandlers) HandleGetTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	transactionID := r.URL.Query().Get("transaction_id")
	if transactionID == "" {
		http.Error(w, "transaction_id query parameter is required", http.StatusBadRequest)
		return
	}
	
	ctx := context.Background()
	txCtx, err := h.settlement.GetTransaction(ctx, transactionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(txCtx)
}

// HandleGetNodeTransactions handles GET /v1/billing/transactions/node?node_id=xxx
func (h *MultiPartyHandlers) HandleGetNodeTransactions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	nodeID := r.URL.Query().Get("node_id")
	if nodeID == "" {
		http.Error(w, "node_id query parameter is required", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	transactions, err := h.settlement.GetNodeTransactions(ctx, nodeID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}

// HandleGetPricingRules handles GET /v1/billing/pricing/rules
func (h *MultiPartyHandlers) HandleGetPricingRules(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rules := h.settlement.GetAllPricingRules()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rules)
}

// HandleGenerateInvoice handles POST /v1/billing/invoices/generate
func (h *MultiPartyHandlers) HandleGenerateInvoice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		NodeID string `json:"node_id"`
		Year   int    `json:"year"`
		Month  int    `json:"month"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	invoice, err := h.invoiceGen.GenerateMonthlyInvoice(
		ctx,
		req.NodeID,
		req.Year,
		time.Month(req.Month),
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoice)
}

// HandleGetInvoice handles GET /v1/billing/invoices/get?invoice_id=xxx
func (h *MultiPartyHandlers) HandleGetInvoice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	invoiceID := r.URL.Query().Get("invoice_id")
	if invoiceID == "" {
		http.Error(w, "invoice_id query parameter is required", http.StatusBadRequest)
		return
	}

	// Check for format parameter
	format := r.URL.Query().Get("format")

	ctx := context.Background()
	invoice, err := h.invoiceGen.GetInvoice(ctx, invoiceID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	if format == "text" || format == "summary" {
		// Return text summary
		summary := h.invoiceGen.GenerateInvoiceSummary(invoice)
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(summary))
	} else {
		// Return JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(invoice)
	}
}

// HandleGetNodeInvoices handles GET /v1/billing/invoices/node?node_id=xxx
func (h *MultiPartyHandlers) HandleGetNodeInvoices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	nodeID := r.URL.Query().Get("node_id")
	if nodeID == "" {
		http.Error(w, "node_id query parameter is required", http.StatusBadRequest)
		return
	}

	// Check for specific period
	yearStr := r.URL.Query().Get("year")
	monthStr := r.URL.Query().Get("month")

	ctx := context.Background()

	if yearStr != "" && monthStr != "" {
		// Get specific invoice
		year, _ := strconv.Atoi(yearStr)
		month, _ := strconv.Atoi(monthStr)

		invoice, err := h.invoiceGen.GetNodeInvoice(ctx, nodeID, year, time.Month(month))
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(invoice)
	} else {
		// Get all invoices
		invoices, err := h.invoiceGen.GetAllNodeInvoices(ctx, nodeID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(invoices)
	}
}

// HandlePayInvoice handles POST /v1/billing/invoices/pay
func (h *MultiPartyHandlers) HandlePayInvoice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		InvoiceID string `json:"invoice_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	if err := h.invoiceGen.MarkInvoicePaid(ctx, req.InvoiceID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	invoice, _ := h.invoiceGen.GetInvoice(ctx, req.InvoiceID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Invoice marked as paid",
		"invoice": invoice,
	})
}

// HandleGetInvoiceStats handles GET /v1/billing/invoices/stats
func (h *MultiPartyHandlers) HandleGetInvoiceStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := context.Background()
	stats := h.invoiceGen.GetInvoiceStats(ctx)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
