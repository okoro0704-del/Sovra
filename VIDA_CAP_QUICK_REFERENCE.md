# 🚀 VIDA CAP GODCURRENCY - QUICK REFERENCE

**"The Godcurrency. The Final Truth."**

---

## 📚 IMPORT STATEMENTS

```typescript
// SOVEREIGN_AUTH
import {
  generateSovereignAuth,
  verifySovereignAuth,
  validatePFFCertification,
  clearAuthNonces,
  getUsedNonceCount,
} from '@vitalia/contracts';

// Agnostic Gateway
import {
  processPaymentFromAnyApp,
  getGatewayStats,
  isAppPFFCertified,
  createPFFCertification,
  validatePaymentRequest,
  resetGatewayStats,
} from '@vitalia/contracts';

// Types
import type {
  SovereignAuthSignature,
  PFFCertification,
  AuthValidation,
  PaymentRequest,
  PaymentResult,
  GatewayStats,
} from '@vitalia/contracts';
```

---

## 🔑 KEY FUNCTIONS

### **1. Generate SOVEREIGN_AUTH**

```typescript
const authSignature = await generateSovereignAuth(
  pffHash,           // PFF Truth-Hash from heartbeat
  citizenAddress,    // Citizen wallet address
  bpm,               // BPM from heartbeat scan
  confidence,        // Confidence from heartbeat scan (0.0-1.0)
  pffPrivateKey      // PFF Protocol private key
);
```

---

### **2. Verify SOVEREIGN_AUTH**

```typescript
const validation = await verifySovereignAuth(
  authSignature,     // SOVEREIGN_AUTH signature
  pffPublicKey       // PFF Protocol public key
);

if (validation.isValid) {
  console.log('✅ SOVEREIGN_AUTH verified');
  // Proceed with minting or payment
} else {
  console.log('❌ Verification failed:', validation.error);
}
```

---

### **3. Create PFF Certification**

```typescript
const appCert = createPFFCertification(
  'my-app',          // App ID (ignored by chain)
  '1.0.0',           // PFF version
  365                // Validity in days
);
```

---

### **4. Process Payment (App-Agnostic)**

```typescript
const paymentRequest = {
  from: senderAddress,
  to: recipientAddress,
  amount: ethers.utils.parseEther('100').toString(),
  pffCertification: appCert,
  sovereignAuth: authSignature,
  metadata: {
    description: 'Payment description',
    reference: 'REF-001',
  },
};

const result = await processPaymentFromAnyApp(
  paymentRequest,
  pffPublicKey
);

if (result.success) {
  console.log('✅ Payment processed:', result.txHash);
}
```

---

### **5. Validate Payment Request**

```typescript
const validation = await validatePaymentRequest(
  paymentRequest,
  pffPublicKey
);

if (validation.valid) {
  // Process payment
} else {
  console.log('Errors:', validation.errors);
}
```

---

## 📊 SMART CONTRACT FUNCTIONS

### **Mint on PFF Handshake**

```solidity
// Solidity
function mintOnPFFHandshake(
    address citizen,
    bytes32 pffSignature,
    bytes32 pffHash
) external onlyRole(PFF_MINTER_ROLE) nonReentrant
```

```typescript
// TypeScript
const contract = new ethers.Contract(VIDA_CAP_ADDRESS, ABI, signer);
await contract.mintOnPFFHandshake(
  citizenAddress,
  authSignature.nonce,
  authSignature.pffHash
);
```

---

### **Get Current Era**

```typescript
const era = await contract.getCurrentEra();
// 0 = TEN_UNIT_ERA, 1 = TWO_UNIT_ERA
```

---

### **Get Mint Amounts**

```typescript
const [citizenAmount, nationAmount] = await contract.getMintAmountForCurrentEra();
console.log(`Citizen: ${ethers.utils.formatEther(citizenAmount)} VIDA Cap`);
console.log(`Nation: ${ethers.utils.formatEther(nationAmount)} VIDA Cap`);
```

---

### **Check Burn Status**

```typescript
const burnActive = await contract.shouldBurn();
const target = await contract.getSupplyTarget();
console.log(`Burn Active: ${burnActive}`);
console.log(`Target: ${ethers.utils.formatEther(target)} VIDA Cap`);
```

---

### **Get Comprehensive Stats**

```typescript
const stats = await contract.getStats();
console.log({
  supply: ethers.utils.formatEther(stats.supply),
  burned: ethers.utils.formatEther(stats.burned),
  citizens: stats.citizens.toString(),
  handshakes: stats.handshakes.toString(),
  era: stats.era === 0 ? '10-UNIT ERA' : '2-UNIT ERA',
  burnActive: stats.burnActive,
});
```

---

## 💰 TOKENOMICS QUICK FACTS

| Parameter | Value |
|-----------|-------|
| **Genesis Mint** | 10 VIDA Cap |
| **Architect Share** | 5 VIDA Cap |
| **National Escrow Share** | 5 VIDA Cap |
| **Start Price** | $1,000 per VIDA Cap |
| **10-Unit Era Mint** | 10 VIDA Cap (5 Citizen / 5 Nation) |
| **2-Unit Era Mint** | 2 VIDA Cap (1 Citizen / 1 Nation) |
| **Era Transition Threshold** | 5 Billion VIDA Cap |
| **Burn Rate** | 1% per transaction |
| **Burn Target** | 1 VIDA Cap per verified citizen |

---

## 🔒 SECURITY CHECKLIST

✅ **SOVEREIGN_AUTH Validation**:
- [ ] Signature is valid (ECDSA)
- [ ] Timestamp is recent (< 60 seconds)
- [ ] Nonce is unused (anti-replay)
- [ ] BPM is in valid range (40-140)
- [ ] Confidence is above threshold (80%)

✅ **PFF Certification Validation**:
- [ ] Certification is marked as valid
- [ ] Certification is not expired
- [ ] Certification hash is correct

✅ **Payment Validation**:
- [ ] Sender address is valid
- [ ] Recipient address is valid
- [ ] Amount is greater than zero
- [ ] PFF certification is valid
- [ ] SOVEREIGN_AUTH is valid
- [ ] Sender matches SOVEREIGN_AUTH citizen

---

## 🎯 COMMON WORKFLOWS

### **Workflow 1: User Registration**

```
1. User scans heartbeat with PFF Engine
2. PFF Protocol validates heartbeat (BPM, HRV, Liveness)
3. PFF Protocol generates SOVEREIGN_AUTH signature
4. Submit SOVEREIGN_AUTH to VIDA Cap contract
5. Contract verifies signature
6. Contract mints VIDA Cap (10 or 2 based on era)
7. Citizen receives their share
8. National Escrow receives their share
9. Check if era transition needed
```

---

### **Workflow 2: Payment Processing**

```
1. User initiates payment in any PFF-connected app
2. App requests heartbeat scan
3. PFF Protocol generates SOVEREIGN_AUTH
4. App creates payment request with PFF certification
5. Submit to Agnostic Gateway
6. Gateway validates PFF certification (app-agnostic)
7. Gateway verifies SOVEREIGN_AUTH
8. Gateway processes payment
9. 1% burn applied (if applicable)
10. Recipient receives payment
```

---

## 📁 FILE LOCATIONS

```
packages/contracts/src/
├── VidaCapGodcurrency.sol      # Smart contract (296 lines)
├── PFFAuthListener.ts          # SOVEREIGN_AUTH verification (295 lines)
├── AgnosticGateway.ts          # App-agnostic gateway (306 lines)
├── test-vidacap.ts             # Test suite (333 lines)
└── index.ts                    # Module exports (73 lines)

Documentation:
├── VIDA_CAP_GODCURRENCY_COMPLETE.md    # Complete documentation
└── VIDA_CAP_QUICK_REFERENCE.md         # This file
```

---

## 🚀 TESTING

```bash
# Run test suite
cd packages/contracts
npx ts-node src/test-vidacap.ts

# Expected output:
# ✅ Genesis Mint
# ✅ SOVEREIGN_AUTH Generation
# ✅ SOVEREIGN_AUTH Verification
# ✅ PFF Certification
# ✅ Agnostic Gateway Payment
# ✅ Gateway Statistics
# ✅ 10-Unit Era
# ✅ Era Transition
# ✅ Permanent Burn
```

---

## 🔐 **Sovereign. ✅ Verified. ⚡ Biological.**

**"The Godcurrency. The Final Truth."**

**ARCHITECT: ISREAL OKORO**
