# SOVRA Protocol Specification
## Unified Presence & Sovereignty Protocol

## Version 1.0.0

## Abstract

The **SOVRA Protocol** (Sovereign Presence Architecture) is the unified technology combining **PFF (Presence Factor Fabric)** biometric verification with **SOVRN** decentralized identity and consent management. It enables citizens to control their personal data through AI-powered liveness detection, explicit consent mechanisms, and usage-based value distribution through SOV tokens.

## Core Principles

1. **Citizen Sovereignty**: Citizens own and control their identity and data
2. **Privacy by Design**: Biometric data is hashed and never stored in plaintext
3. **Explicit Consent**: All data access requires verifiable citizen consent
4. **Usage-Based Value**: Citizens earn SOV tokens for verified interactions
5. **Transparency**: All transactions and consents are auditable
6. **Decentralization**: No single point of control or failure

## Architecture

### Hub-and-Spoke Model

The SOVRA Protocol uses a hub-and-spoke architecture:

- **Global Hub**: Universal protocol layer with shared types and utilities
- **Spokes**: Geographic/jurisdictional implementations (e.g., Nigeria, Kenya, etc.)

Each spoke can customize:
- Token minting rates
- Regulatory compliance requirements
- Local infrastructure
- User interfaces

But must maintain compatibility with:
- Core data types
- Security primitives
- Consent mechanisms
- Token standards

## Core Components

### 1. Citizen Registry

**Purpose**: Unique identity registration using biometric verification

**Key Fields**:
- `pff_hash`: HMAC-SHA256 hash of fingerprint data
- `nin_hash`: Optional national ID hash
- `status`: active | suspended | revoked

**Security**: 
- Biometric data never stored in plaintext
- One-way hashing prevents reverse engineering
- Salt-based hashing prevents rainbow table attacks

### 2. Registered Entities

**Purpose**: Organizations that request citizen data

**Tier Levels**:
- **Tier 1**: Government agencies (highest access)
- **Tier 2**: Financial institutions
- **Tier 3**: Commercial entities (limited access)

**Authentication**: API key-based with rate limiting

### 3. Consent Logs

**Purpose**: Immutable record of citizen consent

**Requirements**:
- Biometric signature from citizen
- Explicit data scope definition
- Timestamp and requester identification
- Cannot be modified after creation

### 4. SOV Token System

**Purpose**: Usage-based value distribution

**Minting Events**:
- PFF verification: 1 SOV (default)
- Consent granted: 1 SOV (default)
- Manual mint: Variable (admin only)

**Token Properties**:
- Decimal precision: 8 places
- Transaction types: mint, transfer, burn, stake
- Full audit trail with metadata

## Security Model

### Biometric Hashing

```
PFF_HASH = HMAC-SHA256(fingerprint_data, secret_key)
```

**Properties**:
- Deterministic: Same fingerprint → same hash
- One-way: Hash → fingerprint is computationally infeasible
- Collision-resistant: Different fingerprints → different hashes

### API Authentication

```
API_KEY_HASH = HMAC-SHA256(api_key, secret_key)
```

**Flow**:
1. Entity receives API key
2. Hash stored in database
3. Each request includes X-API-KEY header
4. Server hashes and compares

### Consent Verification

```
BIOMETRIC_SIGNATURE = HMAC-SHA256(consent_data + timestamp, pff_hash)
```

**Ensures**:
- Only the citizen can create valid signature
- Signature tied to specific consent
- Replay attacks prevented by timestamp

## Data Flow

### Registration Flow

1. Citizen provides fingerprint at enrollment station
2. System generates PFF hash
3. Citizen record created in registry
4. Initial SOV token balance created (0 SOV)

### Verification Flow

1. Entity requests verification via API
2. System generates challenge token
3. Citizen provides biometric signature
4. System verifies signature matches PFF hash
5. Consent logged
6. SOV tokens minted automatically

### Token Minting Flow

1. Consent granted event triggered
2. Minting service creates minting event record
3. Citizen balance updated
4. Transaction recorded in ledger
5. Response includes new balance

## Interoperability

### Cross-Spoke Communication

Spokes can communicate through:
- Shared token standards
- Standard API interfaces
- Common data formats

### Future Extensions

- Cross-spoke token transfers
- Federated identity verification
- Smart contract integration
- Decentralized storage (IPFS)

## Governance

### Protocol Upgrades

- Semantic versioning (MAJOR.MINOR.PATCH)
- Backward compatibility required for MINOR/PATCH
- Migration path required for MAJOR versions

### Spoke Autonomy

Each spoke controls:
- Local regulations compliance
- Token economics parameters
- Infrastructure deployment
- User experience

## Compliance

### Data Protection

- GDPR-compliant (right to erasure, data portability)
- Local data residency requirements
- Audit trail for all data access
- Citizen consent required for all operations

### Financial Regulations

- Token classification per jurisdiction
- KYC/AML compliance at spoke level
- Transaction reporting as required

## References

- [Token Economics](./TOKEN_ECONOMICS.md)
- [Security Best Practices](./SECURITY.md)
- [API Specification](./API_SPEC.md)

