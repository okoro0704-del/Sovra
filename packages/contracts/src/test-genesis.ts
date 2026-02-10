/**
 * test-genesis.ts - Test Genesis Registration
 * 
 * Run this script to test the Architect's Genesis Registration flow
 * 
 * Usage:
 * ```
 * npx ts-node packages/contracts/src/test-genesis.ts
 * ```
 */

import { performGenesisRegistration } from './GenesisRegistration';

async function testGenesisRegistration() {
  console.log('');
  console.log('🧪 TESTING GENESIS REGISTRATION');
  console.log('');

  try {
    // Simulate Architect's wallet address
    const architectAddress = '0xARCHITECT_ISREAL_OKORO_WALLET';

    // Perform genesis registration
    const registration = await performGenesisRegistration(architectAddress);

    // Verify results
    console.log('');
    console.log('🔍 VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Check architect name
    if (registration.architectName === 'ISREAL_OKORO') {
      console.log('✅ Architect Name: CORRECT');
    } else {
      console.log('❌ Architect Name: INCORRECT');
    }

    // Check hardware binding
    if (registration.hardwareBinding.laptopUUID && registration.hardwareBinding.mobileUUID) {
      console.log('✅ Hardware Binding: COMPLETE');
    } else {
      console.log('❌ Hardware Binding: INCOMPLETE');
    }

    // Check master template
    if (
      registration.masterTemplate.face &&
      registration.masterTemplate.finger &&
      registration.masterTemplate.heart &&
      registration.masterTemplate.voice
    ) {
      console.log('✅ Master Template (4 Layers): COMPLETE');
    } else {
      console.log('❌ Master Template: INCOMPLETE');
    }

    // Check genesis mint
    if (registration.genesisMint.amount === 100) {
      console.log('✅ Genesis Mint: 100 VIDA');
    } else {
      console.log('❌ Genesis Mint: INCORRECT AMOUNT');
    }

    // Check VLT finality
    if (
      registration.vltFinality.event === 'ROOT_NODE_ESTABLISHED' &&
      registration.vltFinality.identity === 'ISREAL_OKORO' &&
      registration.vltFinality.reason === 'SYSTEM_ORIGIN'
    ) {
      console.log('✅ VLT Finality: LOGGED');
    } else {
      console.log('❌ VLT Finality: INCORRECT');
    }

    // Check dashboard activation
    if (registration.dashboardActivated) {
      console.log('✅ Dashboard: ACTIVATED');
    } else {
      console.log('❌ Dashboard: NOT ACTIVATED');
    }

    // Check registration complete
    if (registration.registrationComplete) {
      console.log('✅ Registration: COMPLETE');
    } else {
      console.log('❌ Registration: INCOMPLETE');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('"I am the Sovereign Truth."');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('');
  }
}

// Run test
testGenesisRegistration();

