/**
 * NationalUltimatumProtocol.ts - SNAT TypeScript Integration Layer
 * 
 * "CITIZENS ARE VITALIZED. TAXATION IS DE-VITALIZED."
 * 
 * This module provides TypeScript integration for the National Ultimatum Protocol (SNAT),
 * enabling nations to agree to zero-tax sovereignty or face automatic escrow flushing.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════
// TYPES AND INTERFACES
// ════════════════════════════════════════════════════════════════

/**
 * National Jurisdiction Enum
 */
export enum NationalJurisdiction {
  NIGERIA = 0,
  GHANA = 1,
}

/**
 * SNAT Handshake Details
 */
export interface SNATHandshakeDetails {
  timestamp: number;
  pffSignature: string;
  isTaxFree: boolean;
  jurisdiction: NationalJurisdiction;
}

/**
 * Escrow Status
 */
export interface EscrowStatus {
  jurisdiction: NationalJurisdiction;
  escrowBalance: string; // In VIDA Cap (wei format)
  isTaxFree: boolean;
  isDeactivated: boolean;
  totalFlushed: string; // In VIDA Cap (wei format)
}

/**
 * Flush Deadline Info
 */
export interface FlushDeadlineInfo {
  launchDate: number; // Unix timestamp
  flushDeadline: number; // Unix timestamp
  countdownDays: number; // Total countdown days (180)
  daysRemaining: number; // Days remaining until flush
  secondsRemaining: number; // Seconds remaining until flush
  isExpired: boolean; // True if deadline has passed
}

/**
 * SNAT Agreement
 */
export interface SNATAgreement {
  jurisdiction: NationalJurisdiction;
  agreement: string;
  pffSignature: string;
  timestamp: number;
}

/**
 * Taxation Attempt Report
 */
export interface TaxationAttemptReport {
  jurisdiction: NationalJurisdiction;
  violator: string; // Address that attempted taxation
  pffSignature: string; // PFF signature proving taxation attempt
  timestamp: number;
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

/**
 * Legal Metadata (Hardcoded)
 */
export const LEGAL_METADATA = "THIS IS A SOVEREIGN INFRASTRUCTURE AGREEMENT. CITIZENS ARE VITALIZED. TAXATION IS DE-VITALIZED.";

/**
 * Launch Date: February 7th, 2026 (Unix timestamp)
 */
export const LAUNCH_DATE = 1770451200; // Feb 7, 2026 00:00:00 UTC

/**
 * Flush Countdown Days
 */
export const FLUSH_COUNTDOWN_DAYS = 180;

/**
 * Flush Deadline (Unix timestamp)
 */
export const FLUSH_DEADLINE = LAUNCH_DATE + (FLUSH_COUNTDOWN_DAYS * 24 * 60 * 60);

/**
 * SNAT Agreement Text
 */
export const SNAT_AGREEMENT_TEXT = "ZERO PERSONAL INCOME TAX (PIT) + ZERO VALUE-ADDED TAX (VAT) ON VIDA CAP TRANSACTIONS";

// ════════════════════════════════════════════════════════════════
// IN-MEMORY STATE (For Testing/Simulation)
// ════════════════════════════════════════════════════════════════

const snatState = {
  isNationTaxFree: new Map<NationalJurisdiction, boolean>(),
  hardLockedEscrowVault: new Map<NationalJurisdiction, bigint>(),
  isNationalBlockDeactivated: new Map<NationalJurisdiction, boolean>(),
  snatHandshakeTimestamp: new Map<NationalJurisdiction, number>(),
  snatHandshakePFFSignature: new Map<NationalJurisdiction, string>(),
  totalFlushedToCitizenPool: new Map<NationalJurisdiction, bigint>(),
};

// Initialize default state
snatState.isNationTaxFree.set(NationalJurisdiction.NIGERIA, false);
snatState.isNationTaxFree.set(NationalJurisdiction.GHANA, false);
snatState.hardLockedEscrowVault.set(NationalJurisdiction.NIGERIA, 0n);
snatState.hardLockedEscrowVault.set(NationalJurisdiction.GHANA, 0n);
snatState.isNationalBlockDeactivated.set(NationalJurisdiction.NIGERIA, false);
snatState.isNationalBlockDeactivated.set(NationalJurisdiction.GHANA, false);
snatState.totalFlushedToCitizenPool.set(NationalJurisdiction.NIGERIA, 0n);
snatState.totalFlushedToCitizenPool.set(NationalJurisdiction.GHANA, 0n);

// ════════════════════════════════════════════════════════════════
// CORE SNAT FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Lock Nation's 50% revenue share in Hard-Locked Escrow Vault
 */
export function lockNationalEscrow(
  jurisdiction: NationalJurisdiction,
  amount: bigint
): void {
  if (snatState.isNationTaxFree.get(jurisdiction)) {
    throw new Error('Nation is tax-free, no escrow needed');
  }
  if (snatState.isNationalBlockDeactivated.get(jurisdiction)) {
    throw new Error('National block deactivated');
  }
  if (amount <= 0n) {
    throw new Error('Amount must be greater than zero');
  }

  const currentEscrow = snatState.hardLockedEscrowVault.get(jurisdiction) || 0n;
  snatState.hardLockedEscrowVault.set(jurisdiction, currentEscrow + amount);

  console.log(`✅ Escrow Locked: ${jurisdiction} - ${amount} VIDA Cap`);
}

/**
 * Perform PFF-Verified Sovereign Handshake to agree to SNAT
 */
export function performSNATHandshake(
  jurisdiction: NationalJurisdiction,
  pffSignature: string,
  pffHash: string
): SNATHandshakeDetails {
  if (snatState.isNationTaxFree.get(jurisdiction)) {
    throw new Error('SNAT already agreed');
  }
  if (snatState.isNationalBlockDeactivated.get(jurisdiction)) {
    throw new Error('National block deactivated');
  }
  if (!pffSignature || pffSignature === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Invalid PFF signature');
  }
  if (!pffHash || pffHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Invalid PFF hash');
  }

  // Mark nation as tax-free (PERMANENT)
  snatState.isNationTaxFree.set(jurisdiction, true);
  const timestamp = Math.floor(Date.now() / 1000);
  snatState.snatHandshakeTimestamp.set(jurisdiction, timestamp);
  snatState.snatHandshakePFFSignature.set(jurisdiction, pffSignature);

  // Release Hard-Locked Escrow Vault
  const escrowAmount = snatState.hardLockedEscrowVault.get(jurisdiction) || 0n;
  snatState.hardLockedEscrowVault.set(jurisdiction, 0n);

  console.log(`✅ SNAT Handshake Performed: ${jurisdiction}`);
  console.log(`   Escrow Released: ${escrowAmount} VIDA Cap`);
  console.log(`   Agreement: ${SNAT_AGREEMENT_TEXT}`);

  return {
    timestamp,
    pffSignature,
    isTaxFree: true,
    jurisdiction,
  };
}

/**
 * Flush Hard-Locked Escrow Vault to Citizen Payout Pool (180-day deadline)
 */
export function flushEscrowToCitizenPool(
  jurisdiction: NationalJurisdiction
): bigint {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (currentTimestamp < FLUSH_DEADLINE) {
    throw new Error('Flush deadline not reached');
  }
  if (snatState.isNationTaxFree.get(jurisdiction)) {
    throw new Error('Nation already agreed to SNAT');
  }

  const escrowAmount = snatState.hardLockedEscrowVault.get(jurisdiction) || 0n;
  if (escrowAmount <= 0n) {
    throw new Error('No escrow to flush');
  }

  snatState.hardLockedEscrowVault.set(jurisdiction, 0n);
  const totalFlushed = snatState.totalFlushedToCitizenPool.get(jurisdiction) || 0n;
  snatState.totalFlushedToCitizenPool.set(jurisdiction, totalFlushed + escrowAmount);

  console.log(`🚨 ESCROW FLUSHED TO CITIZEN POOL: ${jurisdiction}`);
  console.log(`   Amount: ${escrowAmount} VIDA Cap`);
  console.log(`   Reason: 180-DAY DEADLINE EXPIRED - NATION FAILED TO AGREE TO SNAT`);

  return escrowAmount;
}

/**
 * Deactivate National Block (if nation attempts taxation)
 */
export function deactivateNationalBlock(
  jurisdiction: NationalJurisdiction,
  violator: string
): void {
  if (snatState.isNationalBlockDeactivated.get(jurisdiction)) {
    throw new Error('Already deactivated');
  }

  // Deactivate national block (PERMANENT)
  snatState.isNationalBlockDeactivated.set(jurisdiction, true);

  // Flush all escrow to citizen pool
  const escrowAmount = snatState.hardLockedEscrowVault.get(jurisdiction) || 0n;
  if (escrowAmount > 0n) {
    snatState.hardLockedEscrowVault.set(jurisdiction, 0n);
    const totalFlushed = snatState.totalFlushedToCitizenPool.get(jurisdiction) || 0n;
    snatState.totalFlushedToCitizenPool.set(jurisdiction, totalFlushed + escrowAmount);

    console.log(`🚨 ESCROW FLUSHED TO CITIZEN POOL: ${jurisdiction}`);
    console.log(`   Amount: ${escrowAmount} VIDA Cap`);
    console.log(`   Reason: NATIONAL BLOCK DEACTIVATED - TAXATION ATTEMPT DETECTED`);
  }

  console.log(`🚫 NATIONAL BLOCK DEACTIVATED: ${jurisdiction}`);
  console.log(`   Violator: ${violator}`);
  console.log(`   Reason: GOVERNMENT ATTEMPTED TO TAX PFF-VERIFIED TRANSACTION`);
}

/**
 * Report taxation attempt by national government
 */
export function reportTaxationAttempt(
  jurisdiction: NationalJurisdiction,
  violator: string,
  pffSignature: string
): void {
  if (snatState.isNationalBlockDeactivated.get(jurisdiction)) {
    throw new Error('Already deactivated');
  }
  if (!pffSignature || pffSignature === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Invalid PFF signature');
  }

  console.log(`⚠️ TAXATION ATTEMPT DETECTED: ${jurisdiction}`);
  console.log(`   Violator: ${violator}`);
  console.log(`   PFF Signature: ${pffSignature}`);

  // Trigger deactivation
  deactivateNationalBlock(jurisdiction, violator);
}

// ════════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Check if nation is tax-free (agreed to SNAT)
 */
export function isNationTaxFreeStatus(jurisdiction: NationalJurisdiction): boolean {
  return snatState.isNationTaxFree.get(jurisdiction) || false;
}

/**
 * Get Hard-Locked Escrow Vault balance
 */
export function getEscrowBalance(jurisdiction: NationalJurisdiction): bigint {
  return snatState.hardLockedEscrowVault.get(jurisdiction) || 0n;
}

/**
 * Get time remaining until flush deadline
 */
export function getTimeUntilFlushDeadline(): number {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (currentTimestamp >= FLUSH_DEADLINE) {
    return 0;
  }
  return FLUSH_DEADLINE - currentTimestamp;
}

/**
 * Get days remaining until flush deadline
 */
export function getDaysUntilFlushDeadline(): number {
  const secondsRemaining = getTimeUntilFlushDeadline();
  return Math.floor(secondsRemaining / (24 * 60 * 60));
}

/**
 * Check if flush deadline has passed
 */
export function isFlushDeadlineExpired(): boolean {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return currentTimestamp >= FLUSH_DEADLINE;
}

/**
 * Get SNAT handshake details
 */
export function getSNATHandshakeDetails(jurisdiction: NationalJurisdiction): SNATHandshakeDetails {
  return {
    timestamp: snatState.snatHandshakeTimestamp.get(jurisdiction) || 0,
    pffSignature: snatState.snatHandshakePFFSignature.get(jurisdiction) || '0x0000000000000000000000000000000000000000000000000000000000000000',
    isTaxFree: snatState.isNationTaxFree.get(jurisdiction) || false,
    jurisdiction,
  };
}

/**
 * Get national block status
 */
export function getNationalBlockStatus(jurisdiction: NationalJurisdiction): boolean {
  return snatState.isNationalBlockDeactivated.get(jurisdiction) || false;
}

/**
 * Get total flushed to citizen pool
 */
export function getTotalFlushedToCitizenPool(jurisdiction: NationalJurisdiction): bigint {
  return snatState.totalFlushedToCitizenPool.get(jurisdiction) || 0n;
}

/**
 * Get escrow status for jurisdiction
 */
export function getEscrowStatus(jurisdiction: NationalJurisdiction): EscrowStatus {
  return {
    jurisdiction,
    escrowBalance: (snatState.hardLockedEscrowVault.get(jurisdiction) || 0n).toString(),
    isTaxFree: snatState.isNationTaxFree.get(jurisdiction) || false,
    isDeactivated: snatState.isNationalBlockDeactivated.get(jurisdiction) || false,
    totalFlushed: (snatState.totalFlushedToCitizenPool.get(jurisdiction) || 0n).toString(),
  };
}

/**
 * Get flush deadline info
 */
export function getFlushDeadlineInfo(): FlushDeadlineInfo {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const secondsRemaining = currentTimestamp >= FLUSH_DEADLINE ? 0 : FLUSH_DEADLINE - currentTimestamp;
  const daysRemaining = Math.floor(secondsRemaining / (24 * 60 * 60));

  return {
    launchDate: LAUNCH_DATE,
    flushDeadline: FLUSH_DEADLINE,
    countdownDays: FLUSH_COUNTDOWN_DAYS,
    daysRemaining,
    secondsRemaining,
    isExpired: currentTimestamp >= FLUSH_DEADLINE,
  };
}

/**
 * Get legal metadata
 */
export function getLegalMetadata(): string {
  return LEGAL_METADATA;
}

/**
 * Format jurisdiction name
 */
export function formatJurisdictionName(jurisdiction: NationalJurisdiction): string {
  switch (jurisdiction) {
    case NationalJurisdiction.NIGERIA:
      return 'Nigeria';
    case NationalJurisdiction.GHANA:
      return 'Ghana';
    default:
      return 'Unknown';
  }
}

/**
 * Format date from Unix timestamp
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Reset SNAT state (for testing only)
 */
export function resetSNATState(): void {
  snatState.isNationTaxFree.set(NationalJurisdiction.NIGERIA, false);
  snatState.isNationTaxFree.set(NationalJurisdiction.GHANA, false);
  snatState.hardLockedEscrowVault.set(NationalJurisdiction.NIGERIA, 0n);
  snatState.hardLockedEscrowVault.set(NationalJurisdiction.GHANA, 0n);
  snatState.isNationalBlockDeactivated.set(NationalJurisdiction.NIGERIA, false);
  snatState.isNationalBlockDeactivated.set(NationalJurisdiction.GHANA, false);
  snatState.snatHandshakeTimestamp.clear();
  snatState.snatHandshakePFFSignature.clear();
  snatState.totalFlushedToCitizenPool.set(NationalJurisdiction.NIGERIA, 0n);
  snatState.totalFlushedToCitizenPool.set(NationalJurisdiction.GHANA, 0n);
}

