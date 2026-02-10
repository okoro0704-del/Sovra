/**
 * IoT Lock - Truth-Lock for Hardware Devices
 * 
 * Prevents device operation unless a live rPPG heartbeat is matched
 * to the registered owner's VIDA ID.
 * 
 * Use Cases:
 * - Vehicle ignition (car won't start without owner's heartbeat)
 * - Firearm safety (weapon locked to owner's biometrics)
 * - High-security facilities (door access requires live presence)
 * - Medical equipment (authorized personnel only)
 * - Industrial machinery (operator verification)
 * 
 * Born in Lagos, Nigeria. Truth in Every Pulse.
 */

import { validatePff, PffValidationResult } from './PffValidator';

// ============ TYPES ============

export interface IoTDevice {
  deviceId: string;
  deviceType: 'VEHICLE' | 'FIREARM' | 'DOOR' | 'MEDICAL' | 'INDUSTRIAL' | 'OTHER';
  registeredOwner: string; // VIDA DID
  backupOwners: string[]; // Additional authorized users
  isActive: boolean;
  requiresContinuousVerification: boolean; // Periodic heartbeat checks
  verificationInterval: number; // Seconds between checks
  lastVerification: number;
  totalUnlocks: number;
  totalDenials: number;
}

export interface OwnershipVerification {
  deviceId: string;
  userDid: string;
  pffValidation: PffValidationResult;
  isOwner: boolean;
  isAuthorized: boolean;
  unlockGranted: boolean;
  timestamp: number;
  expiryTime: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface UnlockAttempt {
  attemptId: string;
  deviceId: string;
  userDid: string;
  timestamp: number;
  success: boolean;
  failureReason?: string;
  pffMetrics: {
    bpm: number;
    confidence: number;
    isLive: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ContinuousVerification {
  deviceId: string;
  userDid: string;
  startTime: number;
  lastCheckTime: number;
  checksPerformed: number;
  checksFailed: number;
  isActive: boolean;
}

// ============ CONSTANTS ============

const MIN_PFF_CONFIDENCE = 75; // Minimum confidence for device unlock
const DEFAULT_VERIFICATION_INTERVAL = 60; // 60 seconds
const UNLOCK_DURATION = 300; // 5 minutes before re-verification required
const MAX_FAILED_ATTEMPTS = 3; // Lock device after 3 failed attempts

// ============ DEVICE REGISTRY ============

const deviceRegistry = new Map<string, IoTDevice>();
const activeVerifications = new Map<string, ContinuousVerification>();
const unlockAttempts: UnlockAttempt[] = [];

// ============ CORE VERIFICATION ============

/**
 * Verify ownership and pulse for device unlock
 * @param deviceId Device identifier
 * @param userIdentity User's VIDA DID
 * @param pffSignal rPPG signal from user
 * @param sessionId Unique session identifier
 * @param location Optional location data
 * @returns Ownership verification result
 */
export async function verifyOwnershipAndPulse(
  deviceId: string,
  userIdentity: string,
  pffSignal: any,
  sessionId: string,
  location?: { latitude: number; longitude: number }
): Promise<OwnershipVerification> {
  // Step 1: Get device from registry
  const device = deviceRegistry.get(deviceId);
  if (!device) {
    throw new Error(`Device not found: ${deviceId}`);
  }

  if (!device.isActive) {
    throw new Error(`Device is inactive: ${deviceId}`);
  }

  // Step 2: Validate PFF (heartbeat detection)
  const pffValidation = await validatePff(pffSignal, sessionId);

  // Step 3: Check if heartbeat is valid
  if (!pffValidation.isValid || !pffValidation.heartbeatDetected) {
    await logUnlockAttempt(deviceId, userIdentity, false, 'No valid heartbeat detected', pffValidation, location);
    
    return {
      deviceId,
      userDid: userIdentity,
      pffValidation,
      isOwner: false,
      isAuthorized: false,
      unlockGranted: false,
      timestamp: Date.now(),
      expiryTime: 0,
      location,
    };
  }

  // Step 4: Check PFF confidence
  if (pffValidation.metrics.confidence < MIN_PFF_CONFIDENCE) {
    await logUnlockAttempt(
      deviceId,
      userIdentity,
      false,
      `PFF confidence too low: ${pffValidation.metrics.confidence}%`,
      pffValidation,
      location
    );
    
    return {
      deviceId,
      userDid: userIdentity,
      pffValidation,
      isOwner: false,
      isAuthorized: false,
      unlockGranted: false,
      timestamp: Date.now(),
      expiryTime: 0,
      location,
    };
  }

  // Step 5: Verify ownership
  const isOwner = device.registeredOwner === userIdentity;
  const isBackupOwner = device.backupOwners.includes(userIdentity);
  const isAuthorized = isOwner || isBackupOwner;

  if (!isAuthorized) {
    await logUnlockAttempt(deviceId, userIdentity, false, 'User not authorized', pffValidation, location);
    
    device.totalDenials++;
    updateDevice(device);
    
    return {
      deviceId,
      userDid: userIdentity,
      pffValidation,
      isOwner: false,
      isAuthorized: false,
      unlockGranted: false,
      timestamp: Date.now(),
      expiryTime: 0,
      location,
    };
  }

  // Step 6: Grant unlock
  const timestamp = Date.now();
  const expiryTime = timestamp + (UNLOCK_DURATION * 1000);

  device.lastVerification = timestamp;
  device.totalUnlocks++;
  updateDevice(device);

  await logUnlockAttempt(deviceId, userIdentity, true, undefined, pffValidation, location);

  // Step 7: Start continuous verification if required
  if (device.requiresContinuousVerification) {
    startContinuousVerification(deviceId, userIdentity);
  }

  return {
    deviceId,
    userDid: userIdentity,
    pffValidation,
    isOwner,
    isAuthorized,
    unlockGranted: true,
    timestamp,
    expiryTime,
    location,
  };
}

// ============ CONTINUOUS VERIFICATION ============

/**
 * Start continuous verification for device
 * @param deviceId Device identifier
 * @param userDid User's VIDA DID
 */
function startContinuousVerification(deviceId: string, userDid: string): void {
  const verification: ContinuousVerification = {
    deviceId,
    userDid,
    startTime: Date.now(),
    lastCheckTime: Date.now(),
    checksPerformed: 0,
    checksFailed: 0,
    isActive: true,
  };

  activeVerifications.set(deviceId, verification);
  console.log(`[IoT Lock] Started continuous verification for device ${deviceId}`);
}

/**
 * Perform periodic heartbeat check
 * @param deviceId Device identifier
 * @param pffSignal Current rPPG signal
 * @param sessionId Session identifier
 * @returns Whether verification passed
 */
export async function performPeriodicCheck(
  deviceId: string,
  pffSignal: any,
  sessionId: string
): Promise<boolean> {
  const verification = activeVerifications.get(deviceId);
  if (!verification || !verification.isActive) {
    return false;
  }

  const device = deviceRegistry.get(deviceId);
  if (!device) {
    return false;
  }

  // Validate PFF
  const pffValidation = await validatePff(pffSignal, sessionId);

  verification.checksPerformed++;
  verification.lastCheckTime = Date.now();

  if (!pffValidation.isValid || pffValidation.metrics.confidence < MIN_PFF_CONFIDENCE) {
    verification.checksFailed++;

    // Lock device if too many failures
    if (verification.checksFailed >= MAX_FAILED_ATTEMPTS) {
      stopContinuousVerification(deviceId);
      console.log(`[IoT Lock] Device ${deviceId} locked due to failed verification`);
      return false;
    }
  }

  return pffValidation.isValid;
}

/**
 * Stop continuous verification
 * @param deviceId Device identifier
 */
export function stopContinuousVerification(deviceId: string): void {
  const verification = activeVerifications.get(deviceId);
  if (verification) {
    verification.isActive = false;
    activeVerifications.delete(deviceId);
    console.log(`[IoT Lock] Stopped continuous verification for device ${deviceId}`);
  }
}

// ============ DEVICE MANAGEMENT ============

/**
 * Register new IoT device
 * @param device Device configuration
 */
export function registerDevice(device: IoTDevice): void {
  deviceRegistry.set(device.deviceId, device);
  console.log(`[IoT Lock] Registered device ${device.deviceId} for owner ${device.registeredOwner}`);
}

/**
 * Update device configuration
 */
function updateDevice(device: IoTDevice): void {
  deviceRegistry.set(device.deviceId, device);
}

/**
 * Get device details
 */
export function getDevice(deviceId: string): IoTDevice | undefined {
  return deviceRegistry.get(deviceId);
}

/**
 * Add backup owner to device
 * @param deviceId Device identifier
 * @param backupOwnerDid Backup owner's VIDA DID
 */
export function addBackupOwner(deviceId: string, backupOwnerDid: string): void {
  const device = deviceRegistry.get(deviceId);
  if (!device) {
    throw new Error(`Device not found: ${deviceId}`);
  }

  if (!device.backupOwners.includes(backupOwnerDid)) {
    device.backupOwners.push(backupOwnerDid);
    updateDevice(device);
    console.log(`[IoT Lock] Added backup owner ${backupOwnerDid} to device ${deviceId}`);
  }
}

/**
 * Remove backup owner from device
 */
export function removeBackupOwner(deviceId: string, backupOwnerDid: string): void {
  const device = deviceRegistry.get(deviceId);
  if (!device) {
    throw new Error(`Device not found: ${deviceId}`);
  }

  device.backupOwners = device.backupOwners.filter((did) => did !== backupOwnerDid);
  updateDevice(device);
  console.log(`[IoT Lock] Removed backup owner ${backupOwnerDid} from device ${deviceId}`);
}

/**
 * Deactivate device
 */
export function deactivateDevice(deviceId: string): void {
  const device = deviceRegistry.get(deviceId);
  if (!device) {
    throw new Error(`Device not found: ${deviceId}`);
  }

  device.isActive = false;
  updateDevice(device);
  stopContinuousVerification(deviceId);
  console.log(`[IoT Lock] Deactivated device ${deviceId}`);
}

// ============ AUDIT LOGGING ============

/**
 * Log unlock attempt
 */
async function logUnlockAttempt(
  deviceId: string,
  userDid: string,
  success: boolean,
  failureReason: string | undefined,
  pffValidation: PffValidationResult,
  location?: { latitude: number; longitude: number }
): Promise<void> {
  const attempt: UnlockAttempt = {
    attemptId: `attempt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    deviceId,
    userDid,
    timestamp: Date.now(),
    success,
    failureReason,
    pffMetrics: {
      bpm: pffValidation.metrics.bpm,
      confidence: pffValidation.metrics.confidence,
      isLive: pffValidation.metrics.isLive,
    },
    location,
  };

  unlockAttempts.push(attempt);

  console.log(
    `[IoT Lock] Unlock attempt - Device: ${deviceId}, User: ${userDid}, Success: ${success}${
      failureReason ? `, Reason: ${failureReason}` : ''
    }`
  );
}

/**
 * Get unlock attempts for device
 */
export function getDeviceUnlockAttempts(deviceId: string): UnlockAttempt[] {
  return unlockAttempts.filter((attempt) => attempt.deviceId === deviceId);
}

/**
 * Get unlock attempts for user
 */
export function getUserUnlockAttempts(userDid: string): UnlockAttempt[] {
  return unlockAttempts.filter((attempt) => attempt.userDid === userDid);
}

// ============ STATISTICS ============

/**
 * Get device statistics
 */
export function getDeviceStats(deviceId: string): {
  totalUnlocks: number;
  totalDenials: number;
  successRate: number;
  lastVerification: number;
  isActive: boolean;
} {
  const device = deviceRegistry.get(deviceId);
  if (!device) {
    throw new Error(`Device not found: ${deviceId}`);
  }

  const total = device.totalUnlocks + device.totalDenials;
  const successRate = total > 0 ? (device.totalUnlocks / total) * 100 : 0;

  return {
    totalUnlocks: device.totalUnlocks,
    totalDenials: device.totalDenials,
    successRate,
    lastVerification: device.lastVerification,
    isActive: device.isActive,
  };
}

/**
 * Get continuous verification status
 */
export function getVerificationStatus(deviceId: string): ContinuousVerification | undefined {
  return activeVerifications.get(deviceId);
}

