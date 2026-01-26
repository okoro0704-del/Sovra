package billing

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// BillingEvent represents a revenue event for carrier charging
type BillingEvent struct {
	EventID        string    `json:"event_id"`
	CarrierID      string    `json:"carrier_id"`
	AmountUSOV     int64     `json:"amount_usov"`
	VerificationID string    `json:"verification_id"`
	CheckpointType string    `json:"checkpoint_type"`
	Timestamp      time.Time `json:"timestamp"`
	Status         string    `json:"status"` // "pending", "charged", "failed"
}

// RevenueEventEngine handles billing events for fast-track verifications
type RevenueEventEngine struct {
	// events stores all billing events
	events map[string]*BillingEvent
	mu     sync.RWMutex
	
	// carrierBalances tracks outstanding charges per carrier
	carrierBalances map[string]int64
	
	// Standard charge per verification (1 SOV = 1,000,000 uSOV)
	standardCharge int64
	
	// Event handlers for async processing
	eventHandlers []BillingEventHandler
}

// BillingEventHandler is a callback for billing events
type BillingEventHandler func(event *BillingEvent) error

// NewRevenueEventEngine creates a new revenue event engine
func NewRevenueEventEngine() *RevenueEventEngine {
	return &RevenueEventEngine{
		events:          make(map[string]*BillingEvent),
		carrierBalances: make(map[string]int64),
		standardCharge:  1000000, // 1 SOV = 1,000,000 uSOV
		eventHandlers:   make([]BillingEventHandler, 0),
	}
}

// CreateBillingEvent creates a new billing event for a verification
func (re *RevenueEventEngine) CreateBillingEvent(
	ctx context.Context,
	carrierID string,
	verificationID string,
	checkpointType string,
) (*BillingEvent, error) {
	re.mu.Lock()
	defer re.mu.Unlock()
	
	// Create billing event
	event := &BillingEvent{
		EventID:        uuid.New().String(),
		CarrierID:      carrierID,
		AmountUSOV:     re.standardCharge, // 1 SOV
		VerificationID: verificationID,
		CheckpointType: checkpointType,
		Timestamp:      time.Now(),
		Status:         "pending",
	}
	
	// Store event
	re.events[event.EventID] = event
	
	// Update carrier balance
	re.carrierBalances[carrierID] += re.standardCharge
	
	// Trigger event handlers asynchronously
	go re.triggerEventHandlers(event)
	
	return event, nil
}

// GetBillingEvent retrieves a billing event by ID
func (re *RevenueEventEngine) GetBillingEvent(ctx context.Context, eventID string) (*BillingEvent, error) {
	re.mu.RLock()
	defer re.mu.RUnlock()
	
	event, exists := re.events[eventID]
	if !exists {
		return nil, fmt.Errorf("billing event not found: %s", eventID)
	}
	
	return event, nil
}

// UpdateEventStatus updates the status of a billing event
func (re *RevenueEventEngine) UpdateEventStatus(
	ctx context.Context,
	eventID string,
	status string,
) error {
	re.mu.Lock()
	defer re.mu.Unlock()
	
	event, exists := re.events[eventID]
	if !exists {
		return fmt.Errorf("billing event not found: %s", eventID)
	}
	
	event.Status = status
	return nil
}

// GetCarrierBalance returns the outstanding balance for a carrier
func (re *RevenueEventEngine) GetCarrierBalance(ctx context.Context, carrierID string) int64 {
	re.mu.RLock()
	defer re.mu.RUnlock()
	
	return re.carrierBalances[carrierID]
}

// GetCarrierEvents returns all billing events for a carrier
func (re *RevenueEventEngine) GetCarrierEvents(
	ctx context.Context,
	carrierID string,
) ([]*BillingEvent, error) {
	re.mu.RLock()
	defer re.mu.RUnlock()
	
	events := make([]*BillingEvent, 0)
	for _, event := range re.events {
		if event.CarrierID == carrierID {
			events = append(events, event)
		}
	}
	
	return events, nil
}

// GetRevenueStats returns revenue statistics
func (re *RevenueEventEngine) GetRevenueStats(ctx context.Context) map[string]interface{} {
	re.mu.RLock()
	defer re.mu.RUnlock()
	
	totalEvents := len(re.events)
	totalRevenue := int64(0)
	pendingRevenue := int64(0)
	chargedRevenue := int64(0)
	failedRevenue := int64(0)
	
	for _, event := range re.events {
		totalRevenue += event.AmountUSOV
		
		switch event.Status {
		case "pending":
			pendingRevenue += event.AmountUSOV
		case "charged":
			chargedRevenue += event.AmountUSOV
		case "failed":
			failedRevenue += event.AmountUSOV
		}
	}
	
	return map[string]interface{}{
		"total_events":     totalEvents,
		"total_revenue":    totalRevenue,
		"pending_revenue":  pendingRevenue,
		"charged_revenue":  chargedRevenue,
		"failed_revenue":   failedRevenue,
		"total_carriers":   len(re.carrierBalances),
		"standard_charge":  re.standardCharge,
	}
}

// RegisterEventHandler registers a callback for billing events
func (re *RevenueEventEngine) RegisterEventHandler(handler BillingEventHandler) {
	re.mu.Lock()
	defer re.mu.Unlock()
	
	re.eventHandlers = append(re.eventHandlers, handler)
}

// triggerEventHandlers calls all registered event handlers
func (re *RevenueEventEngine) triggerEventHandlers(event *BillingEvent) {
	re.mu.RLock()
	handlers := make([]BillingEventHandler, len(re.eventHandlers))
	copy(handlers, re.eventHandlers)
	re.mu.RUnlock()
	
	for _, handler := range handlers {
		if err := handler(event); err != nil {
			// Log error but don't fail the billing event
			fmt.Printf("Event handler error: %v\n", err)
		}
	}
}

