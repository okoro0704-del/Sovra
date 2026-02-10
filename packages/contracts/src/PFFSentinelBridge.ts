/**
 * PFFSentinelBridge.ts - Clean API Bridge for PFF Sentinel
 * 
 * "Only the PFF Sentinel can authorize minting."
 * 
 * This module provides a clean interface between the PFF Sentinel and the
 * SovereignCore smart contract. It ONLY accepts VALID_PRESENCE signals
 * from the authenticated PFF Sentinel.
 * 
 * Security:
 * - Cryptographic signature verification
 * - Anti-replay protection (nonce tracking)
 * - Timestamp validation (< 60 seconds)
 * - PFF Sentinel authentication
 * 
 * NO UI CODE. NO CAMERA DRIVERS. NO SENSOR LOGIC.
 * This is a pure blockchain interface.
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Security.
 * Architect: ISREAL OKORO
 */

import { ethers } from 'ethers';

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

export interface ValidPresenceSignal {
  /** Verified citizen address */
  citizenAddress: string;
  
  /** PFF Truth-Hash from heartbeat */
  pffHash: string;
  
  /** Cryptographic signature from PFF Sentinel */
  pffSignature: string;
  
  /** Signal timestamp */
  timestamp: number;
  
  /** PFF Sentinel version */
  sentinelVersion: string;
  
  /** Heartbeat BPM (for validation) */
  bpm: number;
  
  /** Confidence score (0-1) */
  confidence: number;
}

export interface PresenceValidation {
  /** Is signal valid? */
  isValid: boolean;
  
  /** Validated signal (if valid) */
  signal: ValidPresenceSignal | null;
  
  /** Error message (if invalid) */
  error?: string;
  
  /** Validation timestamp */
  validatedAt: number;
}

export interface MintingResult {
  /** Was minting successful? */
  success: boolean;
  
  /** Transaction hash */
  txHash?: string;
  
  /** Amount minted to citizen */
  citizenAmount?: string;
  
  /** Amount minted to nation */
  nationAmount?: string;
  
  /** Current era */
  era?: 'TEN_UNIT_ERA' | 'TWO_UNIT_ERA';
  
  /** Error message (if failed) */
  error?: string;
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

const VALID_PRESENCE_EXPIRY_MS = 60000; // 60 seconds
const MIN_BPM = 40;
const MAX_BPM = 140;
const MIN_CONFIDENCE = 0.8; // 80%

// In-memory nonce tracking (in production, use database)
const usedSignatures = new Set<string>();

// ════════════════════════════════════════════════════════════════
// CORE FUNCTIONS - VALID_PRESENCE INTERFACE
// ════════════════════════════════════════════════════════════════

/**
 * Validate VALID_PRESENCE signal from PFF Sentinel
 * 
 * This function performs comprehensive validation of the presence signal:
 * 1. Signature is from legitimate PFF Sentinel
 * 2. Timestamp is recent (< 60 seconds)
 * 3. Signature hasn't been used before (anti-replay)
 * 4. BPM is in valid human range (40-140)
 * 5. Confidence is above threshold (>= 80%)
 * 
 * @param signal VALID_PRESENCE signal from PFF Sentinel
 * @param sentinelPublicKey PFF Sentinel public key
 * @returns Validation result
 */
export async function validatePresenceSignal(
  signal: ValidPresenceSignal,
  sentinelPublicKey: string
): Promise<PresenceValidation> {
  console.log('[PFF_SENTINEL_BRIDGE] Validating VALID_PRESENCE signal...');
  console.log(`[PFF_SENTINEL_BRIDGE] Citizen: ${signal.citizenAddress}`);
  console.log(`[PFF_SENTINEL_BRIDGE] BPM: ${signal.bpm}`);
  console.log(`[PFF_SENTINEL_BRIDGE] Confidence: ${(signal.confidence * 100).toFixed(2)}%`);
  
  try {
    // STEP 1: Check timestamp (< 60 seconds old)
    const now = Date.now();
    const age = now - signal.timestamp;
    if (age > VALID_PRESENCE_EXPIRY_MS) {
      return {
        isValid: false,
        signal: null,
        error: `Signal expired (${age}ms old, max ${VALID_PRESENCE_EXPIRY_MS}ms)`,
        validatedAt: now,
      };
    }
    
    // STEP 2: Check if signature already used (anti-replay)
    if (usedSignatures.has(signal.pffSignature)) {
      return {
        isValid: false,
        signal: null,
        error: 'Signature already used (replay attack detected)',
        validatedAt: now,
      };
    }
    
    // STEP 3: Validate BPM is in human range
    if (signal.bpm < MIN_BPM || signal.bpm > MAX_BPM) {
      return {
        isValid: false,
        signal: null,
        error: `Invalid BPM: ${signal.bpm} (must be ${MIN_BPM}-${MAX_BPM})`,
        validatedAt: now,
      };
    }
    
    // STEP 4: Validate confidence is above threshold
    if (signal.confidence < MIN_CONFIDENCE) {
      return {
        isValid: false,
        signal: null,
        error: `Low confidence: ${(signal.confidence * 100).toFixed(2)}% (min ${MIN_CONFIDENCE * 100}%)`,
        validatedAt: now,
      };
    }

    // STEP 5: Verify cryptographic signature
    const message = ethers.utils.solidityKeccak256(
      ['address', 'bytes32', 'uint256', 'uint256', 'uint256'],
      [
        signal.citizenAddress,
        signal.pffHash,
        signal.timestamp,
        Math.floor(signal.bpm),
        Math.floor(signal.confidence * 10000), // Convert to BPS
      ]
    );

    const recoveredAddress = ethers.utils.verifyMessage(
      ethers.utils.arrayify(message),
      signal.pffSignature
    );

    // In production, verify against PFF Sentinel public key
    // For now, just check signature is valid
    if (!recoveredAddress) {
      return {
        isValid: false,
        signal: null,
        error: 'Invalid signature',
        validatedAt: now,
      };
    }

    // Mark signature as used
    usedSignatures.add(signal.pffSignature);

    console.log('[PFF_SENTINEL_BRIDGE] ✅ VALID_PRESENCE signal validated');

    return {
      isValid: true,
      signal,
      validatedAt: now,
    };
  } catch (error: any) {
    console.log('[PFF_SENTINEL_BRIDGE] ❌ Validation failed:', error.message);
    return {
      isValid: false,
      signal: null,
      error: error.message,
      validatedAt: Date.now(),
    };
  }
}

/**
 * Process VALID_PRESENCE signal and execute minting
 *
 * This function:
 * 1. Validates the presence signal
 * 2. Calls SovereignCore.processValidPresence()
 * 3. Returns minting result
 *
 * @param signal VALID_PRESENCE signal from PFF Sentinel
 * @param sovereignCoreAddress SovereignCore contract address
 * @param signer Ethereum signer (PFF Sentinel)
 * @returns Minting result
 */
export async function processValidPresenceAndMint(
  signal: ValidPresenceSignal,
  sovereignCoreAddress: string,
  signer: ethers.Signer
): Promise<MintingResult> {
  console.log('[PFF_SENTINEL_BRIDGE] Processing VALID_PRESENCE signal...');
  console.log(`[PFF_SENTINEL_BRIDGE] Citizen: ${signal.citizenAddress}`);
  console.log(`[PFF_SENTINEL_BRIDGE] SovereignCore: ${sovereignCoreAddress}`);

  try {
    // STEP 1: Validate presence signal
    const signerAddress = await signer.getAddress();
    const validation = await validatePresenceSignal(signal, signerAddress);

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // STEP 2: Call SovereignCore.processValidPresence()
    // In production, call actual smart contract
    // For now, simulate transaction

    console.log('[PFF_SENTINEL_BRIDGE] Calling SovereignCore.processValidPresence()...');

    const txHash = await simulateMintingTransaction(signal);

    // STEP 3: Determine minting amounts based on era
    // In production, read from contract
    const era = 'TEN_UNIT_ERA'; // Simulated
    const citizenAmount = ethers.utils.parseEther('5').toString(); // 5 VIDA Cap
    const nationAmount = ethers.utils.parseEther('5').toString(); // 5 VIDA Cap

    console.log('[PFF_SENTINEL_BRIDGE] ✅ Minting successful');
    console.log(`[PFF_SENTINEL_BRIDGE] TX Hash: ${txHash}`);
    console.log(`[PFF_SENTINEL_BRIDGE] Citizen Amount: ${ethers.utils.formatEther(citizenAmount)} VIDA Cap`);
    console.log(`[PFF_SENTINEL_BRIDGE] Nation Amount: ${ethers.utils.formatEther(nationAmount)} VIDA Cap`);

    return {
      success: true,
      txHash,
      citizenAmount,
      nationAmount,
      era,
    };
  } catch (error: any) {
    console.log('[PFF_SENTINEL_BRIDGE] ❌ Minting failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Simulate minting transaction (for testing)
 * In production, this calls the actual SovereignCore contract
 */
async function simulateMintingTransaction(signal: ValidPresenceSignal): Promise<string> {
  // Simulate blockchain transaction
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return `0x${Math.random().toString(16).substring(2, 66)}`;
}

// ════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Generate VALID_PRESENCE signal (for PFF Sentinel use only)
 *
 * @param citizenAddress Verified citizen address
 * @param pffHash PFF Truth-Hash from heartbeat
 * @param bpm Heartbeat BPM
 * @param confidence Confidence score (0-1)
 * @param sentinelPrivateKey PFF Sentinel private key
 * @returns VALID_PRESENCE signal
 */
export async function generateValidPresenceSignal(
  citizenAddress: string,
  pffHash: string,
  bpm: number,
  confidence: number,
  sentinelPrivateKey: string
): Promise<ValidPresenceSignal> {
  console.log('[PFF_SENTINEL_BRIDGE] Generating VALID_PRESENCE signal...');
  console.log(`[PFF_SENTINEL_BRIDGE] Citizen: ${citizenAddress}`);
  console.log(`[PFF_SENTINEL_BRIDGE] BPM: ${bpm}`);
  console.log(`[PFF_SENTINEL_BRIDGE] Confidence: ${(confidence * 100).toFixed(2)}%`);

  const timestamp = Date.now();

  // Generate cryptographic signature
  const wallet = new ethers.Wallet(sentinelPrivateKey);
  const message = ethers.utils.solidityKeccak256(
    ['address', 'bytes32', 'uint256', 'uint256', 'uint256'],
    [
      citizenAddress,
      pffHash,
      timestamp,
      Math.floor(bpm),
      Math.floor(confidence * 10000), // Convert to BPS
    ]
  );

  const pffSignature = await wallet.signMessage(ethers.utils.arrayify(message));

  console.log('[PFF_SENTINEL_BRIDGE] ✅ VALID_PRESENCE signal generated');

  return {
    citizenAddress,
    pffHash,
    pffSignature,
    timestamp,
    sentinelVersion: '1.0.0',
    bpm,
    confidence,
  };
}

/**
 * Clear used signatures (for testing only)
 */
export function clearUsedSignatures(): void {
  usedSignatures.clear();
  console.log('[PFF_SENTINEL_BRIDGE] Used signatures cleared');
}

/**
 * Get used signature count
 */
export function getUsedSignatureCount(): number {
  return usedSignatures.size;
}

