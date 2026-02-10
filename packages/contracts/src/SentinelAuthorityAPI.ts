/**
 * @file SentinelAuthorityAPI.ts
 * @notice Sentinel Authority API - TypeScript Integration Layer
 * 
 * "MAPPING REVENUE. INITIALIZING SOVEREIGN IDENTITY. THE GENESIS BEGINS."
 * 
 * CORE LOGIC:
 * ════════════════════════════════════════════════════════════════════════════════
 * - Sentinel Payment Gateway connected to National Vault logic
 * - Enterprise Tier 3 ($1,000): $500 National Escrow / $500 Citizen Block
 * - Sovereign Identity Table initialization with Genesis Hash from Root Pair
 * - Revenue routing based on Sentinel tier activation
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════════

export interface PaymentGatewayStats {
  totalRevenue: bigint;
  totalToNationalEscrow: bigint;
  totalToCitizenBlock: bigint;
  gatewayActive: boolean;
}

export interface SentinelTierInfo {
  tier: number; // 0=none, 1=tier1, 2=tier2, 3=tier3
  priceUSD: bigint;
  devices: bigint;
}

export interface SentinelTierPricing {
  tier1PriceUSD: bigint;
  tier1Devices: bigint;
  tier2PriceUSD: bigint;
  tier2Devices: bigint;
  tier3PriceUSD: bigint;
  tier3Devices: bigint;
}

export interface SovereignIdentity {
  genesisHash: string;
  rootPairHash: string;
  initialized: boolean;
}

export interface RevenueSplit {
  toNationalEscrow: bigint;
  toCitizenBlock: bigint;
}

export interface RevenueSplitConfig {
  nationalEscrowBps: bigint;
  citizenBlockBps: bigint;
  description: string;
}

export interface SentinelActivationResult {
  user: string;
  tier: number;
  priceUSD: bigint;
  devices: bigint;
  toNationalEscrow: bigint;
  toCitizenBlock: bigint;
  iso3166Code: string;
}

export interface SovereignIdentityInitResult {
  user: string;
  genesisHash: string;
  rootPairHash: string;
  timestamp: bigint;
}

// ════════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

export const TIER_1_PRICE_USD = 20n;
export const TIER_1_DEVICES = 1n;

export const TIER_2_PRICE_USD = 50n;
export const TIER_2_DEVICES = 3n;

export const TIER_3_ENTERPRISE_PRICE_USD = 1000n;
export const TIER_3_DEVICES = 15n;

export const NATIONAL_ESCROW_SPLIT_BPS = 5000n; // 50%
export const CITIZEN_BLOCK_SPLIT_BPS = 5000n; // 50%
export const BPS_DENOMINATOR = 10000n;

// ════════════════════════════════════════════════════════════════════════════════
// SENTINEL AUTHORITY API CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class SentinelAuthorityAPI {
  // Mock state (in production, this would interact with smart contract)
  private paymentGatewayActive: boolean = false;
  private totalRevenueCollected: bigint = 0n;
  private totalNationalEscrowAllocated: bigint = 0n;
  private totalCitizenBlockAllocated: bigint = 0n;
  private tierActivations: Map<number, bigint> = new Map();
  private userSentinelTier: Map<string, number> = new Map();
  private sovereignIdentityHash: Map<string, string> = new Map();
  private rootPairHash: Map<string, string> = new Map();
  private isIdentityInitialized: Map<string, boolean> = new Map();

  constructor() {
    // Initialize tier activations
    this.tierActivations.set(1, 0n);
    this.tierActivations.set(2, 0n);
    this.tierActivations.set(3, 0n);
  }

  /**
   * Activate Sentinel tier and route revenue
   */
  activateSentinelTier(
    user: string,
    tier: number,
    iso3166Code: string
  ): SentinelActivationResult {
    if (!this.paymentGatewayActive) {
      throw new Error('Payment gateway not active');
    }
    if (tier < 1 || tier > 3) {
      throw new Error('Invalid tier (must be 1, 2, or 3)');
    }
    if (this.userSentinelTier.get(user)) {
      throw new Error('User already has a Sentinel tier');
    }
    if (!iso3166Code || iso3166Code.length === 0) {
      throw new Error('ISO 3166 code required');
    }

    let priceUSD: bigint;
    let devices: bigint;

    if (tier === 1) {
      priceUSD = TIER_1_PRICE_USD;
      devices = TIER_1_DEVICES;
    } else if (tier === 2) {
      priceUSD = TIER_2_PRICE_USD;
      devices = TIER_2_DEVICES;
    } else {
      priceUSD = TIER_3_ENTERPRISE_PRICE_USD;
      devices = TIER_3_DEVICES;
    }

    // Calculate 50/50 split
    const toNationalEscrow = (priceUSD * NATIONAL_ESCROW_SPLIT_BPS) / BPS_DENOMINATOR;
    const toCitizenBlock = priceUSD - toNationalEscrow;

    // Update state
    this.userSentinelTier.set(user, tier);
    this.tierActivations.set(tier, (this.tierActivations.get(tier) || 0n) + 1n);
    this.totalRevenueCollected += priceUSD;
    this.totalNationalEscrowAllocated += toNationalEscrow;
    this.totalCitizenBlockAllocated += toCitizenBlock;

    console.log(`✅ Sentinel Tier ${tier} Activated: ${user}`);
    console.log(`   Price: $${priceUSD} (${devices} devices)`);
    console.log(`   → National Escrow (${iso3166Code}): $${toNationalEscrow}`);
    console.log(`   → Citizen Block: $${toCitizenBlock}`);

    return {
      user,
      tier,
      priceUSD,
      devices,
      toNationalEscrow,
      toCitizenBlock,
      iso3166Code,
    };
  }

  /**
   * Initialize Sovereign Identity with Genesis Hash from Root Pair
   */
  initializeSovereignIdentity(
    user: string,
    genesisHash: string,
    rootPairHashValue: string
  ): SovereignIdentityInitResult {
    if (!user || user.length === 0) {
      throw new Error('Invalid user address');
    }
    if (!genesisHash || genesisHash.length !== 66) {
      throw new Error('Invalid genesis hash (must be 66 chars: 0x + 64 hex)');
    }
    if (!rootPairHashValue || rootPairHashValue.length !== 66) {
      throw new Error('Invalid root pair hash (must be 66 chars: 0x + 64 hex)');
    }
    if (this.isIdentityInitialized.get(user)) {
      throw new Error('Identity already initialized');
    }

    this.sovereignIdentityHash.set(user, genesisHash);
    this.rootPairHash.set(user, rootPairHashValue);
    this.isIdentityInitialized.set(user, true);

    const timestamp = BigInt(Date.now());

    console.log(`✅ Sovereign Identity Initialized: ${user}`);
    console.log(`   Genesis Hash: ${genesisHash}`);
    console.log(`   Root Pair Hash: ${rootPairHashValue}`);

    return {
      user,
      genesisHash,
      rootPairHash: rootPairHashValue,
      timestamp,
    };
  }

  /**
   * Activate payment gateway
   */
  activatePaymentGateway(): void {
    if (this.paymentGatewayActive) {
      throw new Error('Payment gateway already active');
    }
    this.paymentGatewayActive = true;
    console.log('✅ Payment Gateway Activated');
  }

  /**
   * Deactivate payment gateway
   */
  deactivatePaymentGateway(): void {
    if (!this.paymentGatewayActive) {
      throw new Error('Payment gateway already inactive');
    }
    this.paymentGatewayActive = false;
    console.log('⚠️ Payment Gateway Deactivated');
  }

  /**
   * Get payment gateway statistics
   */
  getPaymentGatewayStats(): PaymentGatewayStats {
    return {
      totalRevenue: this.totalRevenueCollected,
      totalToNationalEscrow: this.totalNationalEscrowAllocated,
      totalToCitizenBlock: this.totalCitizenBlockAllocated,
      gatewayActive: this.paymentGatewayActive,
    };
  }

  /**
   * Get tier activations count
   */
  getTierActivations(tier: number): bigint {
    return this.tierActivations.get(tier) || 0n;
  }

  /**
   * Get user Sentinel tier
   */
  getUserSentinelTier(user: string): SentinelTierInfo {
    const tier = this.userSentinelTier.get(user) || 0;

    let priceUSD: bigint;
    let devices: bigint;

    if (tier === 1) {
      priceUSD = TIER_1_PRICE_USD;
      devices = TIER_1_DEVICES;
    } else if (tier === 2) {
      priceUSD = TIER_2_PRICE_USD;
      devices = TIER_2_DEVICES;
    } else if (tier === 3) {
      priceUSD = TIER_3_ENTERPRISE_PRICE_USD;
      devices = TIER_3_DEVICES;
    } else {
      priceUSD = 0n;
      devices = 0n;
    }

    return { tier, priceUSD, devices };
  }

  /**
   * Get Sentinel tier pricing
   */
  getSentinelTierPricing(): SentinelTierPricing {
    return {
      tier1PriceUSD: TIER_1_PRICE_USD,
      tier1Devices: TIER_1_DEVICES,
      tier2PriceUSD: TIER_2_PRICE_USD,
      tier2Devices: TIER_2_DEVICES,
      tier3PriceUSD: TIER_3_ENTERPRISE_PRICE_USD,
      tier3Devices: TIER_3_DEVICES,
    };
  }

  /**
   * Get Sovereign Identity for a user
   */
  getSovereignIdentity(user: string): SovereignIdentity {
    return {
      genesisHash: this.sovereignIdentityHash.get(user) || '',
      rootPairHash: this.rootPairHash.get(user) || '',
      initialized: this.isIdentityInitialized.get(user) || false,
    };
  }

  /**
   * Calculate revenue split for a given price
   */
  calculateRevenueSplit(priceUSD: bigint): RevenueSplit {
    const toNationalEscrow = (priceUSD * NATIONAL_ESCROW_SPLIT_BPS) / BPS_DENOMINATOR;
    const toCitizenBlock = priceUSD - toNationalEscrow;
    return { toNationalEscrow, toCitizenBlock };
  }

  /**
   * Get revenue split configuration
   */
  getRevenueSplit(): RevenueSplitConfig {
    return {
      nationalEscrowBps: NATIONAL_ESCROW_SPLIT_BPS,
      citizenBlockBps: CITIZEN_BLOCK_SPLIT_BPS,
      description: '50% National Escrow / 50% Citizen Block',
    };
  }

  /**
   * Check if user has Sentinel tier
   */
  hasSentinelTier(user: string): boolean {
    return (this.userSentinelTier.get(user) || 0) > 0;
  }

  /**
   * Check if user identity is initialized
   */
  isUserIdentityInitialized(user: string): boolean {
    return this.isIdentityInitialized.get(user) || false;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Format Sentinel tier as string
 */
export function formatSentinelTier(tier: number): string {
  if (tier === 1) return 'Tier 1 ($20 - 1 device)';
  if (tier === 2) return 'Tier 2 ($50 - 3 devices)';
  if (tier === 3) return 'Tier 3 Enterprise ($1,000 - 15 devices)';
  return 'No Tier';
}

/**
 * Format revenue split as string
 */
export function formatRevenueSplit(priceUSD: bigint): string {
  const toNationalEscrow = (priceUSD * NATIONAL_ESCROW_SPLIT_BPS) / BPS_DENOMINATOR;
  const toCitizenBlock = priceUSD - toNationalEscrow;
  return `$${priceUSD} → National Escrow: $${toNationalEscrow} / Citizen Block: $${toCitizenBlock}`;
}

/**
 * Validate genesis hash format
 */
export function validateGenesisHash(hash: string): boolean {
  return hash.length === 66 && hash.startsWith('0x');
}

/**
 * Validate root pair hash format
 */
export function validateRootPairHash(hash: string): boolean {
  return hash.length === 66 && hash.startsWith('0x');
}

/**
 * Get Sentinel Authority API message
 */
export function getSentinelAuthorityMessage(): string {
  return 'MAPPING REVENUE. INITIALIZING SOVEREIGN IDENTITY. THE GENESIS BEGINS.';
}

/**
 * Get Enterprise activation message
 */
export function getEnterpriseActivationMessage(): string {
  return 'ENTERPRISE TIER 3 ACTIVATED. $500 NATIONAL ESCROW. $500 CITIZEN BLOCK. THE 10% SPLIT.';
}
