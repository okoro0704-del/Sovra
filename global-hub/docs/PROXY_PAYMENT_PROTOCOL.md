# SOVRA Proxy Payment Protocol

**TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY**

## Overview

The **Proxy Payment Protocol** enables third parties (airports, airlines, border agencies) to pay PFF verification fees on behalf of travelers who have insufficient funds. This ensures seamless passage while maintaining the traveler's verification history and triggering the Four Pillars fee distribution.

---

## Key Features

### 1. Balance Check Before Transaction

Before any PFF transaction, the system checks if the user has sufficient funds:
- If `User_Wallet >= Required_Fee` → Proceed with normal payment
- If `User_Wallet < Required_Fee` → Return `STATUS_INSUFFICIENT_FUNDS_PROXY_REQUIRED`

### 2. Proxy Handshake

When a traveler has insufficient funds, a proxy entity (airport, airline) can pay on their behalf:
- **Debit**: Airport's wallet is debited for the full fee
- **Credit**: Traveler receives credit for being verified (Vitalian Record)
- **Split**: ExecuteFourWaySplit distributes fees across Four Pillars
- **History**: Traveler's travel history shows `Verified_Passage_Success`

### 3. Vitalian Record Tracking

Every verification creates a Vitalian Record that tracks:
- Traveler's DID
- Verification status (`verified_passage_success`)
- Payment method (`self` or `proxy`)
- Proxy DID (if proxy payment)
- Transaction ID
- PFF hash

This ensures travel history stays clean regardless of who paid.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                  Proxy Payment Protocol                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Balance Check   │      │  Proxy Handshake │            │
│  │                  │      │                  │            │
│  │ - Check wallet   │      │ - Debit airport  │            │
│  │ - Return status  │      │ - Credit traveler│            │
│  └──────────────────┘      └──────────────────┘            │
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ Four Pillars     │      │ Vitalian Record  │            │
│  │ Distribution     │      │                  │            │
│  │                  │      │ - Mark verified  │            │
│  │ - 25% Citizen    │      │ - Link to proxy  │            │
│  │ - 25% R&D        │      │ - Clean history  │            │
│  │ - 25% Infra      │      └──────────────────┘            │
│  │ - 25% Burn       │                                       │
│  └──────────────────┘                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## API Reference

### CheckBalanceBeforeTransaction

Validates user has sufficient funds before PFF transaction.

**Function Signature**:
```go
func (ppp *ProxyPaymentProtocol) CheckBalanceBeforeTransaction(
    ctx context.Context,
    userDID string,
    requiredFee int64,
) (*BalanceCheckResult, error)
```

**Parameters**:
- `ctx`: Context
- `userDID`: DID of the user
- `requiredFee`: Required fee amount in uSOV

**Returns**:
```go
type BalanceCheckResult struct {
    HasSufficientFunds bool   // True if balance >= required fee
    Status             string // Status code
    CurrentBalance     int64  // Current balance in uSOV
    RequiredFee        int64  // Required fee in uSOV
    Shortfall          int64  // Amount short (if insufficient)
}
```

**Status Codes**:
- `STATUS_SUFFICIENT_FUNDS` - User has enough funds
- `STATUS_INSUFFICIENT_FUNDS_PROXY_REQUIRED` - User needs proxy payment

**Example**:
```go
result, err := ppp.CheckBalanceBeforeTransaction(ctx, "did:sovra:ng:12345", 1000000)
if !result.HasSufficientFunds {
    // Trigger proxy payment flow
    fmt.Printf("Shortfall: %d uSOV\n", result.Shortfall)
}
```

---

### ExecuteProxyPayment

Handles third-party payment on behalf of traveler.

**Function Signature**:
```go
func (ppp *ProxyPaymentProtocol) ExecuteProxyPayment(
    ctx sdk.Context,
    travelerDID string,
    proxyDID string,
    fee int64,
    pffHash string,
) (*ProxyPaymentResult, error)
```

**Parameters**:
- `ctx`: Cosmos SDK context
- `travelerDID`: DID of the traveler being verified
- `proxyDID`: DID of the entity paying (airport, airline, etc.)
- `fee`: Fee amount in uSOV
- `pffHash`: Hash of the PFF verification

**Returns**:
```go
type ProxyPaymentResult struct {
    TransactionID       string    // Unique transaction ID
    TravelerDID         string    // DID of the traveler
    ProxyDID            string    // DID of the proxy payer
    Fee                 int64     // Fee amount in uSOV
    TravelerStatus      string    // "verified_passage_success"
    ProxyBalanceBefore  int64     // Proxy balance before payment
    ProxyBalanceAfter   int64     // Proxy balance after payment
    FourPillarsSplit    bool      // Confirms ExecuteFourWaySplit triggered
    VitalianRecordID    string    // ID of the Vitalian record created
    Timestamp           time.Time // Transaction timestamp
}
```

**Example**:
```go
result, err := ppp.ExecuteProxyPayment(
    ctx,
    "did:sovra:ng:traveler123",
    "did:sovra:ng:airport_lagos",
    1000000, // 1 SOV
    "sha256_pff_hash",
)
if err == nil {
    fmt.Printf("Traveler status: %s\n", result.TravelerStatus)
    fmt.Printf("Four Pillars split: %v\n", result.FourPillarsSplit)
}
```

---

### RecordVitalianPassage

Marks traveler as verified even when proxy paid.

**Function Signature**:
```go
func (ppp *ProxyPaymentProtocol) RecordVitalianPassage(
    ctx sdk.Context,
    travelerDID string,
    proxyDID string,
    txID string,
    pffHash string,
) (string, error)
```

**Parameters**:
- `ctx`: Cosmos SDK context
- `travelerDID`: DID of the traveler
- `proxyDID`: DID of the proxy payer
- `txID`: Transaction ID of the proxy payment
- `pffHash`: Hash of the PFF verification

**Returns**:
- Record ID of the created Vitalian record

**Example**:
```go
recordID, err := ppp.RecordVitalianPassage(
    ctx,
    "did:sovra:ng:traveler123",
    "did:sovra:ng:airport_lagos",
    "tx_abc123",
    "sha256_pff_hash",
)
```

---

## Use Cases

### Use Case 1: Airport Checkpoint

**Scenario**: Traveler arrives at Lagos airport with insufficient SOV balance.

**Flow**:
1. Traveler scans PFF at checkpoint
2. System checks balance: `CheckBalanceBeforeTransaction()`
3. Balance insufficient → Returns `STATUS_INSUFFICIENT_FUNDS_PROXY_REQUIRED`
4. Airport system triggers proxy payment: `ExecuteProxyPayment()`
5. Airport wallet debited 1 SOV
6. Traveler marked as `Verified_Passage_Success`
7. Four Pillars split executes:
   - 25% → Citizen Dividend Pool
   - 25% → R&D Vault
   - 25% → Infrastructure Pool
   - 25% → Black Hole (burn)
8. Traveler passes through checkpoint

**Result**: Traveler verified, airport paid, history clean, fees distributed.

---

### Use Case 2: Airline Boarding Gate

**Scenario**: Passenger boarding international flight with zero SOV balance.

**Flow**:
1. Passenger scans PFF at boarding gate
2. Balance check fails → `STATUS_INSUFFICIENT_FUNDS_PROXY_REQUIRED`
3. Airline triggers proxy payment (10 SOV for international verification)
4. Airline wallet debited 10 SOV
5. Passenger marked as `Verified_Passage_Success`
6. Four Pillars split executes
7. Passenger boards flight

**Result**: Seamless boarding, airline covers cost, passenger verified.

---

### Use Case 3: Border Control

**Scenario**: Foreign visitor entering Nigeria with no SOV tokens.

**Flow**:
1. Visitor scans PFF at immigration
2. Balance check fails → `STATUS_INSUFFICIENT_FUNDS_PROXY_REQUIRED`
3. Immigration agency triggers proxy payment
4. Agency wallet debited
5. Visitor marked as `Verified_Passage_Success`
6. Visitor granted entry

**Result**: Smooth immigration process, government covers cost, visitor verified.

---

## Integration Guide

### Step 1: Initialize Proxy Payment Protocol

```go
package main

import (
    "github.com/sovrn-protocol/sovrn/chain/economics"
    "github.com/sovrn-protocol/sovrn/api/wallet"
)

func main() {
    // Create vault manager
    vaultMgr := wallet.NewSovereignVaultManager()

    // Create economics kernel
    economicsKernel := economics.NewQuadraticSovereignSplit(bankKeeper)

    // Create proxy payment protocol
    proxyProtocol := economics.NewProxyPaymentProtocol(vaultMgr, economicsKernel)
}
```

---

### Step 2: Check Balance Before Transaction

```go
// Before processing PFF verification
result, err := proxyProtocol.CheckBalanceBeforeTransaction(
    ctx,
    travelerDID,
    1000000, // 1 SOV fee
)

if err != nil {
    return fmt.Errorf("balance check failed: %w", err)
}

if !result.HasSufficientFunds {
    // User has insufficient funds
    fmt.Printf("User needs proxy payment. Shortfall: %d uSOV\n", result.Shortfall)

    // Trigger proxy payment flow
    // (see Step 3)
} else {
    // User has sufficient funds
    // Proceed with normal payment
}
```

---

### Step 3: Execute Proxy Payment

```go
// If balance check fails, execute proxy payment
if !result.HasSufficientFunds {
    // Execute proxy payment (airport pays on behalf of traveler)
    proxyResult, err := proxyProtocol.ExecuteProxyPayment(
        ctx,
        travelerDID,
        "did:sovra:ng:airport_lagos", // Airport DID
        1000000, // 1 SOV fee
        pffHash,
    )

    if err != nil {
        return fmt.Errorf("proxy payment failed: %w", err)
    }

    // Verify traveler was marked as verified
    if proxyResult.TravelerStatus != economics.STATUS_VERIFIED_PASSAGE_SUCCESS {
        return fmt.Errorf("traveler not marked as verified")
    }

    // Verify Four Pillars split executed
    if !proxyResult.FourPillarsSplit {
        return fmt.Errorf("Four Pillars split did not execute")
    }

    fmt.Printf("Proxy payment successful!\n")
    fmt.Printf("Transaction ID: %s\n", proxyResult.TransactionID)
    fmt.Printf("Vitalian Record ID: %s\n", proxyResult.VitalianRecordID)
}
```

---

### Step 4: Query Traveler Verification History

```go
// Get all verification records for a traveler
records := proxyProtocol.GetTravelerVerificationHistory("did:sovra:ng:traveler123")

for _, record := range records {
    fmt.Printf("Record ID: %s\n", record.RecordID)
    fmt.Printf("Status: %s\n", record.VerificationStatus)
    fmt.Printf("Payment Method: %s\n", record.PaymentMethod)

    if record.PaymentMethod == "proxy" {
        fmt.Printf("Paid by: %s\n", record.ProxyDID)
    }

    fmt.Printf("Timestamp: %s\n", record.Timestamp)
    fmt.Println("---")
}
```

---

## Database Schema

The Proxy Payment Protocol uses three main tables:

### 1. proxy_payments

Stores all proxy payment transactions.

**Columns**:
- `transaction_id` - Unique transaction ID
- `traveler_did` - DID of the traveler
- `proxy_did` - DID of the proxy payer
- `fee_amount` - Fee amount in uSOV
- `proxy_balance_before` - Proxy balance before payment
- `proxy_balance_after` - Proxy balance after payment
- `four_pillars_split` - Confirms ExecuteFourWaySplit triggered
- `vitalian_record_id` - Associated Vitalian record ID
- `pff_hash` - Hash of the PFF verification
- `created_at` - Timestamp

### 2. vitalian_records

Stores traveler verification records.

**Columns**:
- `record_id` - Unique record ID
- `traveler_did` - DID of the traveler
- `verification_status` - Status: `verified_passage_success`
- `payment_method` - Payment method: `self` or `proxy`
- `proxy_did` - DID of proxy payer (NULL if self-payment)
- `transaction_id` - Associated transaction ID
- `pff_hash` - Hash of the PFF verification
- `created_at` - Timestamp

### 3. balance_check_log

Logs all balance checks for audit trail.

**Columns**:
- `check_id` - Unique check ID
- `user_did` - DID of the user
- `required_fee` - Required fee amount
- `current_balance` - Current balance
- `has_sufficient_funds` - Boolean
- `status` - Status code
- `shortfall` - Amount short (if insufficient)
- `created_at` - Timestamp

---

## VLT Compliance

This protocol follows the **SOVRA Standard** for Vitalized Ledger Technology:

✅ **Autonomous**: Proxy payments execute automatically without human approval
✅ **Transparent**: All transactions recorded on-chain with events
✅ **Equitable**: Four Pillars distribution ensures fair fee allocation
✅ **Verifiable**: Complete audit trail via Vitalian records
✅ **Privacy-Preserving**: PFF hash stored, not raw biometric data

---

## Security Considerations

### 1. Proxy Authorization

Only authorized entities (airports, airlines, border agencies) should be able to trigger proxy payments. Implement authorization checks:

```go
// Check if proxy DID is authorized
if !isAuthorizedProxy(proxyDID) {
    return fmt.Errorf("unauthorized proxy: %s", proxyDID)
}
```

### 2. Fee Limits

Implement maximum fee limits to prevent abuse:

```go
const MAX_PROXY_FEE = 100000000 // 100 SOV

if fee > MAX_PROXY_FEE {
    return fmt.Errorf("fee exceeds maximum: %d > %d", fee, MAX_PROXY_FEE)
}
```

### 3. Rate Limiting

Prevent spam by rate-limiting proxy payments per traveler:

```go
// Check if traveler has exceeded proxy payment limit
if exceedsRateLimit(travelerDID) {
    return fmt.Errorf("traveler has exceeded proxy payment rate limit")
}
```

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Proxy Payment Protocol**

**Where Seamless Passage Meets Economic Integrity**


