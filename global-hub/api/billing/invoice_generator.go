package billing

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// InvoiceLineItem represents a single line item on an invoice
type InvoiceLineItem struct {
	LineItemID      string    `json:"line_item_id"`
	TransactionID   string    `json:"transaction_id"`
	VerificationID  string    `json:"verification_id"`
	EventType       EventType `json:"event_type"`
	AmountUSOV      int64     `json:"amount_usov"`
	Percentage      float64   `json:"percentage,omitempty"`
	Description     string    `json:"description"`
	Timestamp       time.Time `json:"timestamp"`
}

// MonthlyInvoice represents a monthly billing summary for a corporate node
type MonthlyInvoice struct {
	InvoiceID       string             `json:"invoice_id"`
	NodeID          string             `json:"node_id"`
	NodeName        string             `json:"node_name"`
	NodeType        NodeType           `json:"node_type"`
	BillingPeriod   string             `json:"billing_period"` // "2026-01" format
	StartDate       time.Time          `json:"start_date"`
	EndDate         time.Time          `json:"end_date"`
	LineItems       []InvoiceLineItem  `json:"line_items"`
	TotalAmountUSOV int64              `json:"total_amount_usov"`
	TotalSOV        float64            `json:"total_sov"`
	TotalTransactions int              `json:"total_transactions"`
	Status          string             `json:"status"` // "draft", "finalized", "paid"
	GeneratedAt     time.Time          `json:"generated_at"`
	DueDate         time.Time          `json:"due_date,omitempty"`
	PaidAt          time.Time          `json:"paid_at,omitempty"`
	
	// Breakdown by event type
	EventBreakdown  map[EventType]EventSummary `json:"event_breakdown"`
}

// EventSummary summarizes transactions by event type
type EventSummary struct {
	EventType       EventType `json:"event_type"`
	Count           int       `json:"count"`
	TotalAmountUSOV int64     `json:"total_amount_usov"`
	TotalSOV        float64   `json:"total_sov"`
}

// InvoiceGenerator manages monthly invoice generation
type InvoiceGenerator struct {
	// Invoice storage
	invoices map[string]*MonthlyInvoice
	mu       sync.RWMutex
	
	// Multi-party settlement engine
	settlement *MultiPartySettlement
	
	// Invoice index by node and period
	invoiceIndex map[string]string // key: "nodeID:period" -> invoiceID
}

// NewInvoiceGenerator creates a new invoice generator
func NewInvoiceGenerator(settlement *MultiPartySettlement) *InvoiceGenerator {
	return &InvoiceGenerator{
		invoices:     make(map[string]*MonthlyInvoice),
		settlement:   settlement,
		invoiceIndex: make(map[string]string),
	}
}

// GenerateMonthlyInvoice generates a monthly invoice for a corporate node
func (ig *InvoiceGenerator) GenerateMonthlyInvoice(
	ctx context.Context,
	nodeID string,
	year int,
	month time.Month,
) (*MonthlyInvoice, error) {
	ig.mu.Lock()
	defer ig.mu.Unlock()
	
	// Get corporate node
	node, err := ig.settlement.GetCorporateNode(ctx, nodeID)
	if err != nil {
		return nil, err
	}
	
	// Calculate billing period
	startDate := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second) // Last second of month
	billingPeriod := fmt.Sprintf("%d-%02d", year, month)
	
	// Check if invoice already exists
	indexKey := fmt.Sprintf("%s:%s", nodeID, billingPeriod)
	if existingInvoiceID, exists := ig.invoiceIndex[indexKey]; exists {
		return ig.invoices[existingInvoiceID], nil
	}
	
	// Get all transactions for this node
	allTransactions, err := ig.settlement.GetNodeTransactions(ctx, nodeID)
	if err != nil {
		return nil, err
	}
	
	// Filter transactions for this billing period
	lineItems := make([]InvoiceLineItem, 0)
	totalAmount := int64(0)
	eventBreakdown := make(map[EventType]EventSummary)
	
	for _, txCtx := range allTransactions {
		// Check if transaction is in billing period
		if txCtx.Timestamp.Before(startDate) || txCtx.Timestamp.After(endDate) {
			continue
		}
		
		// Only include settled transactions
		if txCtx.Status != "settled" {
			continue
		}
		
		// Find this node's payer allocation
		for _, payer := range txCtx.Payers {
			if payer.PayerID != nodeID {
				continue
			}
			
			// Create line item
			description := ig.buildLineItemDescription(payer.EventType, payer.Percentage)
			lineItem := InvoiceLineItem{
				LineItemID:     uuid.New().String(),
				TransactionID:  txCtx.TransactionID,
				VerificationID: txCtx.VerificationID,
				EventType:      payer.EventType,
				AmountUSOV:     payer.AmountUSOV,
				Percentage:     payer.Percentage,
				Description:    description,
				Timestamp:      txCtx.Timestamp,
			}
			
			lineItems = append(lineItems, lineItem)
			totalAmount += payer.AmountUSOV
			
			// Update event breakdown
			summary, exists := eventBreakdown[payer.EventType]
			if !exists {
				summary = EventSummary{
					EventType: payer.EventType,
				}
			}
			summary.Count++
			summary.TotalAmountUSOV += payer.AmountUSOV
			summary.TotalSOV = float64(summary.TotalAmountUSOV) / 1_000_000.0
			eventBreakdown[payer.EventType] = summary
		}
	}
	
	// Create invoice
	invoice := &MonthlyInvoice{
		InvoiceID:         uuid.New().String(),
		NodeID:            nodeID,
		NodeName:          node.Name,
		NodeType:          node.NodeType,
		BillingPeriod:     billingPeriod,
		StartDate:         startDate,
		EndDate:           endDate,
		LineItems:         lineItems,
		TotalAmountUSOV:   totalAmount,
		TotalSOV:          float64(totalAmount) / 1_000_000.0,
		TotalTransactions: len(lineItems),
		Status:            "finalized",
		GeneratedAt:       time.Now(),
		DueDate:           endDate.AddDate(0, 0, 15), // Due 15 days after month end
		EventBreakdown:    eventBreakdown,
	}
	
	// Store invoice
	ig.invoices[invoice.InvoiceID] = invoice
	ig.invoiceIndex[indexKey] = invoice.InvoiceID
	
	return invoice, nil
}

// buildLineItemDescription creates a description for a line item
func (ig *InvoiceGenerator) buildLineItemDescription(eventType EventType, percentage float64) string {
	switch eventType {
	case EventTypeAirportCheckpoint:
		return "Security checkpoint verification"
	case EventTypeBoardingGate:
		return "Boarding gate verification"
	case EventTypeDualPurpose:
		return fmt.Sprintf("Dual-purpose verification (%.0f%% share)", percentage*100)
	default:
		return string(eventType)
	}
}

// GetInvoice retrieves an invoice by ID
func (ig *InvoiceGenerator) GetInvoice(ctx context.Context, invoiceID string) (*MonthlyInvoice, error) {
	ig.mu.RLock()
	defer ig.mu.RUnlock()

	invoice, exists := ig.invoices[invoiceID]
	if !exists {
		return nil, fmt.Errorf("invoice not found: %s", invoiceID)
	}

	return invoice, nil
}

// GetNodeInvoice retrieves an invoice for a node and billing period
func (ig *InvoiceGenerator) GetNodeInvoice(
	ctx context.Context,
	nodeID string,
	year int,
	month time.Month,
) (*MonthlyInvoice, error) {
	ig.mu.RLock()
	defer ig.mu.RUnlock()

	billingPeriod := fmt.Sprintf("%d-%02d", year, month)
	indexKey := fmt.Sprintf("%s:%s", nodeID, billingPeriod)

	invoiceID, exists := ig.invoiceIndex[indexKey]
	if !exists {
		return nil, fmt.Errorf("no invoice found for node %s in period %s", nodeID, billingPeriod)
	}

	return ig.invoices[invoiceID], nil
}

// GetAllNodeInvoices returns all invoices for a corporate node
func (ig *InvoiceGenerator) GetAllNodeInvoices(ctx context.Context, nodeID string) ([]*MonthlyInvoice, error) {
	ig.mu.RLock()
	defer ig.mu.RUnlock()

	invoices := make([]*MonthlyInvoice, 0)

	for _, invoice := range ig.invoices {
		if invoice.NodeID == nodeID {
			invoices = append(invoices, invoice)
		}
	}

	return invoices, nil
}

// MarkInvoicePaid marks an invoice as paid
func (ig *InvoiceGenerator) MarkInvoicePaid(ctx context.Context, invoiceID string) error {
	ig.mu.Lock()
	defer ig.mu.Unlock()

	invoice, exists := ig.invoices[invoiceID]
	if !exists {
		return fmt.Errorf("invoice not found: %s", invoiceID)
	}

	if invoice.Status == "paid" {
		return fmt.Errorf("invoice already paid: %s", invoiceID)
	}

	invoice.Status = "paid"
	invoice.PaidAt = time.Now()

	return nil
}

// GetInvoiceStats returns statistics about invoices
func (ig *InvoiceGenerator) GetInvoiceStats(ctx context.Context) map[string]interface{} {
	ig.mu.RLock()
	defer ig.mu.RUnlock()

	totalInvoices := len(ig.invoices)
	totalRevenue := int64(0)
	paidRevenue := int64(0)
	unpaidRevenue := int64(0)

	invoicesByStatus := make(map[string]int)
	invoicesByNodeType := make(map[NodeType]int)

	for _, invoice := range ig.invoices {
		totalRevenue += invoice.TotalAmountUSOV

		if invoice.Status == "paid" {
			paidRevenue += invoice.TotalAmountUSOV
		} else {
			unpaidRevenue += invoice.TotalAmountUSOV
		}

		invoicesByStatus[invoice.Status]++
		invoicesByNodeType[invoice.NodeType]++
	}

	return map[string]interface{}{
		"total_invoices":        totalInvoices,
		"total_revenue_usov":    totalRevenue,
		"total_revenue_sov":     float64(totalRevenue) / 1_000_000.0,
		"paid_revenue_usov":     paidRevenue,
		"paid_revenue_sov":      float64(paidRevenue) / 1_000_000.0,
		"unpaid_revenue_usov":   unpaidRevenue,
		"unpaid_revenue_sov":    float64(unpaidRevenue) / 1_000_000.0,
		"invoices_by_status":    invoicesByStatus,
		"invoices_by_node_type": invoicesByNodeType,
	}
}

// GenerateInvoiceSummary creates a text summary of an invoice
func (ig *InvoiceGenerator) GenerateInvoiceSummary(invoice *MonthlyInvoice) string {
	summary := fmt.Sprintf(`
╔════════════════════════════════════════════════════════════════╗
║                    SOVRN PROTOCOL INVOICE                      ║
╚════════════════════════════════════════════════════════════════╝

Invoice ID:      %s
Billing Period:  %s
Node:            %s (%s)
Node Type:       %s

Period:          %s to %s
Generated:       %s
Due Date:        %s
Status:          %s

────────────────────────────────────────────────────────────────

TRANSACTION SUMMARY:

`, invoice.InvoiceID, invoice.BillingPeriod, invoice.NodeName, invoice.NodeID,
		invoice.NodeType, invoice.StartDate.Format("2006-01-02"),
		invoice.EndDate.Format("2006-01-02"), invoice.GeneratedAt.Format("2006-01-02 15:04:05"),
		invoice.DueDate.Format("2006-01-02"), invoice.Status)

	// Event breakdown
	for eventType, breakdown := range invoice.EventBreakdown {
		summary += fmt.Sprintf("%-25s  %5d transactions  %10.6f SOV\n",
			eventType, breakdown.Count, breakdown.TotalSOV)
	}

	summary += fmt.Sprintf(`
────────────────────────────────────────────────────────────────

TOTAL TRANSACTIONS:  %d
TOTAL AMOUNT:        %.6f SOV (%d uSOV)

────────────────────────────────────────────────────────────────

Payment Instructions:
  Please ensure your corporate wallet has sufficient balance.
  Payments are automatically debited from your escrow wallet.

Questions? Contact: billing@sovrn-protocol.org

`, invoice.TotalTransactions, invoice.TotalSOV, invoice.TotalAmountUSOV)

	return summary
}


