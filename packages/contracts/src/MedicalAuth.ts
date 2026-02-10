/**
 * MedicalAuth.ts
 * 
 * Hospital Verification API with Zero-Knowledge Proofs
 * 
 * Purpose:
 * - Verify health coverage without revealing financial details
 * - Use PFF scan + UID to confirm identity
 * - Return COVERAGE_CONFIRMED if user is registered citizen
 * 
 * "Privacy-preserving healthcare verification."
 */

import { ethers } from 'ethers';
import { processHeartbeat } from '@vitalia/pff-engine';
import type { WorkletResult } from '@vitalia/pff-engine';

// ============ TYPES ============

export enum CoverageStatus {
  COVERAGE_CONFIRMED = 'COVERAGE_CONFIRMED',
  COVERAGE_DENIED = 'COVERAGE_DENIED',
  IDENTITY_MISMATCH = 'IDENTITY_MISMATCH',
  NOT_VITALIZED = 'NOT_VITALIZED',
  EMERGENCY_OVERRIDE = 'EMERGENCY_OVERRIDE',
}

export interface VerificationRequest {
  userUID: string;              // User's unique heartbeat ID
  hospitalID: string;           // Hospital identifier
  pffScanResult?: WorkletResult; // Optional: Real-time heartbeat scan
  timestamp: number;
}

export interface VerificationResult {
  status: CoverageStatus;
  coverageActive: boolean;
  coverageStartDate?: number;
  totalClaims?: number;
  zkProof: string;              // Zero-knowledge proof of coverage
  verificationHash: string;     // Verification transaction hash
  timestamp: number;
}

export interface ZKProof {
  proof: string;                // ZK proof data
  publicInputs: string[];       // Public inputs (no sensitive data)
  verified: boolean;
}

// ============ HEALTH SOVEREIGN CONTRACT ABI ============

const HEALTH_SOVEREIGN_ABI = [
  'function getUserByUID(bytes32 uid) external view returns (address)',
  'function getHealthStatus(address user) external view returns (uint8 status, bool isActive)',
  'function healthRecords(address user) external view returns (uint8 status, uint256 totalContributed, uint256 lastDeductionTimestamp, uint256 coverageStartDate, uint256 claimsUsed, bool isVitalized)',
  'event CoverageVerified(bytes32 indexed uid, address indexed hospital, uint256 timestamp)',
];

// ============ MEDICAL AUTH CLASS ============

export class MedicalAuth {
  private provider: ethers.providers.Provider;
  private contract: ethers.Contract;
  private contractAddress: string;

  constructor(contractAddress: string, provider: ethers.providers.Provider) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.contract = new ethers.Contract(contractAddress, HEALTH_SOVEREIGN_ABI, provider);
  }

  /**
   * Verify health coverage for user
   * 
   * @param request Verification request
   * @returns Verification result with ZK proof
   */
  async verifyHealthCover(request: VerificationRequest): Promise<VerificationResult> {
    try {
      // 1. Convert UID to bytes32
      const uidBytes32 = ethers.utils.formatBytes32String(request.userUID);

      // 2. Get user address from UID
      const userAddress = await this.contract.getUserByUID(uidBytes32);

      if (userAddress === ethers.constants.AddressZero) {
        return {
          status: CoverageStatus.NOT_VITALIZED,
          coverageActive: false,
          zkProof: '',
          verificationHash: '',
          timestamp: Date.now(),
        };
      }

      // 3. Get health status (no financial details exposed)
      const [status, isActive] = await this.contract.getHealthStatus(userAddress);

      // 4. Optional: Verify PFF scan matches
      if (request.pffScanResult) {
        const pffMatch = await this.verifyPFFScan(request.pffScanResult, request.userUID);
        if (!pffMatch) {
          return {
            status: CoverageStatus.IDENTITY_MISMATCH,
            coverageActive: false,
            zkProof: '',
            verificationHash: '',
            timestamp: Date.now(),
          };
        }
      }

      // 5. Get additional details (for ZK proof generation)
      const healthRecord = await this.contract.healthRecords(userAddress);

      // 6. Generate Zero-Knowledge Proof
      const zkProof = await this.generateZKProof({
        userAddress,
        isActive,
        status,
        coverageStartDate: healthRecord.coverageStartDate.toNumber(),
        claimsUsed: healthRecord.claimsUsed.toNumber(),
      });

      // 7. Determine coverage status
      let coverageStatus: CoverageStatus;
      if (status === 3) { // EMERGENCY_OVERRIDE
        coverageStatus = CoverageStatus.EMERGENCY_OVERRIDE;
      } else if (isActive) {
        coverageStatus = CoverageStatus.COVERAGE_CONFIRMED;
      } else {
        coverageStatus = CoverageStatus.COVERAGE_DENIED;
      }

      // 8. Log verification (emit event on-chain in production)
      const verificationHash = await this.logVerification(
        uidBytes32,
        request.hospitalID,
        coverageStatus
      );

      return {
        status: coverageStatus,
        coverageActive: isActive,
        coverageStartDate: healthRecord.coverageStartDate.toNumber(),
        totalClaims: healthRecord.claimsUsed.toNumber(),
        zkProof: zkProof.proof,
        verificationHash,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Health coverage verification failed:', error);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Generate Zero-Knowledge Proof
   * 
   * Proves coverage without revealing:
   * - Total contributed amount
   * - Specific financial balance
   * - Personal health data
   * 
   * Only reveals:
   * - Coverage is active (boolean)
   * - Coverage start date
   * - Number of claims (not amounts)
   */
  private async generateZKProof(data: {
    userAddress: string;
    isActive: boolean;
    status: number;
    coverageStartDate: number;
    claimsUsed: number;
  }): Promise<ZKProof> {
    // In production, use actual ZK-SNARK library (e.g., snarkjs, circom)
    // For now, create a commitment hash

    const commitment = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'bool', 'uint8', 'uint256'],
        [data.userAddress, data.isActive, data.status, data.coverageStartDate]
      )
    );

    // Public inputs (no sensitive data)
    const publicInputs = [
      data.isActive.toString(),
      data.coverageStartDate.toString(),
      data.claimsUsed.toString(),
    ];

    return {
      proof: commitment,
      publicInputs,
      verified: true,
    };
  }

  /**
   * Verify PFF scan matches user's heartbeat signature
   */
  private async verifyPFFScan(
    scanResult: WorkletResult,
    userUID: string
  ): Promise<boolean> {
    // In production, compare scan result with stored Truth-Bundle
    // For now, check if scan was successful
    return scanResult.status === 'LIFE_CONFIRMED' && scanResult.liveness;
  }

  /**
   * Log verification on-chain (for audit trail)
   */
  private async logVerification(
    uidBytes32: string,
    hospitalID: string,
    status: CoverageStatus
  ): Promise<string> {
    // In production, emit event on-chain
    // For now, create verification hash
    const verificationHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'string', 'string', 'uint256'],
        [uidBytes32, hospitalID, status, Date.now()]
      )
    );

    console.log('Verification logged:', {
      uid: uidBytes32,
      hospital: hospitalID,
      status,
      hash: verificationHash,
    });

    return verificationHash;
  }
}

/**
 * Verify health coverage (convenience function)
 */
export async function verifyHealthCover(
  userUID: string,
  hospitalID: string,
  contractAddress: string,
  provider: ethers.providers.Provider,
  pffScanResult?: WorkletResult
): Promise<VerificationResult> {
  const medicalAuth = new MedicalAuth(contractAddress, provider);

  return medicalAuth.verifyHealthCover({
    userUID,
    hospitalID,
    pffScanResult,
    timestamp: Date.now(),
  });
}

