# Quadratic-Sovereign-Split - Four Pillars Economic Model

**TECHNOLOGY_TYPE**: VITALIZED_LEDGER_TECHNOLOGY

## Overview

The **Quadratic-Sovereign-Split** is the SOVRA Protocol's revolutionary fee distribution model that divides every kobo of transaction fees equally across four pillars. This ensures transparent, equitable, and sustainable economics for the entire SOVRA ecosystem.

---

## The Four Pillars

### 1. CITIZEN_DIVIDEND (25%)

**Purpose**: Distribute wealth back to the people who power the network

**Destination**: `citizen_dividend_pool` module account

**Distribution**: Monthly distribution to all verified DIDs

**Rationale**: Every Vitalian who contributes to the network through PFF verifications deserves a share of the protocol's success. This creates a direct economic incentive for participation.

**Example**:
- Total fees collected: 1,000 SOV
- Citizen dividend: 250 SOV
- If 1,000 verified DIDs exist, each receives 0.25 SOV monthly

---

### 2. PROJECT_R_AND_D (25%)

**Purpose**: Fund protocol research, development, and innovation

**Destination**: `project_rnd_vault` module account (time-locked multisig)

**Security Model**: Ghost-Proof Routing
- **Time-Lock**: 30-day minimum lock period
- **Multisig**: 3-of-5 signatures required for withdrawal
- **Voting Period**: 7-day voting window for proposals

**Rationale**: Sustainable innovation requires dedicated funding. The time-locked multisig vault ensures funds cannot be drained by any single person, protecting the protocol's long-term viability.

**Withdrawal Process**:
1. Authorized signer creates withdrawal proposal
2. Proposal enters 7-day voting period
3. Minimum 3 signatures required for approval
4. 30-day time-lock must elapse before execution
5. Approved proposal can be executed by any authorized signer

---

### 3. NATION_INFRASTRUCTURE (25%)

**Purpose**: Fund national operations, compliance, and infrastructure

**Destination**: `nation_infrastructure_pool` module account

**Use Cases**:
- National spoke operations
- Regulatory compliance
- Infrastructure maintenance
- Government partnerships
- Local community programs

**Rationale**: Each nation deploying SOVRA needs resources for operations, compliance, and infrastructure. This pillar ensures sustainable national-level operations.

---

### 4. DEFLATION_BURN (25%)

**Purpose**: Create deflationary pressure and increase token scarcity

**Destination**: Black hole address (`sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead`)

**Properties**:
- No known private key
- Tokens permanently locked
- Balance publicly queryable
- Visible on SOVRA Explorer

**Rationale**: As usage increases, more tokens are burned, creating scarcity. This ensures the protocol's value scales with its utility, following the "Value through Vitality" economic rule.

---

## Economic Formula

```
Total Fee = 100%

CITIZEN_DIVIDEND = Total Fee × 0.25
PROJECT_R_AND_D = Total Fee × 0.25
NATION_INFRASTRUCTURE = Total Fee × 0.25
DEFLATION_BURN = Total Fee × 0.25

Verification: 0.25 + 0.25 + 0.25 + 0.25 = 1.00 ✓
```

---

## Ghost-Proof Routing

### Problem
Traditional treasury systems are vulnerable to single-person drainage, insider theft, and governance attacks.

### Solution
The PROJECT_R_AND_D vault implements **Ghost-Proof Routing**:

1. **Time-Lock**: Funds cannot be withdrawn immediately after deposit
2. **Multisig**: Multiple signatures required (3-of-5)
3. **Voting Period**: Transparent proposal and voting process
4. **Audit Trail**: All proposals and signatures recorded on-chain

### Security Guarantees

✅ **No Single Point of Failure**: Requires 3 of 5 signers
✅ **Time-Delayed Execution**: 30-day minimum lock period
✅ **Transparent Governance**: All proposals publicly visible
✅ **Immutable Audit Trail**: On-chain record of all withdrawals

---

## Public Transparency

### Transparency Oracle

The **Transparency Oracle** provides real-time visibility into all four pillar balances, enabling Vitalians to see where every kobo of transaction fees goes.

### API Endpoints

#### GET /v1/transparency/pillars

Returns balances of all four pillars:

```json
{
  "citizen_dividend": {
    "pool_name": "citizen_dividend_pool",
    "balance_usov": "250000000000000",
    "balance_sov": "250000000 SOV",
    "percentage": "25%",
    "description": "Distributed monthly to all verified DIDs"
  },
  "project_rnd": {
    "vault_name": "project_rnd_vault",
    "balance_usov": "250000000000000",
    "balance_sov": "250000000 SOV",
    "percentage": "25%",
    "description": "Locked for protocol research and development",
    "security_model": "Time-Locked Multisig (3-of-5, 30-day lock)"
  },
  "infrastructure": {
    "pool_name": "nation_infrastructure_pool",
    "balance_usov": "250000000000000",
    "balance_sov": "250000000 SOV",
    "percentage": "25%",
    "description": "Funds for national operations and infrastructure"
  },
  "deflation_burn": {
    "address": "sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead",
    "balance_usov": "250000000000000",
    "balance_sov": "250000000 SOV",
    "percentage": "25%",
    "description": "Permanently burned tokens (deflationary pressure)"
  }
}
```

#### Individual Pillar Endpoints

- `GET /v1/transparency/citizen-dividend` - Citizen dividend pool balance
- `GET /v1/transparency/project-rnd` - R&D vault balance
- `GET /v1/transparency/infrastructure` - Infrastructure pool balance
- `GET /v1/transparency/deflation` - Black hole balance

---

## Implementation

### Economics Kernel

**File**: `global-hub/chain/economics/kernel.go`

**Key Function**: `ExecuteFourWaySplit(totalFee)`

```go
func (qss *QuadraticSovereignSplit) ExecuteFourWaySplit(ctx sdk.Context, totalFee sdk.Coins, feeCollectorModule string) error {
    // Calculate 25% for each pillar
    citizenAmount := totalAmount.ToDec().Mul(sdk.MustNewDecFromStr("0.25")).TruncateInt()
    rndAmount := totalAmount.ToDec().Mul(sdk.MustNewDecFromStr("0.25")).TruncateInt()
    infraAmount := totalAmount.ToDec().Mul(sdk.MustNewDecFromStr("0.25")).TruncateInt()
    burnAmount := totalAmount.Sub(citizenAmount).Sub(rndAmount).Sub(infraAmount)
    
    // Distribute to all four pillars
    // ...
}
```

### Fee Handler Integration

**File**: `global-hub/chain/x/auth/ante/fee_handler.go`

**Integration**:
```go
type BurnEngineDecorator struct {
    economicsKernel *economics.QuadraticSovereignSplit
}

func (bed BurnEngineDecorator) distributeFees(ctx sdk.Context, fees sdk.Coins, requesterDID string) error {
    return bed.economicsKernel.ExecuteFourWaySplit(ctx, fees, types.FeeCollectorName)
}
```

---

## Comparison with Previous Model

### Old Model (Supply Equilibrium Controller)

- **Dynamic Burn Rate**: 1% or 1.5% based on supply
- **Spoke Pool**: 50% of remaining fees
- **Treasury**: 50% of remaining fees
- **Complexity**: Variable distribution based on supply threshold

### New Model (Quadratic-Sovereign-Split)

- **Fixed Distribution**: Always 25/25/25/25
- **Four Pillars**: Citizen, R&D, Infrastructure, Burn
- **Simplicity**: Predictable, transparent, equitable
- **Ghost-Proof**: Time-locked multisig for R&D funds

---

## Benefits

### For Citizens
✅ **Direct Dividends**: 25% of all fees distributed monthly
✅ **Transparent**: Real-time visibility into all balances
✅ **Equitable**: Equal distribution among all verified DIDs

### For Protocol
✅ **Sustainable Funding**: 25% dedicated to R&D
✅ **Ghost-Proof**: Time-locked multisig prevents drainage
✅ **Deflationary**: 25% burned creates scarcity

### For Nations
✅ **Infrastructure Funding**: 25% for national operations
✅ **Compliance**: Resources for regulatory requirements
✅ **Sovereignty**: National control over infrastructure pool

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Where Every Kobo Counts**

