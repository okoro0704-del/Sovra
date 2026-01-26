# SOVRA Hub - Billing Gateway
## Unified Presence & Sovereignty Protocol

## 🎯 Overview

The **Billing Gateway** is the fiat-to-SOV conversion system for the **SOVRA Hub**. It enables users to purchase SOV tokens with fiat currency (USD, NGN, EUR, GBP) and automatically credits their Sovereign Wallet.

### Key Features

✅ **Fiat-to-SOV Conversion** - Purchase SOV tokens with USD, NGN, EUR, GBP  
✅ **Real-Time Price Oracle** - Dynamic exchange rates updated every 30 seconds  
✅ **Auto-Swapper** - Automatic conversion from fiat to SOV  
✅ **Dual Wallet System** - Regular (unrestricted) and Escrow (PFF-only) balances  
✅ **Enterprise Escrow** - Anti-dumping mechanism for corporate users  
✅ **Payment Integration** - Support for cards, bank transfers, mobile money  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Billing Gateway                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Price Oracle │  │ Auto-Swapper │  │Wallet Manager│         │
│  │              │  │              │  │              │         │
│  │ - USD/SOV    │  │ - Fiat→SOV   │  │ - Regular    │         │
│  │ - NGN/SOV    │  │ - Validation │  │ - Escrow     │         │
│  │ - EUR/SOV    │  │ - Crediting  │  │ - Debit/     │         │
│  │ - GBP/SOV    │  │              │  │   Credit     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                │
│         └──────────────────┴──────────────────┘                │
│                            │                                   │
└────────────────────────────┼───────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Sovereign Wallet│
                    │                 │
                    │ Regular: 10 SOV │
                    │ Escrow:  50 SOV │
                    │ Total:   60 SOV │
                    └─────────────────┘
```

---

## 💰 Wallet System

### Sovereign Wallet

Every user has a **Sovereign Wallet** with two balances:

#### 1. Regular Balance (Unrestricted)
- ✅ Can be used for PFF fees
- ✅ Can be withdrawn to external exchanges
- ✅ Can be transferred to other users
- ✅ Available to **all users** (individual & enterprise)

#### 2. Escrow Balance (Restricted)
- ✅ Can ONLY be used for PFF verification fees
- ❌ CANNOT be withdrawn to external exchanges
- ❌ CANNOT be transferred to other users
- ⚠️ **Only for enterprise users** (anti-dumping mechanism)

### User Types

| User Type    | Regular Balance | Escrow Balance | Withdrawal |
|--------------|-----------------|----------------|------------|
| Individual   | ✅ Yes          | ❌ No          | ✅ Yes     |
| Enterprise   | ✅ Yes          | ✅ Yes         | ⚠️ Regular only |

---

## 🔄 Purchase Flow

### Step-by-Step Process

```
1. User submits purchase request
   ├─ User ID
   ├─ User Type (individual/enterprise)
   ├─ Currency (USD/NGN/EUR/GBP)
   ├─ Fiat Amount
   └─ Payment Method

2. Billing Gateway validates request
   ├─ Check minimum amount
   ├─ Validate currency
   └─ Verify user type

3. Price Oracle provides exchange rate
   ├─ Query current rate for currency
   ├─ Calculate SOV amount
   └─ Return rate + confidence score

4. Process fiat payment
   ├─ Stripe (cards)
   ├─ Flutterwave (mobile money)
   └─ Plaid (bank transfers)

5. Auto-Swapper converts fiat to SOV
   ├─ Calculate uSOV amount
   ├─ Determine wallet type
   └─ Credit appropriate wallet

6. Return purchase confirmation
   ├─ Purchase ID
   ├─ SOV amount received
   ├─ Updated wallet balances
   └─ Transaction hash
```

---

## 📊 Price Oracle

### Exchange Rates

The Price Oracle provides real-time SOV/Fiat exchange rates:

| Currency | Rate (uSOV per unit) | Rate (SOV per unit) | Example |
|----------|----------------------|---------------------|---------|
| USD      | 500,000              | 0.5                 | $100 = 50 SOV |
| NGN      | 1,200                | 0.0012              | ₦100,000 = 120 SOV |
| EUR      | 550,000              | 0.55                | €100 = 55 SOV |
| GBP      | 625,000              | 0.625               | £100 = 62.5 SOV |

**Note**: Rates update every 30 seconds with ±2% volatility simulation.

### Oracle Integration

**Current**: Mock implementation with simulated volatility  
**Production**: Integrate with:
- **Chainlink** - Decentralized oracle network
- **Band Protocol** - Cross-chain data oracle
- **Centralized Exchanges** - Binance, Coinbase APIs

---

## 🛡️ Anti-Dumping Mechanism

### The Problem

Enterprise users purchasing large amounts of SOV could:
1. Buy SOV with fiat
2. Immediately sell on exchanges
3. Cause price volatility and "dumping"

### The Solution: Escrow Wallet

**Enterprise purchases go to Escrow Wallet:**
- ✅ Can ONLY be used for PFF verification fees
- ❌ CANNOT be withdrawn to exchanges
- ❌ CANNOT be transferred to other users

**This ensures:**
- Enterprises use SOV for its intended purpose (verification)
- No corporate dumping on exchanges
- Price stability
- Long-term protocol alignment

### Example

```javascript
// Enterprise user purchases 1000 SOV
POST /v1/billing/purchase
{
  "user_id": "enterprise-airline-aa",
  "user_type": "enterprise",
  "currency": "USD",
  "fiat_amount": 2000.00,
  "payment_method": "card"
}

// Response
{
  "purchase_id": "pur-abc123",
  "usov_amount": 1000000000,  // 1000 SOV
  "wallet_type": "escrow",     // ← Goes to ESCROW
  "regular_balance": 0,
  "escrow_balance": 1000000000,
  "message": "Successfully purchased 1000 SOV (credited to escrow wallet - restricted to PFF fees only)"
}

// ✅ Can use for PFF fees
POST /v1/billing/pay-pff-fee
{
  "user_id": "enterprise-airline-aa",
  "fee_amount": 5000000  // 5 SOV
}
// SUCCESS: Deducted from escrow

// ❌ CANNOT withdraw to exchange
POST /v1/billing/withdraw
{
  "user_id": "enterprise-airline-aa",
  "amount": 1000000000,
  "exchange_address": "0xabc..."
}
// ERROR: "insufficient regular balance for withdrawal: have 0 uSOV, need 1000000000 uSOV (escrow balance cannot be withdrawn)"
```

---

## 🔌 API Endpoints

### 1. Purchase SOV Units

**Endpoint**: `POST /v1/billing/purchase`

**Request**:
```json
{
  "user_id": "user-123",
  "user_type": "individual",
  "currency": "USD",
  "fiat_amount": 100.00,
  "payment_method": "card",
  "payment_details": {
    "card_number": "4242424242424242",
    "exp_month": 12,
    "exp_year": 2025,
    "cvc": "123"
  }
}
```

**Response**:
```json
{
  "purchase_id": "pur-abc123",
  "user_id": "user-123",
  "user_type": "individual",
  "currency": "USD",
  "fiat_amount": 100.00,
  "exchange_rate": 500000.0,
  "usov_amount": 50000000,
  "sov_amount": 50.0,
  "wallet_type": "regular",
  "regular_balance": 50000000,
  "escrow_balance": 0,
  "total_balance": 50000000,
  "transaction_hash": "tx-xyz789",
  "status": "success",
  "timestamp": "2026-01-26T12:00:00Z",
  "message": "Successfully purchased 50.000000 SOV"
}
```

---

### 2. Get Wallet Balance

**Endpoint**: `GET /v1/billing/wallet?user_id=user-123`

**Response**:
```json
{
  "user_id": "user-123",
  "user_type": "individual",
  "regular_balance": 50000000,
  "escrow_balance": 0,
  "total_balance": 50000000,
  "created_at": "2026-01-26T10:00:00Z",
  "updated_at": "2026-01-26T12:00:00Z"
}
```

---

### 3. Get Exchange Rates

**Endpoint**: `GET /v1/billing/rates`

**Response**:
```json
{
  "USD": {
    "currency": "USD",
    "usov_per_unit": 500000.0,
    "sov_per_unit": 0.5,
    "last_updated": "2026-01-26T12:00:00Z",
    "source": "SOVRN_ORACLE_V1",
    "confidence": 0.95
  },
  "NGN": {
    "currency": "NGN",
    "usov_per_unit": 1200.0,
    "sov_per_unit": 0.0012,
    "last_updated": "2026-01-26T12:00:00Z",
    "source": "SOVRN_ORACLE_V1",
    "confidence": 0.95
  }
}
```

---

### 4. Get Specific Exchange Rate

**Endpoint**: `GET /v1/billing/rates?currency=USD`

**Response**:
```json
{
  "currency": "USD",
  "usov_per_unit": 500000.0,
  "sov_per_unit": 0.5,
  "last_updated": "2026-01-26T12:00:00Z",
  "source": "SOVRN_ORACLE_V1",
  "confidence": 0.95
}
```

### 5. Get Transaction History

**Endpoint**: `GET /v1/billing/transactions?user_id=user-123&limit=10`

**Response**:
```json
[
  {
    "transaction_id": "tx-001",
    "user_id": "user-123",
    "type": "credit",
    "wallet_type": "regular",
    "amount": 50000000,
    "balance_before": 0,
    "balance_after": 50000000,
    "purpose": "fiat_purchase",
    "timestamp": "2026-01-26T12:00:00Z",
    "status": "success"
  },
  {
    "transaction_id": "tx-002",
    "user_id": "user-123",
    "type": "debit",
    "wallet_type": "regular",
    "amount": 5000000,
    "balance_before": 50000000,
    "balance_after": 45000000,
    "purpose": "pff_fee",
    "timestamp": "2026-01-26T13:00:00Z",
    "status": "success"
  }
]
```

---

### 6. Withdraw to Exchange

**Endpoint**: `POST /v1/billing/withdraw`

**Request**:
```json
{
  "user_id": "user-123",
  "amount": 10000000,
  "exchange_address": "0xabc123..."
}
```

**Response (Success)**:
```json
{
  "transaction_id": "tx-withdraw-001",
  "status": "success",
  "message": "Withdrawal of 10000000 uSOV initiated"
}
```

**Response (Enterprise Escrow Restriction)**:
```json
{
  "error": "insufficient regular balance for withdrawal: have 0 uSOV, need 10000000 uSOV (escrow balance cannot be withdrawn)"
}
```

---

### 7. Get Billing Stats

**Endpoint**: `GET /v1/billing/stats`

**Response**:
```json
{
  "wallet_stats": {
    "total_wallets": 1500,
    "enterprise_wallets": 50,
    "individual_wallets": 1450,
    "total_regular_balance": 75000000000,
    "total_escrow_balance": 25000000000,
    "total_balance": 100000000000,
    "total_transactions": 50000
  },
  "oracle_status": {
    "last_update": "2026-01-26T12:00:00Z",
    "update_interval": "30s"
  }
}
```

---

## 💳 Payment Methods

### Supported Payment Methods

| Method          | Provider      | Currencies | Regions |
|-----------------|---------------|------------|---------|
| Credit/Debit Card | Stripe      | USD, EUR, GBP | Global |
| Bank Transfer   | Plaid         | USD        | US, Canada |
| Mobile Money    | Flutterwave   | NGN        | Nigeria, Africa |

### Payment Integration (Production)

```go
// Stripe integration example
func (bg *BillingGateway) processStripePayment(req *PurchaseUnitsRequest) (bool, error) {
    stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

    params := &stripe.PaymentIntentParams{
        Amount:   stripe.Int64(int64(req.FiatAmount * 100)), // cents
        Currency: stripe.String(strings.ToLower(req.Currency)),
        PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
    }

    pi, err := paymentintent.New(params)
    if err != nil {
        return false, err
    }

    return pi.Status == stripe.PaymentIntentStatusSucceeded, nil
}

// Flutterwave integration example
func (bg *BillingGateway) processFlutterwavePayment(req *PurchaseUnitsRequest) (bool, error) {
    client := flutterwave.NewClient(os.Getenv("FLUTTERWAVE_SECRET_KEY"))

    payload := flutterwave.ChargePayload{
        Amount:   req.FiatAmount,
        Currency: req.Currency,
        Email:    req.PaymentDetails["email"].(string),
        PhoneNumber: req.PaymentDetails["phone"].(string),
    }

    response, err := client.Charge.MobileMoney(payload)
    if err != nil {
        return false, err
    }

    return response.Status == "successful", nil
}
```

---

## 🔐 Security Features

### 1. Escrow Enforcement

**Code Implementation**:
```go
// DebitEscrow enforces PFF-only restriction
func (wm *WalletManager) DebitEscrow(ctx context.Context, userID string, amount int64, purpose string) (string, error) {
    // CRITICAL: Escrow can ONLY be used for PFF fees
    if purpose != "pff_fee" {
        return "", fmt.Errorf("escrow balance can only be used for PFF verification fees (attempted: %s)", purpose)
    }

    // ... rest of implementation
}
```

### 2. Minimum Purchase Amounts

Prevents spam and ensures economic viability:

| Currency | Minimum Purchase |
|----------|------------------|
| USD      | $10.00           |
| NGN      | ₦5,000           |
| EUR      | €10.00           |
| GBP      | £10.00           |

### 3. Transaction Logging

All transactions are logged for:
- Audit compliance
- Fraud detection
- Dispute resolution
- Analytics

## 📈 Use Cases

### Use Case 1: Individual User Purchase

```
Scenario: Alice wants to verify her identity at the airport

1. Alice purchases 50 SOV with $100
   POST /v1/billing/purchase
   {
     "user_id": "alice-123",
     "user_type": "individual",
     "currency": "USD",
     "fiat_amount": 100.00,
     "payment_method": "card"
   }

2. SOV credited to REGULAR wallet
   regular_balance: 50 SOV
   escrow_balance: 0 SOV

3. Alice uses 5 SOV for airport verification
   Deducted from regular balance

4. Alice withdraws remaining 45 SOV to exchange
   ✅ SUCCESS (individual users can withdraw)
```

---

### Use Case 2: Enterprise User Purchase

```
Scenario: American Airlines purchases SOV for passenger verifications

1. AA purchases 10,000 SOV with $20,000
   POST /v1/billing/purchase
   {
     "user_id": "airline-aa",
     "user_type": "enterprise",
     "currency": "USD",
     "fiat_amount": 20000.00,
     "payment_method": "bank_transfer"
   }

2. SOV credited to ESCROW wallet (anti-dumping)
   regular_balance: 0 SOV
   escrow_balance: 10,000 SOV

3. AA uses 5 SOV per passenger verification
   ✅ SUCCESS (deducted from escrow)

4. AA attempts to withdraw 5,000 SOV to exchange
   ❌ FAILED (escrow cannot be withdrawn)
   Error: "escrow balance cannot be withdrawn"

5. AA can only use escrow for PFF fees
   ✅ Ensures long-term protocol alignment
   ✅ Prevents corporate dumping
```

---

### Use Case 3: Mixed Wallet Usage

```
Scenario: Enterprise with both regular and escrow balances

Initial State:
  regular_balance: 100 SOV
  escrow_balance: 1,000 SOV

PFF Fee Payment (5 SOV):
  Strategy: Use escrow first, then regular

  Result:
    escrow_balance: 995 SOV (deducted 5 SOV)
    regular_balance: 100 SOV (unchanged)

Withdrawal Attempt (50 SOV):
  Strategy: Can only withdraw from regular

  Result:
    ✅ SUCCESS (50 SOV withdrawn from regular)
    regular_balance: 50 SOV
    escrow_balance: 995 SOV (unchanged)
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
    // Create billing gateway
    gateway := billing.NewBillingGateway()

    // Purchase SOV units
    req := &billing.PurchaseUnitsRequest{
        UserID:        "user-123",
        UserType:      "individual",
        Currency:      "USD",
        FiatAmount:    100.00,
        PaymentMethod: "card",
    }

    resp, err := gateway.PurchaseUnits(context.Background(), req)
    if err != nil {
        fmt.Printf("Purchase failed: %v\n", err)
        return
    }

    fmt.Printf("Purchase successful!\n")
    fmt.Printf("SOV Amount: %.6f\n", resp.SOVAmount)
    fmt.Printf("Wallet Type: %s\n", resp.WalletType)
    fmt.Printf("Total Balance: %d uSOV\n", resp.TotalBalance)
}
```

### HTTP Integration

```bash
# Purchase SOV units
curl -X POST http://localhost:8080/v1/billing/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "user_type": "individual",
    "currency": "USD",
    "fiat_amount": 100.00,
    "payment_method": "card"
  }'

# Get wallet balance
curl http://localhost:8080/v1/billing/wallet?user_id=user-123

# Get exchange rates
curl http://localhost:8080/v1/billing/rates

# Get transaction history
curl http://localhost:8080/v1/billing/transactions?user_id=user-123&limit=10
```

---

## 📊 Database Schema

See `global-hub/api/billing/schema.sql` for complete schema.

### Key Tables

- **sovereign_wallets** - User wallets with regular and escrow balances
- **wallet_transactions** - All wallet transactions (credit/debit)
- **purchase_orders** - Fiat-to-SOV purchase records
- **exchange_rates_history** - Historical exchange rate data
- **escrow_restrictions_log** - Log of blocked escrow withdrawal attempts
- **pff_fee_payments** - PFF verification fee payment records

---

## 🎯 Key Metrics

### Wallet Metrics
- Total wallets created
- Enterprise vs individual distribution
- Total regular balance
- Total escrow balance
- Average balance per user type

### Purchase Metrics
- Total purchases by currency
- Total fiat volume
- Total SOV volume
- Success/failure rates
- Average purchase size

### Escrow Metrics
- Total escrow balance
- Escrow usage for PFF fees
- Blocked withdrawal attempts
- Escrow-to-regular ratio

---

## 🚀 Production Deployment

### Environment Variables

```bash
# Price Oracle
PRICE_ORACLE_UPDATE_INTERVAL=30s
PRICE_ORACLE_SOURCE=CHAINLINK

# Payment Processors
STRIPE_SECRET_KEY=sk_live_...
FLUTTERWAVE_SECRET_KEY=FLWSECK-...
PLAID_CLIENT_ID=...
PLAID_SECRET=...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/sovrn_billing

# Security
JWT_SECRET=...
API_KEY_HASH_SALT=...
```

### Monitoring

```bash
# Prometheus metrics
curl http://localhost:9090/metrics

# Key metrics:
# - billing_purchases_total
# - billing_wallet_balance_total
# - billing_escrow_restrictions_total
# - billing_pff_fees_total
```

---

## 📞 Support

### Technical Support
- **Email**: billing@sovrn-protocol.org
- **Documentation**: https://docs.sovrn-protocol.org/billing
- **GitHub**: https://github.com/sovrn-protocol/sovrn

### Payment Issues
- **Email**: payments@sovrn-protocol.org
- **Phone**: +1-555-SOVRN-PAY

---

**Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: 2026-01-26

---

**💰 Buy SOV. 🔐 Verify Identity. 🚀 Build Trust.**
