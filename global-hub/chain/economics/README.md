# SOVRA Economics Module

**TECHNOLOGY_TYPE**: VITALIZED_LEDGER_TECHNOLOGY

## Overview

The **Economics Module** implements the Quadratic-Sovereign-Split, the SOVRA Protocol's revolutionary fee distribution model that divides every kobo of transaction fees equally across four pillars.

---

## Module Structure

```
global-hub/chain/economics/
├── kernel.go              # Quadratic-Sovereign-Split implementation
├── multisig_vault.go      # Time-locked multisig vault for R&D funds
├── transactions.go        # Proxy Payment Protocol for third-party payments
├── schema.sql             # Database schema for proxy payments
└── README.md              # This file
```

---

## The Four Pillars

### 1. CITIZEN_DIVIDEND (25%)
- **Module Account**: `citizen_dividend_pool`
- **Purpose**: Monthly distribution to all verified DIDs
- **Distribution**: Equal share to all Vitalians

### 2. PROJECT_R_AND_D (25%)
- **Module Account**: `project_rnd_vault`
- **Purpose**: Protocol research and development
- **Security**: Time-locked multisig (3-of-5, 30-day lock)

### 3. NATION_INFRASTRUCTURE (25%)
- **Module Account**: `nation_infrastructure_pool`
- **Purpose**: National operations and compliance
- **Use**: Spoke operations, infrastructure, partnerships

### 4. DEFLATION_BURN (25%)
- **Destination**: Black hole address
- **Purpose**: Deflationary pressure and scarcity
- **Address**: `sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead`

---

## Key Components

### QuadraticSovereignSplit

**File**: `kernel.go`

**Purpose**: Implements the Four Pillars fee distribution logic

**Key Method**:
```go
func (qss *QuadraticSovereignSplit) ExecuteFourWaySplit(
    ctx sdk.Context,
    totalFee sdk.Coins,
    feeCollectorModule string,
) error
```

**Flow**:
1. Calculate 25% for each pillar
2. Send to citizen dividend pool
3. Send to R&D vault (ghost-proof)
4. Send to infrastructure pool
5. Send to black hole address
6. Emit transparency event

---

### MultisigVault

**File**: `multisig_vault.go`

**Purpose**: Ghost-proof vault for PROJECT_R_AND_D funds

**Security Features**:
- **Time-Lock**: 30-day minimum lock period
- **Multisig**: 3-of-5 signatures required
- **Voting Period**: 7-day proposal voting
- **Audit Trail**: On-chain record of all proposals

**Key Methods**:
```go
// Create withdrawal proposal
func (mv *MultisigVault) CreateWithdrawalProposal(
    ctx sdk.Context,
    proposer string,
    amount sdk.Coins,
    purpose string,
) (uint64, error)

// Sign proposal
func (mv *MultisigVault) SignProposal(
    ctx sdk.Context,
    proposalID uint64,
    signer string,
) error

// Execute approved proposal
func (mv *MultisigVault) ExecuteProposal(
    ctx sdk.Context,
    proposalID uint64,
    executor string,
) error
```

---

## Integration

### Fee Handler Integration

**File**: `global-hub/chain/x/auth/ante/fee_handler.go`

```go
type BurnEngineDecorator struct {
    bankKeeper      BankKeeper
    accountKeeper   AccountKeeper
    economicsKernel *economics.QuadraticSovereignSplit
}

func (bed BurnEngineDecorator) distributeFees(
    ctx sdk.Context,
    fees sdk.Coins,
    requesterDID string,
) error {
    return bed.economicsKernel.ExecuteFourWaySplit(
        ctx,
        fees,
        types.FeeCollectorName,
    )
}
```

### Transparency Oracle Integration

**File**: `global-hub/api/transparency_oracle/transparency_oracle.go`

```go
// Get balances of all four pillars
func (tos *TransparencyOracleService) GetFourPillarsBalances(
    ctx sdk.Context,
) FourPillarsResponse
```

---

## Module Accounts

The economics module requires the following module accounts to be registered:

```go
// In app.go
maccPerms := map[string][]string{
    // ... existing accounts
    economics.CitizenDividendPool:       nil,
    economics.ProjectRnDVault:           nil,
    economics.NationInfrastructurePool:  nil,
}
```

---

## Constants

### Four Pillars Distribution

```go
const (
    CITIZEN_DIVIDEND      = 0.25  // 25%
    PROJECT_R_AND_D       = 0.25  // 25%
    NATION_INFRASTRUCTURE = 0.25  // 25%
    DEFLATION_BURN        = 0.25  // 25%
)
```

### Multisig Vault Configuration

```go
const (
    MINIMUM_SIGNERS  = 3                    // 3-of-5 multisig
    TOTAL_SIGNERS    = 5
    TIME_LOCK_PERIOD = 30 * 24 * time.Hour  // 30 days
    VOTING_PERIOD    = 7 * 24 * time.Hour   // 7 days
)
```

---

## Usage Examples

### Execute Four-Way Split

```go
// In fee handler
economicsKernel := economics.NewQuadraticSovereignSplit(bankKeeper)
err := economicsKernel.ExecuteFourWaySplit(ctx, fees, types.FeeCollectorName)
```

### Create R&D Withdrawal Proposal

```go
// Initialize vault with authorized signers
authorizedSigners := []string{
    "did:sovra:ng:founder1",
    "did:sovra:ng:founder2",
    "did:sovra:ng:founder3",
    "did:sovra:ng:founder4",
    "did:sovra:ng:founder5",
}
vault := economics.NewMultisigVault(bankKeeper, authorizedSigners)

// Create proposal
proposalID, err := vault.CreateWithdrawalProposal(
    ctx,
    "did:sovra:ng:founder1",
    sdk.NewCoins(sdk.NewCoin("usov", sdk.NewInt(1000000000))),
    "Research Grant for AI Liveness Detection",
)
```

### Sign and Execute Proposal

```go
// Signers vote on proposal
vault.SignProposal(ctx, proposalID, "did:sovra:ng:founder2")
vault.SignProposal(ctx, proposalID, "did:sovra:ng:founder3")

// Wait 30 days for time-lock...

// Execute proposal
err := vault.ExecuteProposal(ctx, proposalID, "did:sovra:ng:founder1")
```

---

### ProxyPaymentProtocol

**File**: `transactions.go`

**Purpose**: Enables third-party fee payments for travelers with insufficient funds

**Key Methods**:
```go
// Check balance before transaction
func (ppp *ProxyPaymentProtocol) CheckBalanceBeforeTransaction(
    ctx context.Context,
    userDID string,
    requiredFee int64,
) (*BalanceCheckResult, error)

// Execute proxy payment
func (ppp *ProxyPaymentProtocol) ExecuteProxyPayment(
    ctx sdk.Context,
    travelerDID string,
    proxyDID string,
    fee int64,
    pffHash string,
) (*ProxyPaymentResult, error)

// Record Vitalian passage
func (ppp *ProxyPaymentProtocol) RecordVitalianPassage(
    ctx sdk.Context,
    travelerDID string,
    proxyDID string,
    txID string,
    pffHash string,
) (string, error)
```

**Flow**:
1. Check traveler balance
2. If insufficient, trigger proxy payment
3. Debit airport/airline wallet
4. Credit traveler's verification record
5. Execute Four Pillars split
6. Mark traveler as `Verified_Passage_Success`

**Use Cases**:
- Airport checkpoints
- Airline boarding gates
- Border control
- Immigration services

---

## VLT Compliance

This module follows the **SOVRA Standard** for Vitalized Ledger Technology:

✅ **Autonomous**: Fee distribution executes automatically
✅ **Transparent**: All balances publicly visible via Transparency Oracle
✅ **Ghost-Proof**: Time-locked multisig prevents single-person drainage
✅ **Equitable**: Equal 25% distribution across all four pillars

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Quadratic-Sovereign-Split Economics**

