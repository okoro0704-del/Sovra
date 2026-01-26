# SOVRA Access Control Module

**TECHNOLOGY_TYPE**: VITALIZED_LEDGER_TECHNOLOGY  
**Component**: SOVRA_Sovereign_Kernel

## Overview

The Access Control module implements **Professional Role Tiers** with consent-based metadata access and escrow-based consultation smart contracts. This enables certified professionals (Lawyers, Auditors, Architects) to provide high-level advisory services while preserving citizen privacy and data sovereignty.

---

## Key Features

### 1. **Certified Professional DID Types**

Professional DIDs follow the format:
```
did:sovra:professional:{country}:{role}:{identifier}
```

**Supported Roles**:
- **Lawyer**: Legal advice, court records, property ownership
- **Auditor**: Financial records, tax compliance, asset declarations
- **Architect**: Building permits, land registry, construction approvals

### 2. **Consent-Based Metadata Access**

Citizens explicitly grant professionals access to specific encrypted metadata fields:

- **Biometric Consent**: All consents require citizen's PFF signature
- **Time-Limited**: Default 30-day expiry, revocable anytime
- **Field-Level Granularity**: Only granted fields are decrypted
- **Role-Based Scope**: Each role has predefined access scope

### 3. **Consultation Smart Contract**

Escrow-based consultation system with autonomous payment release:

- **50 SOV Fee**: Standard consultation fee (customizable by tier)
- **Escrow Lock**: Payment held in contract until service delivery
- **Autonomous Release**: Payment automatically released upon delivery
- **Dispute Resolution**: Citizens can dispute completed contracts
- **Delivery Proof**: Document hash recorded on-chain

---

## Professional Roles & Access Scope

### Lawyer
**Access Scope**:
- `legal_name`
- `citizenship_status`
- `legal_documents`
- `court_records`
- `property_ownership`

**Issuing Authority**: Nigerian Bar Association  
**License Format**: `NBA{number}`

### Auditor
**Access Scope**:
- `financial_records`
- `tax_compliance`
- `business_registration`
- `asset_declarations`
- `transaction_history`

**Issuing Authority**: ICAN (Institute of Chartered Accountants of Nigeria)  
**License Format**: `ICAN{number}`

### Architect
**Access Scope**:
- `property_ownership`
- `building_permits`
- `land_registry`
- `construction_approvals`
- `zoning_compliance`

**Issuing Authority**: ARCON (Architects Registration Council of Nigeria)  
**License Format**: `ARCON{number}`

---

## API Endpoints

### Grant Consent
```http
POST /v1/access-control/consent/grant
Content-Type: application/json

{
  "citizen_did": "did:sovra:ng:citizen_001",
  "professional_did": "did:sovra:professional:ng:lawyer:prof_001",
  "requested_fields": ["legal_name", "property_ownership"],
  "purpose": "Legal consultation on property dispute",
  "biometric_signature": "base64_encoded_signature"
}
```

### Revoke Consent
```http
POST /v1/access-control/consent/revoke
Content-Type: application/json

{
  "consent_id": "consent_123"
}
```

### Hire Professional
```http
POST /v1/access-control/consultation/hire
Content-Type: application/json

{
  "citizen_did": "did:sovra:ng:citizen_001",
  "professional_did": "did:sovra:professional:ng:lawyer:prof_001",
  "service_type": "Legal advice",
  "description": "Need advice on property ownership transfer"
}
```

**Response**:
```json
{
  "success": true,
  "contract_id": "contract_123",
  "fee": 50000000,
  "escrow_locked": true
}
```

### Deliver Service
```http
POST /v1/access-control/consultation/deliver
Content-Type: application/json

{
  "contract_id": "contract_123",
  "professional_did": "did:sovra:professional:ng:lawyer:prof_001",
  "delivery_proof": "sha256_hash_of_document"
}
```

---

## Consultation Contract Lifecycle

```
1. PENDING
   ↓ (Citizen hires professional)
   - 50 SOV deducted from citizen wallet
   - Payment locked in escrow

2. IN_PROGRESS
   ↓ (Professional starts work)
   - Professional begins consultation

3. COMPLETED
   ↓ (Professional delivers service)
   - Delivery proof (document hash) recorded
   - Payment AUTOMATICALLY released to professional
   - Escrow balance cleared

4. DISPUTED (optional)
   ↓ (Citizen raises dispute)
   - Payment held pending resolution
   - Manual review required

5. REFUNDED (if cancelled)
   ↓ (Citizen cancels before completion)
   - Payment refunded to citizen
```

---

## Database Schema

See `schema.sql` for complete database schema including:

- `certified_professionals` - Professional registry
- `access_consents` - Consent management
- `citizen_metadata` - Encrypted metadata storage
- `consultation_contracts` - Contract lifecycle
- `metadata_access_log` - Audit trail
- `consultation_payments` - Payment history
- `professional_statistics` - Performance tracking

---

## Security Features

### Encryption
- **AES-256-GCM**: Metadata encryption
- **Field-Level Decryption**: Only granted fields decrypted
- **Biometric Signatures**: PFF-based consent signatures

### License Validation
- **Expiry Checking**: Automatic license expiry validation
- **Authority Verification**: Integration with issuing authorities
- **Active Status**: Real-time professional status checking

### Audit Trail
- **Access Logging**: All metadata access logged
- **Payment History**: Complete transaction history
- **Consent Tracking**: Consent grant/revoke events

---

## Integration Example

```go
package main

import (
    "context"
    "time"
    "github.com/sovra/global-hub/api/access_control"
)

func main() {
    // Initialize components
    registry := access_control.NewProfessionalRegistry()
    metadataController := access_control.NewMetadataAccessController(encryptionKey)
    consultationContract := access_control.NewConsultationSmartContract(walletManager)

    // Register professional
    professional, _ := registry.RegisterProfessional(
        context.Background(),
        "ng",
        access_control.RoleLawyer,
        "NBA12345",
        "Nigerian Bar Association",
        time.Now().Add(365 * 24 * time.Hour),
        []string{"Property Law", "Contract Law"},
    )

    // Citizen grants consent
    consent, _ := metadataController.GrantConsent(
        context.Background(),
        "did:sovra:ng:citizen_001",
        professional.DID,
        professional.Role,
        []string{"legal_name", "property_ownership"},
        "Legal consultation",
        biometricSignature,
    )

    // Citizen hires professional
    contract, _ := consultationContract.HireProfessional(
        context.Background(),
        "did:sovra:ng:citizen_001",
        professional.DID,
        professional,
        "Legal advice",
        "Property ownership transfer",
    )

    // Professional delivers service
    result, _ := consultationContract.DeliverService(
        context.Background(),
        contract.ContractID,
        professional.DID,
        "sha256_hash_of_legal_document",
    )
    // Payment automatically released!
}
```

---

## Future Enhancements

1. **Multi-Tier Pricing**: Different fees based on professional tier
2. **Rating System**: Citizen ratings for completed consultations
3. **Dispute Arbitration**: Automated dispute resolution mechanism
4. **Cross-Border Professionals**: Support for international professionals
5. **Batch Consultations**: Multiple consultations in single contract

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Professional Access Control**

