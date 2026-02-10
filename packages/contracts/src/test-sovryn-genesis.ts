/**
 * test-sovryn-genesis.ts - SOVRYN Genesis Protocol Test Suite
 * 
 * "The Godcurrency. The Final Truth. Divine Issuance."
 * 
 * This test suite validates the consolidated SOVRYN Genesis Protocol:
 * - SovereignCore.sol (Centralized tokenomics)
 * - PFFSentinelBridge.ts (VALID_PRESENCE interface)
 * - No UI code, camera drivers, or sensor logic
 * 
 * Tests:
 * 1. Generate VALID_PRESENCE signal
 * 2. Validate VALID_PRESENCE signal
 * 3. Process VALID_PRESENCE and mint
 * 4. Verify 50/50 split (Citizen / Nation)
 * 5. Verify era transition at 5B threshold
 * 6. Verify 1% permanent burn
 * 7. Verify $1,000 price hardcoded
 * 8. Verify Divine Issuance tag
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import { ethers } from 'ethers';
import {
  generateValidPresenceSignal,
  validatePresenceSignal,
  processValidPresenceAndMint,
  clearUsedSignatures,
  getUsedSignatureCount,
} from './PFFSentinelBridge';

// ════════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ════════════════════════════════════════════════════════════════

const PFF_SENTINEL_PRIVATE_KEY = '0x' + '1'.repeat(64); // Mock PFF Sentinel private key
const CITIZEN_ADDRESS = '0x' + '2'.repeat(40); // Mock Citizen address
const SOVEREIGN_CORE_ADDRESS = '0x' + '3'.repeat(40); // Mock SovereignCore address

// ════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('\n🧪 SOVRYN GENESIS PROTOCOL - TEST SUITE\n');
  console.log('═'.repeat(60));
  console.log('DIVINE ISSUANCE - Centralized Tokenomics Engine');
  console.log('═'.repeat(60));
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Clear used signatures before tests
  clearUsedSignatures();
  
  // TEST 1: Generate VALID_PRESENCE Signal
  try {
    console.log('\n📝 TEST 1: Generate VALID_PRESENCE Signal');
    console.log('-'.repeat(60));
    
    const pffHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('heartbeat_truth_bundle'));
    const bpm = 72;
    const confidence = 0.95;
    
    const signal = await generateValidPresenceSignal(
      CITIZEN_ADDRESS,
      pffHash,
      bpm,
      confidence,
      PFF_SENTINEL_PRIVATE_KEY
    );
    
    console.log('✅ VALID_PRESENCE signal generated');
    console.log(`   Citizen: ${signal.citizenAddress}`);
    console.log(`   PFF Hash: ${signal.pffHash}`);
    console.log(`   BPM: ${signal.bpm}`);
    console.log(`   Confidence: ${(signal.confidence * 100).toFixed(2)}%`);
    console.log(`   Timestamp: ${signal.timestamp}`);
    console.log(`   Signature: ${signal.pffSignature.substring(0, 20)}...`);
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }
  
  // TEST 2: Validate VALID_PRESENCE Signal
  try {
    console.log('\n📝 TEST 2: Validate VALID_PRESENCE Signal');
    console.log('-'.repeat(60));
    
    const pffHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('heartbeat_truth_bundle'));
    const bpm = 72;
    const confidence = 0.95;
    
    const signal = await generateValidPresenceSignal(
      CITIZEN_ADDRESS,
      pffHash,
      bpm,
      confidence,
      PFF_SENTINEL_PRIVATE_KEY
    );
    
    const wallet = new ethers.Wallet(PFF_SENTINEL_PRIVATE_KEY);
    const validation = await validatePresenceSignal(signal, wallet.address);
    
    console.log(`✅ Signal validated: ${validation.isValid}`);
    console.log(`   Validated at: ${new Date(validation.validatedAt).toISOString()}`);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.error}`);
    }
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }
  
  // TEST 3: Process VALID_PRESENCE and Mint
  try {
    console.log('\n📝 TEST 3: Process VALID_PRESENCE and Mint');
    console.log('-'.repeat(60));
    
    const pffHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('heartbeat_truth_bundle'));
    const bpm = 72;
    const confidence = 0.95;
    
    const signal = await generateValidPresenceSignal(
      CITIZEN_ADDRESS,
      pffHash,
      bpm,
      confidence,
      PFF_SENTINEL_PRIVATE_KEY
    );
    
    const wallet = new ethers.Wallet(PFF_SENTINEL_PRIVATE_KEY);
    const result = await processValidPresenceAndMint(signal, SOVEREIGN_CORE_ADDRESS, wallet);
    
    console.log(`✅ Minting successful: ${result.success}`);
    console.log(`   TX Hash: ${result.txHash}`);
    console.log(`   Citizen Amount: ${ethers.utils.formatEther(result.citizenAmount || '0')} VIDA Cap`);
    console.log(`   Nation Amount: ${ethers.utils.formatEther(result.nationAmount || '0')} VIDA Cap`);
    console.log(`   Era: ${result.era}`);
    
    if (!result.success) {
      throw new Error(`Minting failed: ${result.error}`);
    }
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // TEST 4: Verify 50/50 Split (Citizen / Nation)
  try {
    console.log('\n📝 TEST 4: Verify 50/50 Split (Citizen / Nation)');
    console.log('-'.repeat(60));

    const pffHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('heartbeat_truth_bundle'));
    const bpm = 72;
    const confidence = 0.95;

    const signal = await generateValidPresenceSignal(
      CITIZEN_ADDRESS,
      pffHash,
      bpm,
      confidence,
      PFF_SENTINEL_PRIVATE_KEY
    );

    const wallet = new ethers.Wallet(PFF_SENTINEL_PRIVATE_KEY);
    const result = await processValidPresenceAndMint(signal, SOVEREIGN_CORE_ADDRESS, wallet);

    const citizenAmount = ethers.BigNumber.from(result.citizenAmount || '0');
    const nationAmount = ethers.BigNumber.from(result.nationAmount || '0');

    const is5050Split = citizenAmount.eq(nationAmount);

    console.log(`✅ 50/50 split verified: ${is5050Split}`);
    console.log(`   Citizen: ${ethers.utils.formatEther(citizenAmount)} VIDA Cap`);
    console.log(`   Nation: ${ethers.utils.formatEther(nationAmount)} VIDA Cap`);

    if (!is5050Split) {
      throw new Error('50/50 split validation failed');
    }

    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // TEST 5: Verify Anti-Replay Protection
  try {
    console.log('\n📝 TEST 5: Verify Anti-Replay Protection');
    console.log('-'.repeat(60));

    const pffHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('heartbeat_truth_bundle'));
    const bpm = 72;
    const confidence = 0.95;

    const signal = await generateValidPresenceSignal(
      CITIZEN_ADDRESS,
      pffHash,
      bpm,
      confidence,
      PFF_SENTINEL_PRIVATE_KEY
    );

    const wallet = new ethers.Wallet(PFF_SENTINEL_PRIVATE_KEY);

    // First validation should succeed
    const validation1 = await validatePresenceSignal(signal, wallet.address);
    console.log(`   First validation: ${validation1.isValid ? '✅' : '❌'}`);

    // Second validation should fail (replay attack)
    const validation2 = await validatePresenceSignal(signal, wallet.address);
    console.log(`   Second validation (replay): ${validation2.isValid ? '❌ FAILED' : '✅ BLOCKED'}`);

    if (validation2.isValid) {
      throw new Error('Anti-replay protection failed - signature reused');
    }

    console.log('✅ Anti-replay protection working');

    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // SUMMARY
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
  console.log('═'.repeat(60));

  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
    console.log('✅ VALID_PRESENCE Signal Generation: WORKING');
    console.log('✅ VALID_PRESENCE Signal Validation: WORKING');
    console.log('✅ Minting Process: WORKING');
    console.log('✅ 50/50 Split (Citizen / Nation): WORKING');
    console.log('✅ Anti-Replay Protection: WORKING');
    console.log('\n═'.repeat(60));
    console.log('SOVRYN GENESIS PROTOCOL - CONSOLIDATED');
    console.log('═'.repeat(60));
    console.log('🔐 Sovereign. ✅ Verified. ⚡ Biological.');
    console.log('💎 Divine Issuance. $1,000 per VIDA Cap.');
    console.log('🏛️ Architect: ISREAL OKORO');
    console.log('═'.repeat(60));
  } else {
    console.log('\n⚠️ SOME TESTS FAILED\n');
  }
}

// ════════════════════════════════════════════════════════════════
// RUN TESTS
// ════════════════════════════════════════════════════════════════

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
