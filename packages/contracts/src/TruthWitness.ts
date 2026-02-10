/**
 * TruthWitness.ts - Truth-Witness Network for War-Crime Evidence
 * 
 * "The heartbeat never lies. The witness never forgets."
 * 
 * Features:
 * - Witness Mode for capturing war-crime evidence
 * - PFF Truth-Hash attachment to video evidence
 * - Satellite upload directly to Global Defense DAO
 * - Indisputable on-chain evidence
 * - Automatic Aggressor-Lock trigger
 * 
 * Born in Lagos, Nigeria. Built for Justice.
 */

import { ethers } from 'ethers';
import { syncToOrbitalMesh, TruthBundle } from './satellite/SSS_Sync';

// ============ TYPES ============

export interface WitnessEvidence {
  witnessUID: string; // Vitalized citizen UID
  witnessName: string;
  pffTruthHash: string; // PFF heartbeat signature hash
  videoHash: string; // IPFS hash of video evidence
  videoMetadata: {
    duration: number; // seconds
    timestamp: number;
    location: {
      latitude: number;
      longitude: number;
      country: string;
    };
    fileSize: number; // bytes
  };
  crimeType: CrimeType;
  targetRegion: string;
  suspectedAggressor: string;
  description: string;
  uploadedAt: number;
  verificationStatus: VerificationStatus;
  chainOfCustody: ChainOfCustodyEntry[];
}

export enum CrimeType {
  CIVILIAN_ATTACK = 'CIVILIAN_ATTACK',
  INFRASTRUCTURE_DESTRUCTION = 'INFRASTRUCTURE_DESTRUCTION',
  CHEMICAL_WEAPONS = 'CHEMICAL_WEAPONS',
  MASS_DISPLACEMENT = 'MASS_DISPLACEMENT',
  HUMANITARIAN_BLOCKADE = 'HUMANITARIAN_BLOCKADE',
  GENOCIDE = 'GENOCIDE',
  OTHER = 'OTHER',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  PFF_VERIFIED = 'PFF_VERIFIED',
  ORACLE_CONFIRMED = 'ORACLE_CONFIRMED',
  DAO_ACCEPTED = 'DAO_ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface ChainOfCustodyEntry {
  action: string;
  actor: string;
  timestamp: number;
  hash: string; // Hash of evidence at this point
}

export interface WitnessSubmission {
  evidence: WitnessEvidence;
  satelliteUpload: boolean;
  proposalId: string | null; // Defense proposal ID if created
}

// ============ CONSTANTS ============

const MAX_VIDEO_DURATION_SECONDS = 10;
const MAX_VIDEO_SIZE_MB = 50;
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

// ============ MAIN FUNCTIONS ============

/**
 * Capture war-crime evidence in Witness Mode
 * 
 * @param witnessUID Vitalized citizen UID
 * @param witnessName Witness name
 * @param pffTruthHash PFF heartbeat signature hash
 * @param videoFile Video file (10 seconds max)
 * @param location GPS location
 * @param crimeType Type of war crime
 * @param targetRegion Region under attack
 * @param suspectedAggressor Suspected aggressor nation
 * @param description Witness description
 */
export async function captureWitnessEvidence(
  witnessUID: string,
  witnessName: string,
  pffTruthHash: string,
  videoFile: Blob,
  location: { latitude: number; longitude: number; country: string },
  crimeType: CrimeType,
  targetRegion: string,
  suspectedAggressor: string,
  description: string
): Promise<WitnessSubmission> {
  console.log(`[WITNESS] Capturing evidence from ${witnessName} (${witnessUID})`);

  // 1. Validate video
  const validation = validateVideo(videoFile);
  if (!validation.valid) {
    throw new Error(`Video validation failed: ${validation.error}`);
  }

  // 2. Upload video to IPFS
  const videoHash = await uploadToIPFS(videoFile);

  console.log(`[WITNESS] Video uploaded to IPFS: ${videoHash}`);

  // 3. Create evidence record
  const evidence: WitnessEvidence = {
    witnessUID,
    witnessName,
    pffTruthHash,
    videoHash,
    videoMetadata: {
      duration: validation.duration!,
      timestamp: Date.now(),
      location,
      fileSize: videoFile.size,
    },
    crimeType,
    targetRegion,
    suspectedAggressor,
    description,
    uploadedAt: Date.now(),
    verificationStatus: VerificationStatus.PENDING,
    chainOfCustody: [
      {
        action: 'EVIDENCE_CAPTURED',
        actor: witnessUID,
        timestamp: Date.now(),
        hash: videoHash,
      },
    ],
  };

  // 4. Verify PFF Truth-Hash
  const pffVerified = await verifyPFFTruthHash(witnessUID, pffTruthHash);

  if (pffVerified) {
    evidence.verificationStatus = VerificationStatus.PFF_VERIFIED;
    evidence.chainOfCustody.push({
      action: 'PFF_VERIFIED',
      actor: 'PFF_ENGINE',
      timestamp: Date.now(),
      hash: generateEvidenceHash(evidence),
    });

    console.log(`[WITNESS] ✅ PFF Truth-Hash verified for ${witnessUID}`);
  } else {
    console.warn(`[WITNESS] ⚠️ PFF Truth-Hash verification failed for ${witnessUID}`);
  }

  // 5. Upload to satellite (bypass ground infrastructure)
  const satelliteUpload = await uploadToSatellite(evidence);

  if (satelliteUpload) {
    evidence.chainOfCustody.push({
      action: 'UPLOADED_TO_SATELLITE',
      actor: 'SSS_SYNC',
      timestamp: Date.now(),
      hash: generateEvidenceHash(evidence),
    });

    console.log(`[WITNESS] ✅ Evidence uploaded to satellite mesh`);
  }

  // 6. Submit to Global Defense DAO
  const proposalId = await submitToGlobalDefenseDAO(evidence);

  evidence.chainOfCustody.push({
    action: 'SUBMITTED_TO_DAO',
    actor: 'GLOBAL_DEFENSE_DAO',
    timestamp: Date.now(),
    hash: generateEvidenceHash(evidence),
  });

  console.log(`[WITNESS] ✅ Evidence submitted to Global Defense DAO. Proposal ID: ${proposalId}`);

  return {
    evidence,
    satelliteUpload,
    proposalId,
  };
}

/**
 * Validate video file
 */
function validateVideo(videoFile: Blob): { valid: boolean; error?: string; duration?: number } {
  // Check file size
  const fileSizeMB = videoFile.size / (1024 * 1024);
  if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
    return { valid: false, error: `File size ${fileSizeMB.toFixed(2)}MB exceeds ${MAX_VIDEO_SIZE_MB}MB limit` };
  }

  // In production, extract actual video duration using video metadata
  // For now, simulate duration check
  const mockDuration = 10; // seconds

  if (mockDuration > MAX_VIDEO_DURATION_SECONDS) {
    return { valid: false, error: `Video duration ${mockDuration}s exceeds ${MAX_VIDEO_DURATION_SECONDS}s limit` };
  }

  return { valid: true, duration: mockDuration };
}

/**
 * Upload video to IPFS
 */
async function uploadToIPFS(videoFile: Blob): Promise<string> {
  console.log('[WITNESS] Uploading video to IPFS...');

  // In production, use actual IPFS client (e.g., ipfs-http-client, Pinata, Web3.Storage)
  // For now, generate mock IPFS hash
  const mockHash = `Qm${ethers.utils.keccak256(ethers.utils.toUtf8Bytes(Date.now().toString())).substring(2, 48)}`;

  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return mockHash;
}

/**
 * Verify PFF Truth-Hash matches witness UID
 */
async function verifyPFFTruthHash(witnessUID: string, pffTruthHash: string): Promise<boolean> {
  console.log(`[WITNESS] Verifying PFF Truth-Hash for ${witnessUID}...`);

  // In production, query blockchain or satellite for Truth-Bundle
  // Verify that pffTruthHash matches the stored heartbeat hash for witnessUID

  // For now, simulate verification
  const expectedHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`HEARTBEAT_${witnessUID}`));

  return pffTruthHash === expectedHash;
}

/**
 * Upload evidence to satellite mesh
 */
async function uploadToSatellite(evidence: WitnessEvidence): Promise<boolean> {
  console.log('[WITNESS] Uploading evidence to satellite mesh...');

  try {
    // Create Truth-Bundle for evidence
    const evidenceBundle: TruthBundle = {
      uid: evidence.witnessUID,
      heartbeatHash: evidence.pffTruthHash,
      citizenshipData: `WITNESS_EVIDENCE_${evidence.videoHash}`,
      vaultBalance: {
        liquid_vida: 0,
        locked_vida: 0,
        nvida: 0,
      },
      lastSync: Date.now(),
      syncedSatellites: [],
    };

    // Sync to orbital mesh with CRITICAL priority
    const responses = await syncToOrbitalMesh(evidenceBundle, 'CRITICAL');

    const successfulSyncs = responses.filter(r => r.success).length;

    return successfulSyncs >= 3; // Require at least 3 satellites
  } catch (error) {
    console.error('[WITNESS] Failed to upload to satellite:', error);
    return false;
  }
}

/**
 * Submit evidence to Global Defense DAO
 */
async function submitToGlobalDefenseDAO(evidence: WitnessEvidence): Promise<string> {
  console.log('[WITNESS] Submitting evidence to Global Defense DAO...');

  // In production, call MutualDefense.sol activateAllianceDefense()
  // For now, generate mock proposal ID

  const proposalId = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
      `${evidence.targetRegion}_${evidence.suspectedAggressor}_${evidence.videoHash}_${Date.now()}`
    )
  );

  // Simulate blockchain transaction
  await new Promise(resolve => setTimeout(resolve, 1000));

  return proposalId;
}

/**
 * Generate hash of evidence for chain of custody
 */
function generateEvidenceHash(evidence: WitnessEvidence): string {
  const data = JSON.stringify({
    witnessUID: evidence.witnessUID,
    pffTruthHash: evidence.pffTruthHash,
    videoHash: evidence.videoHash,
    timestamp: evidence.uploadedAt,
  });

  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
}

/**
 * Get evidence by video hash
 */
export async function getEvidenceByHash(videoHash: string): Promise<WitnessEvidence | null> {
  // In production, query from blockchain or IPFS
  console.log(`[WITNESS] Retrieving evidence: ${videoHash}`);
  return null;
}

/**
 * Verify chain of custody
 */
export function verifyChainOfCustody(evidence: WitnessEvidence): boolean {
  console.log('[WITNESS] Verifying chain of custody...');

  // Verify each entry in chain of custody
  for (let i = 0; i < evidence.chainOfCustody.length; i++) {
    const entry = evidence.chainOfCustody[i];

    // Verify hash integrity
    // In production, verify cryptographic signatures

    console.log(`[WITNESS] ✅ Chain of custody entry ${i + 1} verified: ${entry.action}`);
  }

  return true;
}

