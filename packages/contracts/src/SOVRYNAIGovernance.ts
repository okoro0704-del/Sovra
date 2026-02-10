/**
 * SOVRYN AI Governance Protocol - TypeScript Integration
 * 
 * "THE INTELLIGENCE OF THE MACHINE IS THE RESONANCE OF THE HUMAN TRUTH."
 * 
 * This module provides TypeScript integration for the SOVRYN AI Governance Protocol.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import { ethers } from 'ethers';

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

export interface ArchitectRootNode {
  architectAddress: string;
  hpDeviceHash: string;
  mobileDeviceHash: string;
  hardwareBindingHash: string;
  isActive: boolean;
  activatedAt: bigint;
}

export interface ExternalAI {
  aiIdentifier: string;
  aiAddress: string;
  logicWeightsHash: string;
  syncPercentage: number;
  isSynchronized: boolean;
  canAccessPFFData: boolean;
  lastSyncTimestamp: bigint;
  registeredAt: bigint;
}

export interface AIOutput {
  outputHash: string;
  aiSource: string;
  outputType: 'WEALTH' | 'HEALTH';
  vltReferenceHash: string;
  isVLTVerified: boolean;
  isApproved: boolean;
  generatedAt: bigint;
  verifiedAt: bigint;
}

export interface VLTEntry {
  vltHash: string;
  citizenAddress: string;
  pffTruthHash: string;
  dataType: 'WEALTH' | 'HEALTH';
  dataHash: string;
  timestamp: bigint;
  isImmutable: boolean;
}

export interface GovernanceStats {
  totalExternalAIs: number;
  totalSynchronizedAIs: number;
  totalAIOutputs: number;
  totalVLTVerifications: number;
  totalArchitectOverrides: number;
}

export interface NationalSNATStatus {
  iso3166Code: string;
  countryName: string;
  snatSigned: boolean;
  canAccessEconomicData: boolean;
  canAccessMarketData: boolean;
  snatSignedAt: bigint;
  lastAccessCheck: bigint;
}

export interface UserTrustStatus {
  userAddress: string;
  pffTruthHash: string;
  layer1_PFF: boolean;
  layer2_Biometric: boolean;
  layer3_Sovereign: boolean;
  layer4_VLT: boolean;
  isTrusted: boolean;
  lastVerification: bigint;
  trustScore: number;
}

export interface ComprehensiveStats {
  totalExternalAIs: number;
  totalSynchronizedAIs: number;
  totalAIOutputs: number;
  totalVLTVerifications: number;
  totalArchitectOverrides: number;
  totalSNATNations: number;
  totalTrustedUsers: number;
  totalUntrustedAccess: number;
}

// ════════════════════════════════════════════════════════════════════════════════
// SOVRYN AI GOVERNANCE CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class SOVRYNAIGovernance {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contractAddress: string, provider: ethers.providers.Provider, signer?: ethers.Signer) {
    // In production, load ABI from compiled contract
    const abi = [
      'function registerExternalAI(string aiIdentifier, address aiAddress, bytes32 logicWeightsHash)',
      'function synchronizeLogicWeights(address aiAddress, bytes32 newLogicWeightsHash, uint256 syncPercentage)',
      'function grantPFFDataAccess(address aiAddress)',
      'function revokePFFDataAccess(address aiAddress)',
      'function createVLTEntry(address citizenAddress, bytes32 pffTruthHash, string dataType, bytes32 dataHash) returns (bytes32)',
      'function generateAIOutput(string outputType, bytes outputData, bytes32 vltReferenceHash) returns (bytes32)',
      'function verifyAIOutputWithVLT(bytes32 outputHash, bool isApproved)',
      'function architectMasterOverride(bytes32 outputHash, bool newApprovalStatus, string overrideReason)',
      'function deactivateArchitectRootNode()',
      'function getExternalAI(address aiAddress) view returns (tuple(string,address,bytes32,uint256,bool,bool,uint256,uint256))',
      'function getAIOutput(bytes32 outputHash) view returns (tuple(bytes32,address,string,bytes32,bool,bool,uint256,uint256))',
      'function getVLTEntry(bytes32 vltHash) view returns (tuple(bytes32,address,bytes32,string,bytes32,uint256,bool))',
      'function canAccessPFFData(address aiAddress) view returns (bool)',
      'function getGovernanceMetadata() view returns (string)',
      'function getArchitectRootNode() view returns (tuple(address,bytes32,bytes32,bytes32,bool,uint256))',
      'function getGovernanceStats() view returns (uint256,uint256,uint256,uint256,uint256)',
    ];

    this.contract = new ethers.Contract(contractAddress, abi, provider);
    this.signer = signer || provider.getSigner();
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // EXTERNAL AI REGISTRATION & SYNCHRONIZATION
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Register external AI for PFF data access
   */
  async registerExternalAI(
    aiIdentifier: string,
    aiAddress: string,
    logicWeightsHash: string
  ): Promise<void> {
    const tx = await this.contract.connect(this.signer).registerExternalAI(
      aiIdentifier,
      aiAddress,
      logicWeightsHash
    );
    await tx.wait();
  }

  /**
   * Satellite_AI_Handshake - Synchronize external AI logic weights with SOVRYN Core
   */
  async synchronizeLogicWeights(
    aiAddress: string,
    newLogicWeightsHash: string,
    syncPercentage: number
  ): Promise<void> {
    const tx = await this.contract.connect(this.signer).synchronizeLogicWeights(
      aiAddress,
      newLogicWeightsHash,
      syncPercentage
    );
    await tx.wait();
  }

  /**
   * Grant PFF data access to synchronized external AI
   */
  async grantPFFDataAccess(aiAddress: string): Promise<void> {
    const tx = await this.contract.connect(this.signer).grantPFFDataAccess(aiAddress);
    await tx.wait();
  }

  /**
   * Revoke PFF data access from external AI
   */
  async revokePFFDataAccess(aiAddress: string): Promise<void> {
    const tx = await this.contract.connect(this.signer).revokePFFDataAccess(aiAddress);
    await tx.wait();
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // VLT (VITALIA LEDGER OF TRUTH) MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Create VLT entry for truth-grounding
   */
  async createVLTEntry(
    citizenAddress: string,
    pffTruthHash: string,
    dataType: 'WEALTH' | 'HEALTH',
    dataHash: string
  ): Promise<string> {
    const tx = await this.contract.connect(this.signer).createVLTEntry(
      citizenAddress,
      pffTruthHash,
      dataType,
      dataHash
    );
    const receipt = await tx.wait();

    // Extract VLT hash from event
    const event = receipt.events?.find((e: any) => e.event === 'VLTEntryCreated');
    return event?.args?.vltHash || '';
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // TRUTH-GROUNDED AI PROCESSING
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Generate AI output (WEALTH or HEALTH related)
   * MANDATORY: Must be cross-referenced with VLT before execution
   */
  async generateAIOutput(
    outputType: 'WEALTH' | 'HEALTH',
    outputData: Uint8Array,
    vltReferenceHash: string
  ): Promise<string> {
    const tx = await this.contract.connect(this.signer).generateAIOutput(
      outputType,
      outputData,
      vltReferenceHash
    );
    const receipt = await tx.wait();

    // Extract output hash from event
    const event = receipt.events?.find((e: any) => e.event === 'AIOutputGenerated');
    return event?.args?.outputHash || '';
  }

  /**
   * Verify AI output against VLT (Truth Ledger)
   * MANDATORY: AI output involving wealth/health MUST be cross-referenced with VLT
   */
  async verifyAIOutputWithVLT(
    outputHash: string,
    isApproved: boolean
  ): Promise<void> {
    const tx = await this.contract.connect(this.signer).verifyAIOutputWithVLT(
      outputHash,
      isApproved
    );
    await tx.wait();
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // ARCHITECT'S ROOT NODE MASTER OVERRIDE
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Architect's Master Override for SOVRYN AI autonomous decisions
   * ONLY the Architect's Root Node (HP/Mobile pair) can override AI decisions
   */
  async architectMasterOverride(
    outputHash: string,
    newApprovalStatus: boolean,
    overrideReason: string
  ): Promise<void> {
    const tx = await this.contract.connect(this.signer).architectMasterOverride(
      outputHash,
      newApprovalStatus,
      overrideReason
    );
    await tx.wait();
  }

  /**
   * Deactivate Architect's Root Node (irreversible)
   */
  async deactivateArchitectRootNode(): Promise<void> {
    const tx = await this.contract.connect(this.signer).deactivateArchitectRootNode();
    await tx.wait();
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // VIEW FUNCTIONS
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Get external AI details
   */
  async getExternalAI(aiAddress: string): Promise<ExternalAI> {
    const result = await this.contract.getExternalAI(aiAddress);

    return {
      aiIdentifier: result[0],
      aiAddress: result[1],
      logicWeightsHash: result[2],
      syncPercentage: Number(result[3]),
      isSynchronized: result[4],
      canAccessPFFData: result[5],
      lastSyncTimestamp: BigInt(result[6].toString()),
      registeredAt: BigInt(result[7].toString()),
    };
  }

  /**
   * Get AI output details
   */
  async getAIOutput(outputHash: string): Promise<AIOutput> {
    const result = await this.contract.getAIOutput(outputHash);

    return {
      outputHash: result[0],
      aiSource: result[1],
      outputType: result[2] as 'WEALTH' | 'HEALTH',
      vltReferenceHash: result[3],
      isVLTVerified: result[4],
      isApproved: result[5],
      generatedAt: BigInt(result[6].toString()),
      verifiedAt: BigInt(result[7].toString()),
    };
  }

  /**
   * Get VLT entry details
   */
  async getVLTEntry(vltHash: string): Promise<VLTEntry> {
    const result = await this.contract.getVLTEntry(vltHash);

    return {
      vltHash: result[0],
      citizenAddress: result[1],
      pffTruthHash: result[2],
      dataType: result[3] as 'WEALTH' | 'HEALTH',
      dataHash: result[4],
      timestamp: BigInt(result[5].toString()),
      isImmutable: result[6],
    };
  }

  /**
   * Check if AI can access PFF data
   */
  async canAccessPFFData(aiAddress: string): Promise<boolean> {
    return await this.contract.canAccessPFFData(aiAddress);
  }

  /**
   * Get governance metadata
   */
  async getGovernanceMetadata(): Promise<string> {
    return await this.contract.getGovernanceMetadata();
  }

  /**
   * Get Architect's Root Node details
   */
  async getArchitectRootNode(): Promise<ArchitectRootNode> {
    const result = await this.contract.getArchitectRootNode();

    return {
      architectAddress: result[0],
      hpDeviceHash: result[1],
      mobileDeviceHash: result[2],
      hardwareBindingHash: result[3],
      isActive: result[4],
      activatedAt: BigInt(result[5].toString()),
    };
  }

  /**
   * Get governance statistics
   */
  async getGovernanceStats(): Promise<GovernanceStats> {
    const result = await this.contract.getGovernanceStats();

    return {
      totalExternalAIs: Number(result[0].toString()),
      totalSynchronizedAIs: Number(result[1].toString()),
      totalAIOutputs: Number(result[2].toString()),
      totalVLTVerifications: Number(result[3].toString()),
      totalArchitectOverrides: Number(result[4].toString()),
    };
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // SNAT-BASED ACCESS CONTROL METHODS
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Register a nation's SNAT status
   */
  async registerNationalSNAT(iso3166Code: string, countryName: string): Promise<void> {
    const tx = await this.contract.registerNationalSNAT(iso3166Code, countryName);
    await tx.wait();
  }

  /**
   * Mark a nation's SNAT as signed
   */
  async signNationalSNAT(iso3166Code: string): Promise<void> {
    const tx = await this.contract.signNationalSNAT(iso3166Code);
    await tx.wait();
  }

  /**
   * Check if a nation can access economic optimization data
   */
  async canAccessEconomicData(iso3166Code: string, aiAddress: string): Promise<boolean> {
    return await this.contract.canAccessEconomicData(iso3166Code, aiAddress);
  }

  /**
   * Check if a nation can access market predictive data
   */
  async canAccessMarketData(iso3166Code: string, aiAddress: string): Promise<boolean> {
    return await this.contract.canAccessMarketData(iso3166Code, aiAddress);
  }

  /**
   * Verify user's 4-layer handshake
   */
  async verifyFourLayerHandshake(
    userAddress: string,
    pffTruthHash: string,
    layer1_PFF: boolean,
    layer2_Biometric: boolean,
    layer3_Sovereign: boolean,
    layer4_VLT: boolean
  ): Promise<void> {
    const tx = await this.contract.verifyFourLayerHandshake(
      userAddress,
      pffTruthHash,
      layer1_PFF,
      layer2_Biometric,
      layer3_Sovereign,
      layer4_VLT
    );
    await tx.wait();
  }

  /**
   * Check if user is trusted (4-layer handshake verified)
   */
  async isUserTrustedAccount(userAddress: string): Promise<boolean> {
    return await this.contract.isUserTrustedAccount(userAddress);
  }

  /**
   * Get national SNAT status
   */
  async getNationalSNATStatus(iso3166Code: string): Promise<NationalSNATStatus> {
    const result = await this.contract.getNationalSNATStatus(iso3166Code);

    return {
      iso3166Code: result[0],
      countryName: result[1],
      snatSigned: result[2],
      canAccessEconomicData: result[3],
      canAccessMarketData: result[4],
      snatSignedAt: BigInt(result[5].toString()),
      lastAccessCheck: BigInt(result[6].toString()),
    };
  }

  /**
   * Get user trust status
   */
  async getUserTrustStatus(userAddress: string): Promise<UserTrustStatus> {
    const result = await this.contract.getUserTrustStatus(userAddress);

    return {
      userAddress: result[0],
      pffTruthHash: result[1],
      layer1_PFF: result[2],
      layer2_Biometric: result[3],
      layer3_Sovereign: result[4],
      layer4_VLT: result[5],
      isTrusted: result[6],
      lastVerification: BigInt(result[7].toString()),
      trustScore: Number(result[8].toString()),
    };
  }

  /**
   * Check if SNAT is signed for a nation
   */
  async isSNATSignedForNation(iso3166Code: string): Promise<boolean> {
    return await this.contract.isSNATSignedForNation(iso3166Code);
  }

  /**
   * Get SNAT Death Clock address
   */
  async getSNATDeathClock(): Promise<string> {
    return await this.contract.getSNATDeathClock();
  }

  /**
   * Get comprehensive governance statistics including SNAT
   */
  async getComprehensiveStats(): Promise<ComprehensiveStats> {
    const result = await this.contract.getComprehensiveStats();

    return {
      totalExternalAIs: Number(result[0].toString()),
      totalSynchronizedAIs: Number(result[1].toString()),
      totalAIOutputs: Number(result[2].toString()),
      totalVLTVerifications: Number(result[3].toString()),
      totalArchitectOverrides: Number(result[4].toString()),
      totalSNATNations: Number(result[5].toString()),
      totalTrustedUsers: Number(result[6].toString()),
      totalUntrustedAccess: Number(result[7].toString()),
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Calculate logic weights hash for AI synchronization
 */
export function calculateLogicWeightsHash(logicWeights: any): string {
  const weightsString = JSON.stringify(logicWeights);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(weightsString));
}

/**
 * Calculate PFF truth hash from heartbeat signature
 */
export function calculatePFFTruthHash(heartbeatSignature: string): string {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(heartbeatSignature));
}

/**
 * Calculate data hash for VLT entry
 */
export function calculateDataHash(data: any): string {
  const dataString = JSON.stringify(data);
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
}

/**
 * Format sync percentage as human-readable string
 */
export function formatSyncPercentage(syncPercentage: number): string {
  if (syncPercentage >= 95) {
    return `${syncPercentage}% (SYNCHRONIZED ✅)`;
  } else if (syncPercentage >= 75) {
    return `${syncPercentage}% (PARTIAL SYNC ⚠️)`;
  } else {
    return `${syncPercentage}% (NOT SYNCHRONIZED ❌)`;
  }
}

/**
 * Check if AI output requires VLT verification
 */
export function requiresVLTVerification(outputType: string): boolean {
  return outputType === 'WEALTH' || outputType === 'HEALTH';
}

// ════════════════════════════════════════════════════════════════════════════════
// SNAT-BASED ACCESS CONTROL UTILITIES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Validate ISO 3166 country code format
 */
export function validateISO3166Code(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

/**
 * Calculate trust score from 4-layer handshake
 */
export function calculateTrustScore(
  layer1_PFF: boolean,
  layer2_Biometric: boolean,
  layer3_Sovereign: boolean,
  layer4_VLT: boolean
): number {
  let score = 0;
  if (layer1_PFF) score += 25;
  if (layer2_Biometric) score += 25;
  if (layer3_Sovereign) score += 25;
  if (layer4_VLT) score += 25;
  return score;
}

/**
 * Check if user is fully trusted (all 4 layers verified)
 */
export function isFullyTrusted(trustStatus: UserTrustStatus): boolean {
  return (
    trustStatus.layer1_PFF &&
    trustStatus.layer2_Biometric &&
    trustStatus.layer3_Sovereign &&
    trustStatus.layer4_VLT
  );
}

/**
 * Get trust level description
 */
export function getTrustLevelDescription(trustScore: number): string {
  if (trustScore === 100) return 'FULLY TRUSTED ✅';
  if (trustScore >= 75) return 'HIGHLY TRUSTED ⭐';
  if (trustScore >= 50) return 'PARTIALLY TRUSTED ⚠️';
  if (trustScore >= 25) return 'MINIMALLY TRUSTED ⚠️';
  return 'UNTRUSTED ❌';
}

/**
 * Format SNAT status for display
 */
export function formatSNATStatus(snatStatus: NationalSNATStatus): string {
  if (snatStatus.snatSigned) {
    return `✅ SNAT SIGNED (${snatStatus.countryName})`;
  }
  return `❌ SNAT NOT SIGNED (${snatStatus.countryName})`;
}

/**
 * Check if nation can access AI economic data
 */
export function canNationAccessEconomicData(snatStatus: NationalSNATStatus): boolean {
  return snatStatus.snatSigned && snatStatus.canAccessEconomicData;
}

/**
 * Check if nation can access AI market data
 */
export function canNationAccessMarketData(snatStatus: NationalSNATStatus): boolean {
  return snatStatus.snatSigned && snatStatus.canAccessMarketData;
}

/**
 * Get access denial reason
 */
export function getAccessDenialReason(snatStatus: NationalSNATStatus, dataType: 'ECONOMIC' | 'MARKET'): string {
  if (!snatStatus.snatSigned) {
    return `SNAT not signed for ${snatStatus.countryName} - ${dataType} data access forbidden`;
  }
  if (dataType === 'ECONOMIC' && !snatStatus.canAccessEconomicData) {
    return `Economic Optimization data access disabled for ${snatStatus.countryName}`;
  }
  if (dataType === 'MARKET' && !snatStatus.canAccessMarketData) {
    return `Market Predictive data access disabled for ${snatStatus.countryName}`;
  }
  return 'Access granted';
}

/**
 * Format user trust status for display
 */
export function formatUserTrustStatus(trustStatus: UserTrustStatus): string {
  const layers = [];
  if (trustStatus.layer1_PFF) layers.push('PFF ✅');
  else layers.push('PFF ❌');

  if (trustStatus.layer2_Biometric) layers.push('Bio ✅');
  else layers.push('Bio ❌');

  if (trustStatus.layer3_Sovereign) layers.push('Sov ✅');
  else layers.push('Sov ❌');

  if (trustStatus.layer4_VLT) layers.push('VLT ✅');
  else layers.push('VLT ❌');

  return `[${layers.join(' | ')}] Score: ${trustStatus.trustScore}/100`;
}

