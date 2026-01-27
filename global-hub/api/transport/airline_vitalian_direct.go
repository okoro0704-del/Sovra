// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
//
// Package transport implements the Airline_Vitalian_Direct handshake.
// This enables certified airline carriers to pay PFF verification fees on behalf
// of passengers during boarding, with automatic wallet detection and conditional debit.

package transport

import (
	"context"
	"fmt"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/google/uuid"
)

// Certified_Airline_Carrier represents a certified airline entity
type CertifiedAirlineCarrier struct {
	CarrierID        string    // Unique carrier ID (e.g., "airline:AA")
	CarrierName      string    // Airline name (e.g., "American Airlines")
	IATA             string    // IATA code (e.g., "AA")
	ICAO             string    // ICAO code (e.g., "AAL")
	Country          string    // Country of registration
	CertificationID  string    // Certification ID from aviation authority
	VaultID          string    // Airline's Sovereign Vault ID
	VaultBalance     int64     // Current vault balance in uSOV
	IsActive         bool      // Active status
	CreatedAt        time.Time // Registration timestamp
	UpdatedAt        time.Time // Last update timestamp
}

// TicketPFFLink represents the link between an airline ticket and a Vitalian DID
type TicketPFFLink struct {
	LinkID       string    // Unique link ID
	TicketID     string    // Airline ticket ID (PNR or booking reference)
	VitalianDID  string    // Vitalian DID (e.g., "did:sovra:ng:12345")
	CarrierID    string    // Airline carrier ID
	FlightNumber string    // Flight number (e.g., "AA123")
	Origin       string    // Origin airport IATA code
	Destination  string    // Destination airport IATA code
	BoardingTime time.Time // Scheduled boarding time
	Status       string    // Status: "linked", "boarded", "cancelled"
	CreatedAt    time.Time // Link creation timestamp
	UpdatedAt    time.Time // Last update timestamp
}

// BoardingEvent represents a PFF scan at boarding gate
type BoardingEvent struct {
	EventID          string    // Unique event ID
	TicketID         string    // Airline ticket ID
	VitalianDID      string    // Vitalian DID
	CarrierID        string    // Airline carrier ID
	FlightNumber     string    // Flight number
	PFFHash          string    // Hash of the PFF verification
	WalletCheckResult string   // "vitalian_funded" or "vitalian_empty"
	PaymentMethod    string    // "vitalian_wallet" or "airline_vault"
	FeeAmount        int64     // Fee amount in uSOV
	TransactionID    string    // Payment transaction ID
	IntegrityScore   int       // Updated integrity score
	Timestamp        time.Time // Boarding timestamp
}

// BoardingReceipt represents the confirmation sent to the Vitalian
type BoardingReceipt struct {
	ReceiptID      string    // Unique receipt ID
	VitalianDID    string    // Vitalian DID
	CarrierName    string    // Airline name
	FlightNumber   string    // Flight number
	PaymentMethod  string    // "vitalian_wallet" or "airline_vault"
	FeeAmount      int64     // Fee amount in uSOV
	IntegrityScore int       // Updated integrity score
	Message        string    // Receipt message
	Timestamp      time.Time // Receipt timestamp
}

// VaultManager interface for wallet operations
type VaultManager interface {
	GetVault(ctx context.Context, userID string) (*SovereignVault, error)
	DebitVault(ctx context.Context, userID string, amount int64, purpose string, pffHash string) (string, error)
}

// SovereignVault represents a user's wallet
type SovereignVault struct {
	UserID    string
	DID       string
	Balance   int64
	Status    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// EconomicsKernel interface for fee distribution
type EconomicsKernel interface {
	ExecuteFourWaySplit(ctx sdk.Context, totalFee sdk.Coins, feeCollectorModule string) error
}

// NotificationService interface for sending receipts
type NotificationService interface {
	SendBoardingReceipt(ctx context.Context, receipt *BoardingReceipt) error
}

// AirlineVitalianDirect implements the airline boarding handshake
type AirlineVitalianDirect struct {
	vaultMgr            VaultManager
	economicsKernel     EconomicsKernel
	notificationService NotificationService
	carriers            map[string]*CertifiedAirlineCarrier // In-memory storage (use DB in production)
	ticketLinks         map[string]*TicketPFFLink           // In-memory storage (use DB in production)
	boardingEvents      map[string]*BoardingEvent           // In-memory storage (use DB in production)
}

// NewAirlineVitalianDirect creates a new airline boarding handshake instance
func NewAirlineVitalianDirect(
	vaultMgr VaultManager,
	economicsKernel EconomicsKernel,
	notificationService NotificationService,
) *AirlineVitalianDirect {
	return &AirlineVitalianDirect{
		vaultMgr:            vaultMgr,
		economicsKernel:     economicsKernel,
		notificationService: notificationService,
		carriers:            make(map[string]*CertifiedAirlineCarrier),
		ticketLinks:         make(map[string]*TicketPFFLink),
		boardingEvents:      make(map[string]*BoardingEvent),
	}
}

// RegisterCertifiedAirlineCarrier registers a new certified airline carrier
func (avd *AirlineVitalianDirect) RegisterCertifiedAirlineCarrier(
	ctx context.Context,
	carrier *CertifiedAirlineCarrier,
) error {
	if carrier.CarrierID == "" {
		carrier.CarrierID = fmt.Sprintf("airline:%s", carrier.IATA)
	}

	if carrier.VaultID == "" {
		carrier.VaultID = fmt.Sprintf("vault-%s", carrier.CarrierID)
	}

	carrier.IsActive = true
	carrier.CreatedAt = time.Now()
	carrier.UpdatedAt = time.Now()

	// Create vault for airline carrier
	vault, err := avd.vaultMgr.GetVault(ctx, carrier.VaultID)
	if err != nil {
		return fmt.Errorf("failed to get/create vault for carrier %s: %w", carrier.CarrierID, err)
	}

	carrier.VaultBalance = vault.Balance

	// Store carrier
	avd.carriers[carrier.CarrierID] = carrier

	return nil
}

// LinkTicketToPFF links an airline ticket to a Vitalian DID
// This is called during check-in or booking to establish the ticket-DID relationship
func (avd *AirlineVitalianDirect) LinkTicketToPFF(
	ctx context.Context,
	ticketID string,
	vitalianDID string,
	carrierID string,
	flightNumber string,
	origin string,
	destination string,
	boardingTime time.Time,
) (*TicketPFFLink, error) {
	// Validate carrier exists
	carrier, exists := avd.carriers[carrierID]
	if !exists {
		return nil, fmt.Errorf("carrier %s not found", carrierID)
	}

	if !carrier.IsActive {
		return nil, fmt.Errorf("carrier %s is not active", carrierID)
	}

	// Create ticket link
	link := &TicketPFFLink{
		LinkID:       uuid.New().String(),
		TicketID:     ticketID,
		VitalianDID:  vitalianDID,
		CarrierID:    carrierID,
		FlightNumber: flightNumber,
		Origin:       origin,
		Destination:  destination,
		BoardingTime: boardingTime,
		Status:       "linked",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Store link
	avd.ticketLinks[ticketID] = link

	return link, nil
}

// ProcessBoardingScan handles PFF scan at boarding gate with conditional wallet logic
// This is the "Boarding_Trigger" that checks Vitalian wallet and conditionally debits
func (avd *AirlineVitalianDirect) ProcessBoardingScan(
	ctx sdk.Context,
	ticketID string,
	pffHash string,
	feeAmount int64,
) (*BoardingEvent, error) {
	// 1. Get ticket link
	link, exists := avd.ticketLinks[ticketID]
	if !exists {
		return nil, fmt.Errorf("ticket %s not linked to any Vitalian DID", ticketID)
	}

	if link.Status != "linked" {
		return nil, fmt.Errorf("ticket %s status is %s, expected 'linked'", ticketID, link.Status)
	}

	// 2. Get carrier
	carrier, exists := avd.carriers[link.CarrierID]
	if !exists {
		return nil, fmt.Errorf("carrier %s not found", link.CarrierID)
	}

	// 3. Check Vitalian wallet balance
	vitalianVault, err := avd.vaultMgr.GetVault(context.Background(), link.VitalianDID)
	if err != nil {
		return nil, fmt.Errorf("failed to get Vitalian vault: %w", err)
	}

	var walletCheckResult string
	var paymentMethod string
	var txID string

	// 4. Conditional wallet logic: If Empty -> Airline pays, If Funded -> Vitalian pays
	if vitalianVault.Balance < feeAmount {
		// VITALIAN WALLET IS EMPTY -> TRIGGER AIRLINE_VAULT_DEBIT
		walletCheckResult = "vitalian_empty"
		paymentMethod = "airline_vault"

		// Debit airline vault
		txID, err = avd.vaultMgr.DebitVault(
			context.Background(),
			carrier.VaultID,
			feeAmount,
			fmt.Sprintf("Proxy payment for boarding - Flight %s, Ticket %s", link.FlightNumber, ticketID),
			pffHash,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to debit airline vault: %w", err)
		}

		// Update carrier balance
		carrier.VaultBalance -= feeAmount
		carrier.UpdatedAt = time.Now()
	} else {
		// VITALIAN WALLET IS FUNDED -> TRIGGER VITALIAN_WALLET_DEBIT
		walletCheckResult = "vitalian_funded"
		paymentMethod = "vitalian_wallet"

		// Debit Vitalian wallet
		txID, err = avd.vaultMgr.DebitVault(
			context.Background(),
			link.VitalianDID,
			feeAmount,
			fmt.Sprintf("Boarding fee - Flight %s", link.FlightNumber),
			pffHash,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to debit Vitalian wallet: %w", err)
		}
	}

	// 5. Trigger ExecuteFourWaySplit (25/25/25/25 distribution)
	feeCoins := sdk.NewCoins(sdk.NewInt64Coin("usov", feeAmount))
	err = avd.economicsKernel.ExecuteFourWaySplit(ctx, feeCoins, "fee_collector")
	if err != nil {
		return nil, fmt.Errorf("failed to execute four-way split: %w", err)
	}

	// 6. Calculate integrity score (simple implementation - can be enhanced)
	integrityScore := avd.calculateIntegrityScore(link.VitalianDID)

	// 7. Create boarding event
	event := &BoardingEvent{
		EventID:           uuid.New().String(),
		TicketID:          ticketID,
		VitalianDID:       link.VitalianDID,
		CarrierID:         link.CarrierID,
		FlightNumber:      link.FlightNumber,
		PFFHash:           pffHash,
		WalletCheckResult: walletCheckResult,
		PaymentMethod:     paymentMethod,
		FeeAmount:         feeAmount,
		TransactionID:     txID,
		IntegrityScore:    integrityScore,
		Timestamp:         time.Now(),
	}

	// Store boarding event
	avd.boardingEvents[event.EventID] = event

	// Update ticket link status
	link.Status = "boarded"
	link.UpdatedAt = time.Now()

	// 8. Send receipt to Vitalian
	err = avd.SendBoardingReceipt(
		context.Background(),
		link.VitalianDID,
		carrier.CarrierName,
		link.FlightNumber,
		paymentMethod,
		feeAmount,
		integrityScore,
	)
	if err != nil {
		// Log error but don't fail the boarding process
		fmt.Printf("Warning: failed to send boarding receipt: %v\n", err)
	}

	return event, nil
}

// SendBoardingReceipt sends confirmation receipt to Vitalian
func (avd *AirlineVitalianDirect) SendBoardingReceipt(
	ctx context.Context,
	vitalianDID string,
	carrierName string,
	flightNumber string,
	paymentMethod string,
	feeAmount int64,
	integrityScore int,
) error {
	receipt := &BoardingReceipt{
		ReceiptID:      uuid.New().String(),
		VitalianDID:    vitalianDID,
		CarrierName:    carrierName,
		FlightNumber:   flightNumber,
		PaymentMethod:  paymentMethod,
		FeeAmount:      feeAmount,
		IntegrityScore: integrityScore,
		Message:        fmt.Sprintf("Passage secured via %s. Your SOVRA Integrity score has been updated.", carrierName),
		Timestamp:      time.Now(),
	}

	return avd.notificationService.SendBoardingReceipt(ctx, receipt)
}

// calculateIntegrityScore calculates the Vitalian's integrity score
// This is a simple implementation - can be enhanced with more sophisticated logic
func (avd *AirlineVitalianDirect) calculateIntegrityScore(vitalianDID string) int {
	// Count successful boarding events for this Vitalian
	successfulBoardings := 0
	for _, event := range avd.boardingEvents {
		if event.VitalianDID == vitalianDID {
			successfulBoardings++
		}
	}

	// Base score: 100
	// Add 5 points per successful boarding (capped at 1000)
	score := 100 + (successfulBoardings * 5)
	if score > 1000 {
		score = 1000
	}

	return score
}

// GetCarrier retrieves a certified airline carrier by ID
func (avd *AirlineVitalianDirect) GetCarrier(carrierID string) (*CertifiedAirlineCarrier, error) {
	carrier, exists := avd.carriers[carrierID]
	if !exists {
		return nil, fmt.Errorf("carrier %s not found", carrierID)
	}
	return carrier, nil
}

// GetTicketLink retrieves a ticket-PFF link by ticket ID
func (avd *AirlineVitalianDirect) GetTicketLink(ticketID string) (*TicketPFFLink, error) {
	link, exists := avd.ticketLinks[ticketID]
	if !exists {
		return nil, fmt.Errorf("ticket link %s not found", ticketID)
	}
	return link, nil
}

// GetBoardingEvent retrieves a boarding event by event ID
func (avd *AirlineVitalianDirect) GetBoardingEvent(eventID string) (*BoardingEvent, error) {
	event, exists := avd.boardingEvents[eventID]
	if !exists {
		return nil, fmt.Errorf("boarding event %s not found", eventID)
	}
	return event, nil
}

