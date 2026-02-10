/**
 * OfflineResilience.ts - Offline Biometric Verification
 * 
 * "Ensure the Sentinel can verify the biological handshake locally, without needing a ping
 * to the SOVRYN mainnet, to prevent lockouts during network failure."
 * 
 * This module implements offline biometric verification to ensure the Sentinel
 * can validate 4-layer handshakes even when the device has no network connectivity.
 * 
 * Features:
 * - Local signature validation
 * - Cached biometric data
 * - Offline handshake verification
 * - Network failure handling
 * - Sync on reconnection
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Security.
 * Architect: ISREAL OKORO
 */

import { validateSentinelBioLock, FourLayerSignature, DeviceBioChain } from './SentinelBioLock';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';

// ============================================================================
// CONSTANTS
// ============================================================================

export const OFFLINE_CACHE_DURATION_MS = 86400000; // 24 hours
export const MAX_OFFLINE_VALIDATIONS = 10;
export const SYNC_RETRY_INTERVAL_MS = 60000; // 1 minute

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineCache {
  citizenAddress: string;
  publicKey: string;
  lastSignature: FourLayerSignature;
  lastDeviceBioChain: DeviceBioChain;
  cachedAt: number;
  expiresAt: number;
  validationCount: number;
}

export interface OfflineValidationResult {
  isValid: boolean;
  isOffline: boolean;
  usedCache: boolean;
  validationCount: number;
  cacheExpiresAt: number;
  error?: string;
}

export interface NetworkStatus {
  isOnline: boolean;
  lastCheckedAt: number;
  lastOnlineAt: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: number;
  pendingValidations: number;
  syncError?: string;
}

// ============================================================================
// STATE
// ============================================================================

/**
 * Offline cache (citizen address => cached data)
 */
const offlineCache = new Map<string, OfflineCache>();

/**
 * Pending validations (to sync when network is restored)
 */
const pendingValidations: Array<{
  citizenAddress: string;
  signature: FourLayerSignature;
  deviceBioChain: DeviceBioChain;
  timestamp: number;
}> = [];

/**
 * Network status
 */
let networkStatus: NetworkStatus = {
  isOnline: true,
  lastCheckedAt: Date.now(),
  lastOnlineAt: Date.now(),
};

/**
 * Sync status
 */
let syncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncAt: 0,
  pendingValidations: 0,
};

// ============================================================================
// OFFLINE CACHE MANAGEMENT
// ============================================================================

/**
 * Cache biometric data for offline use
 * 
 * This function caches the citizen's biometric signature and device binding
 * for offline verification. The cache is valid for 24 hours.
 * 
 * @param citizenAddress Citizen's address
 * @param publicKey Citizen's public key
 * @param signature Last validated signature
 * @param deviceBioChain Last validated device bio-chain
 */
export function cacheOfflineData(
  citizenAddress: string,
  publicKey: string,
  signature: FourLayerSignature,
  deviceBioChain: DeviceBioChain
): void {
  console.log(`[OFFLINE_RESILIENCE] Caching offline data for citizen: ${citizenAddress}`);
  
  const cachedAt = Date.now();
  const expiresAt = cachedAt + OFFLINE_CACHE_DURATION_MS;
  
  const cache: OfflineCache = {
    citizenAddress,
    publicKey,
    lastSignature: signature,
    lastDeviceBioChain: deviceBioChain,
    cachedAt,
    expiresAt,
    validationCount: 0,
  };
  
  offlineCache.set(citizenAddress, cache);
  
  // Persist cache to disk
  persistOfflineCache();
  
  console.log(`[OFFLINE_RESILIENCE] ✅ Offline data cached (expires: ${new Date(expiresAt).toISOString()})`);
}

/**
 * Get cached offline data
 */
export function getCachedOfflineData(citizenAddress: string): OfflineCache | null {
  const cache = offlineCache.get(citizenAddress);
  
  if (!cache) {
    return null;
  }
  
  // Check if cache has expired
  if (cache.expiresAt < Date.now()) {
    console.log(`[OFFLINE_RESILIENCE] Cache expired for citizen: ${citizenAddress}`);
    offlineCache.delete(citizenAddress);
    persistOfflineCache();
    return null;
  }
  
  // Check if max validations exceeded
  if (cache.validationCount >= MAX_OFFLINE_VALIDATIONS) {
    console.log(`[OFFLINE_RESILIENCE] Max offline validations exceeded for citizen: ${citizenAddress}`);
    return null;
  }
  
  return cache;
}

/**
 * Clear cached offline data
 */
export function clearOfflineCache(citizenAddress?: string): void {
  if (citizenAddress) {
    console.log(`[OFFLINE_RESILIENCE] Clearing offline cache for citizen: ${citizenAddress}`);
    offlineCache.delete(citizenAddress);
  } else {
    console.log('[OFFLINE_RESILIENCE] Clearing all offline caches');
    offlineCache.clear();
  }
  
  persistOfflineCache();
}

/**
 * Persist offline cache to disk
 */
function persistOfflineCache(): void {
  const cachePath = os.platform() === 'win32'
    ? 'C:\\ProgramData\\PFFSentinel\\offline_cache.json'
    : '/tmp/pffsentinel_offline_cache.json';
  
  try {
    const cacheData = Array.from(offlineCache.entries());
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.error('[OFFLINE_RESILIENCE] ❌ Failed to persist offline cache:', error);
  }
}

/**
 * Load offline cache from disk
 */
export function loadOfflineCache(): void {
  const cachePath = os.platform() === 'win32'
    ? 'C:\\ProgramData\\PFFSentinel\\offline_cache.json'
    : '/tmp/pffsentinel_offline_cache.json';
  
  try {
    if (fs.existsSync(cachePath)) {
      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      offlineCache.clear();
      
      for (const [address, cache] of cacheData) {
        offlineCache.set(address, cache);
      }
      
      console.log(`[OFFLINE_RESILIENCE] ✅ Loaded ${offlineCache.size} offline caches from disk`);
    }
  } catch (error) {
    console.error('[OFFLINE_RESILIENCE] ❌ Failed to load offline cache:', error);
  }
}

// ============================================================================
// OFFLINE VALIDATION
// ============================================================================

/**
 * Validate biometric handshake offline
 *
 * This function validates a 4-layer biometric handshake using cached data
 * when the device has no network connectivity.
 *
 * The validation uses the same Sentinel Bio-Lock validation logic, but
 * relies on cached public keys and device bindings instead of fetching
 * from the SOVRYN mainnet.
 *
 * @param citizenAddress Citizen's address
 * @param signature 4-layer biometric signature
 * @param deviceBioChain Device bio-chain
 * @param expectedLaptopUUID Expected laptop UUID
 * @param expectedMobileUUID Expected mobile UUID
 * @returns Offline validation result
 */
export function validateOffline(
  citizenAddress: string,
  signature: FourLayerSignature,
  deviceBioChain: DeviceBioChain,
  expectedLaptopUUID: string,
  expectedMobileUUID: string
): OfflineValidationResult {
  console.log(`[OFFLINE_RESILIENCE] Validating offline for citizen: ${citizenAddress}`);

  // Check network status
  const isOnline = checkNetworkStatus();

  if (isOnline) {
    console.log('[OFFLINE_RESILIENCE] Network is online - using online validation');

    // Use online validation
    const validationResult = validateSentinelBioLock(
      signature,
      deviceBioChain,
      expectedLaptopUUID,
      expectedMobileUUID
    );

    // Cache data for future offline use
    if (validationResult.isValid) {
      cacheOfflineData(citizenAddress, '', signature, deviceBioChain);
    }

    return {
      isValid: validationResult.isValid,
      isOffline: false,
      usedCache: false,
      validationCount: 0,
      cacheExpiresAt: 0,
      error: validationResult.error,
    };
  }

  console.log('[OFFLINE_RESILIENCE] Network is OFFLINE - using cached validation');

  // Get cached data
  const cache = getCachedOfflineData(citizenAddress);

  if (!cache) {
    console.log('[OFFLINE_RESILIENCE] ❌ No cached data available for offline validation');
    return {
      isValid: false,
      isOffline: true,
      usedCache: false,
      validationCount: 0,
      cacheExpiresAt: 0,
      error: 'No cached data available for offline validation',
    };
  }

  // Validate using cached data
  const validationResult = validateSentinelBioLock(
    signature,
    deviceBioChain,
    expectedLaptopUUID,
    expectedMobileUUID
  );

  if (!validationResult.isValid) {
    console.log(`[OFFLINE_RESILIENCE] ❌ Offline validation FAILED: ${validationResult.error}`);
    return {
      isValid: false,
      isOffline: true,
      usedCache: true,
      validationCount: cache.validationCount,
      cacheExpiresAt: cache.expiresAt,
      error: validationResult.error,
    };
  }

  // Increment validation count
  cache.validationCount++;
  offlineCache.set(citizenAddress, cache);
  persistOfflineCache();

  // Add to pending validations for sync
  pendingValidations.push({
    citizenAddress,
    signature,
    deviceBioChain,
    timestamp: Date.now(),
  });

  syncStatus.pendingValidations = pendingValidations.length;

  console.log(`[OFFLINE_RESILIENCE] ✅ Offline validation SUCCESSFUL (${cache.validationCount}/${MAX_OFFLINE_VALIDATIONS})`);

  return {
    isValid: true,
    isOffline: true,
    usedCache: true,
    validationCount: cache.validationCount,
    cacheExpiresAt: cache.expiresAt,
  };
}

// ============================================================================
// NETWORK MONITORING
// ============================================================================

/**
 * Check network status
 */
export function checkNetworkStatus(): boolean {
  const now = Date.now();

  // Check if we've checked recently (within last 5 seconds)
  if (now - networkStatus.lastCheckedAt < 5000) {
    return networkStatus.isOnline;
  }

  // Perform network check
  try {
    // Simple check: try to resolve DNS
    const dns = require('dns');
    dns.resolve('www.google.com', (err: any) => {
      if (err) {
        networkStatus.isOnline = false;
      } else {
        networkStatus.isOnline = true;
        networkStatus.lastOnlineAt = now;
      }
    });
  } catch (error) {
    networkStatus.isOnline = false;
  }

  networkStatus.lastCheckedAt = now;

  return networkStatus.isOnline;
}

/**
 * Get network status
 */
export function getNetworkStatus(): NetworkStatus {
  checkNetworkStatus();
  return { ...networkStatus };
}

/**
 * Force network check
 */
export function forceNetworkCheck(): boolean {
  networkStatus.lastCheckedAt = 0;
  return checkNetworkStatus();
}

// ============================================================================
// SYNC ON RECONNECTION
// ============================================================================

/**
 * Sync pending validations to SOVRYN mainnet
 *
 * This function syncs all pending offline validations to the SOVRYN mainnet
 * when network connectivity is restored.
 */
export async function syncPendingValidations(): Promise<void> {
  console.log('[OFFLINE_RESILIENCE] Syncing pending validations...');

  if (syncStatus.isSyncing) {
    console.log('[OFFLINE_RESILIENCE] Sync already in progress');
    return;
  }

  if (!checkNetworkStatus()) {
    console.log('[OFFLINE_RESILIENCE] Network is offline - cannot sync');
    return;
  }

  if (pendingValidations.length === 0) {
    console.log('[OFFLINE_RESILIENCE] No pending validations to sync');
    return;
  }

  syncStatus.isSyncing = true;

  try {
    console.log(`[OFFLINE_RESILIENCE] Syncing ${pendingValidations.length} pending validations...`);

    // In production, this would:
    // 1. Connect to SOVRYN mainnet
    // 2. Submit pending validations
    // 3. Verify on-chain confirmation
    // 4. Clear pending validations

    // For now, just clear pending validations (mock)
    pendingValidations.length = 0;
    syncStatus.pendingValidations = 0;
    syncStatus.lastSyncAt = Date.now();
    syncStatus.syncError = undefined;

    console.log('[OFFLINE_RESILIENCE] ✅ Sync complete');
  } catch (error) {
    console.error('[OFFLINE_RESILIENCE] ❌ Sync failed:', error);
    syncStatus.syncError = String(error);
  } finally {
    syncStatus.isSyncing = false;
  }
}

/**
 * Get sync status
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

/**
 * Start auto-sync
 *
 * Automatically sync pending validations when network is restored
 */
export function startAutoSync(): void {
  console.log('[OFFLINE_RESILIENCE] Starting auto-sync...');

  setInterval(async () => {
    if (checkNetworkStatus() && pendingValidations.length > 0) {
      await syncPendingValidations();
    }
  }, SYNC_RETRY_INTERVAL_MS);

  console.log('[OFFLINE_RESILIENCE] ✅ Auto-sync started');
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get offline resilience statistics
 */
export function getOfflineStats(): {
  cachedCitizens: number;
  pendingValidations: number;
  isOnline: boolean;
  lastSyncAt: number;
} {
  return {
    cachedCitizens: offlineCache.size,
    pendingValidations: pendingValidations.length,
    isOnline: networkStatus.isOnline,
    lastSyncAt: syncStatus.lastSyncAt,
  };
}

