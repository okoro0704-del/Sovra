/**
 * @file test-sentinel-authority-api.js
 * @notice Comprehensive Test Suite for Sentinel Authority API
 * 
 * "MAPPING REVENUE. INITIALIZING SOVEREIGN IDENTITY. THE GENESIS BEGINS."
 * 
 * TEST CATEGORIES:
 * ═══════════════════════════════════════════════════════════════════════════════
 * 1. Payment Gateway Activation & Validation
 * 2. Sentinel Tier Activation (Tier 1, 2, 3)
 * 3. Revenue Split Calculation (50/50)
 * 4. Sovereign Identity Initialization
 * 5. Genesis Hash Validation
 * 6. Multi-Nation Revenue Routing
 * 7. Edge Cases and Error Handling
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import {
  SentinelAuthorityAPI,
  formatSentinelTier,
  formatRevenueSplit,
  validateGenesisHash,
  validateRootPairHash,
  getSentinelAuthorityMessage,
  getEnterpriseActivationMessage,
  TIER_1_PRICE_USD,
  TIER_2_PRICE_USD,
  TIER_3_ENTERPRISE_PRICE_USD,
  NATIONAL_ESCROW_SPLIT_BPS,
  CITIZEN_BLOCK_SPLIT_BPS,
  BPS_DENOMINATOR,
} from './SentinelAuthorityAPI.ts';

// ═══════════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`❌ FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    testsPassed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`❌ FAIL: ${message}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual: ${actual}`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    testsFailed++;
    console.error(`❌ FAIL: ${message} (expected to throw)`);
  } catch (error) {
    testsPassed++;
    console.log(`✅ PASS: ${message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🧪 SENTINEL AUTHORITY API - COMPREHENSIVE TEST SUITE\n');
console.log('═'.repeat(80));
console.log('MAPPING REVENUE. INITIALIZING SOVEREIGN IDENTITY. THE GENESIS BEGINS.');
console.log('═'.repeat(80));

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 1: PAYMENT GATEWAY ACTIVATION & VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📦 CATEGORY 1: Payment Gateway Activation & Validation\n');

const api = new SentinelAuthorityAPI();

// Test 1.1: Payment gateway should be inactive by default
const initialStats = api.getPaymentGatewayStats();
assertEqual(initialStats.gatewayActive, false, 'Payment gateway inactive by default');

// Test 1.2: Activate payment gateway
api.activatePaymentGateway();
const activeStats = api.getPaymentGatewayStats();
assertEqual(activeStats.gatewayActive, true, 'Payment gateway activated successfully');

// Test 1.3: Cannot activate already active gateway
assertThrows(
  () => api.activatePaymentGateway(),
  'Cannot activate already active payment gateway'
);

// Test 1.4: Deactivate payment gateway
api.deactivatePaymentGateway();
const deactivatedStats = api.getPaymentGatewayStats();
assertEqual(deactivatedStats.gatewayActive, false, 'Payment gateway deactivated successfully');

// Test 1.5: Cannot deactivate already inactive gateway
assertThrows(
  () => api.deactivatePaymentGateway(),
  'Cannot deactivate already inactive payment gateway'
);

// Reactivate for subsequent tests
api.activatePaymentGateway();

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 2: SENTINEL TIER ACTIVATION (TIER 1, 2, 3)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📦 CATEGORY 2: Sentinel Tier Activation (Tier 1, 2, 3)\n');

// Test 2.1: Activate Sentinel Tier 1 ($20 - 1 device)
const user1 = '0xUser1';
const result1 = api.activateSentinelTier(user1, 1, 'NGA');
assertEqual(result1.tier, 1, 'Tier 1 activation - tier number');
assertEqual(result1.priceUSD, TIER_1_PRICE_USD, 'Tier 1 activation - price');
assertEqual(result1.devices, 1n, 'Tier 1 activation - devices');
assertEqual(result1.iso3166Code, 'NGA', 'Tier 1 activation - country code');

// Test 2.2: Activate Sentinel Tier 2 ($50 - 3 devices)
const user2 = '0xUser2';
const result2 = api.activateSentinelTier(user2, 2, 'GHA');
assertEqual(result2.tier, 2, 'Tier 2 activation - tier number');
assertEqual(result2.priceUSD, TIER_2_PRICE_USD, 'Tier 2 activation - price');
assertEqual(result2.devices, 3n, 'Tier 2 activation - devices');
assertEqual(result2.iso3166Code, 'GHA', 'Tier 2 activation - country code');

// Test 2.3: Activate Sentinel Tier 3 Enterprise ($1,000 - 15 devices)
const user3 = '0xUser3';
const result3 = api.activateSentinelTier(user3, 3, 'KEN');
assertEqual(result3.tier, 3, 'Tier 3 Enterprise activation - tier number');
assertEqual(result3.priceUSD, TIER_3_ENTERPRISE_PRICE_USD, 'Tier 3 Enterprise activation - price');
assertEqual(result3.devices, 15n, 'Tier 3 Enterprise activation - devices');
assertEqual(result3.iso3166Code, 'KEN', 'Tier 3 Enterprise activation - country code');

// Test 2.4: Cannot activate tier for user who already has a tier
assertThrows(
  () => api.activateSentinelTier(user1, 2, 'NGA'),
  'Cannot activate tier for user who already has a tier'
);

// Test 2.5: Invalid tier number (0)
assertThrows(
  () => api.activateSentinelTier('0xUser4', 0, 'NGA'),
  'Invalid tier number (0)'
);

// Test 2.6: Invalid tier number (4)
assertThrows(
  () => api.activateSentinelTier('0xUser5', 4, 'NGA'),
  'Invalid tier number (4)'
);

// Test 2.7: Missing ISO 3166 code
assertThrows(
  () => api.activateSentinelTier('0xUser6', 1, ''),
  'Missing ISO 3166 code'
);

// Test 2.8: Get tier activations count
assertEqual(api.getTierActivations(1), 1n, 'Tier 1 activations count');
assertEqual(api.getTierActivations(2), 1n, 'Tier 2 activations count');
assertEqual(api.getTierActivations(3), 1n, 'Tier 3 activations count');

// Test 2.9: Get user Sentinel tier
const tier1Info = api.getUserSentinelTier(user1);
assertEqual(tier1Info.tier, 1, 'User 1 tier number');
assertEqual(tier1Info.priceUSD, TIER_1_PRICE_USD, 'User 1 tier price');
assertEqual(tier1Info.devices, 1n, 'User 1 tier devices');

// Test 2.10: Get Sentinel tier pricing
const pricing = api.getSentinelTierPricing();
assertEqual(pricing.tier1PriceUSD, 20n, 'Tier 1 pricing - $20');
assertEqual(pricing.tier1Devices, 1n, 'Tier 1 devices - 1');
assertEqual(pricing.tier2PriceUSD, 50n, 'Tier 2 pricing - $50');
assertEqual(pricing.tier2Devices, 3n, 'Tier 2 devices - 3');
assertEqual(pricing.tier3PriceUSD, 1000n, 'Tier 3 pricing - $1,000');
assertEqual(pricing.tier3Devices, 15n, 'Tier 3 devices - 15');

// Test 2.11: Check if user has Sentinel tier
assertEqual(api.hasSentinelTier(user1), true, 'User 1 has Sentinel tier');
assertEqual(api.hasSentinelTier('0xNonExistentUser'), false, 'Non-existent user has no tier');

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 3: REVENUE SPLIT CALCULATION (50/50)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📦 CATEGORY 3: Revenue Split Calculation (50/50)\n');

// Test 3.1: Tier 1 revenue split ($20 → $10 / $10)
assertEqual(result1.toNationalEscrow, 10n, 'Tier 1 - National Escrow ($10)');
assertEqual(result1.toCitizenBlock, 10n, 'Tier 1 - Citizen Block ($10)');

// Test 3.2: Tier 2 revenue split ($50 → $25 / $25)
assertEqual(result2.toNationalEscrow, 25n, 'Tier 2 - National Escrow ($25)');
assertEqual(result2.toCitizenBlock, 25n, 'Tier 2 - Citizen Block ($25)');

// Test 3.3: Tier 3 Enterprise revenue split ($1,000 → $500 / $500)
assertEqual(result3.toNationalEscrow, 500n, 'Tier 3 Enterprise - National Escrow ($500)');
assertEqual(result3.toCitizenBlock, 500n, 'Tier 3 Enterprise - Citizen Block ($500)');

// Test 3.4: Calculate revenue split for custom amount
const split100 = api.calculateRevenueSplit(100n);
assertEqual(split100.toNationalEscrow, 50n, 'Custom split $100 - National Escrow ($50)');
assertEqual(split100.toCitizenBlock, 50n, 'Custom split $100 - Citizen Block ($50)');

// Test 3.5: Get revenue split configuration
const splitConfig = api.getRevenueSplit();
assertEqual(splitConfig.nationalEscrowBps, 5000n, 'National Escrow BPS (5000 = 50%)');
assertEqual(splitConfig.citizenBlockBps, 5000n, 'Citizen Block BPS (5000 = 50%)');
assertEqual(splitConfig.description, '50% National Escrow / 50% Citizen Block', 'Split description');

// Test 3.6: Verify total revenue collected
const stats = api.getPaymentGatewayStats();
const expectedTotal = TIER_1_PRICE_USD + TIER_2_PRICE_USD + TIER_3_ENTERPRISE_PRICE_USD;
assertEqual(stats.totalRevenue, expectedTotal, 'Total revenue collected ($1,070)');

// Test 3.7: Verify total National Escrow allocated
const expectedNationalEscrow = 10n + 25n + 500n;
assertEqual(stats.totalToNationalEscrow, expectedNationalEscrow, 'Total National Escrow ($535)');

// Test 3.8: Verify total Citizen Block allocated
const expectedCitizenBlock = 10n + 25n + 500n;
assertEqual(stats.totalToCitizenBlock, expectedCitizenBlock, 'Total Citizen Block ($535)');

// Test 3.9: Verify 50/50 split integrity
assertEqual(
  stats.totalToNationalEscrow,
  stats.totalToCitizenBlock,
  '50/50 split integrity (National Escrow = Citizen Block)'
);

// Test 3.10: Verify total equals sum of splits
assertEqual(
  stats.totalRevenue,
  stats.totalToNationalEscrow + stats.totalToCitizenBlock,
  'Total revenue equals sum of splits'
);

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 4: SOVEREIGN IDENTITY INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📦 CATEGORY 4: Sovereign Identity Initialization\n');

// Test 4.1: Initialize Sovereign Identity with Genesis Hash
const genesisHash1 = '0x' + 'a'.repeat(64);
const rootPairHash1 = '0x' + 'b'.repeat(64);
const identityResult1 = api.initializeSovereignIdentity(user1, genesisHash1, rootPairHash1);
assertEqual(identityResult1.user, user1, 'Identity initialization - user address');
assertEqual(identityResult1.genesisHash, genesisHash1, 'Identity initialization - genesis hash');
assertEqual(identityResult1.rootPairHash, rootPairHash1, 'Identity initialization - root pair hash');

// Test 4.2: Get Sovereign Identity
const identity1 = api.getSovereignIdentity(user1);
assertEqual(identity1.genesisHash, genesisHash1, 'Get identity - genesis hash');
assertEqual(identity1.rootPairHash, rootPairHash1, 'Get identity - root pair hash');
assertEqual(identity1.initialized, true, 'Get identity - initialized status');

// Test 4.3: Check if user identity is initialized
assertEqual(api.isUserIdentityInitialized(user1), true, 'User 1 identity initialized');
assertEqual(api.isUserIdentityInitialized('0xNonExistentUser'), false, 'Non-existent user not initialized');

// Test 4.4: Cannot initialize already initialized identity
assertThrows(
  () => api.initializeSovereignIdentity(user1, genesisHash1, rootPairHash1),
  'Cannot initialize already initialized identity'
);

// Test 4.5: Invalid user address (empty)
assertThrows(
  () => api.initializeSovereignIdentity('', genesisHash1, rootPairHash1),
  'Invalid user address (empty)'
);

// Test 4.6: Invalid genesis hash (wrong length)
assertThrows(
  () => api.initializeSovereignIdentity(user2, '0x123', rootPairHash1),
  'Invalid genesis hash (wrong length)'
);

// Test 4.7: Invalid root pair hash (wrong length)
assertThrows(
  () => api.initializeSovereignIdentity(user2, genesisHash1, '0x456'),
  'Invalid root pair hash (wrong length)'
);

// Test 4.8: Initialize multiple identities
const genesisHash2 = '0x' + 'c'.repeat(64);
const rootPairHash2 = '0x' + 'd'.repeat(64);
api.initializeSovereignIdentity(user2, genesisHash2, rootPairHash2);
const identity2 = api.getSovereignIdentity(user2);
assertEqual(identity2.genesisHash, genesisHash2, 'User 2 genesis hash');
assertEqual(identity2.initialized, true, 'User 2 initialized');

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 5: GENESIS HASH VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📦 CATEGORY 5: Genesis Hash Validation\n');

// Test 5.1: Valid genesis hash (66 chars, starts with 0x)
const validHash = '0x' + 'a'.repeat(64);
assertEqual(validateGenesisHash(validHash), true, 'Valid genesis hash');

// Test 5.2: Invalid genesis hash (wrong length)
assertEqual(validateGenesisHash('0x123'), false, 'Invalid genesis hash (wrong length)');

// Test 5.3: Invalid genesis hash (missing 0x prefix)
assertEqual(validateGenesisHash('a'.repeat(64)), false, 'Invalid genesis hash (missing 0x)');

// Test 5.4: Valid root pair hash
const validRootPair = '0x' + 'b'.repeat(64);
assertEqual(validateRootPairHash(validRootPair), true, 'Valid root pair hash');

// Test 5.5: Invalid root pair hash (wrong length)
assertEqual(validateRootPairHash('0x456'), false, 'Invalid root pair hash (wrong length)');

// Test 5.6: Invalid root pair hash (missing 0x prefix)
assertEqual(validateRootPairHash('b'.repeat(64)), false, 'Invalid root pair hash (missing 0x)');

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 6: MULTI-NATION REVENUE ROUTING
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📦 CATEGORY 6: Multi-Nation Revenue Routing\n');

// Test 6.1: Nigeria (NGA) routing
assertEqual(result1.iso3166Code, 'NGA', 'Nigeria routing - ISO code');

// Test 6.2: Ghana (GHA) routing
assertEqual(result2.iso3166Code, 'GHA', 'Ghana routing - ISO code');

// Test 6.3: Kenya (KEN) routing
assertEqual(result3.iso3166Code, 'KEN', 'Kenya routing - ISO code');

// Test 6.4: South Africa (ZAF) routing
const userZAF = '0xUserZAF';
const resultZAF = api.activateSentinelTier(userZAF, 3, 'ZAF');
assertEqual(resultZAF.iso3166Code, 'ZAF', 'South Africa routing - ISO code');
assertEqual(resultZAF.toNationalEscrow, 500n, 'South Africa - National Escrow ($500)');

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 7: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📦 CATEGORY 7: Utility Functions\n');

// Test 7.1: Format Sentinel tier
assertEqual(formatSentinelTier(1), 'Tier 1 ($20 - 1 device)', 'Format Tier 1');
assertEqual(formatSentinelTier(2), 'Tier 2 ($50 - 3 devices)', 'Format Tier 2');
assertEqual(formatSentinelTier(3), 'Tier 3 Enterprise ($1,000 - 15 devices)', 'Format Tier 3');
assertEqual(formatSentinelTier(0), 'No Tier', 'Format No Tier');

// Test 7.2: Format revenue split
const splitStr = formatRevenueSplit(1000n);
assert(splitStr.includes('$1000'), 'Format revenue split - total');
assert(splitStr.includes('$500'), 'Format revenue split - splits');

// Test 7.3: Get Sentinel Authority message
const message = getSentinelAuthorityMessage();
assertEqual(
  message,
  'MAPPING REVENUE. INITIALIZING SOVEREIGN IDENTITY. THE GENESIS BEGINS.',
  'Sentinel Authority message'
);

// Test 7.4: Get Enterprise activation message
const enterpriseMsg = getEnterpriseActivationMessage();
assert(enterpriseMsg.includes('$500'), 'Enterprise activation message - amounts');
assert(enterpriseMsg.includes('10% SPLIT'), 'Enterprise activation message - split reference');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(80));
console.log('TEST SUMMARY');
console.log('═'.repeat(80));
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
console.log(`📈 Pass Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
console.log('═'.repeat(80));

if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! 🎉');
  console.log('\n✅ SENTINEL AUTHORITY API INTEGRATED. REVENUE MAPPED. SOVEREIGN IDENTITY INITIALIZED. THE GENESIS BEGINS.\n');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED. PLEASE REVIEW.\n');
  process.exit(1);
}

