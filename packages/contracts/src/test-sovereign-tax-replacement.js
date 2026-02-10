/**
 * @file test-sovereign-tax-replacement.js
 * @notice Comprehensive test suite for Sovereign Tax-Replacement Protocol (10% Standard)
 * 
 * "TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X."
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════════════════════
// MOCK IMPLEMENTATION
// ════════════════════════════════════════════════════════════════════════════════

class MockSovereignTaxReplacementProtocol {
  constructor() {
    // Constants
    this.BUSINESS_TRIBUTE_RATE_BPS = 1000n; // 10%
    this.BPS_DENOMINATOR = 10000n;
    this.NATIONAL_ESCROW_BPS = 5000n; // 50%
    this.GLOBAL_CITIZEN_BLOCK_BPS = 5000n; // 50%
    
    // Sentinel tier pricing (locked)
    this.SENTINEL_TIER_1_PRICE_USD = 20n;
    this.SENTINEL_TIER_1_DEVICES = 1n;
    this.SENTINEL_TIER_2_PRICE_USD = 50n;
    this.SENTINEL_TIER_2_DEVICES = 3n;
    this.SENTINEL_TIER_3_PRICE_USD = 1000n;
    this.SENTINEL_TIER_3_DEVICES = 15n;
    
    // State
    this.totalBusinessTributeCollected = 0n;
    this.totalNationalEscrowAllocated = 0n;
    this.totalGlobalCitizenBlockAllocated = 0n;
    this.isProtocolActive = false;
    this.isBusinessTier = new Map();
    this.nationalEscrowBalance = new Map();
    this.userSentinelTier = new Map();
  }
  
  // Core functions
  collectBusinessTribute(from, to, amount, iso3166Code) {
    if (!this.isProtocolActive) throw new Error('Protocol not active');
    if (!this.isBusinessTier.get(from) && !this.isBusinessTier.get(to)) {
      throw new Error('Not a business-tier transaction');
    }
    if (amount <= 0n) throw new Error('Amount must be greater than zero');
    
    // Calculate 10% tribute
    const tributeAmount = (amount * this.BUSINESS_TRIBUTE_RATE_BPS) / this.BPS_DENOMINATOR;
    
    // Calculate 50/50 split
    const toNationalEscrow = (tributeAmount * this.NATIONAL_ESCROW_BPS) / this.BPS_DENOMINATOR;
    const toGlobalCitizenBlock = tributeAmount - toNationalEscrow;
    
    // Update balances
    const currentBalance = this.nationalEscrowBalance.get(iso3166Code) || 0n;
    this.nationalEscrowBalance.set(iso3166Code, currentBalance + toNationalEscrow);
    
    this.totalNationalEscrowAllocated += toNationalEscrow;
    this.totalGlobalCitizenBlockAllocated += toGlobalCitizenBlock;
    this.totalBusinessTributeCollected += tributeAmount;
    
    return {
      tributeAmount,
      toNationalEscrow,
      toGlobalCitizenBlock,
    };
  }
  
  setBusinessTier(business, isBusiness) {
    this.isBusinessTier.set(business, isBusiness);
  }
  
  purchaseSentinelTier(user, tier) {
    if (tier < 1 || tier > 3) throw new Error('Invalid tier (must be 1, 2, or 3)');
    if (this.userSentinelTier.get(user)) throw new Error('User already has a Sentinel tier');
    
    this.userSentinelTier.set(user, tier);
    
    let priceUSD, devices;
    if (tier === 1) {
      priceUSD = this.SENTINEL_TIER_1_PRICE_USD;
      devices = this.SENTINEL_TIER_1_DEVICES;
    } else if (tier === 2) {
      priceUSD = this.SENTINEL_TIER_2_PRICE_USD;
      devices = this.SENTINEL_TIER_2_DEVICES;
    } else {
      priceUSD = this.SENTINEL_TIER_3_PRICE_USD;
      devices = this.SENTINEL_TIER_3_DEVICES;
    }
    
    return { tier, priceUSD, devices };
  }
  
  activateProtocol() {
    if (this.isProtocolActive) throw new Error('Protocol already active');
    this.isProtocolActive = true;
    return 'TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X.';
  }
  
  deactivateProtocol() {
    if (!this.isProtocolActive) throw new Error('Protocol already inactive');
    this.isProtocolActive = false;
  }
  
  // View functions
  getBusinessTributeStats() {
    return {
      totalCollected: this.totalBusinessTributeCollected,
      totalToNationalEscrow: this.totalNationalEscrowAllocated,
      totalToGlobalCitizenBlock: this.totalGlobalCitizenBlockAllocated,
      tributeRateBps: this.BUSINESS_TRIBUTE_RATE_BPS,
      protocolActive: this.isProtocolActive,
    };
  }
  
  getNationalEscrowBalance(iso3166Code) {
    return this.nationalEscrowBalance.get(iso3166Code) || 0n;
  }
  
  getUserSentinelTier(user) {
    const tier = this.userSentinelTier.get(user) || 0;
    let priceUSD = 0n, devices = 0n;
    
    if (tier === 1) {
      priceUSD = this.SENTINEL_TIER_1_PRICE_USD;
      devices = this.SENTINEL_TIER_1_DEVICES;
    } else if (tier === 2) {
      priceUSD = this.SENTINEL_TIER_2_PRICE_USD;
      devices = this.SENTINEL_TIER_2_DEVICES;
    } else if (tier === 3) {
      priceUSD = this.SENTINEL_TIER_3_PRICE_USD;
      devices = this.SENTINEL_TIER_3_DEVICES;
    }
    
    return { tier, priceUSD, devices };
  }
  
  getSentinelTierPricing() {
    return {
      tier1PriceUSD: this.SENTINEL_TIER_1_PRICE_USD,
      tier1Devices: this.SENTINEL_TIER_1_DEVICES,
      tier2PriceUSD: this.SENTINEL_TIER_2_PRICE_USD,
      tier2Devices: this.SENTINEL_TIER_2_DEVICES,
      tier3PriceUSD: this.SENTINEL_TIER_3_PRICE_USD,
      tier3Devices: this.SENTINEL_TIER_3_DEVICES,
    };
  }
  
  calculateBusinessTribute(amount) {
    const tributeAmount = (amount * this.BUSINESS_TRIBUTE_RATE_BPS) / this.BPS_DENOMINATOR;
    const toNationalEscrow = (tributeAmount * this.NATIONAL_ESCROW_BPS) / this.BPS_DENOMINATOR;
    const toGlobalCitizenBlock = tributeAmount - toNationalEscrow;
    return { tributeAmount, toNationalEscrow, toGlobalCitizenBlock };
  }

  getSNATDashboardMessage() {
    return "By activating this block, you replace 100% of PIT and VAT with this automated 5% National Revenue Stream.";
  }

  getNationalDividendPotential() {
    return 10n; // 10X multiplier
  }

  getProtocolMetadata() {
    return {
      name: "Sovereign Tax-Replacement Protocol",
      version: "1.0.0",
      description: "TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X.",
      architect: "ISREAL OKORO",
    };
  }

  isBusinessTierAddress(account) {
    return this.isBusinessTier.get(account) || false;
  }

  getRevenueSplit() {
    return {
      nationalEscrowBps: this.NATIONAL_ESCROW_BPS,
      globalCitizenBlockBps: this.GLOBAL_CITIZEN_BLOCK_BPS,
      description: "50% National Escrow (5% total) / 50% Global Citizen Block (5% total)",
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════════════════════

console.log(`
╔════════════════════════════════════════════════════════════════════════════════╗
║  SOVEREIGN TAX-REPLACEMENT PROTOCOL (10% STANDARD) - TEST SUITE               ║
║  "TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED."                       ║
╚════════════════════════════════════════════════════════════════════════════════╝
`);

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}`);
    testsFailed++;
  }
}

// Initialize protocol
const protocol = new MockSovereignTaxReplacementProtocol();

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PROTOCOL ACTIVATION & VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Test 1.1: Initial protocol state
const initialStats = protocol.getBusinessTributeStats();
assert(initialStats.protocolActive === false, 'Test 1.1: Protocol initially inactive');

// Test 1.2: Activate protocol
const activationMessage = protocol.activateProtocol();
assert(
  activationMessage === 'TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X.',
  'Test 1.2: Protocol activation message correct'
);

// Test 1.3: Protocol active after activation
const activeStats = protocol.getBusinessTributeStats();
assert(activeStats.protocolActive === true, 'Test 1.3: Protocol active after activation');

// Test 1.4: Tribute rate is 10% (1000 basis points)
assert(activeStats.tributeRateBps === 1000n, 'Test 1.4: Tribute rate is 10% (1000 BPS)');

// Test 1.5: Protocol metadata
const metadata = protocol.getProtocolMetadata();
assert(metadata.name === "Sovereign Tax-Replacement Protocol", 'Test 1.5: Protocol name correct');
assert(metadata.version === "1.0.0", 'Test 1.6: Protocol version correct');
assert(metadata.architect === "ISREAL OKORO", 'Test 1.7: Protocol architect correct');

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. BUSINESS TRIBUTE COLLECTION (10% STANDARD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Test 2.1: Register business-tier address
const businessAddress = '0xBUSINESS123';
protocol.setBusinessTier(businessAddress, true);
assert(protocol.isBusinessTierAddress(businessAddress) === true, 'Test 2.1: Business-tier address registered');

// Test 2.2: Collect business tribute (100 VIDA Cap transaction)
const userAddress = '0xUSER456';
const transactionAmount = 100n * 10n**18n; // 100 VIDA Cap
const result = protocol.collectBusinessTribute(businessAddress, userAddress, transactionAmount, 'NGA');

// Test 2.3: Tribute amount is 10% of transaction
const expectedTribute = 10n * 10n**18n; // 10 VIDA Cap (10% of 100)
assert(result.tributeAmount === expectedTribute, 'Test 2.3: Tribute amount is 10% of transaction');

// Test 2.4: National Escrow receives 50% of tribute (5% of total)
const expectedNationalEscrow = 5n * 10n**18n; // 5 VIDA Cap (50% of 10)
assert(result.toNationalEscrow === expectedNationalEscrow, 'Test 2.4: National Escrow receives 5% of transaction');

// Test 2.5: Global Citizen Block receives 50% of tribute (5% of total)
const expectedGlobalCitizenBlock = 5n * 10n**18n; // 5 VIDA Cap (50% of 10)
assert(result.toGlobalCitizenBlock === expectedGlobalCitizenBlock, 'Test 2.5: Global Citizen Block receives 5% of transaction');

// Test 2.6: National Escrow balance updated for Nigeria
const nigeriaBalance = protocol.getNationalEscrowBalance('NGA');
assert(nigeriaBalance === expectedNationalEscrow, 'Test 2.6: Nigeria National Escrow balance updated');

// Test 2.7: Total tribute collected updated
const stats1 = protocol.getBusinessTributeStats();
assert(stats1.totalCollected === expectedTribute, 'Test 2.7: Total tribute collected updated');

// Test 2.8: Total National Escrow allocated updated
assert(stats1.totalToNationalEscrow === expectedNationalEscrow, 'Test 2.8: Total National Escrow allocated updated');

// Test 2.9: Total Global Citizen Block allocated updated
assert(stats1.totalToGlobalCitizenBlock === expectedGlobalCitizenBlock, 'Test 2.9: Total Global Citizen Block allocated updated');

// Test 2.10: Second business transaction (Ghana)
const ghanaTransaction = 200n * 10n**18n; // 200 VIDA Cap
const result2 = protocol.collectBusinessTribute(businessAddress, userAddress, ghanaTransaction, 'GHA');
const expectedTribute2 = 20n * 10n**18n; // 20 VIDA Cap (10% of 200)
assert(result2.tributeAmount === expectedTribute2, 'Test 2.10: Second tribute amount correct');

// Test 2.11: Ghana National Escrow balance
const ghanaBalance = protocol.getNationalEscrowBalance('GHA');
const expectedGhanaEscrow = 10n * 10n**18n; // 10 VIDA Cap (5% of 200)
assert(ghanaBalance === expectedGhanaEscrow, 'Test 2.11: Ghana National Escrow balance correct');

// Test 2.12: Total tribute collected after two transactions
const stats2 = protocol.getBusinessTributeStats();
const expectedTotalTribute = 30n * 10n**18n; // 10 + 20 = 30 VIDA Cap
assert(stats2.totalCollected === expectedTotalTribute, 'Test 2.12: Total tribute collected after two transactions');

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. SENTINEL TIER PRICING (LOCKED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Test 3.1: Get Sentinel tier pricing
const pricing = protocol.getSentinelTierPricing();
assert(pricing.tier1PriceUSD === 20n, 'Test 3.1: Tier 1 price is $20');
assert(pricing.tier1Devices === 1n, 'Test 3.2: Tier 1 has 1 device');
assert(pricing.tier2PriceUSD === 50n, 'Test 3.3: Tier 2 price is $50');
assert(pricing.tier2Devices === 3n, 'Test 3.4: Tier 2 has 3 devices');
assert(pricing.tier3PriceUSD === 1000n, 'Test 3.5: Tier 3 price is $1,000');
assert(pricing.tier3Devices === 15n, 'Test 3.6: Tier 3 has 15 devices');

// Test 3.7: Purchase Tier 1
const user1 = '0xUSER1';
const tier1Purchase = protocol.purchaseSentinelTier(user1, 1);
assert(tier1Purchase.tier === 1, 'Test 3.7: Tier 1 purchased successfully');
assert(tier1Purchase.priceUSD === 20n, 'Test 3.8: Tier 1 purchase price correct');
assert(tier1Purchase.devices === 1n, 'Test 3.9: Tier 1 purchase devices correct');

// Test 3.10: Purchase Tier 2
const user2 = '0xUSER2';
const tier2Purchase = protocol.purchaseSentinelTier(user2, 2);
assert(tier2Purchase.tier === 2, 'Test 3.10: Tier 2 purchased successfully');
assert(tier2Purchase.priceUSD === 50n, 'Test 3.11: Tier 2 purchase price correct');
assert(tier2Purchase.devices === 3n, 'Test 3.12: Tier 2 purchase devices correct');

// Test 3.13: Purchase Tier 3
const user3 = '0xUSER3';
const tier3Purchase = protocol.purchaseSentinelTier(user3, 3);
assert(tier3Purchase.tier === 3, 'Test 3.13: Tier 3 purchased successfully');
assert(tier3Purchase.priceUSD === 1000n, 'Test 3.14: Tier 3 purchase price correct');
assert(tier3Purchase.devices === 15n, 'Test 3.15: Tier 3 purchase devices correct');

// Test 3.16: Get user Sentinel tier
const user1Tier = protocol.getUserSentinelTier(user1);
assert(user1Tier.tier === 1, 'Test 3.16: User 1 has Tier 1');
assert(user1Tier.priceUSD === 20n, 'Test 3.17: User 1 tier price correct');
assert(user1Tier.devices === 1n, 'Test 3.18: User 1 tier devices correct');

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. SNAT DASHBOARD & TAX REPLACEMENT MESSAGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Test 4.1: SNAT Dashboard message
const dashboardMessage = protocol.getSNATDashboardMessage();
const expectedMessage = "By activating this block, you replace 100% of PIT and VAT with this automated 5% National Revenue Stream.";
assert(dashboardMessage === expectedMessage, 'Test 4.1: SNAT Dashboard message correct');

// Test 4.2: National Dividend Potential
const dividendPotential = protocol.getNationalDividendPotential();
assert(dividendPotential === 10n, 'Test 4.2: National Dividend Potential is 10X');

// Test 4.3: Revenue split configuration
const revenueSplit = protocol.getRevenueSplit();
assert(revenueSplit.nationalEscrowBps === 5000n, 'Test 4.3: National Escrow receives 50% of tribute');
assert(revenueSplit.globalCitizenBlockBps === 5000n, 'Test 4.4: Global Citizen Block receives 50% of tribute');
assert(
  revenueSplit.description === "50% National Escrow (5% total) / 50% Global Citizen Block (5% total)",
  'Test 4.5: Revenue split description correct'
);

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. TRIBUTE CALCULATION & VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Test 5.1: Calculate tribute for 1000 VIDA Cap
const calc1 = protocol.calculateBusinessTribute(1000n * 10n**18n);
assert(calc1.tributeAmount === 100n * 10n**18n, 'Test 5.1: Tribute is 10% of 1000 VIDA Cap');
assert(calc1.toNationalEscrow === 50n * 10n**18n, 'Test 5.2: National Escrow receives 5% of 1000 VIDA Cap');
assert(calc1.toGlobalCitizenBlock === 50n * 10n**18n, 'Test 5.3: Global Citizen Block receives 5% of 1000 VIDA Cap');

// Test 5.4: Calculate tribute for 500 VIDA Cap
const calc2 = protocol.calculateBusinessTribute(500n * 10n**18n);
assert(calc2.tributeAmount === 50n * 10n**18n, 'Test 5.4: Tribute is 10% of 500 VIDA Cap');
assert(calc2.toNationalEscrow === 25n * 10n**18n, 'Test 5.5: National Escrow receives 5% of 500 VIDA Cap');
assert(calc2.toGlobalCitizenBlock === 25n * 10n**18n, 'Test 5.6: Global Citizen Block receives 5% of 500 VIDA Cap');

// Test 5.7: Calculate tribute for 10,000 VIDA Cap
const calc3 = protocol.calculateBusinessTribute(10000n * 10n**18n);
assert(calc3.tributeAmount === 1000n * 10n**18n, 'Test 5.7: Tribute is 10% of 10,000 VIDA Cap');
assert(calc3.toNationalEscrow === 500n * 10n**18n, 'Test 5.8: National Escrow receives 5% of 10,000 VIDA Cap');
assert(calc3.toGlobalCitizenBlock === 500n * 10n**18n, 'Test 5.9: Global Citizen Block receives 5% of 10,000 VIDA Cap');

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. MULTI-NATION TRIBUTE ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Test 6.1: Kenya transaction
const kenyaTransaction = 150n * 10n**18n; // 150 VIDA Cap
protocol.collectBusinessTribute(businessAddress, userAddress, kenyaTransaction, 'KEN');
const kenyaBalance = protocol.getNationalEscrowBalance('KEN');
assert(kenyaBalance === 7n * 10n**18n + 5n * 10n**17n, 'Test 6.1: Kenya National Escrow balance correct'); // 7.5 VIDA Cap

// Test 6.2: South Africa transaction
const southAfricaTransaction = 300n * 10n**18n; // 300 VIDA Cap
protocol.collectBusinessTribute(businessAddress, userAddress, southAfricaTransaction, 'ZAF');
const southAfricaBalance = protocol.getNationalEscrowBalance('ZAF');
assert(southAfricaBalance === 15n * 10n**18n, 'Test 6.2: South Africa National Escrow balance correct'); // 15 VIDA Cap

// Test 6.3: Nigeria balance unchanged
const nigeriaBalanceAfter = protocol.getNationalEscrowBalance('NGA');
assert(nigeriaBalanceAfter === expectedNationalEscrow, 'Test 6.3: Nigeria balance unchanged after other nations');

// Test 6.4: Ghana balance unchanged
const ghanaBalanceAfter = protocol.getNationalEscrowBalance('GHA');
assert(ghanaBalanceAfter === expectedGhanaEscrow, 'Test 6.4: Ghana balance unchanged after other nations');

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. PROTOCOL CONTROL & EDGE CASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Test 7.1: Deactivate protocol
protocol.deactivateProtocol();
const deactivatedStats = protocol.getBusinessTributeStats();
assert(deactivatedStats.protocolActive === false, 'Test 7.1: Protocol deactivated successfully');

// Test 7.2: Cannot collect tribute when protocol inactive
let errorThrown = false;
try {
  protocol.collectBusinessTribute(businessAddress, userAddress, 100n * 10n**18n, 'NGA');
} catch (e) {
  errorThrown = true;
}
assert(errorThrown, 'Test 7.2: Cannot collect tribute when protocol inactive');

// Test 7.3: Reactivate protocol
protocol.activateProtocol();
const reactivatedStats = protocol.getBusinessTributeStats();
assert(reactivatedStats.protocolActive === true, 'Test 7.3: Protocol reactivated successfully');

// Test 7.4: Cannot purchase invalid tier
errorThrown = false;
try {
  protocol.purchaseSentinelTier('0xUSER4', 4);
} catch (e) {
  errorThrown = true;
}
assert(errorThrown, 'Test 7.4: Cannot purchase invalid tier (tier 4)');

// Test 7.5: Cannot purchase duplicate tier
errorThrown = false;
try {
  protocol.purchaseSentinelTier(user1, 2);
} catch (e) {
  errorThrown = true;
}
assert(errorThrown, 'Test 7.5: Cannot purchase duplicate tier');

// Test 7.6: Unregister business-tier address
protocol.setBusinessTier(businessAddress, false);
assert(protocol.isBusinessTierAddress(businessAddress) === false, 'Test 7.6: Business-tier address unregistered');

// Test 7.7: Cannot collect tribute from non-business address
errorThrown = false;
try {
  protocol.collectBusinessTribute(businessAddress, userAddress, 100n * 10n**18n, 'NGA');
} catch (e) {
  errorThrown = true;
}
assert(errorThrown, 'Test 7.7: Cannot collect tribute from non-business address');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUMMARY
// ════════════════════════════════════════════════════════════════════════════════

console.log(`
╔════════════════════════════════════════════════════════════════════════════════╗
║  TEST SUMMARY                                                                  ║
╚════════════════════════════════════════════════════════════════════════════════╝

Total Tests: ${testsPassed + testsFailed}
Tests Passed: ${testsPassed}
Tests Failed: ${testsFailed}
Pass Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%

${testsFailed === 0 ? '✅ ALL TESTS PASSED! 🎉' : '❌ SOME TESTS FAILED'}

"TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X."

Born in Lagos, Nigeria. Built for Humanity. 🇳🇬
Architect: ISREAL OKORO
`);

