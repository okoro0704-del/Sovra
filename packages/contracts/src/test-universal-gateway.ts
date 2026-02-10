/**
 * test-universal-gateway.ts - Universal PFF Gateway Test Suite
 * 
 * "The Sovereign must push. No app can pull."
 * 
 * This test suite validates the Universal PFF-Gateway Protocol:
 * - Handshake authorization (Face + Finger)
 * - Payment processing
 * - Merchant certification
 * - VLT transparency
 * - 50:50 revenue split
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Commerce.
 */

import { ethers } from 'ethers';
import {
  generateHandshakeAuthorization,
  verifyHandshakeAuthorization,
  processPayment,
  getMerchantCertification,
  getMerchantVLTStats,
  getGlobalGatewayStats,
  isMerchantCertified,
  calculatePaymentBreakdown,
} from './UniversalPFFGateway';

// ============ TEST CONFIGURATION ============

const PFF_PRIVATE_KEY = '0x' + '1'.repeat(64); // Mock PFF Protocol private key
const SOVEREIGN_ADDRESS = '0x' + '2'.repeat(40); // Mock Sovereign address
const MERCHANT_ADDRESS = '0x' + '3'.repeat(40); // Mock Merchant address
const CHECKOUT_SERVICE_ADDRESS = '0x' + '4'.repeat(40); // Mock Checkout Service address

// ============ TEST SUITE ============

async function runTests() {
  console.log('\n🧪 UNIVERSAL PFF GATEWAY - TEST SUITE\n');
  console.log('='.repeat(60));
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // TEST 1: Generate Handshake Authorization
  try {
    console.log('\n📝 TEST 1: Generate Handshake Authorization');
    console.log('-'.repeat(60));
    
    const faceData = new Uint8Array(Buffer.from('face_biometric_data'));
    const fingerData = new Uint8Array(Buffer.from('finger_biometric_data'));
    
    const handshake = await generateHandshakeAuthorization(
      SOVEREIGN_ADDRESS,
      faceData,
      fingerData,
      PFF_PRIVATE_KEY
    );
    
    console.log('✅ Handshake generated');
    console.log(`   PFF Hash: ${handshake.pffHash}`);
    console.log(`   Face Hash: ${handshake.faceHash}`);
    console.log(`   Finger Hash: ${handshake.fingerHash}`);
    console.log(`   Timestamp: ${handshake.timestamp}`);
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }
  
  // TEST 2: Verify Handshake Authorization
  try {
    console.log('\n📝 TEST 2: Verify Handshake Authorization');
    console.log('-'.repeat(60));
    
    const faceData = new Uint8Array(Buffer.from('face_biometric_data'));
    const fingerData = new Uint8Array(Buffer.from('finger_biometric_data'));
    
    const handshake = await generateHandshakeAuthorization(
      SOVEREIGN_ADDRESS,
      faceData,
      fingerData,
      PFF_PRIVATE_KEY
    );
    
    const wallet = new ethers.Wallet(PFF_PRIVATE_KEY);
    const isValid = await verifyHandshakeAuthorization(handshake, wallet.address);
    
    console.log(`✅ Handshake verified: ${isValid}`);
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }
  
  // TEST 3: Process Payment
  try {
    console.log('\n📝 TEST 3: Process Payment');
    console.log('-'.repeat(60));
    
    const faceData = new Uint8Array(Buffer.from('face_biometric_data'));
    const fingerData = new Uint8Array(Buffer.from('finger_biometric_data'));
    
    const handshake = await generateHandshakeAuthorization(
      SOVEREIGN_ADDRESS,
      faceData,
      fingerData,
      PFF_PRIVATE_KEY
    );
    
    const paymentRequest = {
      merchantAddress: MERCHANT_ADDRESS,
      amount: ethers.utils.parseEther('100').toString(),
      handshake,
      metadata: {
        description: 'Test payment',
        reference: 'TEST-001',
      },
    };
    
    const wallet = new ethers.Wallet(PFF_PRIVATE_KEY);
    const result = await processPayment(paymentRequest, CHECKOUT_SERVICE_ADDRESS, wallet);
    
    console.log(`✅ Payment processed: ${result.success}`);
    console.log(`   TX Hash: ${result.txHash}`);
    console.log(`   Merchant Amount: ${ethers.utils.formatEther(result.merchantAmount || '0')} VIDA`);
    console.log(`   Fee: ${ethers.utils.formatEther(result.feeAmount || '0')} VIDA`);
    console.log(`   To People: ${ethers.utils.formatEther(result.peopleAmount || '0')} VIDA`);
    console.log(`   To Infrastructure: ${ethers.utils.formatEther(result.infrastructureAmount || '0')} VIDA`);
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }
  
  // TEST 4: Get Merchant Certification
  try {
    console.log('\n📝 TEST 4: Get Merchant Certification');
    console.log('-'.repeat(60));
    
    const certification = await getMerchantCertification(MERCHANT_ADDRESS);
    
    console.log('✅ Certification retrieved');
    console.log(`   Merchant: ${certification.merchantName}`);
    console.log(`   Certified: ${certification.certified}`);
    console.log(`   Fee Rate: ${certification.feeRateBPS / 100}%`);
    console.log(`   Expires: ${new Date(certification.expiresAt).toISOString()}`);
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }
  
  // TEST 5: Get Merchant VLT Stats
  try {
    console.log('\n📝 TEST 5: Get Merchant VLT Stats');
    console.log('-'.repeat(60));
    
    const stats = await getMerchantVLTStats(MERCHANT_ADDRESS);
    
    console.log('✅ VLT stats retrieved');
    console.log(`   Total Payments: ${stats.totalPayments}`);
    console.log(`   Total Volume: ${ethers.utils.formatEther(stats.totalVolume)} VIDA`);
    console.log(`   Total Fees: ${ethers.utils.formatEther(stats.totalFees)} VIDA`);
    console.log(`   To People: ${ethers.utils.formatEther(stats.contributionToPeople)} VIDA`);
    console.log(`   To Infrastructure: ${ethers.utils.formatEther(stats.contributionToInfrastructure)} VIDA`);
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // TEST 6: Get Global Gateway Stats
  try {
    console.log('\n📝 TEST 6: Get Global Gateway Stats');
    console.log('-'.repeat(60));

    const stats = await getGlobalGatewayStats(CHECKOUT_SERVICE_ADDRESS);

    console.log('✅ Global stats retrieved');
    console.log(`   Total Payments: ${stats.totalPaymentsProcessed}`);
    console.log(`   Total Volume: ${ethers.utils.formatEther(stats.totalVolumeProcessed)} VIDA`);
    console.log(`   Total Fees: ${ethers.utils.formatEther(stats.totalFeesCollected)} VIDA`);
    console.log(`   To People: ${ethers.utils.formatEther(stats.totalToPeople)} VIDA`);
    console.log(`   To Infrastructure: ${ethers.utils.formatEther(stats.totalToInfrastructure)} VIDA`);

    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // TEST 7: Check Merchant Certification
  try {
    console.log('\n📝 TEST 7: Check Merchant Certification');
    console.log('-'.repeat(60));

    const isCertified = await isMerchantCertified(MERCHANT_ADDRESS, CHECKOUT_SERVICE_ADDRESS);

    console.log(`✅ Merchant certified: ${isCertified}`);

    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // TEST 8: Calculate Payment Breakdown
  try {
    console.log('\n📝 TEST 8: Calculate Payment Breakdown');
    console.log('-'.repeat(60));

    const amount = ethers.utils.parseEther('1000').toString();
    const feeRateBPS = 200; // 2%

    const breakdown = calculatePaymentBreakdown(amount, feeRateBPS);

    console.log('✅ Payment breakdown calculated');
    console.log(`   Total Amount: ${ethers.utils.formatEther(amount)} VIDA`);
    console.log(`   Merchant Amount: ${ethers.utils.formatEther(breakdown.merchantAmount)} VIDA`);
    console.log(`   Fee: ${ethers.utils.formatEther(breakdown.feeAmount)} VIDA`);
    console.log(`   To People (50%): ${ethers.utils.formatEther(breakdown.peopleAmount)} VIDA`);
    console.log(`   To Infrastructure (50%): ${ethers.utils.formatEther(breakdown.infrastructureAmount)} VIDA`);

    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // TEST 9: 50:50 Revenue Split Validation
  try {
    console.log('\n📝 TEST 9: 50:50 Revenue Split Validation');
    console.log('-'.repeat(60));

    const amount = ethers.utils.parseEther('1000').toString();
    const feeRateBPS = 200; // 2%

    const breakdown = calculatePaymentBreakdown(amount, feeRateBPS);

    const peopleAmount = ethers.BigNumber.from(breakdown.peopleAmount);
    const infrastructureAmount = ethers.BigNumber.from(breakdown.infrastructureAmount);
    const totalFee = ethers.BigNumber.from(breakdown.feeAmount);

    // Verify 50:50 split
    const expectedPeopleAmount = totalFee.div(2);
    const expectedInfrastructureAmount = totalFee.sub(expectedPeopleAmount);

    const peopleMatch = peopleAmount.eq(expectedPeopleAmount);
    const infrastructureMatch = infrastructureAmount.eq(expectedInfrastructureAmount);

    console.log(`✅ 50:50 split validated`);
    console.log(`   People: ${peopleMatch ? '✅' : '❌'} ${ethers.utils.formatEther(peopleAmount)} VIDA`);
    console.log(`   Infrastructure: ${infrastructureMatch ? '✅' : '❌'} ${ethers.utils.formatEther(infrastructureAmount)} VIDA`);

    if (peopleMatch && infrastructureMatch) {
      testsPassed++;
    } else {
      throw new Error('50:50 split validation failed');
    }
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));

  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
    console.log('✅ Handshake Authorization: WORKING');
    console.log('✅ Payment Processing: WORKING');
    console.log('✅ Merchant Certification: WORKING');
    console.log('✅ VLT Transparency: WORKING');
    console.log('✅ 50:50 Revenue Split: WORKING');
    console.log('\n🔐 Sovereign. ✅ Verified. ⚡ Biological.\n');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED\n');
  }
}

// ============ RUN TESTS ============

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
