# SOVRA Protocol - Supply Equilibrium Controller

## Overview

The **Supply Equilibrium Controller** is a core component of the SOVRA Protocol's tokenomics that implements autonomous supply management through dynamic burn rates and hardcoded minting caps.

**TECHNOLOGY_TYPE**: VITALIZED_LEDGER_TECHNOLOGY

---

## Core Principles

### 1. **MAX_TOTAL_SUPPLY** - Absolute Supply Cap

**Value**: 1 billion SOV (1,000,000,000 SOV = 1,000,000,000,000,000 uSOV)

**Purpose**: Hardcoded maximum supply that can NEVER be exceeded, regardless of how many citizens join the network.

**Implementation**:
- Every minting operation checks current supply against MAX_TOTAL_SUPPLY
- Minting is **rejected** if it would exceed the cap
- No governance override - this is immutable

**Code**:
```go
const MAX_TOTAL_SUPPLY = int64(1_000_000_000_000_000) // 1 billion SOV in uSOV

func (k Keeper) MintOnVerification(ctx sdk.Context, recipient sdk.AccAddress) error {
    currentSupply := k.bankKeeper.GetSupply(ctx, "usov").Amount
    if err := k.equilibriumController.CanMint(currentSupply, mintAmount); err != nil {
        return err // Minting rejected - MAX_TOTAL_SUPPLY reached
    }
    // Proceed with minting...
}
```

---

### 2. **Dynamic Burn Rate** - Automatic Supply Control

**Threshold**: 500 million SOV (50% of max supply)

**Burn Rates**:
- **Base Rate**: 1% (when supply < threshold)
- **Elevated Rate**: 1.5% (when supply >= threshold)

**Purpose**: Automatically increase deflationary pressure when supply grows, maintaining scarcity.

**Implementation**:
```go
func (sec *SupplyEquilibriumController) GetCurrentBurnRate(circulatingSupply sdk.Int) sdk.Dec {
    if circulatingSupply.GTE(sec.params.SupplyThreshold) {
        return sec.params.ElevatedBurnRate // 1.5%
    }
    return sec.params.BaseBurnRate // 1%
}
```

**Autonomous Adjustment**:
- No human intervention required
- Burn rate adjusts automatically based on circulating supply
- Applied to all transaction fees in real-time

---

### 3. **Black Hole Address** - Verifiable Dead Wallet

**Address**: `sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead`

**Purpose**: Publicly verifiable address where burned tokens are sent, allowing the world to see supply shrinking in real-time.

**Properties**:
- No known private key
- Tokens sent here are permanently locked
- Balance is publicly queryable
- Visible on SOVRA Explorer

**Implementation**:
```go
const BLACK_HOLE_ADDRESS = "sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead"

// Send burned tokens to black hole instead of destroying them
blackHoleAddr, _ := sdk.AccAddressFromBech32(minttypes.BLACK_HOLE_ADDRESS)
bed.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.FeeCollectorName, blackHoleAddr, burnCoins)
```

---

## Architecture

### Supply Equilibrium Controller

**File**: `global-hub/chain/x/mint/types/supply_equilibrium.go`

**Key Components**:

1. **SupplyEquilibriumParams** - Configuration parameters
2. **SupplyEquilibriumController** - Core logic controller
3. **SupplyStatus** - Real-time supply status

**Methods**:
- `CanMint(currentSupply, mintAmount)` - Validates minting against MAX_TOTAL_SUPPLY
- `GetCurrentBurnRate(circulatingSupply)` - Returns dynamic burn rate (1% or 1.5%)
- `GetSupplyStatus(circulatingSupply)` - Returns comprehensive supply metrics

---

### Integration Points

#### 1. Mint Module Integration

**File**: `global-hub/chain/x/mint/keeper/keeper.go`

**Changes**:
- Added `equilibriumController` to Keeper struct
- Updated `MintOnVerification()` to check `CanMint()` before minting
- Added `GetSupplyStatus()`, `GetCurrentBurnRate()`, `GetBlackHoleBalance()` query methods

**Flow**:
```
PFF Verification → MintOnVerification() → CanMint() Check → Mint or Reject
```

#### 2. Burn Engine Integration

**File**: `global-hub/chain/x/auth/ante/fee_handler.go`

**Changes**:
- Added `mintKeeper` to BurnEngineDecorator
- Updated `distributeFees()` to use dynamic burn rate
- Changed burn mechanism to send to black hole address instead of destroying

**Flow**:
```
Transaction Fee → GetCurrentBurnRate() → Calculate Burn Amount → Send to Black Hole
```

---

## Supply Explorer API

**File**: `global-hub/api/supply_explorer/supply_explorer.go`

### Endpoints

#### 1. GET /v1/supply/status

Returns comprehensive supply status including:
- Circulating supply (uSOV and SOV)
- Max total supply
- Supply threshold
- Current burn rate (1% or 1.5%)
- Black hole balance
- Percent of max supply
- Remaining mintable supply

**Example Response**:
```json
{
  "circulating_supply": "250000000000000",
  "circulating_supply_sov": "250000000 SOV",
  "max_total_supply": "1000000000000000",
  "max_total_supply_sov": "1000000000 SOV",
  "supply_threshold": "500000000000000",
  "supply_threshold_sov": "500000000 SOV",
  "current_burn_rate": "0.01",
  "current_burn_rate_percent": "1%",
  "black_hole_balance": "5000000000000",
  "black_hole_balance_sov": "5000000 SOV",
  "black_hole_address": "sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead",
  "percent_of_max": 25,
  "percent_of_threshold": 50,
  "is_above_threshold": false,
  "remaining_mintable": "750000000000000",
  "remaining_mintable_sov": "750000000 SOV",
  "timestamp": "2026-01-26T12:00:00Z",
  "chain_id": "sovra-ng-01"
}
```

#### 2. GET /v1/supply/black-hole

Returns black hole address balance:

**Example Response**:
```json
{
  "black_hole_address": "sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead",
  "balance_usov": "5000000000000",
  "balance_sov": "5000000 SOV",
  "timestamp": "2026-01-26T12:00:00Z"
}
```

---

## Economic Impact

### Scenario 1: Early Growth Phase (Supply < 500M SOV)

- **Burn Rate**: 1% (base rate)
- **Minting**: Unrestricted (within MAX_TOTAL_SUPPLY)
- **Effect**: Encourages network growth and citizen adoption

### Scenario 2: Mature Network (Supply >= 500M SOV)

- **Burn Rate**: 1.5% (elevated rate)
- **Minting**: Unrestricted (within MAX_TOTAL_SUPPLY)
- **Effect**: Increased deflationary pressure maintains scarcity

### Scenario 3: Supply Cap Reached (Supply = 1B SOV)

- **Burn Rate**: 1.5% (elevated rate)
- **Minting**: **REJECTED** - no new tokens can be minted
- **Effect**: Pure deflationary economy - supply can only decrease

---

## Monitoring and Visibility

### Real-Time Tracking

The SOVRA Explorer provides real-time visibility into:

1. **Circulating Supply**: Total SOV in circulation
2. **Burn Rate**: Current burn rate (1% or 1.5%)
3. **Black Hole Balance**: Total burned tokens (publicly verifiable)
4. **Supply Status**: Percent of max, remaining mintable

### Public Transparency

- Black hole address is publicly queryable
- Anyone can verify burned tokens
- Supply metrics updated in real-time
- No hidden minting or burning

---

## VLT Compliance

This implementation follows the **SOVRA Standard** for Vitalized Ledger Technology:

✅ **Autonomous**: Burn rate adjusts automatically without human intervention
✅ **Transparent**: All supply metrics publicly visible
✅ **Immutable**: MAX_TOTAL_SUPPLY cannot be changed
✅ **Verifiable**: Black hole balance is publicly queryable

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Where Scarcity Meets Vitality**

