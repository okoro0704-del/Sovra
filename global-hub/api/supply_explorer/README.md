# SOVRA Supply Explorer API

**TECHNOLOGY_TYPE**: VITALIZED_LEDGER_TECHNOLOGY

## Overview

The **Supply Explorer API** provides real-time visibility into the SOVRA Protocol's token supply, burn rate, and black hole balance. This enables the world to see the supply shrinking in real-time as the protocol operates.

---

## Features

### 1. Real-Time Supply Tracking

- **Circulating Supply**: Total SOV tokens in circulation
- **Max Total Supply**: Hardcoded 1 billion SOV cap
- **Supply Threshold**: 500 million SOV threshold for burn rate adjustment
- **Remaining Mintable**: How many SOV can still be minted

### 2. Dynamic Burn Rate Visibility

- **Current Burn Rate**: 1% (base) or 1.5% (elevated)
- **Automatic Adjustment**: Based on circulating supply
- **Transparent**: Publicly visible burn rate changes

### 3. Black Hole Balance Tracking

- **Verifiable Dead Wallet**: `sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead`
- **Public Balance**: Anyone can query burned tokens
- **Real-Time Updates**: Balance updates with every transaction

---

## API Endpoints

### GET /v1/supply/status

Returns comprehensive supply status.

**Response**:
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

### GET /v1/supply/black-hole

Returns black hole address balance.

**Response**:
```json
{
  "black_hole_address": "sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead",
  "balance_usov": "5000000000000",
  "balance_sov": "5000000 SOV",
  "timestamp": "2026-01-26T12:00:00Z"
}
```

---

## Integration

### HTTP Server Setup

```go
import (
    "github.com/sovrn-protocol/sovrn/api/supply_explorer"
)

// Create supply explorer service
supplyExplorer := supply_explorer.NewSupplyExplorerService(mintKeeper, bankKeeper)

// Register HTTP handlers
http.HandleFunc("/v1/supply/status", supplyExplorer.HandleGetSupplyStatus(ctx))
http.HandleFunc("/v1/supply/black-hole", supplyExplorer.HandleGetBlackHoleBalance(ctx))
```

### Query from CLI

```bash
# Get supply status
curl http://localhost:1317/v1/supply/status

# Get black hole balance
curl http://localhost:1317/v1/supply/black-hole
```

---

## Supply Equilibrium Rules

### MAX_TOTAL_SUPPLY

- **Value**: 1 billion SOV (1,000,000,000 SOV)
- **Immutable**: Cannot be changed by governance
- **Enforcement**: Minting rejected if cap exceeded

### Dynamic Burn Rate

- **Base Rate**: 1% (when supply < 500M SOV)
- **Elevated Rate**: 1.5% (when supply >= 500M SOV)
- **Automatic**: Adjusts without human intervention

### Black Hole Address

- **Address**: `sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead`
- **Purpose**: Publicly verifiable dead wallet
- **Properties**: No known private key, tokens permanently locked

---

## Use Cases

### 1. SOVRA Explorer Dashboard

Display real-time supply metrics:
- Circulating supply gauge
- Burn rate indicator
- Black hole balance chart
- Supply cap progress bar

### 2. Token Analytics

Track supply dynamics:
- Daily burn rate changes
- Supply growth rate
- Time to supply cap
- Deflationary pressure

### 3. Public Transparency

Verify protocol claims:
- Confirm MAX_TOTAL_SUPPLY enforcement
- Verify burned tokens in black hole
- Track dynamic burn rate adjustments

---

## Monitoring

### Key Metrics

1. **Circulating Supply**: Track total SOV in circulation
2. **Burn Rate**: Monitor 1% vs 1.5% transitions
3. **Black Hole Balance**: Track cumulative burned tokens
4. **Supply Cap Distance**: Monitor approach to 1B SOV limit

### Alerts

- **Burn Rate Change**: Alert when burn rate increases to 1.5%
- **Supply Threshold**: Alert when supply crosses 500M SOV
- **Supply Cap Approach**: Alert when supply reaches 90% of max

---

## VLT Compliance

This API follows the **SOVRA Standard** for Vitalized Ledger Technology:

✅ **Transparent**: All supply metrics publicly visible
✅ **Verifiable**: Black hole balance is queryable
✅ **Real-Time**: Updates with every block
✅ **Immutable**: Supply cap cannot be changed

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Where Transparency Meets Scarcity**

