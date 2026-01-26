# SOVRA Hub - Multi-Party Settlement System
## Unified Presence & Sovereignty Protocol

## 🎯 Overview

The **Multi-Party Settlement System** for the **SOVRA Protocol** enables complex billing scenarios where multiple corporate entities (airports and airlines) share the cost of identity verification services based on the type of verification event.

### Key Features

✅ **Event-Based Pricing** - Different rates for different verification types  
✅ **Multi-Payer Transactions** - Single verification can bill multiple parties  
✅ **Split Settlement** - Automatic fee splitting for dual-purpose verifications  
✅ **Corporate Node Registry** - Manage airports and airlines  
✅ **Monthly Invoicing** - Automated invoice generation with detailed breakdowns  
✅ **Flexible Allocation** - Percentage-based cost sharing  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Multi-Party Settlement Engine                  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Pricing    │  │ Transaction  │  │   Invoice    │         │
│  │    Rules     │  │   Context    │  │  Generator   │         │
│  │              │  │              │  │              │         │
│  │ - Airport:   │  │ - Multi-     │  │ - Monthly    │         │
│  │   1 SOV      │  │   Payer      │  │   Summary    │         │
│  │ - Airline:   │  │ - Split      │  │ - Event      │         │
│  │   10 SOV     │  │   Logic      │  │   Breakdown  │         │
│  │ - Dual:      │  │ - Settlement │  │ - Line Items │         │
│  │   11 SOV     │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                │
│         └──────────────────┴──────────────────┘                │
│                            │                                   │
└────────────────────────────┼───────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Corporate Wallets│
                    │                 │
                    │ Airport: Escrow │
                    │ Airline: Escrow │
                    └─────────────────┘
```

---

## 💰 Event-Based Pricing

### Pricing Rules

| Event Type | Amount | Billed To | Description |
|------------|--------|-----------|-------------|
| **AIRPORT_CHECKPOINT** | 1 SOV | Airport | Security checkpoint verification |
| **BOARDING_GATE** | 10 SOV | Airline | Boarding gate verification |
| **DUAL_PURPOSE** | 11 SOV | Both (split) | Combined security + boarding |

### Pricing Breakdown

```
AIRPORT_CHECKPOINT:
  └─ Airport pays: 1 SOV (100%)

BOARDING_GATE:
  └─ Airline pays: 10 SOV (100%)

DUAL_PURPOSE (Split Settlement):
  ├─ Airline pays: 8.8 SOV (80%)
  └─ Airport pays: 2.2 SOV (20%)
```

---

## 🔄 Transaction Context

### TransactionContext Structure

Every verification creates a **TransactionContext** that holds multi-party payment information:

```go
type TransactionContext struct {
    TransactionID   string            // Unique transaction ID
    VerificationID  string            // Associated verification
    EventType       EventType         // AIRPORT_CHECKPOINT, BOARDING_GATE, DUAL_PURPOSE
    TotalAmountUSOV int64             // Total amount in uSOV
    Payers          []PayerAllocation // List of payers
    Timestamp       time.Time
    Status          string            // "pending", "settled", "failed"
}

type PayerAllocation struct {
    PayerID        string    // Corporate node ID
    PayerType      NodeType  // "airport" or "airline"
    AmountUSOV     int64     // Amount this payer owes
    Percentage     float64   // Percentage of total (0.0 to 1.0)
    EventType      EventType
}
```

### Example: Dual-Purpose Transaction

```json
{
  "transaction_id": "tx-abc123",
  "verification_id": "ver-xyz789",
  "event_type": "DUAL_PURPOSE",
  "total_amount_usov": 11000000,
  "payers": [
    {
      "payer_id": "airline-aa",
      "payer_type": "airline",
      "amount_usov": 8800000,
      "percentage": 0.80,
      "event_type": "DUAL_PURPOSE"
    },
    {
      "payer_id": "airport-jfk",
      "payer_type": "airport",
      "amount_usov": 2200000,
      "percentage": 0.20,
      "event_type": "DUAL_PURPOSE"
    }
  ],
  "status": "settled"
}
```

---

## 🏢 Corporate Nodes

### Node Types

**Airport Node**:
- Pays for security checkpoint verifications
- Pays 20% of dual-purpose verifications
- Examples: JFK, LAX, LHR, LOS

**Airline Node**:
- Pays for boarding gate verifications
- Pays 80% of dual-purpose verifications
- Examples: American Airlines, Delta, British Airways

### Node Registration

```json
{
  "node_id": "airport-jfk",
  "node_type": "airport",
  "name": "John F. Kennedy International Airport",
  "iata_code": "JFK",
  "country": "USA",
  "wallet_id": "wallet-airport-jfk",
  "is_active": true
}
```

---

## 📊 Split Settlement Logic

### 20/80 Split for Dual-Purpose Events

When a verification serves **both** security and boarding purposes:

**Rationale**:
- **Airport (20%)**: Provides security infrastructure and personnel
- **Airline (80%)**: Primary beneficiary of boarding verification

**Calculation**:
```
Total Fee: 11 SOV
├─ Airline Share: 11 SOV × 80% = 8.8 SOV
└─ Airport Share: 11 SOV × 20% = 2.2 SOV
```

**Example Scenario**:
```
Passenger arrives at airport:
1. Security Checkpoint (AIRPORT_CHECKPOINT)
   └─ Airport pays: 1 SOV

2. Boarding Gate (BOARDING_GATE)
   └─ Airline pays: 10 SOV

Total: 11 SOV (separate transactions)

---

Passenger uses fast-track lane (DUAL_PURPOSE):
1. Single verification for both security and boarding
   ├─ Airport pays: 2.2 SOV (20%)
   └─ Airline pays: 8.8 SOV (80%)

Total: 11 SOV (single transaction, split payment)
```

---

## 📄 Monthly Invoices

### Invoice Structure

```json
{
  "invoice_id": "inv-2026-01-aa",
  "node_id": "airline-aa",
  "node_name": "American Airlines",
  "node_type": "airline",
  "billing_period": "2026-01",
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-01-31T23:59:59Z",
  "total_amount_usov": 150000000,
  "total_sov": 150.0,
  "total_transactions": 12,
  "status": "finalized",
  "due_date": "2026-02-15T00:00:00Z",
  "event_breakdown": {
    "BOARDING_GATE": {
      "count": 10,
      "total_amount_usov": 100000000,
      "total_sov": 100.0
    },
    "DUAL_PURPOSE": {
      "count": 2,
      "total_amount_usov": 50000000,
      "total_sov": 50.0
    }
  }
}
```

### Invoice Summary (Text Format)

```
╔════════════════════════════════════════════════════════════════╗
║                    SOVRN PROTOCOL INVOICE                      ║
╚════════════════════════════════════════════════════════════════╝

Invoice ID:      inv-2026-01-aa
Billing Period:  2026-01
Node:            American Airlines (airline-aa)
Node Type:       airline

Period:          2026-01-01 to 2026-01-31
Generated:       2026-02-01 10:00:00
Due Date:        2026-02-15
Status:          finalized

────────────────────────────────────────────────────────────────

TRANSACTION SUMMARY:

BOARDING_GATE              10 transactions    100.000000 SOV
DUAL_PURPOSE                2 transactions     50.000000 SOV

────────────────────────────────────────────────────────────────

TOTAL TRANSACTIONS:  12
TOTAL AMOUNT:        150.000000 SOV (150000000 uSOV)

────────────────────────────────────────────────────────────────

Payment Instructions:
  Please ensure your corporate wallet has sufficient balance.
  Payments are automatically debited from your escrow wallet.

Questions? Contact: billing@sovrn-protocol.org
```

## 🔌 API Endpoints

### 1. Register Corporate Node

**Endpoint**: `POST /v1/billing/nodes/register`

**Request**:
```json
{
  "node_type": "airline",
  "name": "American Airlines",
  "iata_code": "AA",
  "country": "USA"
}
```

**Response**:
```json
{
  "node_id": "airline-aa-abc123",
  "node_type": "airline",
  "name": "American Airlines",
  "iata_code": "AA",
  "country": "USA",
  "wallet_id": "wallet-airline-aa-abc123",
  "is_active": true,
  "created_at": "2026-01-26T12:00:00Z"
}
```

---

### 2. Create Multi-Party Transaction

**Endpoint**: `POST /v1/billing/transactions/create`

**Request (Airport Checkpoint)**:
```json
{
  "verification_id": "ver-123",
  "event_type": "AIRPORT_CHECKPOINT",
  "airport_node_id": "airport-jfk"
}
```

**Request (Boarding Gate)**:
```json
{
  "verification_id": "ver-456",
  "event_type": "BOARDING_GATE",
  "airline_node_id": "airline-aa"
}
```

**Request (Dual-Purpose)**:
```json
{
  "verification_id": "ver-789",
  "event_type": "DUAL_PURPOSE",
  "airport_node_id": "airport-jfk",
  "airline_node_id": "airline-aa"
}
```

**Response**:
```json
{
  "transaction_id": "tx-abc123",
  "verification_id": "ver-789",
  "event_type": "DUAL_PURPOSE",
  "total_amount_usov": 11000000,
  "payers": [
    {
      "payer_id": "airline-aa",
      "payer_type": "airline",
      "amount_usov": 8800000,
      "percentage": 0.80
    },
    {
      "payer_id": "airport-jfk",
      "payer_type": "airport",
      "amount_usov": 2200000,
      "percentage": 0.20
    }
  ],
  "status": "pending",
  "timestamp": "2026-01-26T12:00:00Z"
}
```

---

### 3. Settle Transaction

**Endpoint**: `POST /v1/billing/transactions/settle`

**Request**:
```json
{
  "transaction_id": "tx-abc123"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Transaction settled successfully",
  "transaction": {
    "transaction_id": "tx-abc123",
    "status": "settled",
    "payers": [...]
  }
}
```

---

### 4. Get Pricing Rules

**Endpoint**: `GET /v1/billing/pricing/rules`

**Response**:
```json
{
  "AIRPORT_CHECKPOINT": {
    "event_type": "AIRPORT_CHECKPOINT",
    "base_amount_usov": 1000000,
    "description": "Security checkpoint verification - billed to airport"
  },
  "BOARDING_GATE": {
    "event_type": "BOARDING_GATE",
    "base_amount_usov": 10000000,
    "description": "Boarding gate verification - billed to airline"
  },
  "DUAL_PURPOSE": {
    "event_type": "DUAL_PURPOSE",
    "base_amount_usov": 11000000,
    "description": "Dual-purpose verification - split between airport and airline"
  }
}
```

---

### 5. Generate Monthly Invoice

**Endpoint**: `POST /v1/billing/invoices/generate`

**Request**:
```json
{
  "node_id": "airline-aa",
  "year": 2026,
  "month": 1
}
```

**Response**:
```json
{
  "invoice_id": "inv-2026-01-aa",
  "node_id": "airline-aa",
  "billing_period": "2026-01",
  "total_amount_usov": 150000000,
  "total_sov": 150.0,
  "total_transactions": 12,
  "status": "finalized",
  "event_breakdown": {...}
}
```

---

### 6. Get Invoice (JSON)

**Endpoint**: `GET /v1/billing/invoices/get?invoice_id=inv-2026-01-aa`

**Response**: Full invoice JSON (see Invoice Structure above)

---

### 7. Get Invoice (Text Summary)

**Endpoint**: `GET /v1/billing/invoices/get?invoice_id=inv-2026-01-aa&format=text`

**Response**: Text-formatted invoice summary

---

### 8. Get Node Invoices

**Endpoint**: `GET /v1/billing/invoices/node?node_id=airline-aa`

**Response**: Array of all invoices for the node

**Specific Period**:
`GET /v1/billing/invoices/node?node_id=airline-aa&year=2026&month=1`

---

### 9. Get Node Transactions

**Endpoint**: `GET /v1/billing/transactions/node?node_id=airline-aa`

**Response**: Array of all transactions for the node

---

### 10. Get Invoice Stats

**Endpoint**: `GET /v1/billing/invoices/stats`

**Response**:
```json
{
  "total_invoices": 50,
  "total_revenue_usov": 5000000000,
  "total_revenue_sov": 5000.0,
  "paid_revenue_usov": 4000000000,
  "unpaid_revenue_usov": 1000000000,
  "invoices_by_status": {
    "finalized": 30,
    "paid": 20
  },
  "invoices_by_node_type": {
    "airport": 25,
    "airline": 25
  }
}
```

## 📈 Use Cases

### Use Case 1: Airport Security Checkpoint

```
Scenario: Passenger goes through security at JFK Airport

1. Create transaction
   POST /v1/billing/transactions/create
   {
     "verification_id": "ver-001",
     "event_type": "AIRPORT_CHECKPOINT",
     "airport_node_id": "airport-jfk"
   }

2. Transaction created
   - Airport JFK pays: 1 SOV (100%)
   - Status: pending

3. Settle transaction
   POST /v1/billing/transactions/settle
   {
     "transaction_id": "tx-001"
   }

4. Payment processed
   - Deducted from JFK's escrow wallet
   - Status: settled
```

---

### Use Case 2: Airline Boarding Gate

```
Scenario: Passenger boards American Airlines flight

1. Create transaction
   POST /v1/billing/transactions/create
   {
     "verification_id": "ver-002",
     "event_type": "BOARDING_GATE",
     "airline_node_id": "airline-aa"
   }

2. Transaction created
   - American Airlines pays: 10 SOV (100%)
   - Status: pending

3. Settle transaction
   - Deducted from AA's escrow wallet
   - Status: settled
```

---

### Use Case 3: Dual-Purpose Fast-Track

```
Scenario: Passenger uses fast-track lane for both security and boarding

1. Create transaction
   POST /v1/billing/transactions/create
   {
     "verification_id": "ver-003",
     "event_type": "DUAL_PURPOSE",
     "airport_node_id": "airport-jfk",
     "airline_node_id": "airline-aa"
   }

2. Transaction created with split allocation
   - American Airlines pays: 8.8 SOV (80%)
   - JFK Airport pays: 2.2 SOV (20%)
   - Total: 11 SOV
   - Status: pending

3. Settle transaction
   - Deducted from both wallets
   - AA: 8.8 SOV from escrow
   - JFK: 2.2 SOV from escrow
   - Status: settled
```

---

### Use Case 4: Monthly Invoice Generation

```
Scenario: Generate January 2026 invoice for American Airlines

1. Generate invoice
   POST /v1/billing/invoices/generate
   {
     "node_id": "airline-aa",
     "year": 2026,
     "month": 1
   }

2. System aggregates all January transactions
   - 10 BOARDING_GATE events: 100 SOV
   - 2 DUAL_PURPOSE events (80% share): 17.6 SOV
   - Total: 117.6 SOV

3. Invoice created
   - Invoice ID: inv-2026-01-aa
   - Total: 117.6 SOV
   - Status: finalized
   - Due: 2026-02-15

4. Retrieve invoice
   GET /v1/billing/invoices/get?invoice_id=inv-2026-01-aa&format=text

   Returns formatted invoice summary
```

---

## 🛠️ Integration Guide

### Go Integration

```go
package main

import (
    "context"
    "fmt"
    "github.com/sovrn-protocol/sovrn/hub/api/billing"
)

func main() {
    // Create wallet manager
    walletMgr := billing.NewWalletManager()

    // Create multi-party settlement engine
    settlement := billing.NewMultiPartySettlement(walletMgr)

    // Register airport
    airport := &billing.CorporateNode{
        NodeType: billing.NodeTypeAirport,
        Name:     "JFK International Airport",
        IATA:     "JFK",
        Country:  "USA",
    }
    settlement.RegisterCorporateNode(context.Background(), airport)

    // Register airline
    airline := &billing.CorporateNode{
        NodeType: billing.NodeTypeAirline,
        Name:     "American Airlines",
        IATA:     "AA",
        Country:  "USA",
    }
    settlement.RegisterCorporateNode(context.Background(), airline)

    // Create dual-purpose transaction
    txCtx, err := settlement.CreateTransaction(
        context.Background(),
        "ver-123",
        billing.EventTypeDualPurpose,
        airport.NodeID,
        airline.NodeID,
    )
    if err != nil {
        panic(err)
    }

    fmt.Printf("Transaction created: %s\\n", txCtx.TransactionID)
    fmt.Printf("Total amount: %d uSOV\\n", txCtx.TotalAmountUSOV)
    fmt.Printf("Payers: %d\\n", len(txCtx.Payers))

    // Settle transaction
    err = settlement.SettleTransaction(context.Background(), txCtx.TransactionID)
    if err != nil {
        panic(err)
    }

    fmt.Println("Transaction settled!")
}
```

### HTTP Integration

```bash
# Register airport
curl -X POST http://localhost:8080/v1/billing/nodes/register \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "airport",
    "name": "JFK International Airport",
    "iata_code": "JFK",
    "country": "USA"
  }'

# Create dual-purpose transaction
curl -X POST http://localhost:8080/v1/billing/transactions/create \
  -H "Content-Type: application/json" \
  -d '{
    "verification_id": "ver-123",
    "event_type": "DUAL_PURPOSE",
    "airport_node_id": "airport-jfk",
    "airline_node_id": "airline-aa"
  }'

# Settle transaction
curl -X POST http://localhost:8080/v1/billing/transactions/settle \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "tx-abc123"
  }'

# Generate monthly invoice
curl -X POST http://localhost:8080/v1/billing/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "airline-aa",
    "year": 2026,
    "month": 1
  }'

# Get invoice (text format)
curl "http://localhost:8080/v1/billing/invoices/get?invoice_id=inv-2026-01-aa&format=text"
```

---

## 📊 Database Schema

See `global-hub/api/billing/schema.sql` for complete schema.

### Key Tables

- **corporate_nodes** - Airport and airline registry
- **multi_party_transactions** - Multi-payer transactions
- **payer_allocations** - Individual payer shares
- **event_pricing_rules** - Pricing configuration
- **monthly_invoices** - Monthly billing summaries
- **invoice_line_items** - Detailed invoice entries
- **invoice_event_breakdown** - Summary by event type

### Views

- **corporate_node_summary** - Node statistics and totals
- **transaction_summary_by_event** - Revenue and transaction counts by event type

---

## 🎯 Key Metrics

### Transaction Metrics
- Total transactions by event type
- Revenue by event type
- Settlement success rate
- Average transaction amount

### Node Metrics
- Total nodes by type (airport/airline)
- Total billed per node
- Transaction count per node
- Average cost per verification

### Invoice Metrics
- Total invoices generated
- Total revenue (paid vs unpaid)
- Invoices by status
- Average invoice amount

---

## 🚀 Production Deployment

### Environment Variables

```bash
# Multi-Party Settlement
ENABLE_MULTI_PARTY_SETTLEMENT=true
DEFAULT_AIRPORT_FEE_USOV=1000000
DEFAULT_AIRLINE_FEE_USOV=10000000
DUAL_PURPOSE_AIRLINE_PERCENTAGE=0.80
DUAL_PURPOSE_AIRPORT_PERCENTAGE=0.20

# Invoice Generation
INVOICE_DUE_DAYS=15
AUTO_GENERATE_INVOICES=true
INVOICE_GENERATION_DAY=1  # 1st of each month
```

### Monitoring

```bash
# Prometheus metrics
curl http://localhost:9090/metrics

# Key metrics:
# - billing_mp_transactions_total
# - billing_mp_revenue_by_event_type
# - billing_invoices_generated_total
# - billing_settlement_success_rate
```

---

## 📞 Support

### Technical Support
- **Email**: multiparty@sovrn-protocol.org
- **Documentation**: https://docs.sovrn-protocol.org/multi-party
- **GitHub**: https://github.com/sovrn-protocol/sovrn

### Billing Questions
- **Email**: billing@sovrn-protocol.org
- **Phone**: +1-555-SOVRN-PAY

---

**Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: 2026-01-26

---

**🏢 Multi-Party. 💰 Fair Billing. 📊 Transparent Invoicing.**
