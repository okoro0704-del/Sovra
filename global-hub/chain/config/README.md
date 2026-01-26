<!-- TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY -->
# SOVRA Protocol - Genesis Configuration

## Overview

This directory contains the **genesis configuration** for the **SOVRA Protocol blockchain** (`sovra-ng-01`).

**Chain ID**: `sovra-ng-01`  
**Genesis Message**: "Born in Lagos, Built for the World. The SOVRA Protocol - Launching the VLT Era."  
**Genesis Time**: 2026-01-26 00:00:00 WAT (West Africa Time, UTC+1)  
**First Validator**: Center-Point-Lagos

---

## Genesis Configuration

### Chain Identity

```json
{
  "chain_id": "sovra-ng-01",
  "genesis_message": "Born in Lagos, Built for the World. The SOVRA Protocol - Launching the VLT Era.",
  "genesis_time": "2026-01-26T00:00:00.000000000+01:00"
}
```

**Key Details**:
- ✅ **Chain ID**: `sovra-ng-01` - SOVRA Nigeria Genesis Chain
- ✅ **Genesis Message**: Permanent on-chain message celebrating Lagos as birthplace
- ✅ **Timezone**: West Africa Time (WAT = UTC+1)
- ✅ **Technology**: Vitalized Ledger Technology (VLT)

---

## First Validator: Center-Point-Lagos

**Moniker**: `Center-Point-Lagos`  
**Description**: "First validator node of the SOVRA Protocol - Born in Lagos, Built for the World"  
**Commission Rate**: 10%  
**Max Commission**: 20%  
**Website**: https://sovra.protocol  
**Security Contact**: security@sovra.protocol

**Validator Details**:
```json
{
  "moniker": "Center-Point-Lagos",
  "identity": "",
  "website": "https://sovra.protocol",
  "security_contact": "security@sovra.protocol",
  "details": "First validator node of the SOVRA Protocol - Born in Lagos, Built for the World"
}
```

---

## VLT_Core Module Configuration

The genesis includes the **VLT_Core security module** with:

- ✅ **Vitality_Anchor**: Ensures every block contains valid PFF_Liveness_Proof
- ✅ **Consensus_of_Presence**: 51% consensus for deepfake detection
- ✅ **Global Blacklist**: Initially empty, populated by consensus

```json
{
  "vltcore": {
    "blacklist": []
  }
}
```

---

## Usage-Based Minting Configuration

**Mint Module** configured for autonomous token minting:

```json
{
  "mint": {
    "params": {
      "usage_based_minting": true,
      "mint_per_verification": "10"
    }
  }
}
```

**Key Features**:
- ✅ **No Fixed Inflation**: Tokens only minted on PFF verifications
- ✅ **10 uSOV per Verification**: Autonomous minting triggered by AI-verified events
- ✅ **Activity-Driven Supply**: Supply grows with protocol usage

---

## PFF Module Configuration

**PFF Module** configured for liveness verification:

```json
{
  "pff": {
    "params": {
      "verification_cost": "5000000",
      "liveness_required": true,
      "min_liveness_score": 70
    }
  }
}
```

**Key Features**:
- ✅ **Verification Cost**: 5 SOV (5,000,000 uSOV)
- ✅ **Liveness Required**: AI-powered liveness detection mandatory
- ✅ **Minimum Score**: 70/100 liveness score required

---

## Oracle Module Configuration

**Oracle Module** configured with hardcoded price:

```json
{
  "oracle": {
    "params": {
      "hardcoded_price": "5",
      "price_denom": "usov"
    }
  }
}
```

**Key Features**:
- ✅ **Hardcoded Price**: 1 verification = 5 SOV units
- ✅ **Autonomous Pricing**: No external oracle dependency

---

## Token Configuration

**Denomination**: SOV (SOVRA Token)  
**Base Unit**: uSOV (microsov)  
**Conversion**: 1 SOV = 1,000,000 uSOV

```json
{
  "denom_metadata": [
    {
      "description": "The native staking token of the SOVRA Protocol",
      "base": "usov",
      "display": "sov",
      "name": "SOVRA Token",
      "symbol": "SOV"
    }
  ]
}
```

---

## Initialization Instructions

### 1. Initialize Chain

```bash
# Navigate to chain directory
cd global-hub/chain

# Initialize chain with genesis
sovd init Center-Point-Lagos --chain-id sovra-ng-01

# Copy genesis file
cp config/genesis.json ~/.sovd/config/genesis.json
```

### 2. Create Validator Key

```bash
# Create validator key
sovd keys add validator

# Add validator to genesis
sovd add-genesis-account $(sovd keys show validator -a) 1000000000usov
```

### 3. Create Genesis Transaction

```bash
# Create gentx for Center-Point-Lagos validator
sovd gentx validator 100000000usov \
  --chain-id sovra-ng-01 \
  --moniker "Center-Point-Lagos" \
  --commission-rate 0.10 \
  --commission-max-rate 0.20 \
  --commission-max-change-rate 0.01 \
  --details "First validator node of the SOVRA Protocol - Born in Lagos, Built for the World"

# Collect genesis transactions
sovd collect-gentxs
```

### 4. Start the Chain

```bash
# Start the SOVRA blockchain
sovd start
```

---

## Genesis Accounts

The genesis will include module accounts for:

- ✅ `mint` - Temporary holding for minted tokens
- ✅ `fee_collector` - Collects fees before distribution
- ✅ `spoke_pool_nigeria` - Nigerian operations fund
- ✅ `global_protocol_treasury` - Global protocol fund

---

## Significance

### Born in Lagos, Built for the World

This genesis configuration marks the **birth of Vitalized Ledger Technology (VLT)** in Lagos, Nigeria.

**Key Milestones**:
1. ✅ **First VLT Chain**: World's first blockchain with Proof of Vitality
2. ✅ **Lagos Origin**: Celebrating Nigerian innovation
3. ✅ **Global Vision**: Built for worldwide adoption
4. ✅ **Autonomous Economics**: AI-verified events trigger token minting

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**  
**The SOVRA Protocol - Launching the VLT Era**

**Born in Lagos, Built for the World.**

