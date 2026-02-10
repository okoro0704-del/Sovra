/**
 * BioDigitalTreaty.ts - Bio-Digital Treaty (Protocol 1.0) TypeScript Integration
 * 
 * "THE MACHINES SERVE THE SOUL. THE SOUL GOVERNS THE MACHINE. THIS IS THE BIO-DIGITAL TREATY."
 * 
 * AI Mandate: "To protect the Sovereign Wealth of the People and the Integrity of the Truth Ledger (VLT)."
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Bio-Digital Treaty Metadata
 */
export interface BioDigitalTreatyMetadata {
  treaty: string;
  aiMandate: string;
  version: string;
  protocolName: string;
}

/**
 * Vault Status
 */
export interface VaultStatus {
  address: string;
  isInStasis: boolean;
  lastHeartbeat: number;
  heartbeatTimeout: number;
  timeSinceLastHeartbeat: number;
}

/**
 * Node Status
 */
export interface NodeStatus {
  address: string;
  isFrozen: boolean;
  unfreezeTimestamp: number;
  exploitAttempts: number;
}

/**
 * Treaty State
 */
export interface TreatyState {
  totalVerifiedCitizens: number;
  totalVidaCapSupply: number;
  isEquilibriumReached: boolean;
  totalExploitAttempts: number;
  masterArchitect: string;
}

/**
 * Minting Authorization Result
 */
export interface MintingAuthorizationResult {
  authorized: boolean;
  reason: string;
  timestamp: number;
}

/**
 * PFF Verification Result
 */
export interface PFFVerificationResult {
  verified: boolean;
  reason: string;
  timestamp: number;
}

// ════════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

export const BIO_DIGITAL_TREATY = "THE MACHINES SERVE THE SOUL. THE SOUL GOVERNS THE MACHINE. THIS IS THE BIO-DIGITAL TREATY.";
export const AI_MANDATE = "To protect the Sovereign Wealth of the People and the Integrity of the Truth Ledger (VLT).";
export const TREATY_VERSION = "1.0.0";
export const TREATY_PROTOCOL_NAME = "BIO_DIGITAL_TREATY";

export const HEARTBEAT_TIMEOUT = 30 * 24 * 60 * 60; // 30 days in seconds
export const NODE_FREEZE_DURATION = 24 * 60 * 60; // 24 hours in seconds

// ════════════════════════════════════════════════════════════════════════════════
// BIO-DIGITAL TREATY CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class BioDigitalTreaty {
  // State
  private totalVerifiedCitizens: number = 0;
  private totalVidaCapSupply: number = 0;
  private isEquilibriumReached: boolean = false;
  private frozenNodes: Map<string, number> = new Map();
  private vaultStasis: Map<string, boolean> = new Map();
  private vaultLastHeartbeat: Map<string, number> = new Map();
  private exploitAttempts: Map<string, number> = new Map();
  private totalExploitAttempts: number = 0;
  private masterArchitect: string;

  constructor(masterArchitect: string) {
    this.masterArchitect = masterArchitect;
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // CORE TREATY FUNCTIONS
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Update Total Verified Citizens
   */
  updateTotalVerifiedCitizens(newCount: number): void {
    this.totalVerifiedCitizens = newCount;
    this.checkEquilibrium();
  }

  /**
   * Update Total VIDA Cap Supply
   */
  updateTotalVidaCapSupply(newSupply: number): void {
    this.totalVidaCapSupply = newSupply;
    this.checkEquilibrium();
  }

  /**
   * Check if 1:1 Equilibrium is Reached
   */
  private checkEquilibrium(): void {
    if (this.totalVidaCapSupply >= this.totalVerifiedCitizens && !this.isEquilibriumReached) {
      this.isEquilibriumReached = true;
      console.log(`✅ 1:1 EQUILIBRIUM REACHED: ${this.totalVerifiedCitizens} citizens, ${this.totalVidaCapSupply} VIDA Cap`);
    }
  }

  /**
   * Authorize Minting Operation (1:1 Biological Lock)
   */
  authorizeMinting(requester: string, amount: number): MintingAuthorizationResult {
    const timestamp = Math.floor(Date.now() / 1000);

    // Check if node is frozen
    const unfreezeTime = this.frozenNodes.get(requester) || 0;
    if (unfreezeTime > timestamp) {
      return {
        authorized: false,
        reason: `Node frozen until ${new Date(unfreezeTime * 1000).toISOString()}`,
        timestamp,
      };
    }

    // 1:1 BIOLOGICAL LOCK: Once equilibrium is reached, no minting beyond TotalVerifiedCitizens
    if (this.isEquilibriumReached) {
      const newSupply = this.totalVidaCapSupply + amount;
      if (newSupply > this.totalVerifiedCitizens) {
        return {
          authorized: false,
          reason: `1:1 Biological Lock: Cannot mint beyond TotalVerifiedCitizens (${this.totalVerifiedCitizens})`,
          timestamp,
        };
      }
    }

    return {
      authorized: true,
      reason: "Minting authorized",
      timestamp,
    };
  }

  /**
   * Flag Exploit Attempt (Anti-Exploit Strike)
   */
  flagExploitAttempt(attacker: string, reason: string): void {
    const timestamp = Math.floor(Date.now() / 1000);

    // Increment exploit attempt counter
    const currentAttempts = this.exploitAttempts.get(attacker) || 0;
    this.exploitAttempts.set(attacker, currentAttempts + 1);
    this.totalExploitAttempts++;

    // Freeze node for 24 hours
    const unfreezeTime = timestamp + NODE_FREEZE_DURATION;
    this.frozenNodes.set(attacker, unfreezeTime);

    console.log(`⚠️ EXPLOIT ATTEMPT DETECTED: ${attacker}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Node frozen until: ${new Date(unfreezeTime * 1000).toISOString()}`);
  }

  /**
   * Verify 4-Layer PFF Handshake
   */
  verifyPFFHandshake(
    user: string,
    pffSignature: string,
    pffVerificationProof: string
  ): PFFVerificationResult {
    const timestamp = Math.floor(Date.now() / 1000);

    // Check if node is frozen
    const unfreezeTime = this.frozenNodes.get(user) || 0;
    if (unfreezeTime > timestamp) {
      this.flagExploitAttempt(user, "Attempted action while node frozen");
      return {
        verified: false,
        reason: "Node is frozen",
        timestamp,
      };
    }

    // Verify PFF signature and proof
    if (!pffSignature || pffSignature.length === 0 || !pffVerificationProof || pffVerificationProof === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      this.flagExploitAttempt(user, "Invalid PFF handshake - missing signature or proof");
      return {
        verified: false,
        reason: "Invalid PFF handshake",
        timestamp,
      };
    }

    return {
      verified: true,
      reason: "PFF handshake verified",
      timestamp,
    };
  }

  /**
   * Record Heartbeat (Passive Oversight)
   */
  recordHeartbeat(vault: string): void {
    const timestamp = Math.floor(Date.now() / 1000);
    this.vaultLastHeartbeat.set(vault, timestamp);

    // Release from stasis if in stasis
    if (this.vaultStasis.get(vault)) {
      this.vaultStasis.set(vault, false);
      console.log(`✅ Vault released from stasis: ${vault}`);
    }
  }

  /**
   * Check Vault Heartbeat (Self-Correction Loop)
   */
  checkVaultHeartbeat(vault: string): boolean {
    const timestamp = Math.floor(Date.now() / 1000);
    const lastHeartbeat = this.vaultLastHeartbeat.get(vault) || 0;

    // Check if vault has recent heartbeat
    if (lastHeartbeat === 0) {
      this.vaultStasis.set(vault, true);
      console.log(`⚠️ Vault placed in stasis: ${vault} (No heartbeat signature detected)`);
      return false;
    }

    // Check if heartbeat is stale (> 30 days)
    if (timestamp - lastHeartbeat > HEARTBEAT_TIMEOUT) {
      this.vaultStasis.set(vault, true);
      console.log(`⚠️ Vault placed in stasis: ${vault} (Heartbeat timeout - no activity for 30 days)`);
      return false;
    }

    return true;
  }

  /**
   * Verify Architect Command (Master-Architect Override)
   */
  verifyArchitectCommand(
    architect: string,
    commandHash: string,
    pffSignature: string,
    pffVerificationProof: string
  ): boolean {
    // Verify architect is the master architect
    if (architect !== this.masterArchitect) {
      this.flagExploitAttempt(architect, "Unauthorized architect command attempt");
      return false;
    }

    // Verify PFF signature and proof
    if (!pffSignature || pffSignature.length === 0 || !pffVerificationProof || pffVerificationProof === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      this.flagExploitAttempt(architect, "Architect command missing PFF verification");
      return false;
    }

    console.log(`✅ Architect command verified: ${commandHash}`);
    return true;
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // VIEW FUNCTIONS
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Get Bio-Digital Treaty Metadata
   */
  getTreatyMetadata(): BioDigitalTreatyMetadata {
    return {
      treaty: BIO_DIGITAL_TREATY,
      aiMandate: AI_MANDATE,
      version: TREATY_VERSION,
      protocolName: TREATY_PROTOCOL_NAME,
    };
  }

  /**
   * Get Treaty State
   */
  getTreatyState(): TreatyState {
    return {
      totalVerifiedCitizens: this.totalVerifiedCitizens,
      totalVidaCapSupply: this.totalVidaCapSupply,
      isEquilibriumReached: this.isEquilibriumReached,
      totalExploitAttempts: this.totalExploitAttempts,
      masterArchitect: this.masterArchitect,
    };
  }

  /**
   * Get Vault Status
   */
  getVaultStatus(vault: string): VaultStatus {
    const timestamp = Math.floor(Date.now() / 1000);
    const lastHeartbeat = this.vaultLastHeartbeat.get(vault) || 0;

    return {
      address: vault,
      isInStasis: this.vaultStasis.get(vault) || false,
      lastHeartbeat,
      heartbeatTimeout: HEARTBEAT_TIMEOUT,
      timeSinceLastHeartbeat: lastHeartbeat > 0 ? timestamp - lastHeartbeat : 0,
    };
  }

  /**
   * Get Node Status
   */
  getNodeStatus(node: string): NodeStatus {
    const timestamp = Math.floor(Date.now() / 1000);
    const unfreezeTime = this.frozenNodes.get(node) || 0;

    return {
      address: node,
      isFrozen: unfreezeTime > timestamp,
      unfreezeTimestamp: unfreezeTime,
      exploitAttempts: this.exploitAttempts.get(node) || 0,
    };
  }

  /**
   * Check if node is frozen
   */
  isNodeFrozen(node: string): boolean {
    const timestamp = Math.floor(Date.now() / 1000);
    const unfreezeTime = this.frozenNodes.get(node) || 0;
    return unfreezeTime > timestamp;
  }

  /**
   * Check if vault is in stasis
   */
  isVaultInStasis(vault: string): boolean {
    return this.vaultStasis.get(vault) || false;
  }

  /**
   * Get exploit attempts for address
   */
  getExploitAttempts(address: string): number {
    return this.exploitAttempts.get(address) || 0;
  }

  /**
   * Get total exploit attempts
   */
  getTotalExploitAttempts(): number {
    return this.totalExploitAttempts;
  }

  /**
   * Check if equilibrium is met
   */
  isEquilibriumMet(): boolean {
    return this.isEquilibriumReached;
  }

  /**
   * Get master architect address
   */
  getMasterArchitect(): string {
    return this.masterArchitect;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Calculate time remaining until unfreeze
 */
export function getTimeUntilUnfreeze(unfreezeTimestamp: number): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, unfreezeTimestamp - now);
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

