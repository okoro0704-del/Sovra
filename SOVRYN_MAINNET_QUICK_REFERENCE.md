# 🚀 SOVRYN MAINNET PROTOCOL - QUICK REFERENCE

**"The Godcurrency. The Final Truth. Divine Issuance."**

---

## 📦 FILES CREATED

### Smart Contracts
1. **VIDACapMainnet.sol** (438 lines)
   - Location: `packages/contracts/src/VIDACapMainnet.sol`
   - Purpose: Consolidated VIDA Cap Godcurrency
   - Status: ✅ COMPLETE

2. **PFFAgnosticGateway.sol** (195 lines)
   - Location: `packages/contracts/src/PFFAgnosticGateway.sol`
   - Purpose: Universal PFF-certified app gateway
   - Status: ✅ COMPLETE

### Test Suite
3. **test-vidacap-mainnet.ts** (314 lines)
   - Location: `packages/contracts/src/test-vidacap-mainnet.ts`
   - Purpose: Comprehensive test suite
   - Status: ✅ COMPLETE

### Documentation
4. **SOVRYN_MAINNET_CONSOLIDATION.md**
   - Location: `SOVRYN_MAINNET_CONSOLIDATION.md`
   - Purpose: Complete consolidation documentation
   - Status: ✅ COMPLETE

5. **SOVRYN_MAINNET_QUICK_REFERENCE.md** (this file)
   - Location: `SOVRYN_MAINNET_QUICK_REFERENCE.md`
   - Purpose: Quick reference guide
   - Status: ✅ COMPLETE

---

## 🔑 KEY CONSTANTS

```solidity
// Genesis
INITIAL_MINT = 10 VIDA Cap
GENESIS_SPLIT = 5 VIDA Cap (Architect / Nation)
START_PRICE_USD = $1,000 (HARDCODED)

// Thresholds
THRESHOLD_5B = 5,000,000,000 VIDA Cap

// 10-Unit Era (Pre-5B)
MINT_AMOUNT_10_ERA = 10 VIDA Cap
CITIZEN_SPLIT_10_ERA = 5 VIDA Cap (50%)
NATION_SPLIT_10_ERA = 5 VIDA Cap (50%)

// 2-Unit Era (Post-5B)
MINT_AMOUNT_2_ERA = 2 VIDA Cap
CITIZEN_SPLIT_2_ERA = 1 VIDA Cap (50%)
NATION_SPLIT_2_ERA = 1 VIDA Cap (50%)

// Burn
BURN_RATE_BPS = 100 (1%)
BPS_DENOMINATOR = 10000

// Metadata
DIVINE_ISSUANCE_TAG = "DIVINE_ISSUANCE"
```

---

## 🔐 THE ONLY ENTRY POINT

### processSovereignAuth()

**Function Signature**:
```solidity
function processSovereignAuth(
    address citizen,
    bytes32 sovereignAuth,
    bytes32 pffHash
) external onlyRole(PFF_PROTOCOL_ROLE) nonReentrant
```

**Access**: Only PFF Protocol (role-based)

**Parameters**:
- `citizen`: Verified citizen address
- `sovereignAuth`: SOVEREIGN_AUTH signature
- `pffHash`: PFF Truth-Hash from heartbeat

**What It Does**:
1. Validates SOVEREIGN_AUTH signature
2. Marks signature as used (anti-replay)
3. Verifies citizen (if first handshake)
4. Mints VIDA Cap based on current era
5. Checks for era transition
6. Emits events to VLT

---

## 📊 VIEW FUNCTIONS

### getCurrentEra()
```solidity
function getCurrentEra() external view returns (MintingEra)
```
Returns: `TEN_UNIT_ERA` or `TWO_UNIT_ERA`

### getMintAmountForCurrentEra()
```solidity
function getMintAmountForCurrentEra() external view returns (uint256, uint256)
```
Returns: `(citizenAmount, nationAmount)`

### getPriceUSD()
```solidity
function getPriceUSD() external pure returns (uint256)
```
Returns: `1000` (always $1,000)

### getDivineIssuanceTag()
```solidity
function getDivineIssuanceTag() external pure returns (string memory)
```
Returns: `"DIVINE_ISSUANCE"`

### shouldBurn()
```solidity
function shouldBurn() external view returns (bool)
```
Returns: `true` if burn is active, `false` otherwise

### getSupplyTarget()
```solidity
function getSupplyTarget() external view returns (uint256)
```
Returns: Target supply (1 VIDA Cap per verified citizen)

### getStats()
```solidity
function getStats() external view returns (
    uint256 supply,
    uint256 burned,
    uint256 citizens,
    uint256 handshakes,
    MintingEra era,
    uint256 priceUSD
)
```
Returns: Comprehensive stats

### getScarcityClock()
```solidity
function getScarcityClock() external view returns (
    uint256 currentSupply,
    uint256 threshold5B,
    uint256 remaining10UnitSlots,
    bool is10UnitEra,
    uint256 priceUSD
)
```
Returns: Scarcity clock data for UI

---

## 🛠️ ADMIN FUNCTIONS

### grantPFFProtocolRole()
```solidity
function grantPFFProtocolRole(address pffProtocol) external onlyRole(ADMIN_ROLE)
```
Grant PFF Protocol role to address

### revokePFFProtocolRole()
```solidity
function revokePFFProtocolRole(address pffProtocol) external onlyRole(ADMIN_ROLE)
```
Revoke PFF Protocol role from address

### updateNationalEscrow()
```solidity
function updateNationalEscrow(address newEscrow) external onlyRole(ADMIN_ROLE)
```
Update national escrow address

---

## 🧪 TESTING

### Run Tests
```bash
# Install dependencies (if needed)
npm install -g ts-node

# Run test suite
cd packages/contracts
npx ts-node src/test-vidacap-mainnet.ts
```

### Expected Output
```
🏛️ VIDACAP MAINNET - TEST SUITE

═══════════════════════════════════════════════════════════
SOVRYN MAINNET PROTOCOL - CLEAN ROOM VALIDATION
═══════════════════════════════════════════════════════════

📝 TEST 1: Verify Genesis Mint
✅ PASSED

📝 TEST 2: Verify Hardcoded $1,000 Price
✅ PASSED

📝 TEST 3: Verify 10-Unit Era Minting
✅ PASSED

📝 TEST 4: Verify 5B Threshold
✅ PASSED

📝 TEST 5: Verify 2-Unit Era Minting
✅ PASSED

📝 TEST 6: Verify 1% Permanent Burn Rate
✅ PASSED

📝 TEST 7: Verify Equilibrium Target (1:1 Ratio)
✅ PASSED

📝 TEST 8: Verify Era Transition Logic
✅ PASSED

═══════════════════════════════════════════════════════════
📊 TEST SUMMARY
═══════════════════════════════════════════════════════════
✅ Tests Passed: 8
❌ Tests Failed: 0
📈 Success Rate: 100.00%
═══════════════════════════════════════════════════════════

🎉 ALL TESTS PASSED! 🎉
```

---

## 🚀 DEPLOYMENT

### 1. Deploy VIDACapMainnet
```javascript
const VIDACapMainnet = await ethers.getContractFactory("VIDACapMainnet");
const vidaCap = await VIDACapMainnet.deploy(
    architectAddress,  // Isreal Okoro's address
    nationalEscrowAddress
);
await vidaCap.deployed();
```

### 2. Deploy PFFAgnosticGateway
```javascript
const PFFAgnosticGateway = await ethers.getContractFactory("PFFAgnosticGateway");
const gateway = await PFFAgnosticGateway.deploy(
    adminAddress,
    vidaCap.address
);
await gateway.deployed();
```

### 3. Grant PFF Protocol Role
```javascript
await vidaCap.grantPFFProtocolRole(pffProtocolAddress);
```

### 4. Certify First App
```javascript
await gateway.certifyApp(appAddress, "App Name v1.0.0");
```

---

## 🔥 BURN MECHANICS

### When Does Burn Activate?
```javascript
// Burn activates when:
totalSupply() > (totalVerifiedCitizens * 1 VIDA Cap)

// Example:
// 10 million citizens verified
// Supply = 15 million VIDA Cap
// Target = 10 million VIDA Cap
// Burn ACTIVE ✅ (supply > target)
```

### When Does Burn Stop?
```javascript
// Burn stops when equilibrium reached:
totalSupply() <= (totalVerifiedCitizens * 1 VIDA Cap)

// Example:
// 10 million citizens verified
// Supply = 10 million VIDA Cap
// Target = 10 million VIDA Cap
// Burn STOPPED ❌ (equilibrium reached)
```

### Burn Calculation
```javascript
// 1% burn on every transaction
burnAmount = (transferAmount * 100) / 10000

// Example:
// Transfer 100 VIDA Cap
// Burn = 1 VIDA Cap (1%)
// Received = 99 VIDA Cap (99%)
```

---

## 🌐 AGNOSTIC GATEWAY

### Certify an App
```javascript
// Only PFF Certifier can call
await gateway.certifyApp(
    appAddress,
    "MyApp v1.0.0" // Optional metadata
);
```

### Check if App is Certified
```javascript
const isCertified = await gateway.isAppCertified(appAddress);
```

### Request Payment (from certified app)
```javascript
// Only certified apps can call
await gateway.requestPayment(
    citizenAddress,
    sovereignAuthSignature,
    pffHash
);
```

---

## 📈 SCARCITY CLOCK

### Get Scarcity Clock Data
```javascript
const clock = await vidaCap.getScarcityClock();

console.log(`Current Supply: ${clock.currentSupply}`);
console.log(`5B Threshold: ${clock.threshold5B}`);
console.log(`Remaining 10-Unit Slots: ${clock.remaining10UnitSlots}`);
console.log(`Is 10-Unit Era: ${clock.is10UnitEra}`);
console.log(`Price USD: $${clock.priceUSD}`);
```

### Display Urgency
```javascript
if (clock.is10UnitEra) {
    const percentToThreshold = (clock.currentSupply / clock.threshold5B) * 100;
    console.log(`⚠️ ${percentToThreshold.toFixed(2)}% to 5B threshold!`);
    console.log(`⏰ Only ${clock.remaining10UnitSlots} 10-Unit slots remaining!`);
}
```

---

## 🔐 Sovereign. ✅ Verified. ⚡ Biological.

**Project Vitalia - SOVRYN Mainnet Protocol**

**Born in Lagos, Nigeria. Built for Humanity.** 🇳🇬

---

**ARCHITECT: ISREAL OKORO**

**💎 $1,000 PER VIDA CAP**

**🏛️ DIVINE ISSUANCE**

**⚡ SOVEREIGN_AUTH ONLY**

**🔥 1% PERMANENT BURN**

**🎯 5B THRESHOLD**

**🌐 AGNOSTIC GATEWAY**

**🧹 CLEAN ROOM VERIFIED**

