# SOVRA Professional Access Control System

**TECHNOLOGY_TYPE**: VITALIZED_LEDGER_TECHNOLOGY  
**Component**: SOVRA_Sovereign_Kernel  
**Module**: `global-hub/api/access_control`

---

## Executive Summary

The **Professional Access Control System** enables certified professionals (Lawyers, Auditors, Architects) to provide high-level advisory services to SOVRA citizens while preserving **data sovereignty** and **privacy**. The system implements:

1. **Certified Professional DID Types** with license validation
2. **Consent-Based Metadata Access** with biometric signatures
3. **Consultation Smart Contracts** with autonomous escrow payments

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SOVRA Access Control                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │   Professional   │  │    Metadata      │  │Consultation│ │
│  │   Verification   │  │Access Controller │  │  Contract  │ │
│  └──────────────────┘  └──────────────────┘  └────────────┘ │
│           │                     │                    │        │
│           ├─────────────────────┼────────────────────┤        │
│           │                     │                    │        │
│  ┌────────▼─────────────────────▼────────────────────▼─────┐ │
│  │              Database (PostgreSQL)                       │ │
│  │  - certified_professionals                               │ │
│  │  - access_consents                                       │ │
│  │  - citizen_metadata (encrypted)                          │ │
│  │  - consultation_contracts                                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Professional Role Tiers

### 1. Lawyer (Legal Advisory)

**DID Format**: `did:sovra:professional:ng:lawyer:{identifier}`

**Access Scope**:
- Legal name and citizenship status
- Legal documents and court records
- Property ownership records

**Issuing Authority**: Nigerian Bar Association  
**License Validation**: NBA license number verification  
**Consultation Fee**: 50 SOV (Junior), 100 SOV (Senior)

**Use Cases**:
- Property dispute resolution
- Contract review and drafting
- Legal compliance advisory

---

### 2. Auditor (Financial Advisory)

**DID Format**: `did:sovra:professional:ng:auditor:{identifier}`

**Access Scope**:
- Financial records and transaction history
- Tax compliance documents
- Business registration and asset declarations

**Issuing Authority**: ICAN (Institute of Chartered Accountants)  
**License Validation**: ICAN membership verification  
**Consultation Fee**: 50 SOV (Certified), 100 SOV (Senior)

**Use Cases**:
- Financial audit and compliance
- Tax planning and advisory
- Forensic accounting

---

### 3. Architect (Construction Advisory)

**DID Format**: `did:sovra:professional:ng:architect:{identifier}`

**Access Scope**:
- Property ownership and land registry
- Building permits and construction approvals
- Zoning compliance documents

**Issuing Authority**: ARCON (Architects Registration Council)  
**License Validation**: ARCON registration verification  
**Consultation Fee**: 50 SOV (Registered), 100 SOV (Principal)

**Use Cases**:
- Building permit applications
- Construction compliance review
- Urban planning consultation

---

## Consent Management

### Consent Lifecycle

```
1. GRANT CONSENT
   ↓
   - Citizen selects professional
   - Citizen selects metadata fields to share
   - Citizen provides biometric signature (PFF)
   - Consent created with 30-day expiry

2. ACTIVE CONSENT
   ↓
   - Professional can access granted fields
   - All access logged in audit trail
   - Citizen can revoke anytime

3. EXPIRED/REVOKED
   ↓
   - Professional loses access
   - Metadata remains encrypted
   - New consent required for access
```

### Consent Properties

- **Time-Limited**: Default 30-day expiry
- **Revocable**: Citizen can revoke anytime
- **Field-Level**: Granular control over metadata fields
- **Biometric**: Requires PFF signature for authenticity
- **Auditable**: All access logged with timestamps

---

## Consultation Smart Contract

### Contract Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│ 1. HIRE PROFESSIONAL                                      │
│    - Citizen initiates consultation                       │
│    - 50 SOV deducted from citizen wallet                  │
│    - Payment locked in escrow                             │
│    Status: PENDING                                        │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ 2. START CONSULTATION                                     │
│    - Professional accepts contract                        │
│    - Work begins                                          │
│    Status: IN_PROGRESS                                    │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ 3. DELIVER SERVICE                                        │
│    - Professional uploads document/signature              │
│    - Delivery proof (hash) recorded on-chain              │
│    - Payment AUTOMATICALLY released to professional       │
│    Status: COMPLETED                                      │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ 4. OPTIONAL: DISPUTE or CONFIRM                           │
│    - Citizen can dispute quality                          │
│    - Citizen can confirm delivery                         │
│    Status: DISPUTED or COMPLETED                          │
└──────────────────────────────────────────────────────────┘
```

### Autonomous Payment Release

**Key Innovation**: Payment is **automatically released** when the professional delivers the service. No manual approval required.

```go
// Professional delivers service
result, _ := consultationContract.DeliverService(
    ctx,
    contractID,
    professionalDID,
    "sha256_hash_of_document",
)

// Payment automatically released to professional's wallet!
// Escrow balance cleared
// Contract status: COMPLETED
```

---

## Security & Privacy

### Encryption

- **AES-256-GCM**: Industry-standard encryption for metadata
- **Field-Level Decryption**: Only granted fields decrypted
- **Zero-Knowledge**: Professional never sees full metadata

### License Validation

- **Real-Time Verification**: License checked before access
- **Expiry Checking**: Automatic expiry validation
- **Authority Integration**: Direct API integration with issuing authorities

### Audit Trail

Every action is logged:
- Consent grants and revocations
- Metadata access requests
- Contract creation and completion
- Payment transactions

---

## Integration with SOVRA Ecosystem

### 1. Wallet Integration

Uses existing `WalletManager` from billing module:
- Debit citizen wallet for consultation fee
- Credit professional wallet upon delivery
- Escrow management for pending contracts

### 2. PFF Integration

Biometric signatures for consent:
- Citizen's PFF signature required for consent
- Ensures authentic consent (not coerced)
- Prevents unauthorized access

### 3. DID Integration

Professional DIDs extend citizen DID system:
- Format: `did:sovra:professional:{country}:{role}:{identifier}`
- Compatible with existing DID infrastructure
- Role-based access control

---

## API Reference

See `global-hub/api/access_control/README.md` for complete API documentation.

**Key Endpoints**:
- `POST /v1/access-control/consent/grant` - Grant metadata access
- `POST /v1/access-control/consent/revoke` - Revoke consent
- `POST /v1/access-control/consultation/hire` - Hire professional
- `POST /v1/access-control/consultation/deliver` - Deliver service
- `POST /v1/access-control/consultation/dispute` - Raise dispute

---

## Database Schema

See `global-hub/api/access_control/schema.sql` for complete schema.

**Key Tables**:
- `certified_professionals` - Professional registry
- `access_consents` - Consent management
- `citizen_metadata` - Encrypted metadata
- `consultation_contracts` - Contract lifecycle
- `metadata_access_log` - Audit trail

---

## Future Roadmap

1. **Multi-Tier Pricing**: Dynamic fees based on professional tier
2. **Rating System**: Citizen ratings and reviews
3. **Dispute Arbitration**: Automated dispute resolution
4. **Cross-Border**: International professional support
5. **Batch Consultations**: Multiple services in one contract

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Where Professionals Meet Privacy**

