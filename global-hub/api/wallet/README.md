# SOVRA Wallet Module

**TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY**

## Overview

The SOVRA Wallet Module implements the **Seamless-Debit-Handshake** - an autonomous payment system that deducts fees automatically upon AI-verified PFF scans, without human approval.

This module is part of the **SOVRA_Sovereign_Kernel** and implements the "Value through Vitality" economic rule.

---

## Key Components

### 1. **Seamless Debit Handshake** (`seamless_debit.go`)

Autonomous biometric payment system.

**Function**: `ExecuteBiometricPayment`

**Logic**:
1. AI validates PFF scan (Proof_of_Presence)
2. If valid (liveness_score >= 70), automatically deduct fee
3. No human approval required
4. Transaction executes in <100ms

**Transaction Types**:
- `fast_track`: 1 SOV fee (1,000,000 uSOV)
- `standard`: 10 SOV fee (10,000,000 uSOV)

**Validation Rules**:
- AI must confirm validity (`IsValid == true`)
- Liveness score must be >= 70
- Timestamp must not be expired (< 5 minutes old)
- Signature must be valid
- PFF hash must not be blacklisted

---

### 2. **Sovereign Vault** (`sovereign_vault.go`)

User SOV balance storage system.

**Features**:
- Single-balance wallet (simplified from dual-wallet system)
- Status tracking: `verified`, `pending`, `suspended`
- Transaction history
- DID-based identification

**Methods**:
- `GetOrCreateVault()` - Get or create user vault
- `CreditVault()` - Add funds to vault
- `DebitVault()` - Deduct funds from vault
- `GetVerifiedDIDs()` - Get all verified DIDs (for dividend distribution)
- `UpdateVaultStatus()` - Update vault status

---

### 3. **Dividend Distributor** (`dividend_distributor.go`)

Monthly integrity fund distribution system.

**Function**: `DistributeMonthlyIntegrityFunds`

**Logic**:
1. Query total balance in National_Spoke_Pool for each spoke
2. Get all verified DIDs (Status: "verified")
3. Calculate dividend per DID (total pool / number of verified DIDs)
4. Distribute to each verified DID
5. Send notification: "You have received your SOVRA Integrity Dividend!"
6. Reset National_Spoke_Pool balance to 0

**Cron Schedule**: `"0 0 1 * *"` (First day of every month at midnight WAT)

**Usage**:
```go
dd := NewDividendDistributor(vaultMgr, blockchainAPI, notifier)
dd.SetupCronJob()
dd.Start()
```

---

### 4. **Notification Service** (`notification_service.go`)

Push notification system for dividend and payment alerts.

**Integrations**:
- Firebase Cloud Messaging (FCM)
- iOS and Android support

**Notifications**:
1. **Dividend Notification**:
   - Title: "SOVRA Integrity Dividend"
   - Body: "You have received your SOVRA Integrity Dividend! Amount: X.XXXXXX SOV"

2. **Payment Notification**:
   - Title: "SOVRA Payment Confirmed"
   - Body: "Biometric payment successful: X.XXXXXX SOV. Remaining balance: X.XXXXXX SOV"

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOVRA Wallet Module                       │
│              (SOVRA_Sovereign_Kernel Component)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│   Seamless    │    │   Sovereign    │    │   Dividend   │
│    Debit      │───▶│     Vault      │◀───│ Distributor  │
│  Handshake    │    │                │    │              │
└───────────────┘    └────────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│  PFF Liveness │    │  Transaction   │    │ Notification │
│  Validation   │    │    History     │    │   Service    │
└───────────────┘    └────────────────┘    └──────────────┘
```

---

## Integration with Existing Systems

### Blockchain Integration

The wallet module integrates with:
- **National_Spoke_Pool**: 50% of transaction fees (from `x/auth/ante/fee_handler.go`)
- **VLT_Core Module**: PFF blacklist checking (from `x/vltcore/keeper/keeper.go`)
- **Mint Module**: Usage-based minting (from `x/mint/keeper/keeper.go`)

### Billing System Integration

The wallet module coexists with the existing billing system:
- **Existing**: `WalletManager` (dual wallet: regular + escrow) for fiat purchases
- **New**: `SovereignVaultManager` (single wallet) for biometric payments
- Both systems can be unified in future iterations

---

## Usage Examples

### 1. Execute Biometric Payment

```go
package main

import (
    "context"
    "github.com/sovrn-protocol/sovrn/hub/api/wallet"
)

func main() {
    // Create vault manager
    vaultMgr := wallet.NewSovereignVaultManager()
    
    // Create seamless debit handshake
    sdh := wallet.NewSeamlessDebitHandshake(vaultMgr)
    
    // Create proof of presence (from PFF scan)
    proof := &wallet.ProofOfPresence{
        PFFHash:       "sha256_hash_of_biometric_data",
        DID:           "did:sovra:ng:12345",
        LivenessScore: 85,
        Timestamp:     time.Now(),
        Signature:     []byte("cryptographic_signature"),
        IsValid:       true,
    }
    
    // Execute autonomous payment
    result, err := sdh.ExecuteBiometricPayment(
        context.Background(),
        proof,
        wallet.TransactionTypeFastTrack, // 1 SOV fee
    )
    
    if err != nil {
        fmt.Printf("Payment failed: %v\n", err)
        return
    }
    
    fmt.Printf("Payment successful!\n")
    fmt.Printf("Transaction ID: %s\n", result.TransactionID)
    fmt.Printf("Fee: %.6f SOV\n", float64(result.FeeAmount)/1_000_000)
    fmt.Printf("Balance After: %.6f SOV\n", float64(result.BalanceAfter)/1_000_000)
}
```

### 2. Setup Monthly Dividend Distribution

```go
// Create components
vaultMgr := wallet.NewSovereignVaultManager()
blockchainAPI := NewBlockchainAPI() // Your blockchain API implementation
notifier := wallet.NewMockNotificationService()

// Create dividend distributor
dd := wallet.NewDividendDistributor(vaultMgr, blockchainAPI, notifier)

// Setup cron job (runs first day of every month at midnight)
err := dd.SetupCronJob()
if err != nil {
    panic(err)
}

// Start the scheduler
dd.Start()

// For testing: run immediately
dd.RunNow(context.Background())
```

---

## Security Features

1. **AI Validation**: Liveness score >= 70 required
2. **Timestamp Expiry**: Proofs expire after 5 minutes
3. **Signature Verification**: Cryptographic signature validation
4. **Blacklist Checking**: Integration with VLT_Core Consensus_of_Presence
5. **Balance Validation**: Insufficient balance protection
6. **Status Checking**: Only "verified" DIDs receive dividends

---

## Future Enhancements

1. **Database Persistence**: Replace in-memory maps with PostgreSQL
2. **Real FCM Integration**: Replace mock FCM client with production Firebase
3. **Blockchain API Implementation**: Connect to actual Cosmos SDK modules
4. **Multi-Spoke Support**: Handle multiple National_Spoke_Pools simultaneously
5. **Advanced Analytics**: Track dividend distribution metrics
6. **Wallet Unification**: Merge with existing `WalletManager` dual-wallet system

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Where Vitality Creates Value**

