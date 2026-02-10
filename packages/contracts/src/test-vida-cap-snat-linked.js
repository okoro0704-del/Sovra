/**
 * test-vida-cap-snat-linked.js - Test Suite for SNAT-Linked VIDA Cap Minting
 * 
 * "IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT."
 * 
 * This test suite validates the SNAT-Linked VIDA Cap Minting implementation.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════════════════════
// MOCK CONTRACTS
// ════════════════════════════════════════════════════════════════════════════════

class MockSNATDeathClock {
  constructor() {
    this.nationDeathClocks = new Map();
  }

  initializeDeathClock(iso3166Code, countryName, safeVault) {
    const now = Math.floor(Date.now() / 1000);
    const T_MINUS = 180 * 24 * 60 * 60; // 180 days in seconds

    this.nationDeathClocks.set(iso3166Code, {
      iso3166Code,
      countryName,
      deathClockStart: now,
      deathClockExpiry: now + T_MINUS,
      safeVault,
      safeVaultBalance: 0n,
      snatStatus: 0, // INACTIVE
      isInitialized: true,
      isFlushed: false,
      flushTimestamp: 0,
      flushTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });
  }

  activateSNAT(iso3166Code) {
    const clock = this.nationDeathClocks.get(iso3166Code);
    if (clock) {
      clock.snatStatus = 1; // ACTIVE
    }
  }

  flushNation(iso3166Code) {
    const clock = this.nationDeathClocks.get(iso3166Code);
    if (clock) {
      clock.snatStatus = 2; // FLUSHED
      clock.isFlushed = true;
    }
  }

  getDeathClock(iso3166Code) {
    const clock = this.nationDeathClocks.get(iso3166Code);
    if (!clock) {
      return {
        iso3166Code: '',
        countryName: '',
        deathClockStart: 0,
        deathClockExpiry: 0,
        safeVault: '0x0000000000000000000000000000000000000000',
        safeVaultBalance: 0n,
        snatStatus: 0,
        isInitialized: false,
        isFlushed: false,
        flushTimestamp: 0,
        flushTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
    }
    return clock;
  }
}

class MockVidaCapSNATLinked {
  constructor(architect, nationalEscrow, globalCitizenBlock, snatDeathClock) {
    this.architect = architect;
    this.nationalEscrow = nationalEscrow;
    this.globalCitizenBlock = globalCitizenBlock;
    this.snatDeathClock = snatDeathClock;
    this.currentEra = 0; // TEN_UNIT_ERA
    
    this.balances = new Map();
    this.usedPFFSignatures = new Set();
    this.isVerifiedCitizen = new Map();
    this.nationEscrows = new Map();
    
    this.totalVerifiedCitizens = 0;
    this.totalPFFHandshakes = 0;
    this.totalSNATActiveMints = 0;
    this.totalSNATInactiveMints = 0;
    this.totalSNATFlushedMints = 0;
    this.totalGlobalPoolAllocations = 0n;
    
    // Genesis mint
    this.balances.set(architect, 5n * 10n**18n);
    this.balances.set(nationalEscrow, 5n * 10n**18n);
    this.totalSupply = 10n * 10n**18n;
    
    this.events = [];
  }

  getBalance(address) {
    return this.balances.get(address) || 0n;
  }

  _mint(address, amount) {
    const currentBalance = this.balances.get(address) || 0n;
    this.balances.set(address, currentBalance + amount);
    this.totalSupply += amount;
  }

  registerNationEscrow(iso3166Code, escrowAddress) {
    this.nationEscrows.set(iso3166Code, escrowAddress);
    this.events.push({
      type: 'NationEscrowRegistered',
      iso3166Code,
      escrowAddress,
    });
  }

  mintOnPFFHandshake(citizen, pffSignature, pffHash, iso3166Code) {
    // Validation
    if (this.usedPFFSignatures.has(pffSignature)) {
      throw new Error('PFF signature already used');
    }

    // Mark signature as used
    this.usedPFFSignatures.add(pffSignature);

    // Verify citizen if first handshake
    if (!this.isVerifiedCitizen.get(citizen)) {
      this.isVerifiedCitizen.set(citizen, true);
      this.totalVerifiedCitizens++;
    }

    // Check SNAT status
    const deathClock = this.snatDeathClock.getDeathClock(iso3166Code);
    const snatStatus = deathClock.snatStatus;

    // Determine mint amounts
    const baseCitizenAmount = this.currentEra === 0 ? 5n * 10n**18n : 1n * 10n**18n;
    const baseNationAmount = this.currentEra === 0 ? 5n * 10n**18n : 1n * 10n**18n;

    const citizenAmount = baseCitizenAmount;
    let nationAmount = 0n;
    let globalPoolAmount = 0n;

    if (snatStatus === 1) {
      // ACTIVE: Full nation allocation
      nationAmount = baseNationAmount;
      this.totalSNATActiveMints++;
    } else if (snatStatus === 0) {
      // INACTIVE: 50% nation, 50% global pool
      nationAmount = (baseNationAmount * 50n) / 100n;
      globalPoolAmount = (baseNationAmount * 50n) / 100n;
      this.totalSNATInactiveMints++;
      this.totalGlobalPoolAllocations += globalPoolAmount;
    } else {
      // FLUSHED: 100% global pool
      nationAmount = 0n;
      globalPoolAmount = baseNationAmount;
      this.totalSNATFlushedMints++;
      this.totalGlobalPoolAllocations += globalPoolAmount;
    }

    // Mint tokens
    this._mint(citizen, citizenAmount);

    if (nationAmount > 0n) {
      const nationEscrow = this.nationEscrows.get(iso3166Code) || this.nationalEscrow;
      this._mint(nationEscrow, nationAmount);
    }

    if (globalPoolAmount > 0n) {
      this._mint(this.globalCitizenBlock, globalPoolAmount);
    }

    this.totalPFFHandshakes++;

    this.events.push({
      type: 'PFFHandshakeMint',
      citizen,
      citizenAmount,
      nationAmount,
      globalPoolAmount,
      pffSignature,
      iso3166Code,
      snatStatus,
    });

    // Check era transition
    if (this.currentEra === 0 && this.totalSupply >= 5_000_000_000n * 10n**18n) {
      this.currentEra = 1; // TWO_UNIT_ERA
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════════════════════

console.log('════════════════════════════════════════════════════════════════');
console.log('🧪 SNAT-LINKED VIDA CAP MINTING - TEST SUITE');
console.log('════════════════════════════════════════════════════════════════\n');

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

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}`);
    testsFailed++;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// TEST SETUP
// ════════════════════════════════════════════════════════════════════════════════

const architect = '0x1111111111111111111111111111111111111111';
const nationalEscrow = '0x2222222222222222222222222222222222222222';
const globalCitizenBlock = '0x3333333333333333333333333333333333333333';
const nigeriaEscrow = '0x4444444444444444444444444444444444444444';
const ghanaEscrow = '0x5555555555555555555555555555555555555555';
const kenyaEscrow = '0x6666666666666666666666666666666666666666';

const citizen1 = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const citizen2 = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const citizen3 = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';

const snatDeathClock = new MockSNATDeathClock();
const vidaCap = new MockVidaCapSNATLinked(architect, nationalEscrow, globalCitizenBlock, snatDeathClock);

// Initialize death clocks for test nations
snatDeathClock.initializeDeathClock('NG', 'Nigeria', nigeriaEscrow);
snatDeathClock.initializeDeathClock('GH', 'Ghana', ghanaEscrow);
snatDeathClock.initializeDeathClock('KE', 'Kenya', kenyaEscrow);

// Register nation escrows
vidaCap.registerNationEscrow('NG', nigeriaEscrow);
vidaCap.registerNationEscrow('GH', ghanaEscrow);
vidaCap.registerNationEscrow('KE', kenyaEscrow);

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: GENESIS MINT
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 1: Genesis Mint\n');

assertEqual(
  vidaCap.getBalance(architect),
  5n * 10n**18n,
  'Genesis mint - Architect receives 5 VIDA Cap'
);

assertEqual(
  vidaCap.getBalance(nationalEscrow),
  5n * 10n**18n,
  'Genesis mint - National Escrow receives 5 VIDA Cap'
);

assertEqual(
  vidaCap.totalSupply,
  10n * 10n**18n,
  'Genesis mint - Total supply is 10 VIDA Cap'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 2: SNAT ACTIVE MINTING
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 2: SNAT ACTIVE Minting\n');

// Activate SNAT for Nigeria
snatDeathClock.activateSNAT('NG');

// Mint for Nigerian citizen
vidaCap.mintOnPFFHandshake(
  citizen1,
  '0xSIG001',
  '0xHASH001',
  'NG'
);

assertEqual(
  vidaCap.getBalance(citizen1),
  5n * 10n**18n,
  'SNAT ACTIVE - Citizen receives 5 VIDA Cap (10-Unit Era)'
);

assertEqual(
  vidaCap.getBalance(nigeriaEscrow),
  5n * 10n**18n,
  'SNAT ACTIVE - Nation receives 5 VIDA Cap (100% allocation)'
);

assertEqual(
  vidaCap.getBalance(globalCitizenBlock),
  0n,
  'SNAT ACTIVE - Global Citizen Block receives 0 VIDA Cap'
);

assertEqual(
  vidaCap.totalSNATActiveMints,
  1,
  'SNAT ACTIVE - Total active mints is 1'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 3: SNAT INACTIVE MINTING
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 3: SNAT INACTIVE Minting\n');

// Ghana has INACTIVE SNAT (default state)

// Mint for Ghanaian citizen
vidaCap.mintOnPFFHandshake(
  citizen2,
  '0xSIG002',
  '0xHASH002',
  'GH'
);

assertEqual(
  vidaCap.getBalance(citizen2),
  5n * 10n**18n,
  'SNAT INACTIVE - Citizen receives 5 VIDA Cap (10-Unit Era)'
);

assertEqual(
  vidaCap.getBalance(ghanaEscrow),
  2n * 10n**18n + 500000000000000000n, // 2.5 VIDA Cap
  'SNAT INACTIVE - Nation receives 2.5 VIDA Cap (50% allocation)'
);

assertEqual(
  vidaCap.getBalance(globalCitizenBlock),
  2n * 10n**18n + 500000000000000000n, // 2.5 VIDA Cap
  'SNAT INACTIVE - Global Citizen Block receives 2.5 VIDA Cap (50% allocation)'
);

assertEqual(
  vidaCap.totalSNATInactiveMints,
  1,
  'SNAT INACTIVE - Total inactive mints is 1'
);

assertEqual(
  vidaCap.totalGlobalPoolAllocations,
  2n * 10n**18n + 500000000000000000n,
  'SNAT INACTIVE - Total global pool allocations is 2.5 VIDA Cap'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 4: SNAT FLUSHED MINTING
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 4: SNAT FLUSHED Minting\n');

// Flush Kenya's vault
snatDeathClock.flushNation('KE');

// Mint for Kenyan citizen
vidaCap.mintOnPFFHandshake(
  citizen3,
  '0xSIG003',
  '0xHASH003',
  'KE'
);

assertEqual(
  vidaCap.getBalance(citizen3),
  5n * 10n**18n,
  'SNAT FLUSHED - Citizen receives 5 VIDA Cap (10-Unit Era)'
);

assertEqual(
  vidaCap.getBalance(kenyaEscrow),
  0n,
  'SNAT FLUSHED - Nation receives 0 VIDA Cap (0% allocation)'
);

const expectedGlobalBlock = 2n * 10n**18n + 500000000000000000n + 5n * 10n**18n; // 2.5 + 5 = 7.5 VIDA Cap

assertEqual(
  vidaCap.getBalance(globalCitizenBlock),
  expectedGlobalBlock,
  'SNAT FLUSHED - Global Citizen Block receives 5 VIDA Cap (100% allocation)'
);

assertEqual(
  vidaCap.totalSNATFlushedMints,
  1,
  'SNAT FLUSHED - Total flushed mints is 1'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 5: CITIZEN VERIFICATION
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 5: Citizen Verification\n');

assertEqual(
  vidaCap.totalVerifiedCitizens,
  3,
  'Citizen verification - Total verified citizens is 3'
);

assert(
  vidaCap.isVerifiedCitizen.get(citizen1),
  'Citizen verification - Citizen 1 is verified'
);

assert(
  vidaCap.isVerifiedCitizen.get(citizen2),
  'Citizen verification - Citizen 2 is verified'
);

assert(
  vidaCap.isVerifiedCitizen.get(citizen3),
  'Citizen verification - Citizen 3 is verified'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 6: PFF SIGNATURE ANTI-REPLAY
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 6: PFF Signature Anti-Replay\n');

let replayError = false;
try {
  vidaCap.mintOnPFFHandshake(citizen1, '0xSIG001', '0xHASH001', 'NG');
} catch (error) {
  replayError = error.message.includes('already used');
}

assert(
  replayError,
  'Anti-replay - Cannot reuse PFF signature'
);

assert(
  vidaCap.usedPFFSignatures.has('0xSIG001'),
  'Anti-replay - Signature marked as used'
);

assert(
  vidaCap.usedPFFSignatures.has('0xSIG002'),
  'Anti-replay - Signature 2 marked as used'
);

assert(
  vidaCap.usedPFFSignatures.has('0xSIG003'),
  'Anti-replay - Signature 3 marked as used'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 7: NATION ESCROW REGISTRATION
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 7: Nation Escrow Registration\n');

assertEqual(
  vidaCap.nationEscrows.get('NG'),
  nigeriaEscrow,
  'Nation escrow - Nigeria escrow registered'
);

assertEqual(
  vidaCap.nationEscrows.get('GH'),
  ghanaEscrow,
  'Nation escrow - Ghana escrow registered'
);

assertEqual(
  vidaCap.nationEscrows.get('KE'),
  kenyaEscrow,
  'Nation escrow - Kenya escrow registered'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 8: STATISTICS TRACKING
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 8: Statistics Tracking\n');

assertEqual(
  vidaCap.totalPFFHandshakes,
  3,
  'Statistics - Total PFF handshakes is 3'
);

assertEqual(
  vidaCap.totalSNATActiveMints,
  1,
  'Statistics - Total SNAT active mints is 1'
);

assertEqual(
  vidaCap.totalSNATInactiveMints,
  1,
  'Statistics - Total SNAT inactive mints is 1'
);

assertEqual(
  vidaCap.totalSNATFlushedMints,
  1,
  'Statistics - Total SNAT flushed mints is 1'
);

const expectedTotalGlobalPool = 2n * 10n**18n + 500000000000000000n + 5n * 10n**18n; // 7.5 VIDA Cap

assertEqual(
  vidaCap.totalGlobalPoolAllocations,
  expectedTotalGlobalPool,
  'Statistics - Total global pool allocations is 7.5 VIDA Cap'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 9: TOTAL SUPPLY VALIDATION
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 9: Total Supply Validation\n');

// Expected total supply:
// Genesis: 10 VIDA Cap
// Mint 1 (NG, ACTIVE): 10 VIDA Cap (5 citizen + 5 nation)
// Mint 2 (GH, INACTIVE): 10 VIDA Cap (5 citizen + 2.5 nation + 2.5 global)
// Mint 3 (KE, FLUSHED): 10 VIDA Cap (5 citizen + 0 nation + 5 global)
// Total: 40 VIDA Cap

const expectedTotalSupply = 40n * 10n**18n;

assertEqual(
  vidaCap.totalSupply,
  expectedTotalSupply,
  'Total supply - Total supply is 40 VIDA Cap'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE 10: EVENT EMISSION
// ════════════════════════════════════════════════════════════════════════════════

console.log('📋 Test Suite 10: Event Emission\n');

const pffHandshakeMintEvents = vidaCap.events.filter(e => e.type === 'PFFHandshakeMint');

assertEqual(
  pffHandshakeMintEvents.length,
  3,
  'Events - 3 PFFHandshakeMint events emitted'
);

assertEqual(
  pffHandshakeMintEvents[0].snatStatus,
  1,
  'Events - First mint has SNAT status ACTIVE (1)'
);

assertEqual(
  pffHandshakeMintEvents[1].snatStatus,
  0,
  'Events - Second mint has SNAT status INACTIVE (0)'
);

assertEqual(
  pffHandshakeMintEvents[2].snatStatus,
  2,
  'Events - Third mint has SNAT status FLUSHED (2)'
);

const nationEscrowEvents = vidaCap.events.filter(e => e.type === 'NationEscrowRegistered');

assertEqual(
  nationEscrowEvents.length,
  3,
  'Events - 3 NationEscrowRegistered events emitted'
);

console.log('');

// ════════════════════════════════════════════════════════════════════════════════
// FINAL SUMMARY
// ════════════════════════════════════════════════════════════════════════════════

console.log('════════════════════════════════════════════════════════════════');
console.log('📊 TEST RESULTS SUMMARY');
console.log('════════════════════════════════════════════════════════════════\n');

console.log(`Total Tests:  ${testsPassed + testsFailed}`);
console.log(`✅ Passed:    ${testsPassed}`);
console.log(`❌ Failed:    ${testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%\n`);

console.log('════════════════════════════════════════════════════════════════');
console.log('🎯 FINAL STATE');
console.log('════════════════════════════════════════════════════════════════\n');

console.log(`Total Supply:              ${Number(vidaCap.totalSupply) / 1e18} VIDA Cap`);
console.log(`Total Verified Citizens:   ${vidaCap.totalVerifiedCitizens}`);
console.log(`Total PFF Handshakes:      ${vidaCap.totalPFFHandshakes}`);
console.log(`Total SNAT Active Mints:   ${vidaCap.totalSNATActiveMints}`);
console.log(`Total SNAT Inactive Mints: ${vidaCap.totalSNATInactiveMints}`);
console.log(`Total SNAT Flushed Mints:  ${vidaCap.totalSNATFlushedMints}`);
console.log(`Total Global Pool Alloc:   ${Number(vidaCap.totalGlobalPoolAllocations) / 1e18} VIDA Cap\n`);

console.log('Balances by Address:');
console.log(`  Architect:           ${Number(vidaCap.getBalance(architect)) / 1e18} VIDA Cap`);
console.log(`  National Escrow:     ${Number(vidaCap.getBalance(nationalEscrow)) / 1e18} VIDA Cap`);
console.log(`  Global Citizen Block: ${Number(vidaCap.getBalance(globalCitizenBlock)) / 1e18} VIDA Cap`);
console.log(`  Nigeria Escrow:      ${Number(vidaCap.getBalance(nigeriaEscrow)) / 1e18} VIDA Cap`);
console.log(`  Ghana Escrow:        ${Number(vidaCap.getBalance(ghanaEscrow)) / 1e18} VIDA Cap`);
console.log(`  Kenya Escrow:        ${Number(vidaCap.getBalance(kenyaEscrow)) / 1e18} VIDA Cap`);
console.log(`  Citizen 1:           ${Number(vidaCap.getBalance(citizen1)) / 1e18} VIDA Cap`);
console.log(`  Citizen 2:           ${Number(vidaCap.getBalance(citizen2)) / 1e18} VIDA Cap`);
console.log(`  Citizen 3:           ${Number(vidaCap.getBalance(citizen3)) / 1e18} VIDA Cap\n`);

console.log('SNAT Status by Nation:');
const ngClock = snatDeathClock.getDeathClock('NG');
const ghClock = snatDeathClock.getDeathClock('GH');
const keClock = snatDeathClock.getDeathClock('KE');

const statusNames = ['INACTIVE', 'ACTIVE', 'FLUSHED'];
console.log(`  NG (Nigeria): ${statusNames[ngClock.snatStatus]}`);
console.log(`  GH (Ghana):   ${statusNames[ghClock.snatStatus]}`);
console.log(`  KE (Kenya):   ${statusNames[keClock.snatStatus]}\n`);

console.log('════════════════════════════════════════════════════════════════');

if (testsFailed === 0) {
  console.log('✅ ALL TESTS PASSED! 🎉');
  console.log('════════════════════════════════════════════════════════════════\n');
  console.log('"IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT."\n');
  console.log('Born in Lagos, Nigeria. Built for Humanity. 🇳🇬');
  console.log('Architect: ISREAL OKORO\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('════════════════════════════════════════════════════════════════\n');
  process.exit(1);
}

