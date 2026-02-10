/**
 * SNATDeathClock.ts - TypeScript Integration for SNAT Death Clock
 * 
 * "IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT."
 * 
 * This module provides TypeScript integration for the SNAT Death Clock smart contract.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════════════════════
// TYPES AND INTERFACES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * SNAT Status enum
 */
export enum SNATStatus {
  INACTIVE = 0,  // SNAT not signed
  ACTIVE = 1,    // SNAT signed and active
  FLUSHED = 2,   // Vault flushed to Global Citizen Block
}

/**
 * Nation Death Clock structure
 */
export interface NationDeathClock {
  iso3166Code: string;        // ISO-3166 Alpha-2 code
  countryName: string;        // Full country name
  deathClockStart: bigint;    // Timestamp of first citizen vitalization
  deathClockExpiry: bigint;   // Timestamp when clock expires (start + 180 days)
  safeVault: string;          // Safe vault address (70% of VIDA CAP)
  safeVaultBalance: bigint;   // Safe vault balance at flush time
  snatStatus: SNATStatus;     // Current SNAT status
  isInitialized: boolean;     // Whether death clock has been initialized
  isFlushed: boolean;         // Whether vault has been flushed
  flushTimestamp: bigint;     // Timestamp of flush
  flushTxHash: string;        // Transaction hash of flush
}

/**
 * Global Flush Statistics
 */
export interface GlobalFlushStats {
  totalFlushed: bigint;       // Total amount flushed to Global Citizen Block
  nationsFlushed: bigint;     // Total number of nations flushed
  nationsActive: bigint;      // Total number of nations with active SNAT
  nationsInactive: bigint;    // Total number of nations with inactive SNAT
}

/**
 * Death Clock Summary
 */
export interface DeathClockSummary {
  iso3166Code: string;
  countryName: string;
  status: SNATStatus;
  timeRemaining: bigint;      // Seconds remaining (0 if expired)
  isExpired: boolean;
  isEligibleForFlush: boolean;
  daysRemaining: number;      // Human-readable days remaining
}

// ════════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

export const T_MINUS = 180 * 24 * 60 * 60; // 180 days in seconds (15,552,000)
export const SAFE_VAULT_PERCENTAGE = 70;

// ════════════════════════════════════════════════════════════════════════════════
// SNAT DEATH CLOCK CLASS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * SNATDeathClock - TypeScript wrapper for SNAT Death Clock smart contract
 */
export class SNATDeathClock {
  private contract: any;

  constructor(contractInstance: any) {
    this.contract = contractInstance;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DEATH CLOCK INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Initialize death clock for a nation upon first citizen vitalization
   */
  async initializeDeathClock(
    iso3166Code: string,
    countryName: string,
    safeVault: string
  ): Promise<void> {
    const tx = await this.contract.initializeDeathClock(iso3166Code, countryName, safeVault);
    await tx.wait();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SNAT ACTIVATION
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Activate SNAT status for a nation (stops the death clock)
   */
  async activateSNAT(iso3166Code: string): Promise<void> {
    const tx = await this.contract.activateSNAT(iso3166Code);
    await tx.wait();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // GLOBAL FLUSH
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Execute Global Flush for a nation that failed to activate SNAT
   */
  async executeGlobalFlush(iso3166Code: string): Promise<string> {
    const tx = await this.contract.executeGlobalFlush(iso3166Code);
    const receipt = await tx.wait();
    
    // Extract flush transaction hash from event
    const event = receipt.events?.find((e: any) => e.event === 'GlobalFlush');
    return event?.args?.flushTxHash || '';
  }

  /**
   * Batch execute Global Flush for multiple nations
   */
  async batchExecuteGlobalFlush(iso3166Codes: string[]): Promise<string[]> {
    const tx = await this.contract.batchExecuteGlobalFlush(iso3166Codes);
    const receipt = await tx.wait();
    
    // Extract flush transaction hashes from return value
    return receipt.returnValues || [];
  }

  /**
   * Auto-flush all expired nations (callable by anyone)
   */
  async autoFlushExpiredNations(): Promise<number> {
    const tx = await this.contract.autoFlushExpiredNations();
    const receipt = await tx.wait();
    
    // Extract flushed count from return value
    return Number(receipt.returnValues?.[0] || 0);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get death clock details for a nation
   */
  async getDeathClock(iso3166Code: string): Promise<NationDeathClock> {
    const clock = await this.contract.getDeathClock(iso3166Code);
    
    return {
      iso3166Code: clock.iso3166Code,
      countryName: clock.countryName,
      deathClockStart: BigInt(clock.deathClockStart.toString()),
      deathClockExpiry: BigInt(clock.deathClockExpiry.toString()),
      safeVault: clock.safeVault,
      safeVaultBalance: BigInt(clock.safeVaultBalance.toString()),
      snatStatus: clock.snatStatus as SNATStatus,
      isInitialized: clock.isInitialized,
      isFlushed: clock.isFlushed,
      flushTimestamp: BigInt(clock.flushTimestamp.toString()),
      flushTxHash: clock.flushTxHash,
    };
  }

  /**
   * Check if a nation's death clock has expired
   */
  async isDeathClockExpired(iso3166Code: string): Promise<boolean> {
    return await this.contract.isDeathClockExpired(iso3166Code);
  }

  /**
   * Get time remaining until death clock expiry
   */
  async getTimeRemaining(iso3166Code: string): Promise<bigint> {
    const timeRemaining = await this.contract.getTimeRemaining(iso3166Code);
    return BigInt(timeRemaining.toString());
  }

  /**
   * Check if a nation is eligible for global flush
   */
  async isEligibleForFlush(iso3166Code: string): Promise<boolean> {
    return await this.contract.isEligibleForFlush(iso3166Code);
  }

  /**
   * Get all nations eligible for flush
   */
  async getAllEligibleForFlush(): Promise<string[]> {
    return await this.contract.getAllEligibleForFlush();
  }

  /**
   * Get total number of nations with initialized death clocks
   */
  async getTotalNations(): Promise<number> {
    const total = await this.contract.getTotalNations();
    return Number(total.toString());
  }

  /**
   * Get global flush statistics
   */
  async getGlobalFlushStats(): Promise<GlobalFlushStats> {
    const stats = await this.contract.getGlobalFlushStats();

    return {
      totalFlushed: BigInt(stats.totalFlushed.toString()),
      nationsFlushed: BigInt(stats.nationsFlushed.toString()),
      nationsActive: BigInt(stats.nationsActive.toString()),
      nationsInactive: BigInt(stats.nationsInactive.toString()),
    };
  }

  /**
   * Get death clock summary for a nation (human-readable)
   */
  async getDeathClockSummary(iso3166Code: string): Promise<DeathClockSummary> {
    const clock = await this.getDeathClock(iso3166Code);
    const timeRemaining = await this.getTimeRemaining(iso3166Code);
    const isExpired = await this.isDeathClockExpired(iso3166Code);
    const isEligibleForFlush = await this.isEligibleForFlush(iso3166Code);

    const daysRemaining = Number(timeRemaining) / (24 * 60 * 60);

    return {
      iso3166Code: clock.iso3166Code,
      countryName: clock.countryName,
      status: clock.snatStatus,
      timeRemaining,
      isExpired,
      isEligibleForFlush,
      daysRemaining: Math.max(0, Math.floor(daysRemaining)),
    };
  }

  /**
   * Get death clock summaries for all nations
   */
  async getAllDeathClockSummaries(): Promise<DeathClockSummary[]> {
    const totalNations = await this.getTotalNations();
    const summaries: DeathClockSummary[] = [];

    // Get all nation codes from contract
    for (let i = 0; i < totalNations; i++) {
      const iso3166Code = await this.contract.allNationCodes(i);
      const summary = await this.getDeathClockSummary(iso3166Code);
      summaries.push(summary);
    }

    return summaries;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ADMIN FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Update Global Citizen Block address
   */
  async updateGlobalCitizenBlock(newGlobalCitizenBlock: string): Promise<void> {
    const tx = await this.contract.updateGlobalCitizenBlock(newGlobalCitizenBlock);
    await tx.wait();
  }

  /**
   * Get the immutability message
   */
  async getImmutabilityMessage(): Promise<string> {
    return await this.contract.getImmutabilityMessage();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Format time remaining as human-readable string
   */
  static formatTimeRemaining(seconds: bigint): string {
    const totalSeconds = Number(seconds);

    if (totalSeconds === 0) {
      return 'EXPIRED';
    }

    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days} days, ${hours} hours`;
    } else if (hours > 0) {
      return `${hours} hours, ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  }

  /**
   * Get SNAT status as human-readable string
   */
  static getSNATStatusString(status: SNATStatus): string {
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
   * Calculate percentage of time elapsed
   */
  static calculateTimeElapsedPercentage(
    deathClockStart: bigint,
    deathClockExpiry: bigint,
    currentTime: bigint
  ): number {
    const totalDuration = Number(deathClockExpiry - deathClockStart);
    const elapsed = Number(currentTime - deathClockStart);

    if (elapsed >= totalDuration) {
      return 100;
    }

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Convert seconds to days
 */
export function secondsToDays(seconds: bigint): number {
  return Number(seconds) / (24 * 60 * 60);
}

/**
 * Convert days to seconds
 */
export function daysToSeconds(days: number): bigint {
  return BigInt(days * 24 * 60 * 60);
}

/**
 * Check if death clock is in critical period (< 30 days remaining)
 */
export function isCriticalPeriod(timeRemaining: bigint): boolean {
  const days = secondsToDays(timeRemaining);
  return days > 0 && days < 30;
}

/**
 * Check if death clock is in warning period (< 60 days remaining)
 */
export function isWarningPeriod(timeRemaining: bigint): boolean {
  const days = secondsToDays(timeRemaining);
  return days > 0 && days < 60;
}

/**
 * Get urgency level based on time remaining
 */
export function getUrgencyLevel(timeRemaining: bigint): 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'NORMAL' {
  if (timeRemaining === BigInt(0)) {
    return 'EXPIRED';
  }

  const days = secondsToDays(timeRemaining);

  if (days < 30) {
    return 'CRITICAL';
  } else if (days < 60) {
    return 'WARNING';
  } else {
    return 'NORMAL';
  }
}

