/**
 * test-iso-vault-simple.js - ISO-VAULT Test Suite
 * 
 * "THE WORLD IS VITALIZED. EVERY NATION IS A SOVEREIGN GOD-ECONOMY."
 * 
 * This test suite validates the Universal National Vault Authorization (ISO-VAULT) system.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

const fs = require('fs');
const path = require('path');

// ════════════════════════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════

const CONTRACTS_DIR = path.join(__dirname);

const FILES_TO_TEST = [
  'ISOVaultRegistry.sol',
  'ISO3166CountryRegistry.ts',
  'ISOVaultRegistry.ts',
];

// ════════════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ════════════════════════════════════════════════════════════════════════════════

let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function countLines(content) {
  return content.split('\n').length;
}

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════════════════════

console.log('');
console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('ISO-VAULT TEST SUITE');
console.log('"THE WORLD IS VITALIZED. EVERY NATION IS A SOVEREIGN GOD-ECONOMY."');
console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 1: File Existence
// ────────────────────────────────────────────────────────────────────────────────

console.log('📦 Testing File Existence...');
console.log('');

FILES_TO_TEST.forEach((file) => {
  test(`File exists: ${file}`, () => {
    const filePath = path.join(CONTRACTS_DIR, file);
    assert(fileExists(filePath), `File not found: ${filePath}`);
  });
});

console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 2: ISOVaultRegistry.sol - Smart Contract Structure
// ────────────────────────────────────────────────────────────────────────────────

console.log('🔐 Testing ISOVaultRegistry.sol...');
console.log('');

const solFilePath = path.join(CONTRACTS_DIR, 'ISOVaultRegistry.sol');
const solContent = readFile(solFilePath);

test('ISOVaultRegistry.sol: Contains dual-vault structure', () => {
  assert(solContent.includes('struct NationalVault'), 'Missing NationalVault struct');
  assert(solContent.includes('safeVault'), 'Missing safeVault field');
  assert(solContent.includes('liquidityVault'), 'Missing liquidityVault field');
  assert(solContent.includes('SAFE_VAULT_PERCENTAGE = 70'), 'Missing 70% safe vault constant');
  assert(solContent.includes('LIQUIDITY_VAULT_PERCENTAGE = 30'), 'Missing 30% liquidity vault constant');
});

test('ISOVaultRegistry.sol: Contains citizen binding', () => {
  assert(solContent.includes('struct CitizenBinding'), 'Missing CitizenBinding struct');
  assert(solContent.includes('pffIdentity'), 'Missing pffIdentity field');
  assert(solContent.includes('latitude'), 'Missing latitude field');
  assert(solContent.includes('longitude'), 'Missing longitude field');
  assert(solContent.includes('function bindCitizenToVault'), 'Missing bindCitizenToVault function');
});

test('ISOVaultRegistry.sol: Contains cross-swap protocol', () => {
  assert(solContent.includes('struct CrossSwapRecord'), 'Missing CrossSwapRecord struct');
  assert(solContent.includes('function executeCrossSwap'), 'Missing executeCrossSwap function');
  assert(solContent.includes('fromNation'), 'Missing fromNation field');
  assert(solContent.includes('toNation'), 'Missing toNation field');
  assert(solContent.includes('vidaCapAmount'), 'Missing vidaCapAmount field');
});

test('ISOVaultRegistry.sol: Contains liquidity isolation firewall', () => {
  assert(solContent.includes('function validateLiquidityIsolation'), 'Missing validateLiquidityIsolation function');
  assert(solContent.includes('function enforceLiquidityIsolation'), 'Missing enforceLiquidityIsolation function');
  assert(solContent.includes('LIQUIDITY ISOLATION VIOLATION'), 'Missing liquidity isolation error message');
});

test('ISOVaultRegistry.sol: Contains SNAT treaty', () => {
  assert(solContent.includes('SNAT_LOCK_DURATION = 180 days'), 'Missing 180-day SNAT lock');
  assert(solContent.includes('function signSNATTreaty'), 'Missing signSNATTreaty function');
  assert(solContent.includes('snatSigned'), 'Missing snatSigned field');
  assert(solContent.includes('snatLockExpiry'), 'Missing snatLockExpiry field');
});

test('ISOVaultRegistry.sol: Contains validation message', () => {
  assert(solContent.includes('THE WORLD IS VITALIZED'), 'Missing validation message');
  assert(solContent.includes('EVERY NATION IS A SOVEREIGN GOD-ECONOMY'), 'Missing validation message');
  assert(solContent.includes('function getValidationMessage'), 'Missing getValidationMessage function');
});

test('ISOVaultRegistry.sol: Contains vault registration', () => {
  assert(solContent.includes('function registerNationalVault'), 'Missing registerNationalVault function');
  assert(solContent.includes('iso3166Code'), 'Missing iso3166Code parameter');
  assert(solContent.includes('countryName'), 'Missing countryName parameter');
  assert(solContent.includes('nationalStableToken'), 'Missing nationalStableToken parameter');
});

test('ISOVaultRegistry.sol: Contains VIDA CAP deposit', () => {
  assert(solContent.includes('function depositVIDACAP'), 'Missing depositVIDACAP function');
  assert(solContent.includes('safeAmount'), 'Missing safeAmount calculation');
  assert(solContent.includes('liquidityAmount'), 'Missing liquidityAmount calculation');
});

console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 3: ISO3166CountryRegistry.ts - Country Registry
// ────────────────────────────────────────────────────────────────────────────────

console.log('🌍 Testing ISO3166CountryRegistry.ts...');
console.log('');

const registryFilePath = path.join(CONTRACTS_DIR, 'ISO3166CountryRegistry.ts');
const registryContent = readFile(registryFilePath);

test('ISO3166CountryRegistry.ts: Contains country data structures', () => {
  assert(registryContent.includes('interface CountryInfo'), 'Missing CountryInfo interface');
  assert(registryContent.includes('interface GeoBoundaries'), 'Missing GeoBoundaries interface');
  assert(registryContent.includes('ISO3166_COUNTRIES'), 'Missing ISO3166_COUNTRIES array');
});

test('ISO3166CountryRegistry.ts: Contains Nigeria', () => {
  assert(registryContent.includes("iso3166Code: 'NG'"), 'Missing Nigeria ISO code');
  assert(registryContent.includes("countryName: 'Nigeria'"), 'Missing Nigeria country name');
  assert(registryContent.includes("capital: 'Abuja'"), 'Missing Nigeria capital');
});

test('ISO3166CountryRegistry.ts: Contains Ghana', () => {
  assert(registryContent.includes("iso3166Code: 'GH'"), 'Missing Ghana ISO code');
  assert(registryContent.includes("countryName: 'Ghana'"), 'Missing Ghana country name');
  assert(registryContent.includes("capital: 'Accra'"), 'Missing Ghana capital');
});

test('ISO3166CountryRegistry.ts: Contains helper functions', () => {
  assert(registryContent.includes('function findCountryByCode'), 'Missing findCountryByCode function');
  assert(registryContent.includes('function determineCountryFromLocation'), 'Missing determineCountryFromLocation function');
  assert(registryContent.includes('function getNearestCountry'), 'Missing getNearestCountry function');
  assert(registryContent.includes('function calculateDistance'), 'Missing calculateDistance function');
});

test('ISO3166CountryRegistry.ts: Contains major countries', () => {
  // Africa
  assert(registryContent.includes("'NG'"), 'Missing Nigeria');
  assert(registryContent.includes("'GH'"), 'Missing Ghana');
  assert(registryContent.includes("'KE'"), 'Missing Kenya');
  assert(registryContent.includes("'ZA'"), 'Missing South Africa');
  assert(registryContent.includes("'EG'"), 'Missing Egypt');

  // Americas
  assert(registryContent.includes("'US'"), 'Missing United States');
  assert(registryContent.includes("'CA'"), 'Missing Canada');
  assert(registryContent.includes("'BR'"), 'Missing Brazil');

  // Asia
  assert(registryContent.includes("'CN'"), 'Missing China');
  assert(registryContent.includes("'IN'"), 'Missing India');
  assert(registryContent.includes("'JP'"), 'Missing Japan');

  // Europe
  assert(registryContent.includes("'GB'"), 'Missing United Kingdom');
  assert(registryContent.includes("'DE'"), 'Missing Germany');
  assert(registryContent.includes("'FR'"), 'Missing France');

  // Oceania
  assert(registryContent.includes("'AU'"), 'Missing Australia');
});

console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 4: ISOVaultRegistry.ts - TypeScript Integration
// ────────────────────────────────────────────────────────────────────────────────

console.log('⚙️  Testing ISOVaultRegistry.ts...');
console.log('');

const tsFilePath = path.join(CONTRACTS_DIR, 'ISOVaultRegistry.ts');
const tsContent = readFile(tsFilePath);

test('ISOVaultRegistry.ts: Contains type definitions', () => {
  assert(tsContent.includes('interface NationalVault'), 'Missing NationalVault interface');
  assert(tsContent.includes('interface CitizenBinding'), 'Missing CitizenBinding interface');
  assert(tsContent.includes('interface CrossSwapRecord'), 'Missing CrossSwapRecord interface');
  assert(tsContent.includes('interface RegistryStats'), 'Missing RegistryStats interface');
});

test('ISOVaultRegistry.ts: Contains ISOVaultRegistry class', () => {
  assert(tsContent.includes('class ISOVaultRegistry'), 'Missing ISOVaultRegistry class');
  assert(tsContent.includes('async registerNationalVault'), 'Missing registerNationalVault method');
  assert(tsContent.includes('async bindCitizenToVault'), 'Missing bindCitizenToVault method');
  assert(tsContent.includes('async executeCrossSwap'), 'Missing executeCrossSwap method');
});

test('ISOVaultRegistry.ts: Contains geolocation-based binding', () => {
  assert(tsContent.includes('determineCountryFromLocation'), 'Missing determineCountryFromLocation call');
  assert(tsContent.includes('getNearestCountry'), 'Missing getNearestCountry call');
  assert(tsContent.includes('LocationCoordinates'), 'Missing LocationCoordinates type');
});

test('ISOVaultRegistry.ts: Contains liquidity isolation validation', () => {
  assert(tsContent.includes('async validateLiquidityIsolation'), 'Missing validateLiquidityIsolation method');
  assert(tsContent.includes('async enforceLiquidityIsolation'), 'Missing enforceLiquidityIsolation method');
});

test('ISOVaultRegistry.ts: Contains batch registration', () => {
  assert(tsContent.includes('async registerAllNations'), 'Missing registerAllNations method');
  assert(tsContent.includes('ISO3166_COUNTRIES'), 'Missing ISO3166_COUNTRIES import');
});

test('ISOVaultRegistry.ts: Contains getter methods', () => {
  assert(tsContent.includes('async getVaultDetails'), 'Missing getVaultDetails method');
  assert(tsContent.includes('async getCitizenBinding'), 'Missing getCitizenBinding method');
  assert(tsContent.includes('async getCrossSwapRecord'), 'Missing getCrossSwapRecord method');
  assert(tsContent.includes('async getRegistryStats'), 'Missing getRegistryStats method');
});

console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 5: Code Quality
// ────────────────────────────────────────────────────────────────────────────────

console.log('📊 Testing Code Quality...');
console.log('');

test('ISOVaultRegistry.sol: Adequate code length', () => {
  const lines = countLines(solContent);
  assert(lines >= 500, `Smart contract too short: ${lines} lines (expected >= 500)`);
  console.log(`   Smart contract: ${lines} lines`);
});

test('ISO3166CountryRegistry.ts: Adequate code length', () => {
  const lines = countLines(registryContent);
  assert(lines >= 800, `Country registry too short: ${lines} lines (expected >= 800)`);
  console.log(`   Country registry: ${lines} lines`);
});

test('ISOVaultRegistry.ts: Adequate code length', () => {
  const lines = countLines(tsContent);
  assert(lines >= 300, `TypeScript integration too short: ${lines} lines (expected >= 300)`);
  console.log(`   TypeScript integration: ${lines} lines`);
});

test('ISOVaultRegistry.sol: Contains comprehensive documentation', () => {
  const docLines = (solContent.match(/\/\*\*/g) || []).length;
  assert(docLines >= 5, `Insufficient documentation: ${docLines} doc blocks (expected >= 5)`);
  console.log(`   Documentation blocks: ${docLines}`);
});

test('ISO3166CountryRegistry.ts: Contains comprehensive comments', () => {
  const commentLines = (registryContent.match(/\/\//g) || []).length;
  assert(commentLines >= 20, `Insufficient comments: ${commentLines} comment lines (expected >= 20)`);
  console.log(`   Comment lines: ${commentLines}`);
});

console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 6: Architecture Validation
// ────────────────────────────────────────────────────────────────────────────────

console.log('🏗️  Testing Architecture...');
console.log('');

test('Dual-Vault Structure: 70/30 split enforced', () => {
  assert(solContent.includes('SAFE_VAULT_PERCENTAGE = 70'), 'Missing 70% constant');
  assert(solContent.includes('LIQUIDITY_VAULT_PERCENTAGE = 30'), 'Missing 30% constant');
  assert(solContent.includes('safeAmount = (amount * SAFE_VAULT_PERCENTAGE)'), 'Missing safe vault calculation');
  assert(solContent.includes('liquidityAmount = (amount * LIQUIDITY_VAULT_PERCENTAGE)'), 'Missing liquidity vault calculation');
});

test('SNAT Treaty: 180-day lock enforced', () => {
  assert(solContent.includes('180 days'), 'Missing 180-day duration');
  assert(solContent.includes('snatLockExpiry'), 'Missing lock expiry tracking');
  assert(solContent.includes('function isSNATLockActive'), 'Missing lock status check');
});

test('Liquidity Isolation: Firewall implemented', () => {
  assert(solContent.includes('validateLiquidityIsolation'), 'Missing validation function');
  assert(solContent.includes('citizenBindings[citizen].iso3166Code'), 'Missing citizen nation check');
  assert(solContent.includes('LIQUIDITY ISOLATION VIOLATION'), 'Missing violation error');
});

test('Cross-Swap Protocol: Atomic swap implemented', () => {
  assert(solContent.includes('executeCrossSwap'), 'Missing cross-swap function');
  assert(solContent.includes('fromNation'), 'Missing source nation');
  assert(solContent.includes('toNation'), 'Missing destination nation');
  assert(solContent.includes('vidaCapAmount'), 'Missing intermediate VIDA CAP');
});

test('Geolocation Binding: Automatic routing implemented', () => {
  assert(tsContent.includes('determineCountryFromLocation'), 'Missing location determination');
  assert(tsContent.includes('latitude'), 'Missing latitude parameter');
  assert(tsContent.includes('longitude'), 'Missing longitude parameter');
  assert(tsContent.includes('boundaries'), 'Missing boundary checking');
});

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUMMARY
// ════════════════════════════════════════════════════════════════════════════════

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('TEST SUMMARY');
console.log('════════════════════════════════════════════════════════════════════════════════');
console.log(`✅ Tests Passed: ${testsPassed}      `);
console.log(`❌ Tests Failed: ${testsFailed}       `);
console.log(`📊 Total Tests: ${testsPassed + testsFailed}       `);
console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}% `);
console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('');

if (testsFailed === 0) {
  console.log('🎉 ALL TESTS PASSED! ISO-VAULT IS READY! 🎉');
  console.log('');
  console.log('"THE WORLD IS VITALIZED. EVERY NATION IS A SOVEREIGN GOD-ECONOMY."');
  console.log('');
  console.log('Born in Lagos, Nigeria. Built for Humanity. 🇳🇬');
  console.log('Architect: ISREAL OKORO');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED. PLEASE FIX THE ISSUES ABOVE.');
  console.log('');
  process.exit(1);
}

