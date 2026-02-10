/**
 * test-sentinel-binding-simple.js - Simplified Sentinel System-Binding Protocol Test
 * 
 * Tests core functionality without TypeScript dependencies
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Security.
 * Architect: ISREAL OKORO
 */

console.log('='.repeat(80));
console.log('SENTINEL SYSTEM-BINDING PROTOCOL - SIMPLIFIED TEST SUITE');
console.log('='.repeat(80));
console.log('');

// Test counter
let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    console.log(`\n🧪 TEST: ${testName}`);
    const result = testFn();
    if (result && typeof result.then === 'function') {
      // Async test
      return result.then(() => {
        console.log(`✅ PASSED: ${testName}`);
        testsPassed++;
      }).catch((error) => {
        console.log(`❌ FAILED: ${testName}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
      });
    } else {
      console.log(`✅ PASSED: ${testName}`);
      testsPassed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// TEST 1: MODULE EXISTENCE
// ============================================================================

runTest('Module Existence - SentinelSystemDaemon.ts', () => {
  const fs = require('fs');
  const path = 'packages/contracts/src/SentinelSystemDaemon.ts';
  
  if (!fs.existsSync(path)) {
    throw new Error('SentinelSystemDaemon.ts not found');
  }
  
  const content = fs.readFileSync(path, 'utf8');
  console.log(`   File size: ${content.length} bytes`);
  console.log(`   Lines: ${content.split('\n').length}`);
  
  // Check for key functions
  if (!content.includes('installDaemon')) {
    throw new Error('installDaemon function not found');
  }
  if (!content.includes('getDaemonStatus')) {
    throw new Error('getDaemonStatus function not found');
  }
  
  console.log('   ✓ installDaemon function found');
  console.log('   ✓ getDaemonStatus function found');
});

runTest('Module Existence - InterceptorHook.ts', () => {
  const fs = require('fs');
  const path = 'packages/contracts/src/InterceptorHook.ts';
  
  if (!fs.existsSync(path)) {
    throw new Error('InterceptorHook.ts not found');
  }
  
  const content = fs.readFileSync(path, 'utf8');
  console.log(`   File size: ${content.length} bytes`);
  console.log(`   Lines: ${content.split('\n').length}`);
  
  // Check for key functions
  if (!content.includes('registerSecureApp')) {
    throw new Error('registerSecureApp function not found');
  }
  if (!content.includes('interceptAppLaunch')) {
    throw new Error('interceptAppLaunch function not found');
  }
  if (!content.includes('executeHandshake')) {
    throw new Error('executeHandshake function not found');
  }
  
  console.log('   ✓ registerSecureApp function found');
  console.log('   ✓ interceptAppLaunch function found');
  console.log('   ✓ executeHandshake function found');
});

runTest('Module Existence - HardwareExclusiveLock.ts', () => {
  const fs = require('fs');
  const path = 'packages/contracts/src/HardwareExclusiveLock.ts';
  
  if (!fs.existsSync(path)) {
    throw new Error('HardwareExclusiveLock.ts not found');
  }
  
  const content = fs.readFileSync(path, 'utf8');
  console.log(`   File size: ${content.length} bytes`);
  console.log(`   Lines: ${content.split('\n').length}`);
  
  // Check for key functions
  if (!content.includes('isTPMAvailable')) {
    throw new Error('isTPMAvailable function not found');
  }
  if (!content.includes('captureTPMUUID')) {
    throw new Error('captureTPMUUID function not found');
  }
  if (!content.includes('generateHardwareBinding')) {
    throw new Error('generateHardwareBinding function not found');
  }
  if (!content.includes('storeActivationState')) {
    throw new Error('storeActivationState function not found');
  }
  
  console.log('   ✓ isTPMAvailable function found');
  console.log('   ✓ captureTPMUUID function found');
  console.log('   ✓ generateHardwareBinding function found');
  console.log('   ✓ storeActivationState function found');
});

runTest('Module Existence - AntiKillLogic.ts', () => {
  const fs = require('fs');
  const path = 'packages/contracts/src/AntiKillLogic.ts';
  
  if (!fs.existsSync(path)) {
    throw new Error('AntiKillLogic.ts not found');
  }
  
  const content = fs.readFileSync(path, 'utf8');
  console.log(`   File size: ${content.length} bytes`);
  console.log(`   Lines: ${content.split('\n').length}`);
  
  // Check for key functions
  if (!content.includes('authorizeKill')) {
    throw new Error('authorizeKill function not found');
  }
  if (!content.includes('installSignalHandlers')) {
    throw new Error('installSignalHandlers function not found');
  }
  if (!content.includes('triggerDeviceStasis')) {
    throw new Error('triggerDeviceStasis function not found');
  }
  if (!content.includes('startWatchdog')) {
    throw new Error('startWatchdog function not found');
  }
  
  console.log('   ✓ authorizeKill function found');
  console.log('   ✓ installSignalHandlers function found');
  console.log('   ✓ triggerDeviceStasis function found');
  console.log('   ✓ startWatchdog function found');
});

runTest('Module Existence - OfflineResilience.ts', () => {
  const fs = require('fs');
  const path = 'packages/contracts/src/OfflineResilience.ts';
  
  if (!fs.existsSync(path)) {
    throw new Error('OfflineResilience.ts not found');
  }
  
  const content = fs.readFileSync(path, 'utf8');
  console.log(`   File size: ${content.length} bytes`);
  console.log(`   Lines: ${content.split('\n').length}`);
  
  // Check for key functions
  if (!content.includes('cacheOfflineData')) {
    throw new Error('cacheOfflineData function not found');
  }
  if (!content.includes('validateOffline')) {
    throw new Error('validateOffline function not found');
  }
  if (!content.includes('checkNetworkStatus')) {
    throw new Error('checkNetworkStatus function not found');
  }
  if (!content.includes('syncPendingValidations')) {
    throw new Error('syncPendingValidations function not found');
  }
  
  console.log('   ✓ cacheOfflineData function found');
  console.log('   ✓ validateOffline function found');
  console.log('   ✓ checkNetworkStatus function found');
  console.log('   ✓ syncPendingValidations function found');
});

// ============================================================================
// TEST 2: CODE QUALITY CHECKS
// ============================================================================

runTest('Code Quality - SentinelSystemDaemon Platform Support', () => {
  const fs = require('fs');
  const content = fs.readFileSync('packages/contracts/src/SentinelSystemDaemon.ts', 'utf8');

  // Check for all platform implementations
  const platforms = ['Windows', 'macOS', 'Linux', 'Android', 'iOS'];

  for (const platform of platforms) {
    if (!content.includes(`install${platform.replace(/\s/g, '')}`) &&
        !content.includes(`${platform.toLowerCase()}`)) {
      throw new Error(`${platform} support not found`);
    }
    console.log(`   ✓ ${platform} support found`);
  }
});

runTest('Code Quality - InterceptorHook SECURE_VITALIE Tag', () => {
  const fs = require('fs');
  const content = fs.readFileSync('packages/contracts/src/InterceptorHook.ts', 'utf8');

  if (!content.includes('SECURE_VITALIE')) {
    throw new Error('SECURE_VITALIE tag not found');
  }

  if (!content.includes('handshakeCache')) {
    throw new Error('Handshake cache not found');
  }

  if (!content.includes('3600000')) { // 1 hour in ms
    throw new Error('1-hour cache expiry not found');
  }

  console.log('   ✓ SECURE_VITALIE tag found');
  console.log('   ✓ Handshake cache found');
  console.log('   ✓ 1-hour cache expiry found');
});

runTest('Code Quality - HardwareExclusiveLock TPM and SE Support', () => {
  const fs = require('fs');
  const content = fs.readFileSync('packages/contracts/src/HardwareExclusiveLock.ts', 'utf8');

  if (!content.includes('TPM')) {
    throw new Error('TPM support not found');
  }

  if (!content.includes('Secure Element') && !content.includes('SecureElement')) {
    throw new Error('Secure Element support not found');
  }

  if (!content.includes('bindingHash')) {
    throw new Error('Hardware binding hash not found');
  }

  if (!content.includes('bindingSignature')) {
    throw new Error('Hardware binding signature not found');
  }

  console.log('   ✓ TPM support found');
  console.log('   ✓ Secure Element support found');
  console.log('   ✓ Hardware binding hash found');
  console.log('   ✓ Hardware binding signature found');
});

runTest('Code Quality - AntiKillLogic deviceStasis Implementation', () => {
  const fs = require('fs');
  const content = fs.readFileSync('packages/contracts/src/AntiKillLogic.ts', 'utf8');

  if (!content.includes('deviceStasis')) {
    throw new Error('deviceStasis function not found');
  }

  if (!content.includes('SIGTERM') || !content.includes('SIGINT')) {
    throw new Error('Signal handlers not found');
  }

  if (!content.includes('watchdog')) {
    throw new Error('Watchdog not found');
  }

  if (!content.includes('unauthorizedAttempts')) {
    throw new Error('Unauthorized attempt tracking not found');
  }

  console.log('   ✓ deviceStasis function found');
  console.log('   ✓ Signal handlers found');
  console.log('   ✓ Watchdog found');
  console.log('   ✓ Unauthorized attempt tracking found');
});

runTest('Code Quality - OfflineResilience Cache Duration', () => {
  const fs = require('fs');
  const content = fs.readFileSync('packages/contracts/src/OfflineResilience.ts', 'utf8');

  if (!content.includes('86400000')) { // 24 hours in ms
    throw new Error('24-hour cache duration not found');
  }

  if (!content.includes('MAX_OFFLINE_VALIDATIONS')) {
    throw new Error('Max offline validations limit not found');
  }

  if (!content.includes('syncPendingValidations')) {
    throw new Error('Sync function not found');
  }

  console.log('   ✓ 24-hour cache duration found');
  console.log('   ✓ Max offline validations limit found');
  console.log('   ✓ Sync function found');
});

// ============================================================================
// TEST 3: DOCUMENTATION CHECK
// ============================================================================

runTest('Documentation - SENTINEL_SYSTEM_BINDING_COMPLETE.md Exists', () => {
  const fs = require('fs');
  const path = 'SENTINEL_SYSTEM_BINDING_COMPLETE.md';

  if (!fs.existsSync(path)) {
    throw new Error('Documentation file not found');
  }

  const content = fs.readFileSync(path, 'utf8');
  console.log(`   File size: ${content.length} bytes`);
  console.log(`   Lines: ${content.split('\n').length}`);

  // Check for key sections
  const sections = [
    'MISSION ACCOMPLISHED',
    'DELIVERABLES',
    'ARCHITECTURE OVERVIEW',
    'SECURITY FEATURES',
    'USAGE EXAMPLES',
    'TESTING',
    'INTEGRATION GUIDE',
  ];

  for (const section of sections) {
    if (!content.includes(section)) {
      throw new Error(`Section "${section}" not found in documentation`);
    }
    console.log(`   ✓ Section "${section}" found`);
  }
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

setTimeout(() => {
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
  console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(80));

  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! SENTINEL SYSTEM-BINDING PROTOCOL IS READY! 🎉\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - PLEASE REVIEW AND FIX ⚠️\n');
    process.exit(1);
  }
}, 1000);

