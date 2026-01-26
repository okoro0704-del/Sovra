package billing

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// EventType represents the type of verification event
type EventType string

const (
	EventTypeAirportCheckpoint EventType = "AIRPORT_CHECKPOINT"
	EventTypeBoardingGate      EventType = "BOARDING_GATE"
	EventTypeDualPurpose       EventType = "DUAL_PURPOSE" // Both security and boarding
)

// NodeType represents the type of corporate node
type NodeType string

const (
	NodeTypeAirport NodeType = "airport"
	NodeTypeAirline NodeType = "airline"
)

// CorporateNode represents an airport or airline entity
type CorporateNode struct {
	NodeID      string    `json:"node_id"`
	NodeType    NodeType  `json:"node_type"`
	Name        string    `json:"name"`
	IATA        string    `json:"iata_code"`       // Airport/Airline IATA code
	Country     string    `json:"country"`
	WalletID    string    `json:"wallet_id"`
	CreatedAt   time.Time `json:"created_at"`
	IsActive    bool      `json:"is_active"`
}

// PayerAllocation represents a single payer's portion of a transaction
type PayerAllocation struct {
	PayerID        string    `json:"payer_id"`
	PayerType      NodeType  `json:"payer_type"`
	AmountUSOV     int64     `json:"amount_usov"`
	Percentage     float64   `json:"percentage"`      // 0.0 to 1.0
	EventType      EventType `json:"event_type"`
}

// TransactionContext holds multi-party payment information
type TransactionContext struct {
	TransactionID   string             `json:"transaction_id"`
	VerificationID  string             `json:"verification_id"`
	EventType       EventType          `json:"event_type"`
	TotalAmountUSOV int64              `json:"total_amount_usov"`
	Payers          []PayerAllocation  `json:"payers"`
	Timestamp       time.Time          `json:"timestamp"`
	Status          string             `json:"status"` // "pending", "settled", "failed"
	Metadata        map[string]string  `json:"metadata,omitempty"`
}

// EventPricingRule defines pricing for different event types
type EventPricingRule struct {
	EventType      EventType `json:"event_type"`
	BaseAmountUSOV int64     `json:"base_amount_usov"`
	Description    string    `json:"description"`
}

// SplitRule defines how fees are split for dual-purpose events
type SplitRule struct {
	EventType         EventType `json:"event_type"`
	PrimaryPayerType  NodeType  `json:"primary_payer_type"`
	PrimaryPercentage float64   `json:"primary_percentage"`
	SecondaryPayerType NodeType `json:"secondary_payer_type"`
	SecondaryPercentage float64 `json:"secondary_percentage"`
	Description       string    `json:"description"`
}

// MultiPartySettlement manages multi-party billing transactions
type MultiPartySettlement struct {
	// Pricing rules for different event types
	pricingRules map[EventType]*EventPricingRule
	
	// Split rules for dual-purpose events
	splitRules map[EventType]*SplitRule
	
	// Transaction storage
	transactions map[string]*TransactionContext
	mu           sync.RWMutex
	
	// Corporate nodes registry
	corporateNodes map[string]*CorporateNode
	
	// Wallet manager for debiting corporate wallets
	walletMgr *WalletManager
}

// NewMultiPartySettlement creates a new multi-party settlement engine
func NewMultiPartySettlement(walletMgr *WalletManager) *MultiPartySettlement {
	mps := &MultiPartySettlement{
		pricingRules:   make(map[EventType]*EventPricingRule),
		splitRules:     make(map[EventType]*SplitRule),
		transactions:   make(map[string]*TransactionContext),
		corporateNodes: make(map[string]*CorporateNode),
		walletMgr:      walletMgr,
	}
	
	// Initialize default pricing rules
	mps.initializePricingRules()
	
	// Initialize default split rules
	mps.initializeSplitRules()
	
	return mps
}

// initializePricingRules sets up default pricing for event types
func (mps *MultiPartySettlement) initializePricingRules() {
	// AIRPORT_CHECKPOINT: 1 SOV (1,000,000 uSOV)
	mps.pricingRules[EventTypeAirportCheckpoint] = &EventPricingRule{
		EventType:      EventTypeAirportCheckpoint,
		BaseAmountUSOV: 1_000_000, // 1 SOV
		Description:    "Security checkpoint verification - billed to airport",
	}
	
	// BOARDING_GATE: 10 SOV (10,000,000 uSOV)
	mps.pricingRules[EventTypeBoardingGate] = &EventPricingRule{
		EventType:      EventTypeBoardingGate,
		BaseAmountUSOV: 10_000_000, // 10 SOV
		Description:    "Boarding gate verification - billed to airline",
	}
	
	// DUAL_PURPOSE: 11 SOV total (1 + 10), split 20/80
	mps.pricingRules[EventTypeDualPurpose] = &EventPricingRule{
		EventType:      EventTypeDualPurpose,
		BaseAmountUSOV: 11_000_000, // 11 SOV total
		Description:    "Dual-purpose verification - split between airport and airline",
	}
}

// initializeSplitRules sets up default split rules
func (mps *MultiPartySettlement) initializeSplitRules() {
	// DUAL_PURPOSE: 20% Airport, 80% Airline
	mps.splitRules[EventTypeDualPurpose] = &SplitRule{
		EventType:           EventTypeDualPurpose,
		PrimaryPayerType:    NodeTypeAirline,
		PrimaryPercentage:   0.80, // 80% to airline
		SecondaryPayerType:  NodeTypeAirport,
		SecondaryPercentage: 0.20, // 20% to airport
		Description:         "Dual-purpose verification: 80% airline, 20% airport",
	}
}

// RegisterCorporateNode registers a new corporate node (airport or airline)
func (mps *MultiPartySettlement) RegisterCorporateNode(ctx context.Context, node *CorporateNode) error {
	mps.mu.Lock()
	defer mps.mu.Unlock()
	
	if node.NodeID == "" {
		node.NodeID = uuid.New().String()
	}
	
	if node.CreatedAt.IsZero() {
		node.CreatedAt = time.Now()
	}
	
	node.IsActive = true
	
	// Create wallet for corporate node
	walletID := fmt.Sprintf("wallet-%s", node.NodeID)
	node.WalletID = walletID
	
	// Ensure corporate wallet exists (enterprise type for escrow)
	_, err := mps.walletMgr.GetOrCreateWallet(ctx, walletID, "enterprise")
	if err != nil {
		return fmt.Errorf("failed to create wallet for node %s: %w", node.NodeID, err)
	}
	
	mps.corporateNodes[node.NodeID] = node
	
	return nil
}

// GetCorporateNode retrieves a corporate node by ID
func (mps *MultiPartySettlement) GetCorporateNode(ctx context.Context, nodeID string) (*CorporateNode, error) {
	mps.mu.RLock()
	defer mps.mu.RUnlock()

	node, exists := mps.corporateNodes[nodeID]
	if !exists {
		return nil, fmt.Errorf("corporate node not found: %s", nodeID)
	}

	return node, nil
}

// CreateTransaction creates a new multi-party transaction
func (mps *MultiPartySettlement) CreateTransaction(
	ctx context.Context,
	verificationID string,
	eventType EventType,
	airportNodeID string,
	airlineNodeID string,
) (*TransactionContext, error) {
	mps.mu.Lock()
	defer mps.mu.Unlock()

	// Get pricing rule
	pricingRule, exists := mps.pricingRules[eventType]
	if !exists {
		return nil, fmt.Errorf("no pricing rule for event type: %s", eventType)
	}

	// Create transaction context
	txCtx := &TransactionContext{
		TransactionID:   uuid.New().String(),
		VerificationID:  verificationID,
		EventType:       eventType,
		TotalAmountUSOV: pricingRule.BaseAmountUSOV,
		Payers:          make([]PayerAllocation, 0),
		Timestamp:       time.Now(),
		Status:          "pending",
		Metadata:        make(map[string]string),
	}

	// Allocate payers based on event type
	switch eventType {
	case EventTypeAirportCheckpoint:
		// Bill airport only
		if airportNodeID == "" {
			return nil, fmt.Errorf("airport_node_id required for AIRPORT_CHECKPOINT event")
		}

		txCtx.Payers = append(txCtx.Payers, PayerAllocation{
			PayerID:    airportNodeID,
			PayerType:  NodeTypeAirport,
			AmountUSOV: pricingRule.BaseAmountUSOV,
			Percentage: 1.0,
			EventType:  eventType,
		})

	case EventTypeBoardingGate:
		// Bill airline only
		if airlineNodeID == "" {
			return nil, fmt.Errorf("airline_node_id required for BOARDING_GATE event")
		}

		txCtx.Payers = append(txCtx.Payers, PayerAllocation{
			PayerID:    airlineNodeID,
			PayerType:  NodeTypeAirline,
			AmountUSOV: pricingRule.BaseAmountUSOV,
			Percentage: 1.0,
			EventType:  eventType,
		})

	case EventTypeDualPurpose:
		// Split between airport and airline
		if airportNodeID == "" || airlineNodeID == "" {
			return nil, fmt.Errorf("both airport_node_id and airline_node_id required for DUAL_PURPOSE event")
		}

		splitRule := mps.splitRules[eventType]

		// Airline pays 80%
		airlineAmount := int64(float64(pricingRule.BaseAmountUSOV) * splitRule.PrimaryPercentage)
		txCtx.Payers = append(txCtx.Payers, PayerAllocation{
			PayerID:    airlineNodeID,
			PayerType:  NodeTypeAirline,
			AmountUSOV: airlineAmount,
			Percentage: splitRule.PrimaryPercentage,
			EventType:  eventType,
		})

		// Airport pays 20%
		airportAmount := int64(float64(pricingRule.BaseAmountUSOV) * splitRule.SecondaryPercentage)
		txCtx.Payers = append(txCtx.Payers, PayerAllocation{
			PayerID:    airportNodeID,
			PayerType:  NodeTypeAirport,
			AmountUSOV: airportAmount,
			Percentage: splitRule.SecondaryPercentage,
			EventType:  eventType,
		})

	default:
		return nil, fmt.Errorf("unsupported event type: %s", eventType)
	}

	// Store transaction
	mps.transactions[txCtx.TransactionID] = txCtx

	return txCtx, nil
}

// SettleTransaction processes payment from all payers
func (mps *MultiPartySettlement) SettleTransaction(ctx context.Context, transactionID string) error {
	mps.mu.Lock()
	defer mps.mu.Unlock()

	txCtx, exists := mps.transactions[transactionID]
	if !exists {
		return fmt.Errorf("transaction not found: %s", transactionID)
	}

	if txCtx.Status == "settled" {
		return fmt.Errorf("transaction already settled: %s", transactionID)
	}

	// Process each payer
	for i, payer := range txCtx.Payers {
		// Get corporate node
		node, exists := mps.corporateNodes[payer.PayerID]
		if !exists {
			txCtx.Status = "failed"
			return fmt.Errorf("corporate node not found: %s", payer.PayerID)
		}

		// Debit from corporate wallet (use PayPFFFeeSmart for smart escrow handling)
		txID, err := mps.walletMgr.PayPFFFeeSmart(ctx, node.WalletID, payer.AmountUSOV)
		if err != nil {
			txCtx.Status = "failed"
			return fmt.Errorf("failed to debit %s (%s): %w", node.Name, payer.PayerID, err)
		}

		// Store transaction ID in metadata
		txCtx.Metadata[fmt.Sprintf("payer_%d_tx_id", i)] = txID
	}

	// Mark as settled
	txCtx.Status = "settled"

	return nil
}

// GetTransaction retrieves a transaction by ID
func (mps *MultiPartySettlement) GetTransaction(ctx context.Context, transactionID string) (*TransactionContext, error) {
	mps.mu.RLock()
	defer mps.mu.RUnlock()

	txCtx, exists := mps.transactions[transactionID]
	if !exists {
		return nil, fmt.Errorf("transaction not found: %s", transactionID)
	}

	return txCtx, nil
}

// GetNodeTransactions returns all transactions for a corporate node
func (mps *MultiPartySettlement) GetNodeTransactions(ctx context.Context, nodeID string) ([]*TransactionContext, error) {
	mps.mu.RLock()
	defer mps.mu.RUnlock()

	transactions := make([]*TransactionContext, 0)

	for _, txCtx := range mps.transactions {
		for _, payer := range txCtx.Payers {
			if payer.PayerID == nodeID {
				transactions = append(transactions, txCtx)
				break
			}
		}
	}

	return transactions, nil
}

// GetPricingRule returns the pricing rule for an event type
func (mps *MultiPartySettlement) GetPricingRule(eventType EventType) (*EventPricingRule, error) {
	mps.mu.RLock()
	defer mps.mu.RUnlock()

	rule, exists := mps.pricingRules[eventType]
	if !exists {
		return nil, fmt.Errorf("no pricing rule for event type: %s", eventType)
	}

	return rule, nil
}

// GetAllPricingRules returns all pricing rules
func (mps *MultiPartySettlement) GetAllPricingRules() map[EventType]*EventPricingRule {
	mps.mu.RLock()
	defer mps.mu.RUnlock()

	rules := make(map[EventType]*EventPricingRule)
	for k, v := range mps.pricingRules {
		rules[k] = v
	}

	return rules
}


