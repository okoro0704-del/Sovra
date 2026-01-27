# SOVRA Transparency Oracle API

**TECHNOLOGY_TYPE**: VITALIZED_LEDGER_TECHNOLOGY

## Overview

The **Transparency Oracle** provides real-time visibility into all Four Pillars balances, enabling Vitalians to see where every kobo of transaction fees goes. This ensures complete transparency and accountability in the SOVRA Protocol's economics.

---

## Features

### 1. Real-Time Balance Tracking

- **Citizen Dividend Pool**: Monthly distribution to verified DIDs
- **Project R&D Vault**: Time-locked multisig for research funding
- **Nation Infrastructure Pool**: National operations and compliance
- **Deflation Burn**: Black hole address for burned tokens

### 2. Public Transparency

- All balances publicly queryable
- No authentication required
- Real-time updates with every block
- Complete audit trail

### 3. Multiple Query Options

- Get all four pillars in single request
- Query individual pillar balances
- Human-readable SOV format
- Machine-readable uSOV format

---

## API Endpoints

### GET /v1/transparency/pillars

Returns balances of all four pillars.

**Response**:
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
  },
  "timestamp": "2026-01-27T12:00:00Z",
  "chain_id": "sovra-ng-01"
}
```

---

### GET /v1/transparency/citizen-dividend

Returns citizen dividend pool balance.

**Response**:
```json
{
  "pool_name": "citizen_dividend_pool",
  "balance_usov": "250000000000000",
  "balance_sov": "250000000 SOV",
  "percentage": "25%",
  "description": "Distributed monthly to all verified DIDs"
}
```

---

### GET /v1/transparency/project-rnd

Returns R&D vault balance.

**Response**:
```json
{
  "vault_name": "project_rnd_vault",
  "balance_usov": "250000000000000",
  "balance_sov": "250000000 SOV",
  "percentage": "25%",
  "description": "Locked for protocol research and development",
  "security_model": "Time-Locked Multisig (3-of-5, 30-day lock)"
}
```

---

### GET /v1/transparency/infrastructure

Returns infrastructure pool balance.

**Response**:
```json
{
  "pool_name": "nation_infrastructure_pool",
  "balance_usov": "250000000000000",
  "balance_sov": "250000000 SOV",
  "percentage": "25%",
  "description": "Funds for national operations and infrastructure"
}
```

---

### GET /v1/transparency/deflation

Returns black hole balance.

**Response**:
```json
{
  "address": "sovra1deaddeaddeaddeaddeaddeaddeaddeaddeaddead",
  "balance_usov": "250000000000000",
  "balance_sov": "250000000 SOV",
  "percentage": "25%",
  "description": "Permanently burned tokens (deflationary pressure)"
}
```

---

## Integration

### HTTP Server Setup

```go
import (
    "github.com/sovrn-protocol/sovrn/api/transparency_oracle"
)

// Create transparency oracle service
transparencyOracle := transparency_oracle.NewTransparencyOracleService(bankKeeper)

// Register routes
mux := http.NewServeMux()
transparency_oracle.RegisterTransparencyRoutes(mux, transparencyOracle, ctx)

// Start server
http.ListenAndServe(":1317", mux)
```

### Query from CLI

```bash
# Get all four pillars
curl http://localhost:1317/v1/transparency/pillars

# Get citizen dividend pool
curl http://localhost:1317/v1/transparency/citizen-dividend

# Get R&D vault
curl http://localhost:1317/v1/transparency/project-rnd

# Get infrastructure pool
curl http://localhost:1317/v1/transparency/infrastructure

# Get black hole balance
curl http://localhost:1317/v1/transparency/deflation
```

---

## Use Cases

### 1. SOVRA Explorer Dashboard

Display real-time Four Pillars balances:
- Citizen dividend pool gauge
- R&D vault balance chart
- Infrastructure pool tracker
- Black hole balance (deflationary pressure)

### 2. Public Accountability

Enable Vitalians to verify:
- Where their fees are going
- How much is being burned
- R&D vault security (time-locked multisig)
- Infrastructure funding levels

### 3. Economic Analytics

Track protocol economics:
- Fee distribution trends
- Burn rate over time
- R&D funding accumulation
- Infrastructure spending patterns

---

## VLT Compliance

This API follows the **SOVRA Standard** for Vitalized Ledger Technology:

✅ **Transparent**: All balances publicly visible
✅ **Real-Time**: Updates with every block
✅ **Verifiable**: Query balances directly from blockchain
✅ **Accessible**: No authentication required

---

**🔐 Sovereign. ✅ Verified. ⚡ Transparent.**

**SOVRA Protocol - Where Every Kobo Counts**

