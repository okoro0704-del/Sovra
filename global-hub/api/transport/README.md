# SOVRA Transport Module

**TECHNOLOGY_TYPE**: VITALIZED_LEDGER_TECHNOLOGY

## Overview

The **Transport Module** implements the Airline_Vitalian_Direct handshake, enabling certified airline carriers to seamlessly pay PFF verification fees on behalf of passengers during boarding, with automatic wallet detection and conditional debit logic.

---

## Features

### 🎫 **Certified Airline Carriers**

Airlines are registered as certified entities with their own Sovereign Vaults, enabling proxy payments for passengers.

### 🔗 **Ticket-to-PFF Linking**

Establishes the relationship between airline tickets (PNR/booking reference) and Vitalian DIDs during check-in.

### ⚡ **Boarding_Trigger Logic**

Conditional wallet logic that automatically determines payment source:
- **If Vitalian wallet is empty** → Airline pays from vault
- **If Vitalian wallet is funded** → Vitalian pays from wallet

### 💰 **Quadratic-Sovereign-Split Integration**

Ensures Four Pillars distribution (25/25/25/25) executes regardless of payment source.

### 📧 **Confirmation Receipts**

Real-time notifications sent to Vitalians with boarding confirmation and integrity score updates.

---

## Module Structure

```
global-hub/api/transport/
├── airline_vitalian_direct.go    # Main service implementation
├── schema.sql                     # Database schema
└── README.md                      # This file
```

---

## Quick Start

### 1. Register Airline Carrier

```go
import "github.com/sovrn-protocol/sovrn/hub/api/transport"

avd := transport.NewAirlineVitalianDirect(vaultMgr, economicsKernel, notificationSvc)

carrier := &transport.CertifiedAirlineCarrier{
    CarrierName:     "American Airlines",
    IATA:            "AA",
    ICAO:            "AAL",
    Country:         "USA",
    CertificationID: "FAA-AA-2024",
}

err := avd.RegisterCertifiedAirlineCarrier(ctx, carrier)
```

### 2. Link Ticket to PFF

```go
link, err := avd.LinkTicketToPFF(
    ctx,
    "AA123-PNR456",              // Ticket ID
    "did:sovra:ng:12345",        // Vitalian DID
    "airline:AA",                 // Carrier ID
    "AA123",                      // Flight number
    "LOS",                        // Origin
    "JFK",                        // Destination
    boardingTime,                 // Boarding time
)
```

### 3. Process Boarding Scan

```go
event, err := avd.ProcessBoardingScan(
    sdkCtx,
    "AA123-PNR456",              // Ticket ID
    "a1b2c3d4e5f6...",           // PFF hash
    10000000,                     // Fee: 10 SOV
)

// Check payment method
if event.PaymentMethod == "airline_vault" {
    fmt.Println("Airline paid on behalf of passenger")
} else {
    fmt.Println("Passenger paid from own wallet")
}
```

---

## Key Functions

### RegisterCertifiedAirlineCarrier

Registers a new certified airline carrier with Sovereign Vault.

**Parameters**:
- `carrier` - Airline carrier details (name, IATA, ICAO, certification)

**Returns**:
- Error if registration fails

### LinkTicketToPFF

Links an airline ticket to a Vitalian DID during check-in.

**Parameters**:
- `ticketID` - Airline ticket ID (PNR or booking reference)
- `vitalianDID` - Vitalian DID (e.g., "did:sovra:ng:12345")
- `carrierID` - Airline carrier ID
- `flightNumber` - Flight number
- `origin` - Origin airport IATA code
- `destination` - Destination airport IATA code
- `boardingTime` - Scheduled boarding time

**Returns**:
- `TicketPFFLink` - Link record
- Error if linking fails

### ProcessBoardingScan

Handles PFF scan at boarding gate with conditional wallet logic.

**Parameters**:
- `ticketID` - Airline ticket ID
- `pffHash` - Hash of the PFF verification
- `feeAmount` - Fee amount in uSOV

**Returns**:
- `BoardingEvent` - Boarding event record
- Error if processing fails

**Flow**:
1. Get ticket link
2. Check Vitalian wallet balance
3. If empty → Debit airline vault (proxy payment)
4. If funded → Debit Vitalian wallet
5. Execute Four Pillars split (25/25/25/25)
6. Calculate integrity score
7. Send receipt to Vitalian

### SendBoardingReceipt

Sends confirmation receipt to Vitalian.

**Parameters**:
- `vitalianDID` - Vitalian DID
- `carrierName` - Airline name
- `flightNumber` - Flight number
- `paymentMethod` - "vitalian_wallet" or "airline_vault"
- `feeAmount` - Fee amount in uSOV
- `integrityScore` - Updated integrity score

**Returns**:
- Error if sending fails

**Receipt Message**:
```
"Passage secured via [Airline Name]. Your SOVRA Integrity score has been updated."
```

---

## Database Schema

### Tables

1. **certified_airline_carriers** - Airline registry
2. **ticket_pff_links** - Ticket-to-DID relationships
3. **boarding_events** - Boarding scan records
4. **boarding_receipts** - Receipt history

### Views

1. **airline_proxy_payment_stats** - Proxy payment analytics
2. **vitalian_boarding_history** - Passenger boarding history
3. **flight_boarding_stats** - Per-flight statistics
4. **wallet_check_analytics** - Wallet funding trends

See `schema.sql` for complete schema.

---

## Integration Points

### VaultManager

Manages Sovereign Vault balances for airlines and Vitalians.

**Methods Used**:
- `GetVault(ctx, userID)` - Get vault balance
- `DebitVault(ctx, userID, amount, purpose, pffHash)` - Debit vault

### EconomicsKernel

Implements Quadratic-Sovereign-Split for fee distribution.

**Methods Used**:
- `ExecuteFourWaySplit(ctx, totalFee, feeCollectorModule)` - Distribute fees across Four Pillars

### NotificationService

Sends boarding receipts to Vitalians.

**Methods Used**:
- `SendBoardingReceipt(ctx, receipt)` - Send receipt notification

---

## VLT Compliance

This module follows the **SOVRA Standard** for Vitalized Ledger Technology:

✅ **Autonomous**: Boarding process executes automatically  
✅ **Transparent**: All transactions recorded on-chain  
✅ **Equitable**: Four Pillars distribution maintained  
✅ **Verifiable**: Complete audit trail  
✅ **Privacy-Preserving**: PFF hash stored, not raw biometric data

---

## Documentation

For complete documentation, see:
- [AIRLINE_VITALIAN_DIRECT.md](../../docs/AIRLINE_VITALIAN_DIRECT.md) - Full specification
- [PROXY_PAYMENT_PROTOCOL.md](../../docs/PROXY_PAYMENT_PROTOCOL.md) - Proxy payment details
- [QUADRATIC_SOVEREIGN_SPLIT.md](../../docs/QUADRATIC_SOVEREIGN_SPLIT.md) - Fee distribution

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Transport Module**

