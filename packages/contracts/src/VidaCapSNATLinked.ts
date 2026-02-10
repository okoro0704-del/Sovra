/**
 * VidaCapSNATLinked.ts - TypeScript Integration for SNAT-Linked VIDA Cap Minting
 * 
 * "IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT."
 * 
 * This module provides TypeScript integration for the SNAT-Linked VIDA Cap smart contract.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════════════════════
// TYPES AND INTERFACES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Minting Era enum
 */
export enum MintingEra {
  TEN_UNIT_ERA = 0,
  TWO_UNIT_ERA = 1,
}

/**
 * SNAT Status enum
 */
export enum SNATStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  FLUSHED = 2,
}

/**
 * SNAT Statistics
 */
export interface SNATStatistics {
  activeMints: bigint;
  inactiveMints: bigint;
  flushedMints: bigint;
  globalPoolAllocations: bigint;
}

/**
 * Mint Amounts
 */
export interface MintAmounts {
  citizenAmount: bigint;
  nationAmount: bigint;
}

/**
 * PFF Handshake Mint Event
 */
export interface PFFHandshakeMintEvent {
  citizen: string;
  citizenAmount: bigint;
  nationAmount: bigint;
  globalPoolAmount: bigint;
  pffSignature: string;
  iso3166Code: string;
  snatStatus: SNATStatus;
}

// ════════════════════════════════════════════════════════════════════════════════
// VIDA CAP SNAT LINKED CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class VidaCapSNATLinked {
  private contract: any;
  private provider: any;
  private signer: any;

  constructor(contractAddress: string, provider: any, signer: any) {
    this.provider = provider;
    this.signer = signer;
    // In production, use actual contract ABI
    this.contract = new (provider as any).eth.Contract([], contractAddress);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MINTING FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Mint VIDA Cap on PFF-verified handshake with SNAT integration
   */
  async mintOnPFFHandshake(
    citizen: string,
    pffSignature: string,
    pffHash: string,
    iso3166Code: string
  ): Promise<void> {
    const tx = await this.contract.mintOnPFFHandshake(
      citizen,
      pffSignature,
      pffHash,
      iso3166Code
    );
    await tx.wait();
  }

  /**
   * Register nation escrow address for a specific nation
   */
  async registerNationEscrow(iso3166Code: string, escrowAddress: string): Promise<void> {
    const tx = await this.contract.registerNationEscrow(iso3166Code, escrowAddress);
    await tx.wait();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get current minting era
   */
  async getCurrentEra(): Promise<MintingEra> {
    const era = await this.contract.currentEra();
    return era as MintingEra;
  }

  /**
   * Get mint amounts for current era
   */
  async getMintAmountForCurrentEra(): Promise<MintAmounts> {
    const [citizenAmount, nationAmount] = await this.contract.getMintAmountForCurrentEra();
    return {
      citizenAmount: BigInt(citizenAmount.toString()),
      nationAmount: BigInt(nationAmount.toString()),
    };
  }

  /**
   * Get SNAT statistics
   */
  async getSNATStatistics(): Promise<SNATStatistics> {
    const [activeMints, inactiveMints, flushedMints, globalPoolAllocations] =
      await this.contract.getSNATStatistics();
    
    return {
      activeMints: BigInt(activeMints.toString()),
      inactiveMints: BigInt(inactiveMints.toString()),
      flushedMints: BigInt(flushedMints.toString()),
      globalPoolAllocations: BigInt(globalPoolAllocations.toString()),
    };
  }

  /**
   * Get nation escrow address for a specific nation
   */
  async getNationEscrow(iso3166Code: string): Promise<string> {
    return await this.contract.getNationEscrow(iso3166Code);
  }

  /**
   * Get total verified citizens
   */
  async getTotalVerifiedCitizens(): Promise<bigint> {
    const total = await this.contract.totalVerifiedCitizens();
    return BigInt(total.toString());
  }

  /**
   * Get total PFF handshakes
   */
  async getTotalPFFHandshakes(): Promise<bigint> {
    const total = await this.contract.totalPFFHandshakes();
    return BigInt(total.toString());
  }

  /**
   * Check if citizen is verified
   */
  async isVerifiedCitizen(address: string): Promise<boolean> {
    return await this.contract.isVerifiedCitizen(address);
  }

  /**
   * Get global citizen block address
   */
  async getGlobalCitizenBlock(): Promise<string> {
    return await this.contract.globalCitizenBlock();
  }

  /**
   * Get SNAT Death Clock address
   */
  async getSNATDeathClock(): Promise<string> {
    return await this.contract.snatDeathClock();
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Format SNAT status to human-readable string
 */
export function formatSNATStatus(status: SNATStatus): string {
  switch (status) {
    case SNATStatus.INACTIVE:
      return 'INACTIVE';
    case SNATStatus.ACTIVE:
      return 'ACTIVE';
    case SNATStatus.FLUSHED:
      return 'FLUSHED';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Format minting era to human-readable string
 */
export function formatMintingEra(era: MintingEra): string {
  switch (era) {
    case MintingEra.TEN_UNIT_ERA:
      return '10-Unit Era';
    case MintingEra.TWO_UNIT_ERA:
      return '2-Unit Era';
    default:
      return 'Unknown Era';
  }
}

/**
 * Calculate nation allocation percentage based on SNAT status
 */
export function calculateNationAllocationPercentage(status: SNATStatus): number {
  switch (status) {
    case SNATStatus.ACTIVE:
      return 100; // 100% to nation
    case SNATStatus.INACTIVE:
      return 50; // 50% to nation, 50% to global pool
    case SNATStatus.FLUSHED:
      return 0; // 0% to nation, 100% to global pool
    default:
      return 0;
  }
}

/**
 * Calculate global pool allocation percentage based on SNAT status
 */
export function calculateGlobalPoolAllocationPercentage(status: SNATStatus): number {
  switch (status) {
    case SNATStatus.ACTIVE:
      return 0; // 0% to global pool
    case SNATStatus.INACTIVE:
      return 50; // 50% to global pool
    case SNATStatus.FLUSHED:
      return 100; // 100% to global pool
    default:
      return 0;
  }
}

/**
 * Format VIDA Cap amount (convert from wei to VIDA Cap)
 */
export function formatVIDACapAmount(amount: bigint): string {
  const vidaCap = Number(amount) / 1e18;
  return vidaCap.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Parse VIDA Cap amount (convert from VIDA Cap to wei)
 */
export function parseVIDACapAmount(amount: number): bigint {
  return BigInt(Math.floor(amount * 1e18));
}

/**
 * Get SNAT status description
 */
export function getSNATStatusDescription(status: SNATStatus): string {
  switch (status) {
    case SNATStatus.INACTIVE:
      return 'SNAT not signed - Nation receives 50% allocation, 50% goes to Global Citizen Block';
    case SNATStatus.ACTIVE:
      return 'SNAT signed and active - Nation receives 100% allocation';
    case SNATStatus.FLUSHED:
      return 'Vault flushed to Global Citizen Block - Nation receives 0% allocation';
    default:
      return 'Unknown SNAT status';
  }
}

/**
 * Validate ISO 3166 Alpha-2 code
 */
export function validateISO3166Code(code: string): boolean {
  // ISO 3166 Alpha-2 codes are exactly 2 uppercase letters
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Format PFF signature for display
 */
export function formatPFFSignature(signature: string): string {
  if (signature.length < 10) return signature;
  return `${signature.substring(0, 6)}...${signature.substring(signature.length - 4)}`;
}


