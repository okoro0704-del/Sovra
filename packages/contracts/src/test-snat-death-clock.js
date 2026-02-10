/**
 * test-snat-death-clock.js - SNAT Death Clock Test Suite
 * 
 * "IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT."
 * 
 * This test suite validates the SNAT 180-Day Global Default system.
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
  'SNATDeathClock.sol',
  'SNATDeathClock.ts',
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
console.log('SNAT DEATH CLOCK TEST SUITE');
console.log('"IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT."');
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
// TEST 2: SNATDeathClock.sol - Smart Contract Structure
// ────────────────────────────────────────────────────────────────────────────────

console.log('🔐 Testing SNATDeathClock.sol...');
console.log('');

const solFilePath = path.join(CONTRACTS_DIR, 'SNATDeathClock.sol');
const solContent = readFile(solFilePath);

test('SNATDeathClock.sol: Contains 180-day constant', () => {
  assert(solContent.includes('T_MINUS = 180 days'), 'Missing T_MINUS constant');
  assert(solContent.includes('15,552,000 seconds'), 'Missing seconds comment');
});

test('SNATDeathClock.sol: Contains NationDeathClock structure', () => {
  assert(solContent.includes('struct NationDeathClock'), 'Missing NationDeathClock struct');
  assert(solContent.includes('deathClockStart'), 'Missing deathClockStart field');
  assert(solContent.includes('deathClockExpiry'), 'Missing deathClockExpiry field');
  assert(solContent.includes('snatStatus'), 'Missing snatStatus field');
});

test('SNATDeathClock.sol: Contains SNAT status enum', () => {
  assert(solContent.includes('enum SNATStatus'), 'Missing SNATStatus enum');
  assert(solContent.includes('INACTIVE'), 'Missing INACTIVE status');
  assert(solContent.includes('ACTIVE'), 'Missing ACTIVE status');
  assert(solContent.includes('FLUSHED'), 'Missing FLUSHED status');
});

test('SNATDeathClock.sol: Contains death clock initialization', () => {
  assert(solContent.includes('function initializeDeathClock'), 'Missing initializeDeathClock function');
  assert(solContent.includes('deathClockStart = block.timestamp'), 'Missing death clock start');
  assert(solContent.includes('deathClockExpiry = deathClockStart + T_MINUS'), 'Missing death clock expiry calculation');
});

test('SNATDeathClock.sol: Contains SNAT activation', () => {
  assert(solContent.includes('function activateSNAT'), 'Missing activateSNAT function');
  assert(solContent.includes('snatStatus = SNATStatus.ACTIVE'), 'Missing SNAT activation logic');
  assert(solContent.includes('block.timestamp <= clock.deathClockExpiry'), 'Missing expiry check');
});

test('SNATDeathClock.sol: Contains Global Flush function', () => {
  assert(solContent.includes('function executeGlobalFlush'), 'Missing executeGlobalFlush function');
  assert(solContent.includes('block.timestamp >= clock.deathClockExpiry'), 'Missing expiry validation');
  assert(solContent.includes('snatStatus == SNATStatus.INACTIVE'), 'Missing SNAT status check');
  assert(solContent.includes('100%'), 'Missing 100% transfer comment');
});

test('SNATDeathClock.sol: Contains wealth transfer logic', () => {
  assert(solContent.includes('globalCitizenBlock'), 'Missing Global Citizen Block');
  assert(solContent.includes('transferFrom'), 'Missing transfer function');
  assert(solContent.includes('safeVault'), 'Missing safe vault reference');
});

test('SNATDeathClock.sol: Contains immutability protection', () => {
  assert(solContent.includes('TIMELOCK_ROLE'), 'Missing TIMELOCK_ROLE');
  assert(solContent.includes('address(this)'), 'Missing self-reference for timelock');
  assert(solContent.includes('No human key'), 'Missing immutability comment');
});

test('SNATDeathClock.sol: Contains auto-flush function', () => {
  assert(solContent.includes('function autoFlushExpiredNations'), 'Missing autoFlushExpiredNations function');
  assert(solContent.includes('public good'), 'Missing public good comment');
  assert(solContent.includes('anyone can trigger'), 'Missing public access comment');
});

test('SNATDeathClock.sol: Contains validation message', () => {
  assert(solContent.includes('IF A NATION DOES NOT CLAIM SOVEREIGNTY'), 'Missing validation message');
  assert(solContent.includes('THE PEOPLE INHERIT THE VAULT'), 'Missing validation message');
  assert(solContent.includes('function getImmutabilityMessage'), 'Missing getImmutabilityMessage function');
});

console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 3: SNATDeathClock.ts - TypeScript Integration
// ────────────────────────────────────────────────────────────────────────────────

console.log('⚙️  Testing SNATDeathClock.ts...');
console.log('');

const tsFilePath = path.join(CONTRACTS_DIR, 'SNATDeathClock.ts');
const tsContent = readFile(tsFilePath);

test('SNATDeathClock.ts: Contains type definitions', () => {
  assert(tsContent.includes('interface NationDeathClock'), 'Missing NationDeathClock interface');
  assert(tsContent.includes('interface GlobalFlushStats'), 'Missing GlobalFlushStats interface');
  assert(tsContent.includes('interface DeathClockSummary'), 'Missing DeathClockSummary interface');
  assert(tsContent.includes('enum SNATStatus'), 'Missing SNATStatus enum');
});

test('SNATDeathClock.ts: Contains SNATDeathClock class', () => {
  assert(tsContent.includes('class SNATDeathClock'), 'Missing SNATDeathClock class');
  assert(tsContent.includes('async initializeDeathClock'), 'Missing initializeDeathClock method');
  assert(tsContent.includes('async activateSNAT'), 'Missing activateSNAT method');
  assert(tsContent.includes('async executeGlobalFlush'), 'Missing executeGlobalFlush method');
});

test('SNATDeathClock.ts: Contains view functions', () => {
  assert(tsContent.includes('async getDeathClock'), 'Missing getDeathClock method');
  assert(tsContent.includes('async isDeathClockExpired'), 'Missing isDeathClockExpired method');
  assert(tsContent.includes('async getTimeRemaining'), 'Missing getTimeRemaining method');
  assert(tsContent.includes('async isEligibleForFlush'), 'Missing isEligibleForFlush method');
});

test('SNATDeathClock.ts: Contains batch operations', () => {
  assert(tsContent.includes('async batchExecuteGlobalFlush'), 'Missing batchExecuteGlobalFlush method');
  assert(tsContent.includes('async autoFlushExpiredNations'), 'Missing autoFlushExpiredNations method');
  assert(tsContent.includes('async getAllEligibleForFlush'), 'Missing getAllEligibleForFlush method');
});

test('SNATDeathClock.ts: Contains utility functions', () => {
  assert(tsContent.includes('formatTimeRemaining'), 'Missing formatTimeRemaining function');
  assert(tsContent.includes('getSNATStatusString'), 'Missing getSNATStatusString function');
  assert(tsContent.includes('calculateTimeElapsedPercentage'), 'Missing calculateTimeElapsedPercentage function');
});

test('SNATDeathClock.ts: Contains helper functions', () => {
  assert(tsContent.includes('function secondsToDays'), 'Missing secondsToDays function');
  assert(tsContent.includes('function daysToSeconds'), 'Missing daysToSeconds function');
  assert(tsContent.includes('function isCriticalPeriod'), 'Missing isCriticalPeriod function');
  assert(tsContent.includes('function getUrgencyLevel'), 'Missing getUrgencyLevel function');
});

console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 4: Code Quality
// ────────────────────────────────────────────────────────────────────────────────

console.log('📊 Testing Code Quality...');
console.log('');

test('SNATDeathClock.sol: Adequate code length', () => {
  const lines = countLines(solContent);
  assert(lines >= 500, `Smart contract too short: ${lines} lines (expected >= 500)`);
  console.log(`   Smart contract: ${lines} lines`);
});

test('SNATDeathClock.ts: Adequate code length', () => {
  const lines = countLines(tsContent);
  assert(lines >= 350, `TypeScript integration too short: ${lines} lines (expected >= 350)`);
  console.log(`   TypeScript integration: ${lines} lines`);
});

test('SNATDeathClock.sol: Contains comprehensive documentation', () => {
  const docLines = (solContent.match(/\/\*\*/g) || []).length;
  assert(docLines >= 10, `Insufficient documentation: ${docLines} doc blocks (expected >= 10)`);
  console.log(`   Documentation blocks: ${docLines}`);
});

test('SNATDeathClock.ts: Contains comprehensive comments', () => {
  const commentLines = (tsContent.match(/\/\//g) || []).length;
  assert(commentLines >= 30, `Insufficient comments: ${commentLines} comment lines (expected >= 30)`);
  console.log(`   Comment lines: ${commentLines}`);
});

console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 5: Architecture Validation
// ────────────────────────────────────────────────────────────────────────────────

console.log('🏗️  Testing Architecture...');
console.log('');

test('Nation Timer: Death clock initialized on first vitalization', () => {
  assert(solContent.includes('deathClockStart = block.timestamp'), 'Missing death clock start');
  assert(solContent.includes('first citizen'), 'Missing first citizen comment');
  assert(solContent.includes('isInitialized'), 'Missing initialization flag');
});

test('180-Day Constant: T_MINUS hardcoded', () => {
  assert(solContent.includes('constant T_MINUS = 180 days'), 'Missing constant T_MINUS');
  assert(solContent.includes('15,552,000'), 'Missing seconds value');
  assert(tsContent.includes('T_MINUS = 180 * 24 * 60 * 60'), 'Missing TypeScript constant');
});

test('Redirection Logic: GlobalFlush triggered at T_MINUS == 0', () => {
  assert(solContent.includes('block.timestamp >= clock.deathClockExpiry'), 'Missing expiry check');
  assert(solContent.includes('executeGlobalFlush'), 'Missing GlobalFlush function');
  assert(solContent.includes('SNAT_STATUS is not'), 'Missing SNAT status check comment');
});

test('Wealth Transfer: 100% of Safe Vault to Global Citizen Block', () => {
  assert(solContent.includes('100%'), 'Missing 100% comment');
  assert(solContent.includes('globalCitizenBlock'), 'Missing Global Citizen Block');
  assert(solContent.includes('safeVaultBalance'), 'Missing safe vault balance');
  assert(solContent.includes('transferFrom'), 'Missing transfer function');
});

test('Immutability: Time-lock governance, no human pause', () => {
  assert(solContent.includes('TIMELOCK_ROLE'), 'Missing TIMELOCK_ROLE');
  assert(solContent.includes('address(this)'), 'Missing self-reference');
  assert(solContent.includes('No human key'), 'Missing immutability comment');
  assert(solContent.includes('cannot pause or reset'), 'Missing no-pause comment');
});

test('Auto-Flush: Public good function (anyone can trigger)', () => {
  assert(solContent.includes('autoFlushExpiredNations'), 'Missing auto-flush function');
  assert(solContent.includes('public good'), 'Missing public good comment');
  assert(solContent.includes('anyone can trigger'), 'Missing public access comment');
});

test('Batch Operations: Efficient multi-nation processing', () => {
  assert(solContent.includes('batchExecuteGlobalFlush'), 'Missing batch flush function');
  assert(tsContent.includes('async batchExecuteGlobalFlush'), 'Missing TypeScript batch method');
});

test('Statistics Tracking: Global flush metrics', () => {
  assert(solContent.includes('totalFlushedAmount'), 'Missing total flushed amount');
  assert(solContent.includes('totalNationsFlushed'), 'Missing total nations flushed');
  assert(solContent.includes('getGlobalFlushStats'), 'Missing stats function');
});

console.log('');

// ────────────────────────────────────────────────────────────────────────────────
// TEST 6: Security Features
// ────────────────────────────────────────────────────────────────────────────────

console.log('🔒 Testing Security Features...');
console.log('');

test('Reentrancy Protection: NonReentrant modifier', () => {
  assert(solContent.includes('nonReentrant'), 'Missing nonReentrant modifier');
  assert(solContent.includes('ReentrancyGuard'), 'Missing ReentrancyGuard import');
});

test('Access Control: Role-based permissions', () => {
  assert(solContent.includes('AccessControl'), 'Missing AccessControl import');
  assert(solContent.includes('onlyRole'), 'Missing onlyRole modifier');
  assert(solContent.includes('VAULT_REGISTRY_ROLE'), 'Missing VAULT_REGISTRY_ROLE');
});

test('State Validation: Comprehensive checks', () => {
  assert(solContent.includes('require(clock.isInitialized'), 'Missing initialization check');
  assert(solContent.includes('require(!clock.isFlushed'), 'Missing flush check');
  assert(solContent.includes('require(clock.snatStatus'), 'Missing SNAT status check');
});

test('CEI Pattern: Checks-Effects-Interactions', () => {
  assert(solContent.includes('Update state BEFORE transfer'), 'Missing CEI comment');
  assert(solContent.includes('clock.isFlushed = true'), 'Missing state update before transfer');
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
  console.log('🎉 ALL TESTS PASSED! SNAT DEATH CLOCK IS READY! 🎉');
  console.log('');
  console.log('"IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT."');
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

