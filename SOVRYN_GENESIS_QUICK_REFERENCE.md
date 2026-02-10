# 🏛️ SOVRYN GENESIS PROTOCOL - QUICK REFERENCE

**"The Godcurrency. The Final Truth. Divine Issuance."**

---

## 📦 WHAT WAS DELIVERED

### ✅ 1. SovereignCore.sol (411 lines)
**Purpose**: Centralized tokenomics engine for VIDA Cap Godcurrency

**Location**: `packages/contracts/src/SovereignCore.sol`

**Key Features**:
- All minting logic (10-Unit Era and 2-Unit Era)
- 50/50 splitting (Citizen / Nation)
- 5B threshold transition logic
- 1% permanent burn mechanism
- Hardcoded $1,000 VIDA Cap price
- "DIVINE_ISSUANCE" tag in metadata

**ONLY Entry Point for Minting**:
```solidity
function processValidPresence(
    address citizen,
    bytes32 pffSignature,
    bytes32 pffHash
) external onlyRole(PFF_SENTINEL_ROLE) nonReentrant
```

---

### ✅ 2. PFFSentinelBridge.ts (366 lines)
**Purpose**: Clean API bridge for PFF Sentinel to SovereignCore

**Location**: `packages/contracts/src/PFFSentinelBridge.ts`

**Key Features**:
- ONLY accepts VALID_PRESENCE signals
- Cryptographic signature verification
- Anti-replay protection
- Timestamp validation (< 60 seconds)
- BPM validation (40-140 range)
- Confidence validation (>= 80%)
- NO UI CODE, NO CAMERA DRIVERS, NO SENSOR LOGIC

**Core Functions**:
```typescript
// Validate VALID_PRESENCE signal
validatePresenceSignal(signal, sentinelPublicKey)

// Process signal and mint
processValidPresenceAndMint(signal, sovereignCoreAddress, signer)

// Generate signal (PFF Sentinel only)
generateValidPresenceSignal(citizenAddress, pffHash, bpm, confidence, sentinelPrivateKey)
```

---

### ✅ 3. Test Suite (272 lines)
**Purpose**: Comprehensive test suite for SOVRYN Genesis Protocol

**Location**: `packages/contracts/src/test-sovryn-genesis.ts`

**Tests Included**:
1. ✅ Generate VALID_PRESENCE Signal
2. ✅ Validate VALID_PRESENCE Signal
3. ✅ Process VALID_PRESENCE and Mint
4. ✅ Verify 50/50 Split (Citizen / Nation)
5. ✅ Verify Anti-Replay Protection

**Run Command**:
```bash
cd packages/contracts
npx ts-node src/test-sovryn-genesis.ts
```

---

### ✅ 4. Updated index.ts
**Purpose**: Clean exports for contracts package

**Location**: `packages/contracts/src/index.ts`

**Changes**:
- Added header: "NO UI CODE. NO CAMERA DRIVERS. NO SENSOR LOGIC."
- Added PFFSentinelBridge exports
- Removed GenesisRegistration exports (UI/sensor functions)
- Marked old exports as "LEGACY EXPORTS (Deprecated)"

---

### ✅ 5. Removed GenesisRegistration.ts
**Purpose**: Purge UI/sensor code from contracts package

**Action**: DELETED `packages/contracts/src/GenesisRegistration.ts`

**Reason**: Contained biometric capture functions (captureFaceTemplate, captureFingerTemplate, etc.) which violate the "Blockchain & VLT Only" requirement

---

## 🔑 KEY CONSTANTS

### VIDA Cap Godcurrency
```solidity
uint256 public constant START_PRICE_USD = 1000; // $1,000 per VIDA Cap
string public constant DIVINE_ISSUANCE_TAG = "DIVINE_ISSUANCE";
```

### Minting Eras
```solidity
// 10-Unit Era (Pre-5B)
uint256 public constant MINT_AMOUNT_10_ERA = 10 * 10**18; // 10 VIDA Cap
uint256 public constant CITIZEN_SPLIT_10_ERA = 5 * 10**18; // 5 to Citizen
uint256 public constant NATION_SPLIT_10_ERA = 5 * 10**18; // 5 to Nation

// 2-Unit Era (Post-5B)
uint256 public constant MINT_AMOUNT_2_ERA = 2 * 10**18; // 2 VIDA Cap
uint256 public constant CITIZEN_SPLIT_2_ERA = 1 * 10**18; // 1 to Citizen
uint256 public constant NATION_SPLIT_2_ERA = 1 * 10**18; // 1 to Nation
```

### Thresholds
```solidity
uint256 public constant THRESHOLD_5B = 5_000_000_000 * 10**18; // 5 Billion
uint256 public constant BURN_RATE_BPS = 100; // 1%
```

---

## 🔐 SECURITY MODEL

### VALID_PRESENCE Signal Flow

```
┌─────────────────────┐
│   PFF Sentinel      │
│  (Biometric Layer)  │
└──────────┬──────────┘
           │
           │ 1. Generate VALID_PRESENCE Signal
           │    - Citizen Address
           │    - PFF Hash (heartbeat)
           │    - BPM (40-140)
           │    - Confidence (>= 80%)
           │    - Cryptographic Signature
           │
           ▼
┌─────────────────────┐
│ PFFSentinelBridge   │
│  (API Bridge)       │
└──────────┬──────────┘
           │
           │ 2. Validate Signal
           │    - Verify signature
           │    - Check timestamp (< 60s)
           │    - Validate BPM range
           │    - Validate confidence
           │    - Anti-replay check
           │
           ▼
┌─────────────────────┐
│  SovereignCore.sol  │
│ (Tokenomics Engine) │
└──────────┬──────────┘
           │
           │ 3. Execute Minting
           │    - Verify citizen
           │    - Mint based on era
           │    - 50/50 split
           │    - Check era transition
           │    - Log to VLT
           │
           ▼
┌─────────────────────┐
│   VIDA Cap Minted   │
│  5 Citizen / 5 Nation│
│  (or 1 / 1 post-5B) │
└─────────────────────┘
```

---

## 📊 TOKENOMICS SUMMARY

### 10-Unit Era (Pre-5B Threshold)
- **Mint per handshake**: 10 VIDA Cap
- **Citizen receives**: 5 VIDA Cap
- **Nation receives**: 5 VIDA Cap
- **Duration**: Until total supply reaches 5 Billion

### Great Burn Transition (5B Threshold)
- **Trigger**: Total supply >= 5,000,000,000 VIDA Cap
- **Action**: Automatic transition to 2-Unit Era
- **Event**: `EraTransition` emitted

### 2-Unit Era (Post-5B Threshold)
- **Mint per handshake**: 2 VIDA Cap
- **Citizen receives**: 1 VIDA Cap
- **Nation receives**: 1 VIDA Cap
- **Duration**: Permanent

### Permanent Burn (Burn-to-One)
- **Burn rate**: 1% of every transaction
- **Target**: 1 VIDA Cap per verified citizen
- **Mechanism**: Automatic burn on transfer
- **End condition**: Supply <= (Total Citizens × 1 VIDA Cap)

---

## 🎯 USAGE EXAMPLES

### For PFF Sentinel (Generate Signal)
```typescript
import { generateValidPresenceSignal } from '@vitalia/contracts';

const signal = await generateValidPresenceSignal(
  citizenAddress,
  pffHash,
  72, // BPM
  0.95, // 95% confidence
  sentinelPrivateKey
);
```

### For API Bridge (Validate & Mint)
```typescript
import { validatePresenceSignal, processValidPresenceAndMint } from '@vitalia/contracts';

// Validate signal
const validation = await validatePresenceSignal(signal, sentinelPublicKey);

if (validation.isValid) {
  // Process and mint
  const result = await processValidPresenceAndMint(
    signal,
    sovereignCoreAddress,
    signer
  );
  
  console.log(`Minted: ${result.citizenAmount} to citizen`);
  console.log(`Minted: ${result.nationAmount} to nation`);
}
```

### For Smart Contract (Process Presence)
```solidity
// Only callable by PFF Sentinel
sovereignCore.processValidPresence(
    citizenAddress,
    pffSignature,
    pffHash
);
```

---

## 🔍 VIEW FUNCTIONS

### Get Current Era
```solidity
MintingEra era = sovereignCore.getCurrentEra();
// Returns: TEN_UNIT_ERA or TWO_UNIT_ERA
```

### Get Mint Amounts
```solidity
(uint256 citizenAmount, uint256 nationAmount) = sovereignCore.getMintAmountForCurrentEra();
```

### Get Price
```solidity
uint256 priceUSD = sovereignCore.getPriceUSD();
// Returns: 1000 ($1,000 per VIDA Cap)
```

### Get Scarcity Clock Data
```solidity
(
    uint256 currentSupply,
    uint256 threshold5B,
    uint256 remaining10UnitSlots,
    bool is10UnitEra,
    uint256 priceUSD
) = sovereignCore.getScarcityClock();
```

### Get Comprehensive Stats
```solidity
(
    MintingEra era,
    uint256 supply,
    uint256 burned,
    uint256 handshakes,
    uint256 citizens,
    uint256 priceUSD,
    bool burnActive
) = sovereignCore.getStats();
```

---

## 🔐 Sovereign. ✅ Verified. ⚡ Biological.

**Project Vitalia - SOVRYN Genesis Protocol**

**Born in Lagos, Nigeria. Built for Humanity.** 🇳🇬

**Architect: ISREAL OKORO**

---

*"The Blockchain is Pure. The VLT is Truth. Divine Issuance."*

