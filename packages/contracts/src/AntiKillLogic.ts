/**
 * AntiKillLogic.ts - Process Protection and Anti-Kill Logic
 * 
 * "If the Sentinel process receives a SIGKILL or SIGSTOP signal not authorized by a PFF Handshake,
 * trigger deviceStasis() immediately."
 * 
 * This module implements process protection to prevent unauthorized termination
 * of the Sentinel daemon. If an unauthorized kill signal is detected, the device
 * is immediately locked down via deviceStasis().
 * 
 * Features:
 * - Signal interception (SIGKILL, SIGSTOP, SIGTERM)
 * - PFF Handshake authorization verification
 * - deviceStasis() trigger on unauthorized termination
 * - Process protection across platforms
 * - Watchdog monitoring
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Security.
 * Architect: ISREAL OKORO
 */

import { validateSentinelBioLock, FourLayerSignature, DeviceBioChain } from './SentinelBioLock';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTHORIZATION_TIMEOUT_MS = 30000; // 30 seconds
export const WATCHDOG_INTERVAL_MS = 5000; // 5 seconds
export const MAX_UNAUTHORIZED_ATTEMPTS = 3;

// ============================================================================
// TYPES
// ============================================================================

export interface KillAuthorization {
  signature: FourLayerSignature;
  deviceBioChain: DeviceBioChain;
  expectedLaptopUUID: string;
  expectedMobileUUID: string;
  authorizedAt: number;
  expiresAt: number;
}

export interface SignalEvent {
  signal: string;
  pid: number;
  timestamp: number;
  isAuthorized: boolean;
  authorizationId?: string;
}

export interface StasisTrigger {
  reason: string;
  signal: string;
  timestamp: number;
  unauthorizedAttempts: number;
}

// ============================================================================
// STATE
// ============================================================================

/**
 * Active kill authorizations (authorization ID => expiry timestamp)
 */
const activeAuthorizations = new Map<string, number>();

/**
 * Signal event history
 */
const signalHistory: SignalEvent[] = [];

/**
 * Unauthorized attempt counter
 */
let unauthorizedAttempts = 0;

/**
 * Device stasis state
 */
let isInStasis = false;

/**
 * Watchdog timer
 */
let watchdogTimer: NodeJS.Timeout | null = null;

// ============================================================================
// KILL AUTHORIZATION
// ============================================================================

/**
 * Authorize kill signal with PFF Handshake
 * 
 * This function validates a 4-layer PFF handshake and grants temporary
 * authorization to terminate the Sentinel process.
 * 
 * The authorization is valid for 30 seconds.
 * 
 * @param request Kill authorization request
 * @returns Authorization ID if successful
 */
export function authorizeKill(request: KillAuthorization): string | null {
  console.log('[ANTI_KILL] Processing kill authorization request...');
  
  // Validate Sentinel Bio-Lock (4-layer + Device-Bio-Chain)
  const validationResult = validateSentinelBioLock(
    request.signature,
    request.deviceBioChain,
    request.expectedLaptopUUID,
    request.expectedMobileUUID
  );
  
  if (!validationResult.isValid) {
    console.log(`[ANTI_KILL] ❌ Kill authorization DENIED: ${validationResult.error}`);
    unauthorizedAttempts++;
    
    // Check if max attempts exceeded
    if (unauthorizedAttempts >= MAX_UNAUTHORIZED_ATTEMPTS) {
      console.log('[ANTI_KILL] 🚨 MAX UNAUTHORIZED ATTEMPTS EXCEEDED - TRIGGERING DEVICE STASIS');
      triggerDeviceStasis({
        reason: 'Maximum unauthorized kill attempts exceeded',
        signal: 'AUTHORIZATION_FAILURE',
        timestamp: Date.now(),
        unauthorizedAttempts,
      });
    }
    
    return null;
  }
  
  // Generate authorization ID
  const authorizationId = `AUTH_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Store authorization (valid for 30 seconds)
  const expiresAt = Date.now() + AUTHORIZATION_TIMEOUT_MS;
  activeAuthorizations.set(authorizationId, expiresAt);
  
  console.log(`[ANTI_KILL] ✅ Kill authorization GRANTED: ${authorizationId}`);
  console.log(`[ANTI_KILL] Authorization expires at: ${new Date(expiresAt).toISOString()}`);
  
  // Reset unauthorized attempts counter
  unauthorizedAttempts = 0;
  
  return authorizationId;
}

/**
 * Revoke kill authorization
 */
export function revokeKillAuthorization(authorizationId: string): void {
  console.log(`[ANTI_KILL] Revoking kill authorization: ${authorizationId}`);
  activeAuthorizations.delete(authorizationId);
}

/**
 * Check if kill is authorized
 */
export function isKillAuthorized(authorizationId?: string): boolean {
  if (!authorizationId) {
    return false;
  }
  
  const expiresAt = activeAuthorizations.get(authorizationId);
  
  if (!expiresAt) {
    return false;
  }
  
  // Check if authorization has expired
  if (expiresAt < Date.now()) {
    console.log(`[ANTI_KILL] Authorization expired: ${authorizationId}`);
    activeAuthorizations.delete(authorizationId);
    return false;
  }
  
  return true;
}

// ============================================================================
// SIGNAL INTERCEPTION
// ============================================================================

/**
 * Install signal handlers
 *
 * This function installs handlers for SIGTERM, SIGINT, and other signals
 * that can terminate the Sentinel process.
 *
 * NOTE: SIGKILL and SIGSTOP cannot be intercepted at the process level.
 * They must be intercepted at the kernel level using platform-specific mechanisms.
 */
export function installSignalHandlers(authorizationId?: string): void {
  console.log('[ANTI_KILL] Installing signal handlers...');

  // SIGTERM handler
  process.on('SIGTERM', () => {
    handleSignal('SIGTERM', authorizationId);
  });

  // SIGINT handler (Ctrl+C)
  process.on('SIGINT', () => {
    handleSignal('SIGINT', authorizationId);
  });

  // SIGHUP handler (terminal closed)
  process.on('SIGHUP', () => {
    handleSignal('SIGHUP', authorizationId);
  });

  console.log('[ANTI_KILL] ✅ Signal handlers installed');
}

/**
 * Handle signal
 */
function handleSignal(signal: string, authorizationId?: string): void {
  console.log(`[ANTI_KILL] Received signal: ${signal}`);

  const timestamp = Date.now();
  const isAuthorized = isKillAuthorized(authorizationId);

  // Record signal event
  signalHistory.push({
    signal,
    pid: process.pid,
    timestamp,
    isAuthorized,
    authorizationId,
  });

  if (isAuthorized) {
    console.log(`[ANTI_KILL] ✅ Signal AUTHORIZED - allowing graceful shutdown`);

    // Revoke authorization
    if (authorizationId) {
      revokeKillAuthorization(authorizationId);
    }

    // Perform graceful shutdown
    performGracefulShutdown();
  } else {
    console.log(`[ANTI_KILL] ❌ Signal NOT AUTHORIZED - triggering device stasis`);

    // Increment unauthorized attempts
    unauthorizedAttempts++;

    // Trigger device stasis
    triggerDeviceStasis({
      reason: `Unauthorized ${signal} signal received`,
      signal,
      timestamp,
      unauthorizedAttempts,
    });
  }
}

/**
 * Perform graceful shutdown
 */
function performGracefulShutdown(): void {
  console.log('[ANTI_KILL] Performing graceful shutdown...');

  // Stop watchdog
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }

  // Clean up resources
  activeAuthorizations.clear();

  console.log('[ANTI_KILL] ✅ Graceful shutdown complete');

  // Exit process
  process.exit(0);
}

// ============================================================================
// DEVICE STASIS
// ============================================================================

/**
 * Trigger device stasis
 *
 * This function immediately locks down the device when an unauthorized
 * kill attempt is detected.
 *
 * Device stasis includes:
 * - Lock all SECURE_VITALIE apps
 * - Disable network access
 * - Require full 4-layer handshake to unlock
 * - Log security event to VLT (Vitalia Ledger of Truth)
 *
 * @param trigger Stasis trigger information
 */
export function triggerDeviceStasis(trigger: StasisTrigger): void {
  console.log('[ANTI_KILL] 🚨🚨🚨 TRIGGERING DEVICE STASIS 🚨🚨🚨');
  console.log(`[ANTI_KILL] Reason: ${trigger.reason}`);
  console.log(`[ANTI_KILL] Signal: ${trigger.signal}`);
  console.log(`[ANTI_KILL] Unauthorized Attempts: ${trigger.unauthorizedAttempts}`);

  // Set stasis state
  isInStasis = true;

  // Platform-specific stasis implementation
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      // Windows: Lock workstation
      execAsync('rundll32.exe user32.dll,LockWorkStation');
    } else if (platform === 'darwin') {
      // macOS: Activate screensaver lock
      execAsync('/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend');
    } else if (platform === 'linux') {
      // Linux: Lock screen
      execAsync('loginctl lock-sessions');
    }

    console.log('[ANTI_KILL] ✅ Device locked successfully');
  } catch (error) {
    console.error('[ANTI_KILL] ❌ Failed to lock device:', error);
  }

  // Log security event
  logSecurityEvent(trigger);

  // In production, this would also:
  // 1. Disable network access
  // 2. Lock all SECURE_VITALIE apps
  // 3. Send alert to SOVRYN mainnet
  // 4. Require full 4-layer handshake to unlock
}

/**
 * Check if device is in stasis
 */
export function isDeviceInStasis(): boolean {
  return isInStasis;
}

/**
 * Exit device stasis (requires 4-layer handshake)
 */
export function exitDeviceStasis(
  signature: FourLayerSignature,
  deviceBioChain: DeviceBioChain,
  expectedLaptopUUID: string,
  expectedMobileUUID: string
): boolean {
  console.log('[ANTI_KILL] Processing device stasis exit request...');

  // Validate Sentinel Bio-Lock (4-layer + Device-Bio-Chain)
  const validationResult = validateSentinelBioLock(
    signature,
    deviceBioChain,
    expectedLaptopUUID,
    expectedMobileUUID
  );

  if (!validationResult.isValid) {
    console.log(`[ANTI_KILL] ❌ Stasis exit DENIED: ${validationResult.error}`);
    return false;
  }

  // Exit stasis
  isInStasis = false;
  unauthorizedAttempts = 0;

  console.log('[ANTI_KILL] ✅ Device stasis EXITED - device unlocked');

  return true;
}

// ============================================================================
// WATCHDOG
// ============================================================================

/**
 * Start watchdog
 *
 * The watchdog monitors the Sentinel process and detects if it has been
 * terminated unexpectedly (e.g., via SIGKILL at kernel level).
 *
 * If the watchdog detects unexpected termination, it triggers device stasis
 * on the next boot.
 */
export function startWatchdog(): void {
  console.log('[ANTI_KILL] Starting watchdog...');

  // Create heartbeat file
  const heartbeatPath = os.platform() === 'win32'
    ? 'C:\\ProgramData\\PFFSentinel\\heartbeat.txt'
    : '/tmp/pffsentinel_heartbeat.txt';

  // Update heartbeat every 5 seconds
  watchdogTimer = setInterval(() => {
    const timestamp = Date.now();

    try {
      const fs = require('fs');
      fs.writeFileSync(heartbeatPath, timestamp.toString());
    } catch (error) {
      console.error('[ANTI_KILL] ❌ Failed to update heartbeat:', error);
    }
  }, WATCHDOG_INTERVAL_MS);

  console.log('[ANTI_KILL] ✅ Watchdog started');
}

/**
 * Stop watchdog
 */
export function stopWatchdog(): void {
  console.log('[ANTI_KILL] Stopping watchdog...');

  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }

  console.log('[ANTI_KILL] ✅ Watchdog stopped');
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log security event
 */
function logSecurityEvent(trigger: StasisTrigger): void {
  console.log('[ANTI_KILL] Logging security event...');

  const event = {
    type: 'DEVICE_STASIS_TRIGGERED',
    trigger,
    timestamp: Date.now(),
    platform: os.platform(),
    hostname: os.hostname(),
  };

  // In production, this would log to VLT (Vitalia Ledger of Truth)
  console.log('[ANTI_KILL] Security Event:', JSON.stringify(event, null, 2));
}

/**
 * Get signal history
 */
export function getSignalHistory(): SignalEvent[] {
  return [...signalHistory];
}

/**
 * Get unauthorized attempt count
 */
export function getUnauthorizedAttemptCount(): number {
  return unauthorizedAttempts;
}

/**
 * Reset unauthorized attempt count
 */
export function resetUnauthorizedAttemptCount(): void {
  console.log('[ANTI_KILL] Resetting unauthorized attempt count');
  unauthorizedAttempts = 0;
}

