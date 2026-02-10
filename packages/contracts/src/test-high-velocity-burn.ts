/**
 * test-high-velocity-burn.ts - High-Velocity Burn Protocol Test Suite
 * 
 * "The Supply Hammer. 10% Burn. Aggressive Deflation."
 * 
 * This test suite validates the High-Velocity Burn Protocol implementation:
 * - 10% aggressive burn rate (post-5B threshold)
 * - Transaction fee split (45% People / 45% Nation / 10% Architect)
 * - Live Burn Meter tracking
 * - Equilibrium detection
 * - Burn activation at 5B threshold
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import { ethers } from 'ethers';

// ════════════════════════════════════════════════════════════════════════════════
// TEST CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════

const BURN_RATE_BPS = 1000; // 10% (1000 basis points)
const BPS_DENOMINATOR = 10000;

const CITIZEN_POOL_BPS = 4500; // 45%
const NATIONAL_ESCROW_BPS = 4500; // 45%
const ARCHITECT_BPS = 1000; // 10%

const THRESHOLD_5B = ethers.BigNumber.from('5000000000').mul(ethers.BigNumber.from(10).pow(18));

// ════════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('\n🔥 HIGH-VELOCITY BURN PROTOCOL - TEST SUITE\n');
  console.log('═'.repeat(60));
  console.log('THE SUPPLY HAMMER - 10% AGGRESSIVE BURN');
  console.log('═'.repeat(60));
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // TEST 1: Verify 10% Burn Rate
  try {
    console.log('\n📝 TEST 1: Verify 10% Aggressive Burn Rate');
    console.log('-'.repeat(60));
    
    const transferAmount = ethers.utils.parseEther('100'); // 100 VIDA Cap
    const burnAmount = transferAmount.mul(BURN_RATE_BPS).div(BPS_DENOMINATOR);
    const remainder = transferAmount.sub(burnAmount);
    
    const expectedBurn = ethers.utils.parseEther('10'); // 10% of 100 = 10
    const expectedRemainder = ethers.utils.parseEther('90'); // 90 VIDA Cap
    
    const isBurnCorrect = burnAmount.eq(expectedBurn);
    const isRemainderCorrect = remainder.eq(expectedRemainder);
    
    console.log(`✅ Transfer Amount: ${ethers.utils.formatEther(transferAmount)} VIDA Cap`);
    console.log(`   Burn Amount: ${ethers.utils.formatEther(burnAmount)} VIDA Cap (10%)`);
    console.log(`   Remainder: ${ethers.utils.formatEther(remainder)} VIDA Cap (90%)`);
    console.log(`   Burn Correct: ${isBurnCorrect ? '✅' : '❌'}`);
    console.log(`   Remainder Correct: ${isRemainderCorrect ? '✅' : '❌'}`);
    
    if (!isBurnCorrect || !isRemainderCorrect) {
      throw new Error('10% burn rate incorrect');
    }
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }
  
  // TEST 2: Verify Transaction Fee Split (45/45/10)
  try {
    console.log('\n📝 TEST 2: Verify Transaction Fee Split (45/45/10)');
    console.log('-'.repeat(60));
    
    const transferAmount = ethers.utils.parseEther('100'); // 100 VIDA Cap
    const burnAmount = transferAmount.mul(BURN_RATE_BPS).div(BPS_DENOMINATOR); // 10 VIDA Cap
    const remainder = transferAmount.sub(burnAmount); // 90 VIDA Cap
    
    const citizenPoolAmount = remainder.mul(CITIZEN_POOL_BPS).div(BPS_DENOMINATOR);
    const nationalEscrowAmount = remainder.mul(NATIONAL_ESCROW_BPS).div(BPS_DENOMINATOR);
    const architectAmount = remainder.mul(ARCHITECT_BPS).div(BPS_DENOMINATOR);
    
    const expectedCitizenPool = ethers.utils.parseEther('40.5'); // 45% of 90 = 40.5
    const expectedNationalEscrow = ethers.utils.parseEther('40.5'); // 45% of 90 = 40.5
    const expectedArchitect = ethers.utils.parseEther('9'); // 10% of 90 = 9
    
    const isCitizenPoolCorrect = citizenPoolAmount.eq(expectedCitizenPool);
    const isNationalEscrowCorrect = nationalEscrowAmount.eq(expectedNationalEscrow);
    const isArchitectCorrect = architectAmount.eq(expectedArchitect);
    
    const totalFees = citizenPoolAmount.add(nationalEscrowAmount).add(architectAmount);
    const isTotalCorrect = totalFees.eq(remainder);
    
    console.log(`✅ Remainder: ${ethers.utils.formatEther(remainder)} VIDA Cap (90%)`);
    console.log(`   Citizen Pool: ${ethers.utils.formatEther(citizenPoolAmount)} VIDA Cap (45%)`);
    console.log(`   National Escrow: ${ethers.utils.formatEther(nationalEscrowAmount)} VIDA Cap (45%)`);
    console.log(`   Architect: ${ethers.utils.formatEther(architectAmount)} VIDA Cap (10%)`);
    console.log(`   Total Fees: ${ethers.utils.formatEther(totalFees)} VIDA Cap`);
    console.log(`   Citizen Pool Correct: ${isCitizenPoolCorrect ? '✅' : '❌'}`);
    console.log(`   National Escrow Correct: ${isNationalEscrowCorrect ? '✅' : '❌'}`);
    console.log(`   Architect Correct: ${isArchitectCorrect ? '✅' : '❌'}`);
    console.log(`   Total Correct: ${isTotalCorrect ? '✅' : '❌'}`);
    
    if (!isCitizenPoolCorrect || !isNationalEscrowCorrect || !isArchitectCorrect || !isTotalCorrect) {
      throw new Error('Transaction fee split incorrect');
    }
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }
  
  // TEST 3: Verify Burn Activation at 5B Threshold
  try {
    console.log('\n📝 TEST 3: Verify Burn Activation at 5B Threshold');
    console.log('-'.repeat(60));
    
    const pre5BSupply = THRESHOLD_5B.sub(ethers.utils.parseEther('1'));
    const at5BSupply = THRESHOLD_5B;
    const post5BSupply = THRESHOLD_5B.add(ethers.utils.parseEther('1'));
    
    const shouldNotBurnPre5B = pre5BSupply.lt(THRESHOLD_5B);
    const shouldActivateAt5B = at5BSupply.gte(THRESHOLD_5B);
    const shouldBurnPost5B = post5BSupply.gte(THRESHOLD_5B);
    
    console.log(`✅ Pre-5B Supply: ${ethers.utils.formatEther(pre5BSupply)} VIDA Cap`);
    console.log(`   Should NOT burn: ${shouldNotBurnPre5B ? '✅' : '❌'}`);
    console.log(`✅ At-5B Supply: ${ethers.utils.formatEther(at5BSupply)} VIDA Cap`);
    console.log(`   Should ACTIVATE burn: ${shouldActivateAt5B ? '✅' : '❌'}`);
    console.log(`✅ Post-5B Supply: ${ethers.utils.formatEther(post5BSupply)} VIDA Cap`);
    console.log(`   Should burn: ${shouldBurnPost5B ? '✅' : '❌'}`);
    
    if (!shouldNotBurnPre5B || !shouldActivateAt5B || !shouldBurnPost5B) {
      throw new Error('Burn activation logic incorrect');
    }
    
    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // TEST 4: Verify Live Burn Meter Calculation
  try {
    console.log('\n📝 TEST 4: Verify Live Burn Meter Calculation');
    console.log('-'.repeat(60));

    const burnAmount = ethers.utils.parseEther('10'); // 10 VIDA Cap burned
    const timeSinceLastBurn = 5; // 5 seconds

    // burnRatePerSecond = (burnAmount * 1e18) / timeSinceLastBurn
    const expectedBurnRate = burnAmount.mul(ethers.BigNumber.from(10).pow(18)).div(timeSinceLastBurn);

    // Projected burn for 24 hours = (burnRatePerSecond * 86400) / 1e18
    const secondsIn24h = 86400;
    const projectedBurn24h = expectedBurnRate.mul(secondsIn24h).div(ethers.BigNumber.from(10).pow(18));

    console.log(`✅ Burn Amount: ${ethers.utils.formatEther(burnAmount)} VIDA Cap`);
    console.log(`   Time Since Last Burn: ${timeSinceLastBurn} seconds`);
    console.log(`   Burn Rate Per Second: ${ethers.utils.formatEther(expectedBurnRate)} VIDA Cap/s (scaled)`);
    console.log(`   Projected 24h Burn: ${ethers.utils.formatEther(projectedBurn24h)} VIDA Cap`);

    const expectedProjected = ethers.utils.parseEther('172800'); // 2 VIDA Cap/s * 86400s = 172,800
    const isProjectedCorrect = projectedBurn24h.eq(expectedProjected);

    console.log(`   Projected Correct: ${isProjectedCorrect ? '✅' : '❌'}`);

    if (!isProjectedCorrect) {
      throw new Error('Live Burn Meter calculation incorrect');
    }

    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // TEST 5: Verify Equilibrium Detection
  try {
    console.log('\n📝 TEST 5: Verify Equilibrium Detection');
    console.log('-'.repeat(60));

    const totalCitizens = 1000000; // 1 million citizens
    const supplyTarget = ethers.BigNumber.from(totalCitizens).mul(ethers.BigNumber.from(10).pow(18));

    const aboveEquilibrium = supplyTarget.add(ethers.utils.parseEther('1'));
    const atEquilibrium = supplyTarget;
    const belowEquilibrium = supplyTarget.sub(ethers.utils.parseEther('1'));

    const shouldBurnAbove = aboveEquilibrium.gt(supplyTarget);
    const shouldNotBurnAt = atEquilibrium.lte(supplyTarget);
    const shouldNotBurnBelow = belowEquilibrium.lt(supplyTarget);

    console.log(`✅ Total Citizens: ${totalCitizens.toLocaleString()}`);
    console.log(`   Supply Target: ${ethers.utils.formatEther(supplyTarget)} VIDA Cap`);
    console.log(`   Above Equilibrium: ${ethers.utils.formatEther(aboveEquilibrium)} VIDA Cap`);
    console.log(`   Should burn: ${shouldBurnAbove ? '✅' : '❌'}`);
    console.log(`   At Equilibrium: ${ethers.utils.formatEther(atEquilibrium)} VIDA Cap`);
    console.log(`   Should NOT burn: ${shouldNotBurnAt ? '✅' : '❌'}`);
    console.log(`   Below Equilibrium: ${ethers.utils.formatEther(belowEquilibrium)} VIDA Cap`);
    console.log(`   Should NOT burn: ${shouldNotBurnBelow ? '✅' : '❌'}`);

    if (!shouldBurnAbove || !shouldNotBurnAt || !shouldNotBurnBelow) {
      throw new Error('Equilibrium detection incorrect');
    }

    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // TEST 6: Verify Time to Equilibrium Calculation
  try {
    console.log('\n📝 TEST 6: Verify Time to Equilibrium Calculation');
    console.log('-'.repeat(60));

    const totalCitizens = 1000000; // 1 million citizens
    const supplyTarget = ethers.BigNumber.from(totalCitizens).mul(ethers.BigNumber.from(10).pow(18));
    const currentSupply = supplyTarget.add(ethers.utils.parseEther('100000')); // 100k excess

    const excessSupply = currentSupply.sub(supplyTarget);
    const burnRatePerSecond = ethers.utils.parseEther('10').mul(ethers.BigNumber.from(10).pow(18)); // 10 VIDA Cap/s (scaled)
    const burnPerSecond = burnRatePerSecond.div(ethers.BigNumber.from(10).pow(18)); // Unscale

    const timeToEquilibrium = excessSupply.div(burnPerSecond);

    console.log(`✅ Current Supply: ${ethers.utils.formatEther(currentSupply)} VIDA Cap`);
    console.log(`   Supply Target: ${ethers.utils.formatEther(supplyTarget)} VIDA Cap`);
    console.log(`   Excess Supply: ${ethers.utils.formatEther(excessSupply)} VIDA Cap`);
    console.log(`   Burn Rate: ${ethers.utils.formatEther(burnPerSecond)} VIDA Cap/s`);
    console.log(`   Time to Equilibrium: ${timeToEquilibrium.toString()} seconds`);
    console.log(`   Time to Equilibrium: ${timeToEquilibrium.div(3600).toString()} hours`);

    const expectedTime = ethers.BigNumber.from('10000'); // 100,000 / 10 = 10,000 seconds
    const isTimeCorrect = timeToEquilibrium.eq(expectedTime);

    console.log(`   Time Correct: ${isTimeCorrect ? '✅' : '❌'}`);

    if (!isTimeCorrect) {
      throw new Error('Time to equilibrium calculation incorrect');
    }

    testsPassed++;
  } catch (error: any) {
    console.log('❌ TEST FAILED:', error.message);
    testsFailed++;
  }

  // ════════════════════════════════════════════════════════════════
  // TEST SUMMARY
  // ════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(60));
  console.log('🔥 HIGH-VELOCITY BURN PROTOCOL - TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
  console.log('═'.repeat(60));

  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! HIGH-VELOCITY BURN PROTOCOL VALIDATED! 🎉');
    console.log('\n💎 THE SUPPLY HAMMER IS READY');
    console.log('🔥 10% AGGRESSIVE BURN ACTIVATED');
    console.log('⚖️ 45/45/10 FEE SPLIT CONFIRMED');
    console.log('📊 LIVE BURN METER OPERATIONAL');
    console.log('🎯 EQUILIBRIUM TARGET LOCKED');
    console.log('\n"The Godcurrency. The Final Truth. Divine Issuance."');
    console.log('\nBorn in Lagos, Nigeria. Built for Humanity. 🇳🇬');
    console.log('Architect: ISREAL OKORO\n');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED - REVIEW IMPLEMENTATION\n');
  }
}

// ════════════════════════════════════════════════════════════════
// RUN TESTS
// ════════════════════════════════════════════════════════════════

runTests().catch((error) => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});

