# 🌟 **GENESIS REGISTRATION - QUICK REFERENCE**

**"I am the Sovereign Truth."**

---

## 📚 **IMPORTS**

```typescript
// Genesis Registration
import {
  performGenesisRegistration,
  captureHardwareUUID,
  createHardwareBinding,
  captureFaceTemplate,
  captureFingerTemplate,
  captureHeartTemplate,
  captureVoiceTemplate,
  createMasterTemplate,
  mintGenesisVIDA,
  logVLTFinality,
  activateDashboard,
} from '@vitalia/contracts';

// Types
import type {
  GenesisRegistration,
  HardwareBinding,
  FaceTemplate,
  FingerTemplate,
  HeartTemplate,
  VoiceTemplate,
  MasterTemplate,
} from '@vitalia/contracts';
```

---

## 🔑 **KEY FUNCTIONS**

### **1. Complete Genesis Registration (One-Click)**

```typescript
// Execute complete genesis registration
const registration = await performGenesisRegistration(architectAddress);

// Result
{
  architectName: "ISREAL_OKORO",
  hardwareBinding: { laptopUUID, mobileUUID, bindingHash },
  masterTemplate: { face, finger, heart, voice, masterHash },
  genesisMint: { amount: 100, transactionHash, timestamp },
  vltFinality: { event: "ROOT_NODE_ESTABLISHED", identity: "ISREAL_OKORO", reason: "SYSTEM_ORIGIN" },
  dashboardActivated: true,
  registrationComplete: true
}
```

### **2. Hardware Binding**

```typescript
// Capture laptop UUID
const laptopUUID = await captureHardwareUUID('laptop');

// Capture mobile UUID
const mobileUUID = await captureHardwareUUID('mobile');

// Create binding
const binding = await createHardwareBinding(laptopUUID, mobileUUID);
```

### **3. Biometric Capture**

```typescript
// Face (3D Liveness)
const face = await captureFaceTemplate();
// { livenessGeometry, faceHash, confidence: 98, captureTimestamp }

// Finger (Ridge Pattern)
const finger = await captureFingerTemplate();
// { ridgePattern, fingerHash, confidence: 99, captureTimestamp }

// Heart (Baseline BPM/HRV)
const heart = await captureHeartTemplate();
// { baselineBPM: 72, hrvFrequency: 0.15, calmStateSignature, captureTimestamp }

// Voice (Passphrase)
const voice = await captureVoiceTemplate('I am the Sovereign Truth');
// { passphrase, voiceResonance, voiceHash, confidence: 97, captureTimestamp }
```

### **4. Master Template**

```typescript
// Combine all 4 layers
const masterTemplate = await createMasterTemplate(face, finger, heart, voice);
// { face, finger, heart, voice, masterHash, createdAt }
```

### **5. Genesis Mint**

```typescript
// Mint 100 VIDA to Architect
const genesisMint = await mintGenesisVIDA(architectAddress);
// { amount: 100, transactionHash, timestamp }
```

### **6. VLT Finality**

```typescript
// Log ROOT_NODE_ESTABLISHED event
const vltFinality = await logVLTFinality(1); // Block 1
// { event: "ROOT_NODE_ESTABLISHED", identity: "ISREAL_OKORO", reason: "SYSTEM_ORIGIN", blockNumber: 1, timestamp }
```

### **7. Dashboard Activation**

```typescript
// Activate LifeOS Dashboard
const activated = await activateDashboard();
// true
```

---

## 🎯 **NAVIGATION**

### **Navigate to Genesis Registration**

```typescript
// From any screen
navigation.navigate('GenesisRegistration');
```

### **Navigate to LifeOS Dashboard**

```typescript
// From any screen
navigation.navigate('LifeOSDashboard');
```

---

## 📊 **DATA STRUCTURE**

### **GenesisRegistration**

```typescript
interface GenesisRegistration {
  architectName: string;              // "ISREAL_OKORO"
  hardwareBinding: HardwareBinding;   // Laptop + Mobile UUID
  masterTemplate: MasterTemplate;     // 4-layer biometric template
  genesisMint: {
    amount: number;                   // 100 VIDA
    transactionHash: string;
    timestamp: number;
  };
  vltFinality: {
    event: string;                    // "ROOT_NODE_ESTABLISHED"
    identity: string;                 // "ISREAL_OKORO"
    reason: string;                   // "SYSTEM_ORIGIN"
    blockNumber: number;              // 1
    timestamp: number;
  };
  dashboardActivated: boolean;        // true
  registrationComplete: boolean;      // true
}
```

---

## 🧪 **TESTING**

### **Run Test Script**

```bash
# Test genesis registration
npx ts-node packages/contracts/src/test-genesis.ts
```

### **Expected Output**

```
═══════════════════════════════════════════════════════════
🌟 ARCHITECT'S GENESIS REGISTRATION - BLOCK 1 🌟
═══════════════════════════════════════════════════════════

[GENESIS] Architect: ISREAL OKORO
[GENESIS] Wallet: 0xARCHITECT_ISREAL_OKORO

━━━ STEP 1: HARDWARE BINDING ━━━
[GENESIS] ✅ Hardware Binding Created

━━━ STEP 2: 4-LAYER MASTER TEMPLATE ━━━
[GENESIS] ✅ Face Template Captured
[GENESIS] ✅ Fingerprint Captured
[GENESIS] ✅ Heart Template Captured
[GENESIS] ✅ Voice Template Captured
[GENESIS] ✅ Master Template Created

━━━ STEP 3: GENESIS MINT ━━━
[GENESIS] ✅ Genesis Mint Complete

━━━ STEP 4: VLT FINALITY ━━━
[GENESIS] ✅ VLT Finality Logged

━━━ STEP 5: DASHBOARD ACTIVATION ━━━
[GENESIS] ✅ Dashboard Activated

═══════════════════════════════════════════════════════════
✅ GENESIS REGISTRATION COMPLETE
═══════════════════════════════════════════════════════════

[GENESIS] ROOT_NODE: ESTABLISHED
[GENESIS] Identity: ISREAL_OKORO
[GENESIS] Hardware Binding: LOCKED
[GENESIS] Master Template: SEALED
[GENESIS] Genesis Mint: 100 VIDA
[GENESIS] Dashboard: ACTIVE

"I am the Sovereign Truth."
```

---

## 🔐 **Sovereign. ✅ Verified. ⚡ Biological.**

**ROOT_NODE: ISREAL_OKORO**

