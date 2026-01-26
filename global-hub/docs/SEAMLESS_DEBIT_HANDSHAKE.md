# Seamless-Debit-Handshake

**TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY**

## Overview

The **Seamless-Debit-Handshake** is an autonomous payment system that automatically deducts fees from a user's Sovereign_Vault upon AI-verified PFF (Presence Factor Fabric) scans.

**Key Principle**: **No human approval required** - payments execute automatically when AI confirms vitality.

---

## How It Works

### 1. User Performs PFF Scan

User opens SOVRA app and performs biometric liveness scan:
- Camera captures face
- AI analyzes texture, pulse (rPPG), and liveness
- Neural analyzer generates liveness score (0-100)
- System creates Proof_of_Presence

### 2. AI Validates Proof

The system validates the Proof_of_Presence:
```
✅ IsValid == true (AI confirmed)
✅ LivenessScore >= 70 (confidence threshold)
✅ Timestamp < 5 minutes old (not expired)
✅ Signature valid (cryptographic proof)
✅ PFF hash not blacklisted (VLT_Core check)
```

### 3. Autonomous Payment Execution

If validation passes:
```
1. Extract user ID from DID
2. Get fee amount (1 SOV or 10 SOV)
3. Query Sovereign_Vault balance
4. DEBIT vault automatically (no approval)
5. Update balance
6. Return transaction result
```

**Execution Time**: <100ms

### 4. User Receives Confirmation

Notification sent to user's phone:
```
"Biometric payment successful: 1.000000 SOV
Remaining balance: 45.500000 SOV"
```

---

## Transaction Types

### Fast-Track (1 SOV)
- **Fee**: 1 SOV (1,000,000 uSOV)
- **Use Case**: Priority verification with sub-500ms response
- **Features**: Temporal trust cache, instant validation

### Standard (10 SOV)
- **Fee**: 10 SOV (10,000,000 uSOV)
- **Use Case**: Standard verification with full fraud checks
- **Features**: Complete fraud orchestration, hardware attestation

---

## Proof_of_Presence Structure

```go
type ProofOfPresence struct {
    PFFHash       string    // SHA-256 hash of biometric data
    DID           string    // did:sovra:{country}:{identifier}
    LivenessScore uint8     // AI confidence (0-100)
    Timestamp     time.Time // When verification occurred
    Signature     []byte    // Cryptographic signature
    IsValid       bool      // AI validation result
}
```

---

## Validation Rules

### 1. AI Confirmation
```go
if !proof.IsValid {
    return error("AI validation failed")
}
```

### 2. Liveness Score Threshold
```go
const MinLivenessScore = 70
if proof.LivenessScore < MinLivenessScore {
    return error("liveness score too low")
}
```

### 3. Timestamp Expiry
```go
const MaxProofAge = 5 * time.Minute
if time.Since(proof.Timestamp) > MaxProofAge {
    return error("proof expired")
}
```

### 4. Signature Verification
```go
if len(proof.Signature) == 0 {
    return error("missing signature")
}
// In production: verify cryptographic signature
```

### 5. Blacklist Check
```go
// Query VLT_Core Consensus_of_Presence blacklist
if isBlacklisted(proof.PFFHash) {
    return error("PFF hash blacklisted")
}
```

---

## Payment Flow Diagram

```
┌─────────────┐
│    User     │
│  Opens App  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  PFF Liveness   │
│      Scan       │
│  (Camera + AI)  │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│  Proof_of_Presence  │
│     Generated       │
│  (Hash + Score)     │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│  AI Validation       │
│  - IsValid?          │
│  - Score >= 70?      │
│  - Not expired?      │
│  - Not blacklisted?  │
└──────┬───────────────┘
       │
       ├─── ❌ Failed ──▶ Return Error
       │
       ▼
┌──────────────────────┐
│  AUTONOMOUS DEBIT    │
│  - Get vault         │
│  - Check balance     │
│  - Deduct fee        │
│  - Update balance    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Send Notification   │
│  "Payment Success!"  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Return Result       │
│  (Transaction ID)    │
└──────────────────────┘
```

---

## Integration with National_Spoke_Pool

### Fee Distribution

When a biometric payment is executed:

1. **25% Burned** - Deflationary mechanism
2. **50% to National_Spoke_Pool** - Integrity dividend fund
3. **25% to Global_Protocol_Treasury** - Protocol development

Example: 10 SOV payment
```
Burn:     2.5 SOV  (25%)
Spoke:    5.0 SOV  (50%) ← Goes to monthly dividend
Treasury: 2.5 SOV  (25%)
```

### Monthly Dividend Distribution

On the first day of every month:
```
1. Query National_Spoke_Pool balance
2. Get all verified DIDs
3. Divide pool equally among verified DIDs
4. Credit each Sovereign_Vault
5. Send notification: "You have received your SOVRA Integrity Dividend!"
6. Reset pool to 0
```

---

## Security Considerations

### 1. Replay Attack Prevention
- Each PFF hash can only be used once
- Timestamp expiry (5 minutes)
- Nonce tracking (in production)

### 2. Deepfake Detection
- AI liveness score threshold (70/100)
- Texture analysis (Gabor filters)
- Pulse detection (rPPG)
- VLT_Core Consensus_of_Presence (51% validator vote)

### 3. Balance Protection
- Insufficient balance check before debit
- Atomic transaction execution
- Transaction history audit trail

### 4. DID Verification
- Cryptographic signature validation
- DID format validation (`did:sovra:{country}:{identifier}`)
- Status checking (only "verified" DIDs)

---

## Error Handling

### Common Errors

1. **AI Validation Failed**
   ```
   Error: "AI validation failed: proof marked as invalid"
   Action: User must retry PFF scan
   ```

2. **Liveness Score Too Low**
   ```
   Error: "liveness score too low: 65 (minimum: 70)"
   Action: User must retry in better lighting
   ```

3. **Proof Expired**
   ```
   Error: "proof expired: age 6m0s exceeds maximum 5m0s"
   Action: User must perform new PFF scan
   ```

4. **Insufficient Balance**
   ```
   Error: "insufficient balance: have 500000 uSOV, need 1000000 uSOV"
   Action: User must purchase more SOV units
   ```

5. **PFF Hash Blacklisted**
   ```
   Error: "PFF hash blacklisted by Consensus_of_Presence"
   Action: User account suspended, contact support
   ```

---

## Performance Metrics

### Target Performance
- **Validation Time**: <50ms
- **Debit Execution**: <30ms
- **Total Transaction Time**: <100ms
- **Notification Delivery**: <2 seconds

### Monitoring
- Transaction success rate
- Average execution time
- Failed validation reasons
- Balance distribution

---

## Future Enhancements

1. **Multi-Currency Support**: Accept multiple fiat currencies
2. **Dynamic Pricing**: Adjust fees based on network congestion
3. **Batch Payments**: Process multiple payments in single transaction
4. **Refund Mechanism**: Automatic refunds for failed verifications
5. **Loyalty Rewards**: Discount fees for frequent users

---

**🔐 Sovereign. ✅ Verified. ⚡ Autonomous.**

**SOVRA Protocol - Seamless Payments Through Vitality**

