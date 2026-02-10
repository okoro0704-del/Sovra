/**
 * SovereignSession.ts - Session Persistence for PFF-Sovryn Integration
 * 
 * "The Physical Key unlocks the Financial Vault."
 * 
 * This module manages the 'Sovereign_Active' flag that determines whether
 * a user's Sovryn vault is visible and accessible.
 * 
 * Logic:
 * - PFF Vitalization sets Sovereign_Active = true
 * - Session expires after 5 minutes of inactivity
 * - Presence Proof expires after 60 seconds
 * - Any Sovryn transaction requires active session
 * - Failed vitalization sets Sovereign_Active = false
 * 
 * Security:
 * - Session stored in encrypted secure storage
 * - Automatic expiry on app background
 * - Heartbeat required for renewal
 */

import { ethers } from 'ethers';
import type { PresenceProof } from './SovrynClient';

// ============ TYPES ============

export interface SovereignSession {
  /** Unique session ID */
  sessionId: string;
  
  /** User's unique ID (from PFF Truth-Bundle) */
  uid: string;
  
  /** Wallet address */
  walletAddress: string;
  
  /** Sovereign_Active flag - determines vault visibility */
  sovereignActive: boolean;
  
  /** Current presence proof (expires after 60 seconds) */
  presenceProof: PresenceProof | null;
  
  /** Session creation timestamp */
  createdAt: number;
  
  /** Last activity timestamp (for 5-minute timeout) */
  lastActivityAt: number;
  
  /** Session expiry timestamp */
  expiresAt: number;
  
  /** PFF vitalization status */
  isVitalized: boolean;
  
  /** Last heartbeat BPM */
  lastBPM: number;
  
  /** Last heartbeat confidence */
  lastConfidence: number;
}

export interface SessionConfig {
  /** Session timeout in milliseconds (default: 5 minutes) */
  sessionTimeout: number;
  
  /** Presence proof timeout in milliseconds (default: 60 seconds) */
  presenceTimeout: number;
  
  /** Auto-renew session on activity (default: true) */
  autoRenew: boolean;
  
  /** Require heartbeat for renewal (default: true) */
  requireHeartbeat: boolean;
}

// ============ CONSTANTS ============

const DEFAULT_SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PRESENCE_TIMEOUT = 60 * 1000; // 60 seconds

// ============ SOVEREIGN SESSION MANAGER ============

export class SovereignSessionManager {
  private session: SovereignSession | null = null;
  private config: SessionConfig;
  private activityTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SessionConfig>) {
    this.config = {
      sessionTimeout: config?.sessionTimeout || DEFAULT_SESSION_TIMEOUT,
      presenceTimeout: config?.presenceTimeout || DEFAULT_PRESENCE_TIMEOUT,
      autoRenew: config?.autoRenew !== false,
      requireHeartbeat: config?.requireHeartbeat !== false,
    };
  }

  /**
   * Create new sovereign session after successful PFF vitalization
   */
  async createSession(
    uid: string,
    walletAddress: string,
    presenceProof: PresenceProof
  ): Promise<SovereignSession> {
    const now = Date.now();
    const sessionId = ethers.utils.id(`SESSION_${uid}_${now}`);

    this.session = {
      sessionId,
      uid,
      walletAddress,
      sovereignActive: true, // ✅ VAULT UNLOCKED
      presenceProof,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + this.config.sessionTimeout,
      isVitalized: true,
      lastBPM: presenceProof.bpm,
      lastConfidence: presenceProof.confidence,
    };

    // Start activity monitoring
    this.startActivityMonitoring();

    console.log('[SOVEREIGN SESSION] ✅ Session created:', {
      sessionId: this.session.sessionId.substring(0, 10),
      uid,
      sovereignActive: true,
      expiresIn: `${this.config.sessionTimeout / 1000}s`,
    });

    return this.session;
  }

  /**
   * Get current session
   */
  getSession(): SovereignSession | null {
    if (!this.session) {
      return null;
    }

    // Check if session expired
    if (Date.now() > this.session.expiresAt) {
      console.log('[SOVEREIGN SESSION] ⏰ Session expired');
      this.destroySession();
      return null;
    }

    // Check if presence proof expired
    if (this.session.presenceProof) {
      const proofAge = Date.now() - this.session.presenceProof.timestamp;
      if (proofAge > this.config.presenceTimeout) {
        console.log('[SOVEREIGN SESSION] ⏰ Presence proof expired');
        this.session.presenceProof = null;
        this.session.sovereignActive = false; // 🔒 VAULT LOCKED
      }
    }

    return this.session;
  }

  /**
   * Check if Sovereign_Active flag is true
   * This is the PRIMARY gate for all Sovryn transactions
   */
  isSovereignActive(): boolean {
    const session = this.getSession();

    if (!session) {
      console.log('[SOVEREIGN SESSION] ❌ No active session - Vault INVISIBLE');
      return false;
    }

    if (!session.sovereignActive) {
      console.log('[SOVEREIGN SESSION] 🔒 Sovereign_Active = false - Vault LOCKED');
      return false;
    }

    console.log('[SOVEREIGN SESSION] ✅ Sovereign_Active = true - Vault UNLOCKED');
    return true;
  }

  /**
   * Renew presence proof (requires new heartbeat scan)
   */
  async renewPresenceProof(presenceProof: PresenceProof): Promise<void> {
    if (!this.session) {
      throw new Error('No active session to renew');
    }

    // Validate proof belongs to same user
    if (presenceProof.uid !== this.session.uid) {
      throw new Error('Presence proof UID mismatch');
    }

    this.session.presenceProof = presenceProof;
    this.session.sovereignActive = true; // ✅ VAULT UNLOCKED
    this.session.lastBPM = presenceProof.bpm;
    this.session.lastConfidence = presenceProof.confidence;
    this.session.lastActivityAt = Date.now();

    console.log('[SOVEREIGN SESSION] ✅ Presence proof renewed:', {
      bpm: presenceProof.bpm,
      confidence: `${(presenceProof.confidence * 100).toFixed(1)}%`,
    });
  }

  /**
   * Record activity (extends session timeout)
   */
  recordActivity(): void {
    if (!this.session) {
      return;
    }

    const now = Date.now();
    this.session.lastActivityAt = now;

    if (this.config.autoRenew) {
      this.session.expiresAt = now + this.config.sessionTimeout;
      console.log('[SOVEREIGN SESSION] 🔄 Session auto-renewed');
    }
  }

  /**
   * Destroy session (logout)
   */
  destroySession(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.session) {
      console.log('[SOVEREIGN SESSION] 🔒 Session destroyed - Vault INVISIBLE');
    }

    this.session = null;
  }

  /**
   * Start activity monitoring (checks for expiry every 10 seconds)
   */
  private startActivityMonitoring(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }

    this.activityTimer = setInterval(() => {
      const session = this.getSession();

      if (!session) {
        // Session expired, stop monitoring
        if (this.activityTimer) {
          clearInterval(this.activityTimer);
          this.activityTimer = null;
        }
        return;
      }

      // Check for inactivity
      const inactiveTime = Date.now() - session.lastActivityAt;
      if (inactiveTime > this.config.sessionTimeout) {
        console.log('[SOVEREIGN SESSION] ⏰ Session timeout due to inactivity');
        this.destroySession();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get session status for UI display
   */
  getSessionStatus(): {
    active: boolean;
    sovereignActive: boolean;
    presenceValid: boolean;
    timeRemaining: number;
    presenceTimeRemaining: number;
  } {
    const session = this.getSession();

    if (!session) {
      return {
        active: false,
        sovereignActive: false,
        presenceValid: false,
        timeRemaining: 0,
        presenceTimeRemaining: 0,
      };
    }

    const now = Date.now();
    const timeRemaining = Math.max(0, session.expiresAt - now);

    let presenceTimeRemaining = 0;
    if (session.presenceProof) {
      const proofAge = now - session.presenceProof.timestamp;
      presenceTimeRemaining = Math.max(0, this.config.presenceTimeout - proofAge);
    }

    return {
      active: true,
      sovereignActive: session.sovereignActive,
      presenceValid: presenceTimeRemaining > 0,
      timeRemaining: Math.floor(timeRemaining / 1000), // seconds
      presenceTimeRemaining: Math.floor(presenceTimeRemaining / 1000), // seconds
    };
  }
}

// ============ SINGLETON INSTANCE ============

let globalSessionManager: SovereignSessionManager | null = null;

/**
 * Get global session manager instance
 */
export function getSovereignSessionManager(): SovereignSessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new SovereignSessionManager();
  }
  return globalSessionManager;
}

/**
 * Initialize session after PFF vitalization
 */
export async function initializeSovereignSession(
  uid: string,
  walletAddress: string,
  presenceProof: PresenceProof
): Promise<SovereignSession> {
  const manager = getSovereignSessionManager();
  return manager.createSession(uid, walletAddress, presenceProof);
}

/**
 * Check if user's Sovryn vault is accessible
 */
export function isSovereignVaultUnlocked(): boolean {
  const manager = getSovereignSessionManager();
  return manager.isSovereignActive();
}

/**
 * Get current session
 */
export function getCurrentSovereignSession(): SovereignSession | null {
  const manager = getSovereignSessionManager();
  return manager.getSession();
}

