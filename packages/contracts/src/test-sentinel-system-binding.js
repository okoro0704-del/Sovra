/**
 * test-sentinel-system-binding.js - Sentinel System-Binding Protocol Test Suite
 * 
 * Comprehensive tests for:
 * - Daemon Initialization
 * - App-Wrapper Engine (InterceptorHook)
 * - Hardware Exclusive Lock
 * - Anti-Kill Logic
 * - Offline Resilience
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Security.
 * Architect: ISREAL OKORO
 */

console.log('='.repeat(80));
console.log('SENTINEL SYSTEM-BINDING PROTOCOL - TEST SUITE');
console.log('='.repeat(80));
console.log('');

// Test counter
let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    console.log(`\n🧪 TEST: ${testName}`);
    testFn();
    console.log(`✅ PASSED: ${testName}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// TEST 1: DAEMON INITIALIZATION
// ============================================================================

runTest('Daemon Initialization - Platform Detection', () => {
  const { detectPlatform, Platform } = require('./SentinelSystemDaemon.ts');
  
  const platform = detectPlatform();
  console.log(`   Detected platform: ${platform}`);
  
  if (!Object.values(Platform).includes(platform)) {
    throw new Error('Invalid platform detected');
  }
});

runTest('Daemon Initialization - Daemon Status', async () => {
  const { getDaemonStatus } = require('./SentinelSystemDaemon.ts');
  
  const status = await getDaemonStatus();
  console.log(`   Daemon installed: ${status.isInstalled}`);
  console.log(`   Daemon running: ${status.isRunning}`);
  console.log(`   Daemon enabled: ${status.isEnabled}`);
  
  // Status should have required fields
  if (typeof status.isRunning !== 'boolean') {
    throw new Error('Invalid daemon status');
  }
});

// ============================================================================
// TEST 2: APP-WRAPPER ENGINE (INTERCEPTOR HOOK)
// ============================================================================

runTest('InterceptorHook - App Registration', () => {
  const { registerSecureApp, isSecureVitalieApp, SECURE_VITALIE_TAG } = require('./InterceptorHook.ts');
  
  const appMetadata = {
    appId: 'test.app.1',
    appName: 'Test App',
    packageName: 'com.vitalia.testapp',
    executablePath: '/usr/bin/testapp',
    isSecureVitalie: true,
    requiresHandshake: true,
  };
  
  registerSecureApp(appMetadata);
  
  const isSecure = isSecureVitalieApp('test.app.1');
  console.log(`   App registered as SECURE_VITALIE: ${isSecure}`);
  
  if (!isSecure) {
    throw new Error('App registration failed');
  }
});

runTest('InterceptorHook - App Launch Interception (No Handshake)', () => {
  const { interceptAppLaunch } = require('./InterceptorHook.ts');
  
  const result = interceptAppLaunch('test.app.1');
  console.log(`   Launch allowed: ${result.allowed}`);
  console.log(`   Handshake required: ${result.handshakeRequired}`);
  console.log(`   Reason: ${result.reason}`);
  
  // Should be blocked (no handshake completed)
  if (result.allowed) {
    throw new Error('App launch should be blocked without handshake');
  }
});

runTest('InterceptorHook - Get App Handshake Status', () => {
  const { getAppHandshakeStatus } = require('./InterceptorHook.ts');
  
  const status = getAppHandshakeStatus('test.app.1');
  console.log(`   Registered: ${status.isRegistered}`);
  console.log(`   Requires handshake: ${status.requiresHandshake}`);
  console.log(`   Handshake cached: ${status.handshakeCached}`);
  
  if (!status.isRegistered) {
    throw new Error('App should be registered');
  }
});

runTest('InterceptorHook - Interception Statistics', () => {
  const { getInterceptionStats } = require('./InterceptorHook.ts');
  
  const stats = getInterceptionStats();
  console.log(`   Total apps: ${stats.totalApps}`);
  console.log(`   Secure apps: ${stats.secureApps}`);
  console.log(`   Cached handshakes: ${stats.cachedHandshakes}`);
  
  if (stats.totalApps === 0) {
    throw new Error('Should have at least one registered app');
  }
});

// ============================================================================
// TEST 3: HARDWARE EXCLUSIVE LOCK
// ============================================================================

runTest('HardwareExclusiveLock - TPM Availability', async () => {
  const { isTPMAvailable, getTPMInfo } = require('./HardwareExclusiveLock.ts');
  
  const available = await isTPMAvailable();
  console.log(`   TPM available: ${available}`);
  
  const info = await getTPMInfo();
  console.log(`   TPM version: ${info.version}`);
  console.log(`   TPM manufacturer: ${info.manufacturer}`);
});

runTest('HardwareExclusiveLock - TPM UUID Capture', async () => {
  const { captureTPMUUID } = require('./HardwareExclusiveLock.ts');
  
  const tpmUUID = await captureTPMUUID();
  console.log(`   TPM UUID: ${tpmUUID.substring(0, 20)}...`);
  
  if (!tpmUUID.startsWith('0x')) {
    throw new Error('TPM UUID should start with 0x');
  }
});

runTest('HardwareExclusiveLock - Secure Element Availability', async () => {
  const { isSecureElementAvailable, getSecureElementInfo } = require('./HardwareExclusiveLock.ts');
  
  const available = await isSecureElementAvailable();
  console.log(`   Secure Element available: ${available}`);
  
  const info = await getSecureElementInfo();
  console.log(`   SE type: ${info.type}`);
  console.log(`   Attestation supported: ${info.attestationSupported}`);
});

runTest('HardwareExclusiveLock - Secure Element UUID Capture', async () => {
  const { captureSecureElementUUID } = require('./HardwareExclusiveLock.ts');
  
  const seUUID = await captureSecureElementUUID();
  console.log(`   SE UUID: ${seUUID.substring(0, 20)}...`);
  
  if (!seUUID.startsWith('0x')) {
    throw new Error('SE UUID should start with 0x');
  }
});

runTest('HardwareExclusiveLock - Hardware Binding Generation', async () => {
  const { generateHardwareBinding } = require('./HardwareExclusiveLock.ts');
  const crypto = require('crypto');

  // Generate test key pair
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });

  const binding = await generateHardwareBinding(privateKey);
  console.log(`   TPM UUID: ${binding.tpmUUID.substring(0, 20)}...`);
  console.log(`   SE UUID: ${binding.secureElementUUID.substring(0, 20)}...`);
  console.log(`   Binding hash: ${binding.bindingHash.substring(0, 20)}...`);
  console.log(`   Binding timestamp: ${new Date(binding.bindingTimestamp).toISOString()}`);

  if (!binding.bindingHash.startsWith('0x')) {
    throw new Error('Binding hash should start with 0x');
  }
});

runTest('HardwareExclusiveLock - Activation State Persistence', async () => {
  const { storeActivationState, loadActivationState, clearActivationState } = require('./HardwareExclusiveLock.ts');
  const { generateHardwareBinding } = require('./HardwareExclusiveLock.ts');
  const crypto = require('crypto');

  // Generate test key pair
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });

  const binding = await generateHardwareBinding(privateKey);

  const state = {
    isActivated: true,
    activatedAt: Date.now(),
    hardwareBinding: binding,
    lastVerifiedAt: Date.now(),
  };

  // Store
  await storeActivationState(state);
  console.log('   Activation state stored');

  // Load
  const loadedState = await loadActivationState();
  console.log(`   Activation state loaded: ${loadedState ? 'YES' : 'NO'}`);

  if (!loadedState || !loadedState.isActivated) {
    throw new Error('Failed to load activation state');
  }

  // Clear
  await clearActivationState();
  console.log('   Activation state cleared');
});

// ============================================================================
// TEST 4: ANTI-KILL LOGIC
// ============================================================================

runTest('AntiKillLogic - Signal Handler Installation', () => {
  const { installSignalHandlers } = require('./AntiKillLogic.ts');

  installSignalHandlers();
  console.log('   Signal handlers installed');
});

runTest('AntiKillLogic - Kill Authorization (No Handshake)', () => {
  const { authorizeKill } = require('./AntiKillLogic.ts');

  // Mock authorization request (invalid signature)
  const request = {
    signature: {
      faceLayer: { geometry: '0x00', ppgBloodFlow: '0x00', timestamp: Date.now() },
      fingerLayer: { ridgePattern: '0x00', livenessDetection: '0x00', timestamp: Date.now() },
      heartLayer: { rppgSignal: '0x00', hrv: '0x00', timestamp: Date.now() },
      voiceLayer: { spectralResonance: '0x00', boneConduction: '0x00', timestamp: Date.now() },
      temporalSync: { cohesionWindow: 1500, isValid: false },
    },
    deviceBioChain: {
      laptopUUID: '0x00',
      mobileSecureElement: '0x00',
      chainHash: '0x00',
      chainTimestamp: Date.now(),
      chainSignature: '0x00',
    },
    expectedLaptopUUID: '0x00',
    expectedMobileUUID: '0x00',
    authorizedAt: Date.now(),
    expiresAt: Date.now() + 30000,
  };

  const authId = authorizeKill(request);
  console.log(`   Authorization ID: ${authId || 'DENIED'}`);

  // Should be denied (invalid signature)
  if (authId) {
    throw new Error('Kill authorization should be denied with invalid signature');
  }
});

runTest('AntiKillLogic - Device Stasis Check', () => {
  const { isDeviceInStasis } = require('./AntiKillLogic.ts');

  const inStasis = isDeviceInStasis();
  console.log(`   Device in stasis: ${inStasis}`);
});

runTest('AntiKillLogic - Watchdog Start/Stop', () => {
  const { startWatchdog, stopWatchdog } = require('./AntiKillLogic.ts');

  startWatchdog();
  console.log('   Watchdog started');

  stopWatchdog();
  console.log('   Watchdog stopped');
});

runTest('AntiKillLogic - Signal History', () => {
  const { getSignalHistory, getUnauthorizedAttemptCount } = require('./AntiKillLogic.ts');

  const history = getSignalHistory();
  const attempts = getUnauthorizedAttemptCount();

  console.log(`   Signal history entries: ${history.length}`);
  console.log(`   Unauthorized attempts: ${attempts}`);
});

// ============================================================================
// TEST 5: OFFLINE RESILIENCE
// ============================================================================

runTest('OfflineResilience - Network Status Check', () => {
  const { checkNetworkStatus, getNetworkStatus } = require('./OfflineResilience.ts');

  const isOnline = checkNetworkStatus();
  console.log(`   Network online: ${isOnline}`);

  const status = getNetworkStatus();
  console.log(`   Last checked: ${new Date(status.lastCheckedAt).toISOString()}`);
  console.log(`   Last online: ${new Date(status.lastOnlineAt).toISOString()}`);
});

runTest('OfflineResilience - Offline Cache Management', () => {
  const { cacheOfflineData, getCachedOfflineData, clearOfflineCache } = require('./OfflineResilience.ts');

  const citizenAddress = '0x1234567890abcdef';
  const publicKey = '0xpublickey';

  const signature = {
    faceLayer: { geometry: '0x00', ppgBloodFlow: '0x00', timestamp: Date.now() },
    fingerLayer: { ridgePattern: '0x00', livenessDetection: '0x00', timestamp: Date.now() },
    heartLayer: { rppgSignal: '0x00', hrv: '0x00', timestamp: Date.now() },
    voiceLayer: { spectralResonance: '0x00', boneConduction: '0x00', timestamp: Date.now() },
    temporalSync: { cohesionWindow: 1500, isValid: true },
  };

  const deviceBioChain = {
    laptopUUID: '0x00',
    mobileSecureElement: '0x00',
    chainHash: '0x00',
    chainTimestamp: Date.now(),
    chainSignature: '0x00',
  };

  // Cache data
  cacheOfflineData(citizenAddress, publicKey, signature, deviceBioChain);
  console.log('   Offline data cached');

  // Get cached data
  const cached = getCachedOfflineData(citizenAddress);
  console.log(`   Cached data retrieved: ${cached ? 'YES' : 'NO'}`);

  if (!cached) {
    throw new Error('Failed to retrieve cached data');
  }

  // Clear cache
  clearOfflineCache(citizenAddress);
  console.log('   Offline cache cleared');
});

runTest('OfflineResilience - Load Offline Cache from Disk', () => {
  const { loadOfflineCache } = require('./OfflineResilience.ts');

  loadOfflineCache();
  console.log('   Offline cache loaded from disk');
});

runTest('OfflineResilience - Sync Status', () => {
  const { getSyncStatus } = require('./OfflineResilience.ts');

  const status = getSyncStatus();
  console.log(`   Is syncing: ${status.isSyncing}`);
  console.log(`   Pending validations: ${status.pendingValidations}`);
  console.log(`   Last sync: ${status.lastSyncAt ? new Date(status.lastSyncAt).toISOString() : 'Never'}`);
});

runTest('OfflineResilience - Offline Statistics', () => {
  const { getOfflineStats } = require('./OfflineResilience.ts');

  const stats = getOfflineStats();
  console.log(`   Cached citizens: ${stats.cachedCitizens}`);
  console.log(`   Pending validations: ${stats.pendingValidations}`);
  console.log(`   Is online: ${stats.isOnline}`);
  console.log(`   Last sync: ${stats.lastSyncAt ? new Date(stats.lastSyncAt).toISOString() : 'Never'}`);
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

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

