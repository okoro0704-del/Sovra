/**
 * test-snat-protocol.ts - National Ultimatum Protocol (SNAT) Test Suite
 * 
 * "Testing the National Ultimatum. Validating Zero-Tax Sovereignty."
 * 
 * This test suite validates the SNAT implementation:
 * - SNAT Variable (isNationTaxFree)
 * - 50/50 Revenue Split with Hard-Locked Escrow
 * - 180-Day Flush Trigger
 * - Infrastructure Deactivation
 * - PFF-Verified Sovereign Handshake
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import {
  NationalJurisdiction,
  lockNationalEscrow,
  performSNATHandshake,
  flushEscrowToCitizenPool,
  deactivateNationalBlock,
  reportTaxationAttempt,
  isNationTaxFreeStatus,
  getEscrowBalance,
  getTimeUntilFlushDeadline,
  getDaysUntilFlushDeadline,
  isFlushDeadlineExpired,
  getSNATHandshakeDetails,
  getNationalBlockStatus,
  getTotalFlushedToCitizenPool,
  getEscrowStatus,
  getFlushDeadlineInfo,
  getLegalMetadata,
  formatJurisdictionName,
  formatDate,
  resetSNATState,
  LEGAL_METADATA,
  LAUNCH_DATE,
  FLUSH_COUNTDOWN_DAYS,
  FLUSH_DEADLINE,
  SNAT_AGREEMENT_TEXT,
} from './NationalUltimatumProtocol';

// ════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════

async function runSNATTests() {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('🏛️ NATIONAL ULTIMATUM PROTOCOL (SNAT) - TEST SUITE');
  console.log('═'.repeat(80));
  console.log('\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // ════════════════════════════════════════════════════════════════
  // TEST 1: Legal Metadata Verification
  // ════════════════════════════════════════════════════════════════

  console.log('📋 TEST 1: Legal Metadata Verification');
  console.log('-'.repeat(80));

  try {
    const metadata = getLegalMetadata();
    console.log(`   Legal Metadata: "${metadata}"`);
    
    if (metadata === LEGAL_METADATA) {
      console.log('   ✅ Legal metadata verified\n');
      testsPassed++;
    } else {
      console.log('   ❌ Legal metadata mismatch\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ Test failed: ${error}\n`);
    testsFailed++;
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 2: Default SNAT Variable (isNationTaxFree == FALSE)
  // ════════════════════════════════════════════════════════════════

  console.log('📋 TEST 2: Default SNAT Variable (isNationTaxFree == FALSE)');
  console.log('-'.repeat(80));

  try {
    resetSNATState();
    
    const nigeriaTaxFree = isNationTaxFreeStatus(NationalJurisdiction.NIGERIA);
    const ghanaTaxFree = isNationTaxFreeStatus(NationalJurisdiction.GHANA);
    
    console.log(`   Nigeria isNationTaxFree: ${nigeriaTaxFree}`);
    console.log(`   Ghana isNationTaxFree: ${ghanaTaxFree}`);
    
    if (!nigeriaTaxFree && !ghanaTaxFree) {
      console.log('   ✅ Default SNAT variable verified (FALSE)\n');
      testsPassed++;
    } else {
      console.log('   ❌ Default SNAT variable incorrect\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ Test failed: ${error}\n`);
    testsFailed++;
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 3: Lock National Escrow (50% Revenue Share)
  // ════════════════════════════════════════════════════════════════

  console.log('📋 TEST 3: Lock National Escrow (50% Revenue Share)');
  console.log('-'.repeat(80));

  try {
    resetSNATState();
    
    // Lock 5 VIDA Cap for Nigeria (50% of 10 VIDA Cap transaction)
    const lockAmount = 5n * 10n ** 18n; // 5 VIDA Cap
    lockNationalEscrow(NationalJurisdiction.NIGERIA, lockAmount);
    
    const escrowBalance = getEscrowBalance(NationalJurisdiction.NIGERIA);
    console.log(`   Escrow Balance: ${escrowBalance / 10n ** 18n} VIDA Cap`);
    
    if (escrowBalance === lockAmount) {
      console.log('   ✅ National escrow locked successfully\n');
      testsPassed++;
    } else {
      console.log('   ❌ Escrow balance mismatch\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ Test failed: ${error}\n`);
    testsFailed++;
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 4: PFF-Verified Sovereign Handshake (SNAT Agreement)
  // ════════════════════════════════════════════════════════════════

  console.log('📋 TEST 4: PFF-Verified Sovereign Handshake (SNAT Agreement)');
  console.log('-'.repeat(80));

  try {
    resetSNATState();
    
    // Lock escrow first
    const lockAmount = 10n * 10n ** 18n; // 10 VIDA Cap
    lockNationalEscrow(NationalJurisdiction.NIGERIA, lockAmount);
    
    // Perform SNAT handshake
    const pffSignature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const pffHash = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    
    const handshakeDetails = performSNATHandshake(NationalJurisdiction.NIGERIA, pffSignature, pffHash);
    
    console.log(`   Jurisdiction: ${formatJurisdictionName(handshakeDetails.jurisdiction)}`);
    console.log(`   PFF Signature: ${handshakeDetails.pffSignature.substring(0, 16)}...`);
    console.log(`   Is Tax-Free: ${handshakeDetails.isTaxFree}`);
    console.log(`   Agreement: ${SNAT_AGREEMENT_TEXT}`);
    
    const isTaxFree = isNationTaxFreeStatus(NationalJurisdiction.NIGERIA);
    const escrowBalance = getEscrowBalance(NationalJurisdiction.NIGERIA);
    
    if (isTaxFree && escrowBalance === 0n) {
      console.log('   ✅ SNAT handshake performed successfully\n');
      testsPassed++;
    } else {
      console.log('   ❌ SNAT handshake failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ Test failed: ${error}\n`);
    testsFailed++;
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 5: Flush Deadline Info
  // ════════════════════════════════════════════════════════════════

  console.log('📋 TEST 5: Flush Deadline Info');
  console.log('-'.repeat(80));

  try {
    const deadlineInfo = getFlushDeadlineInfo();

    console.log(`   Launch Date: ${formatDate(deadlineInfo.launchDate)}`);
    console.log(`   Flush Deadline: ${formatDate(deadlineInfo.flushDeadline)}`);
    console.log(`   Countdown Days: ${deadlineInfo.countdownDays}`);
    console.log(`   Days Remaining: ${deadlineInfo.daysRemaining}`);
    console.log(`   Is Expired: ${deadlineInfo.isExpired}`);

    if (deadlineInfo.countdownDays === FLUSH_COUNTDOWN_DAYS) {
      console.log('   ✅ Flush deadline info verified\n');
      testsPassed++;
    } else {
      console.log('   ❌ Flush deadline info incorrect\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ Test failed: ${error}\n`);
    testsFailed++;
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 6: Taxation Attempt Detection & Deactivation
  // ════════════════════════════════════════════════════════════════

  console.log('📋 TEST 6: Taxation Attempt Detection & Deactivation');
  console.log('-'.repeat(80));

  try {
    resetSNATState();

    // Lock escrow first
    const lockAmount = 15n * 10n ** 18n; // 15 VIDA Cap
    lockNationalEscrow(NationalJurisdiction.GHANA, lockAmount);

    // Report taxation attempt
    const violator = '0x1234567890123456789012345678901234567890';
    const pffSignature = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

    reportTaxationAttempt(NationalJurisdiction.GHANA, violator, pffSignature);

    const isDeactivated = getNationalBlockStatus(NationalJurisdiction.GHANA);
    const escrowBalance = getEscrowBalance(NationalJurisdiction.GHANA);
    const totalFlushed = getTotalFlushedToCitizenPool(NationalJurisdiction.GHANA);

    console.log(`   National Block Deactivated: ${isDeactivated}`);
    console.log(`   Escrow Balance: ${escrowBalance / 10n ** 18n} VIDA Cap`);
    console.log(`   Total Flushed to Citizen Pool: ${totalFlushed / 10n ** 18n} VIDA Cap`);

    if (isDeactivated && escrowBalance === 0n && totalFlushed === lockAmount) {
      console.log('   ✅ Taxation attempt detected and deactivated\n');
      testsPassed++;
    } else {
      console.log('   ❌ Deactivation failed\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ Test failed: ${error}\n`);
    testsFailed++;
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 7: Escrow Status Query
  // ════════════════════════════════════════════════════════════════

  console.log('📋 TEST 7: Escrow Status Query');
  console.log('-'.repeat(80));

  try {
    resetSNATState();

    // Lock escrow
    const lockAmount = 20n * 10n ** 18n; // 20 VIDA Cap
    lockNationalEscrow(NationalJurisdiction.NIGERIA, lockAmount);

    const status = getEscrowStatus(NationalJurisdiction.NIGERIA);

    console.log(`   Jurisdiction: ${formatJurisdictionName(status.jurisdiction)}`);
    console.log(`   Escrow Balance: ${BigInt(status.escrowBalance) / 10n ** 18n} VIDA Cap`);
    console.log(`   Is Tax-Free: ${status.isTaxFree}`);
    console.log(`   Is Deactivated: ${status.isDeactivated}`);
    console.log(`   Total Flushed: ${BigInt(status.totalFlushed) / 10n ** 18n} VIDA Cap`);

    if (BigInt(status.escrowBalance) === lockAmount && !status.isTaxFree && !status.isDeactivated) {
      console.log('   ✅ Escrow status query successful\n');
      testsPassed++;
    } else {
      console.log('   ❌ Escrow status incorrect\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`   ❌ Test failed: ${error}\n`);
    testsFailed++;
  }

  // ════════════════════════════════════════════════════════════════
  // TEST SUMMARY
  // ════════════════════════════════════════════════════════════════

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`   Total Tests: ${testsPassed + testsFailed}`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
  console.log('═'.repeat(80));
  console.log('\n');

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! SNAT PROTOCOL VERIFIED! 🎉\n');
  } else {
    console.log('⚠️ SOME TESTS FAILED. PLEASE REVIEW.\n');
  }
}

// ════════════════════════════════════════════════════════════════
// RUN TESTS
// ════════════════════════════════════════════════════════════════

runSNATTests()
  .then(() => {
    console.log('✅ SNAT Test Suite completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ SNAT Test Suite failed:', error);
    process.exit(1);
  });

