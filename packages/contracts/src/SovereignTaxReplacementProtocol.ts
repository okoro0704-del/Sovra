/**
 * @file SovereignTaxReplacementProtocol.ts
 * @notice TypeScript integration layer for Sovereign Tax-Replacement Protocol (10% Standard)
 * 
 * "TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X."
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import { ethers } from 'ethers';

// ════════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Business tribute statistics
 */
export interface BusinessTributeStats {
  totalCollected: bigint;
  totalToNationalEscrow: bigint;
  totalToGlobalCitizenBlock: bigint;
  tributeRateBps: bigint;
  protocolActive: boolean;
}

/**
 * Sentinel tier information
 */
export interface SentinelTierInfo {
  tier: number; // 0=none, 1=tier1, 2=tier2, 3=tier3
  priceUSD: bigint;
  devices: bigint;
}

/**
 * Sentinel tier pricing
 */
export interface SentinelTierPricing {
  tier1PriceUSD: bigint;
  tier1Devices: bigint;
  tier2PriceUSD: bigint;
  tier2Devices: bigint;
  tier3PriceUSD: bigint;
  tier3Devices: bigint;
}

/**
 * Business tribute calculation result
 */
export interface TributeCalculation {
  tributeAmount: bigint;
  toNationalEscrow: bigint;
  toGlobalCitizenBlock: bigint;
}

/**
 * Revenue split configuration
 */
export interface RevenueSplit {
  nationalEscrowBps: bigint;
  globalCitizenBlockBps: bigint;
  description: string;
}

/**
 * Protocol metadata
 */
export interface ProtocolMetadata {
  name: string;
  version: string;
  description: string;
  architect: string;
}

/**
 * Contract addresses
 */
export interface ContractAddresses {
  vidaCap: string;
  snatClock: string;
  natEscrow: string;
  globalBlock: string;
}

// ════════════════════════════════════════════════════════════════════════════════
// SOVEREIGN TAX-REPLACEMENT PROTOCOL CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class SovereignTaxReplacementProtocol {
  private contract: ethers.Contract;
  private provider: ethers.providers.Provider;
  private signer?: ethers.Signer;

  constructor(
    contractAddress: string,
    provider: ethers.providers.Provider,
    signer?: ethers.Signer
  ) {
    this.provider = provider;
    this.signer = signer;

    // ABI for the contract (simplified for TypeScript integration)
    const abi = [
      // Core functions
      'function collectBusinessTribute(address from, address to, uint256 amount, string iso3166Code)',
      'function setBusinessTier(address business, bool isBusiness)',
      'function purchaseSentinelTier(uint8 tier)',
      'function activateProtocol()',
      'function deactivateProtocol()',
      
      // View functions
      'function getBusinessTributeStats() view returns (uint256, uint256, uint256, uint256, bool)',
      'function getNationalEscrowBalance(string iso3166Code) view returns (uint256)',
      'function getUserSentinelTier(address user) view returns (uint8, uint256, uint256)',
      'function getSentinelTierPricing() view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
      'function calculateBusinessTribute(uint256 amount) view returns (uint256, uint256, uint256)',
      'function getSNATDashboardMessage() view returns (string)',
      'function getNationalDividendPotential() view returns (uint256)',
      'function getProtocolMetadata() view returns (string, string, string, string)',
      'function getContractAddresses() view returns (address, address, address, address)',
      'function isBusinessTierAddress(address account) view returns (bool)',
      'function getRevenueSplit() view returns (uint256, uint256, string)',
      
      // Events
      'event BusinessTributeCollected(address indexed from, address indexed to, uint256 amount, uint256 tributeAmount, uint256 toNationalEscrow, uint256 toGlobalCitizenBlock, string iso3166Code)',
      'event NationalEscrowAllocated(string indexed iso3166Code, uint256 amount, uint256 totalBalance)',
      'event GlobalCitizenBlockAllocated(uint256 amount, uint256 totalBalance)',
      'event BusinessTierRegistered(address indexed business, bool isBusiness)',
      'event SentinelTierPurchased(address indexed user, uint8 tier, uint256 priceUSD, uint256 devices)',
      'event ProtocolActivated(uint256 timestamp, string message)',
      'event ProtocolDeactivated(uint256 timestamp)',
    ];

    this.contract = new ethers.Contract(
      contractAddress,
      abi,
      signer || provider
    );
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // CORE FUNCTIONS
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Collect 10% business tribute on business-tier transaction
   */
  async collectBusinessTribute(
    from: string,
    to: string,
    amount: bigint,
    iso3166Code: string
  ): Promise<ethers.ContractTransaction> {
    if (!this.signer) throw new Error('Signer required for this operation');
    return await this.contract.collectBusinessTribute(from, to, amount, iso3166Code);
  }

  /**
   * Register or unregister a business-tier address
   */
  async setBusinessTier(business: string, isBusiness: boolean): Promise<ethers.ContractTransaction> {
    if (!this.signer) throw new Error('Signer required for this operation');
    return await this.contract.setBusinessTier(business, isBusiness);
  }

  /**
   * Purchase Sentinel tier
   */
  async purchaseSentinelTier(tier: number): Promise<ethers.ContractTransaction> {
    if (!this.signer) throw new Error('Signer required for this operation');
    if (tier < 1 || tier > 3) throw new Error('Invalid tier (must be 1, 2, or 3)');
    return await this.contract.purchaseSentinelTier(tier);
  }

  /**
   * Activate the Tax-Killer Protocol
   */
  async activateProtocol(): Promise<ethers.ContractTransaction> {
    if (!this.signer) throw new Error('Signer required for this operation');
    return await this.contract.activateProtocol();
  }

  /**
   * Deactivate the protocol (emergency only)
   */
  async deactivateProtocol(): Promise<ethers.ContractTransaction> {
    if (!this.signer) throw new Error('Signer required for this operation');
    return await this.contract.deactivateProtocol();
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // VIEW FUNCTIONS
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Get business tribute statistics
   */
  async getBusinessTributeStats(): Promise<BusinessTributeStats> {
    const result = await this.contract.getBusinessTributeStats();
    return {
      totalCollected: result[0],
      totalToNationalEscrow: result[1],
      totalToGlobalCitizenBlock: result[2],
      tributeRateBps: result[3],
      protocolActive: result[4],
    };
  }

  /**
   * Get National Escrow balance for a nation
   */
  async getNationalEscrowBalance(iso3166Code: string): Promise<bigint> {
    return await this.contract.getNationalEscrowBalance(iso3166Code);
  }

  /**
   * Get Sentinel tier for a user
   */
  async getUserSentinelTier(user: string): Promise<SentinelTierInfo> {
    const result = await this.contract.getUserSentinelTier(user);
    return {
      tier: result[0],
      priceUSD: result[1],
      devices: result[2],
    };
  }

  /**
   * Get all Sentinel tier pricing (locked)
   */
  async getSentinelTierPricing(): Promise<SentinelTierPricing> {
    const result = await this.contract.getSentinelTierPricing();
    return {
      tier1PriceUSD: result[0],
      tier1Devices: result[1],
      tier2PriceUSD: result[2],
      tier2Devices: result[3],
      tier3PriceUSD: result[4],
      tier3Devices: result[5],
    };
  }

  /**
   * Calculate business tribute for a given amount
   */
  async calculateBusinessTribute(amount: bigint): Promise<TributeCalculation> {
    const result = await this.contract.calculateBusinessTribute(amount);
    return {
      tributeAmount: result[0],
      toNationalEscrow: result[1],
      toGlobalCitizenBlock: result[2],
    };
  }

  /**
   * Get SNAT Dashboard message for governments
   */
  async getSNATDashboardMessage(): Promise<string> {
    return await this.contract.getSNATDashboardMessage();
  }

  /**
   * Get National Dividend Potential multiplier
   */
  async getNationalDividendPotential(): Promise<bigint> {
    return await this.contract.getNationalDividendPotential();
  }

  /**
   * Get protocol metadata
   */
  async getProtocolMetadata(): Promise<ProtocolMetadata> {
    const result = await this.contract.getProtocolMetadata();
    return {
      name: result[0],
      version: result[1],
      description: result[2],
      architect: result[3],
    };
  }

  /**
   * Get contract addresses
   */
  async getContractAddresses(): Promise<ContractAddresses> {
    const result = await this.contract.getContractAddresses();
    return {
      vidaCap: result[0],
      snatClock: result[1],
      natEscrow: result[2],
      globalBlock: result[3],
    };
  }

  /**
   * Check if address is business-tier
   */
  async isBusinessTierAddress(account: string): Promise<boolean> {
    return await this.contract.isBusinessTierAddress(account);
  }

  /**
   * Get revenue split configuration
   */
  async getRevenueSplit(): Promise<RevenueSplit> {
    const result = await this.contract.getRevenueSplit();
    return {
      nationalEscrowBps: result[0],
      globalCitizenBlockBps: result[1],
      description: result[2],
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Format Sentinel tier name
 */
export function formatSentinelTier(tier: number): string {
  if (tier === 1) return 'Tier 1 ($20 - 1 device)';
  if (tier === 2) return 'Tier 2 ($50 - 3 devices)';
  if (tier === 3) return 'Tier 3 ($1,000 - 15 devices)';
  return 'No tier';
}

/**
 * Calculate tribute percentage
 */
export function calculateTributePercentage(tributeRateBps: bigint): number {
  return Number(tributeRateBps) / 100; // Convert basis points to percentage
}

/**
 * Format VIDA Cap amount
 */
export function formatVIDACapAmount(amount: bigint): string {
  return ethers.utils.formatEther(amount) + ' VIDA Cap';
}

/**
 * Parse VIDA Cap amount
 */
export function parseVIDACapAmount(amount: string): bigint {
  return ethers.utils.parseEther(amount).toBigInt();
}

/**
 * Format National Dividend Potential
 */
export function formatNationalDividendPotential(multiplier: bigint): string {
  return `${multiplier}X`;
}

/**
 * Get SNAT Dashboard display message
 */
export function getSNATDashboardDisplayMessage(): string {
  return "By activating this block, you replace 100% of PIT and VAT with this automated 5% National Revenue Stream.";
}

/**
 * Get Tax-Killer Protocol activation message
 */
export function getTaxKillerProtocolMessage(): string {
  return "TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X.";
}

