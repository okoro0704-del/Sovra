# SOVRA Hub - Cosmos SDK Blockchain
## Unified Presence & Sovereignty Protocol

## Overview

The **SOVRA Hub** is a Cosmos SDK blockchain that implements the core tokenomics for the **SOVRA Protocol** (Sovereign Presence Architecture). It features usage-based minting, a burn engine for fee distribution, and DID-based routing for national spoke pools.

## Key Features

### ✅ Usage-Based Minting
- **No fixed inflation** - tokens are only minted when verifications occur
- **10 uSOV per verification** - citizens earn tokens for completing PFF verifications
- **Activity-driven supply** - token supply grows with protocol usage

### ✅ Burn Engine
- **25% burned** - deflationary pressure on every verification
- **50% to National Spoke Pool** - funds national operations (DID-based routing)
- **25% to Global Protocol Treasury** - funds global protocol development

### ✅ Oracle Peg
- **Hardcoded 5 SOV per verification** - predictable costs (temporary)
- **Fee validation** - ensures all verifications pay exactly 5 SOV
- **Future dynamic pricing** - will be made market-driven later

### ✅ DID-Based Routing
- **Decentralized Identifiers** - format: `did:sovrn:{country}:{identifier}`
- **Automatic routing** - 50% of fees go to correct national spoke pool
- **Multi-jurisdiction support** - Nigeria, Kenya, Ghana, and more

## Architecture

```
global-hub/chain/
├── x/mint/              # Usage-based minting module
│   ├── keeper/          # Keeper with MintOnVerification()
│   └── types/           # Params, events, expected keepers
├── x/pff/               # PFF verification module
│   ├── keeper/          # Verification processing logic
│   └── types/           # MsgPFFVerification, DID parsing
├── x/oracle/            # Price oracle module
│   ├── keeper/          # GetVerificationPrice() - 5 SOV
│   └── types/           # Keys, errors
└── x/auth/              # Fee handling
    └── ante/            # BurnEngineDecorator (post-handler)
```

## Modules

### x/mint - Usage-Based Minting

**Purpose**: Mint tokens on verification events instead of fixed inflation

**Key Functions**:
- `MintOnVerification(ctx, recipient)` - Mints 10 uSOV to citizen

**Parameters**:
- `UsageBasedMinting`: `true` (enabled)
- `MintPerVerification`: `10 uSOV`

**Events**:
- `mint_on_verification` - Emitted when tokens are minted

### x/pff - PFF Verification

**Purpose**: Process PFF (Presence Factor Fabric) biometric verifications

**Messages**:
- `MsgPFFVerification` - Submit PFF verification with DID

**Key Functions**:
- `ProcessPFFVerification()` - Validates and processes verification
- `ValidateDID()` - Validates DID format
- `ParseDIDCountry()` - Extracts country from DID

**Events**:
- `pff_verification` - Emitted on successful verification

### x/oracle - Price Oracle

**Purpose**: Provide verification pricing (hardcoded for now)

**Key Functions**:
- `GetVerificationPrice()` - Returns 5 SOV (5,000,000 uSOV)
- `ValidateVerificationFee()` - Ensures correct fee paid

**Hardcoded Price**: 1 verification = 5 SOV = 5,000,000 uSOV

### x/auth - Burn Engine

**Purpose**: Distribute verification fees according to tokenomics

**Post-Handler**: `BurnEngineDecorator`

**Fee Distribution**:
1. **25% Burn** - Removed from supply
2. **50% National Spoke Pool** - DID-based routing
3. **25% Global Protocol Treasury** - Protocol operations

**Events**:
- `fee_distribution` - Emitted when fees are distributed

## Token Economics

### Verification Flow

```
1. Citizen pays 5 SOV (5,000,000 uSOV) fee
2. Oracle validates fee amount
3. PFF module processes verification
4. Mint module mints 10 uSOV to citizen
5. Burn engine distributes fees:
   - Burn: 1,250,000 uSOV (25%)
   - Spoke Pool: 2,500,000 uSOV (50%)
   - Treasury: 1,250,000 uSOV (25%)
```

### Net Effect Per Verification

- **Minted**: 10 uSOV (to citizen)
- **Burned**: 1,250,000 uSOV (25% of fee)
- **Net Supply Change**: -1,249,990 uSOV (deflationary!)

### Token Denominations

| Unit | Value | Use Case |
|------|-------|----------|
| **SOV** | 1,000,000 uSOV | User-facing |
| **uSOV** | 0.000001 SOV | Blockchain base |

## DID Format

**Format**: `did:sovrn:{country}:{identifier}`

**Examples**:
- `did:sovrn:nigeria:airport_security_001`
- `did:sovrn:kenya:border_control_005`
- `did:sovrn:ghana:hospital_emergency_002`

**Routing**:
- Nigeria DID → `spoke_pool_nigeria`
- Kenya DID → `spoke_pool_kenya`
- Ghana DID → `spoke_pool_ghana`

## Module Accounts

| Account | Purpose |
|---------|---------|
| `mint` | Temporary holding for minted tokens |
| `fee_collector` | Collects fees before distribution |
| `spoke_pool_nigeria` | Nigerian operations fund |
| `spoke_pool_kenya` | Kenyan operations fund |
| `spoke_pool_ghana` | Ghanaian operations fund |
| `global_protocol_treasury` | Global protocol fund |

## Development

### Prerequisites

```bash
# Go 1.21+
go version

# Cosmos SDK v0.47+
go get github.com/cosmos/cosmos-sdk@v0.47.0
```

### Build

```bash
cd global-hub/chain
go mod init github.com/sovrn-protocol/sovrn
go mod tidy
make install
```

### Initialize

```bash
sovd init my-node --chain-id sovrn-hub-1
sovd keys add validator
sovd add-genesis-account $(sovd keys show validator -a) 1000000000usov
sovd gentx validator 100000000usov --chain-id sovrn-hub-1
sovd collect-gentxs
sovd start
```

## Documentation

- **[Blockchain Tokenomics](../docs/BLOCKCHAIN_TOKENOMICS.md)** - Complete tokenomics specification
- **[Protocol Specification](../docs/PROTOCOL.md)** - SOVRN Protocol overview
- **[Token Economics](../docs/TOKEN_ECONOMICS.md)** - SOV token design

## Support

- **GitHub**: https://github.com/sovrn-protocol/sovrn
- **Discord**: https://discord.gg/sovrn
- **Email**: blockchain@sovrn.network

