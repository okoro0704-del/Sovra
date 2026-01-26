/**
 * SOVRN Spoke - Integrity Dividend Payout Engine
 * 
 * This module calculates and distributes the "Daily Integrity Payout" to
 * all active verified DIDs in the national spoke.
 * 
 * ECONOMIC PRINCIPLES:
 * 1. Spoke receives 50% of verification fees from Global Hub
 * 2. Fees are distributed proportionally to all active_verified_dids
 * 3. Distribution is based on verification_count (more verifications = more payout)
 * 4. Payouts are calculated daily and distributed automatically
 * 5. Citizens earn passive income for participating in the protocol
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger';
import { SovereignStore } from '../data-sovereignty/sovereign-store';

export interface PayoutPeriod {
  period_id: string;           // e.g., "2026-01-26"
  start_date: string;          // ISO 8601
  end_date: string;            // ISO 8601
  total_fees_received: number; // Total uSOV received from hub (50% of verification fees)
  total_verifications: number; // Total verifications in period
  total_citizens: number;      // Total active citizens eligible for payout
  payout_per_verification: number; // uSOV per verification
  status: 'pending' | 'calculated' | 'distributed' | 'failed';
  created_at: string;
}

export interface CitizenPayout {
  payout_id: string;
  period_id: string;
  did: string;
  verification_count: number;  // Verifications in this period
  payout_amount: number;       // uSOV earned
  status: 'pending' | 'distributed' | 'failed';
  distributed_at: string | null;
  transaction_hash: string | null;
}

export class IntegrityDividendEngine {
  private db: Database.Database;
  private sovereignStore: SovereignStore;

  constructor(dbPath: string, sovereignStore: SovereignStore) {
    this.db = new Database(dbPath);
    this.sovereignStore = sovereignStore;

    this.initializeSchema();

    logger.info('Integrity Dividend Engine initialized');
  }

  /**
   * Initialize database schema for payout tracking
   */
  private initializeSchema(): void {
    this.db.exec(`
      -- Payout periods table
      CREATE TABLE IF NOT EXISTS payout_periods (
        period_id TEXT PRIMARY KEY,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_fees_received INTEGER DEFAULT 0,
        total_verifications INTEGER DEFAULT 0,
        total_citizens INTEGER DEFAULT 0,
        payout_per_verification INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Citizen payouts table
      CREATE TABLE IF NOT EXISTS citizen_payouts (
        payout_id TEXT PRIMARY KEY,
        period_id TEXT NOT NULL,
        did TEXT NOT NULL,
        verification_count INTEGER NOT NULL,
        payout_amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        distributed_at TEXT,
        transaction_hash TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (period_id) REFERENCES payout_periods(period_id)
      );

      CREATE INDEX IF NOT EXISTS idx_citizen_payouts_period ON citizen_payouts(period_id);
      CREATE INDEX IF NOT EXISTS idx_citizen_payouts_did ON citizen_payouts(did);
      CREATE INDEX IF NOT EXISTS idx_citizen_payouts_status ON citizen_payouts(status);

      -- Fee receipts from Global Hub
      CREATE TABLE IF NOT EXISTS fee_receipts (
        receipt_id TEXT PRIMARY KEY,
        period_id TEXT NOT NULL,
        amount_usov INTEGER NOT NULL,
        transaction_hash TEXT,
        received_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (period_id) REFERENCES payout_periods(period_id)
      );

      CREATE INDEX IF NOT EXISTS idx_fee_receipts_period ON fee_receipts(period_id);
    `);

    logger.info('Integrity Dividend schema initialized');
  }

  /**
   * Calculate daily integrity payout
   * This is called automatically by a cron job (default: daily at midnight)
   */
  async calculateDailyPayout(periodId: string): Promise<PayoutPeriod> {
    logger.info('Calculating daily integrity payout', { periodId });

    // 1. Get or create payout period
    const period = this.getOrCreatePeriod(periodId);

    // 2. Get total fees received from hub for this period
    const totalFeesReceived = this.getTotalFeesForPeriod(periodId);

    // 3. Get all active verified DIDs
    const activeCitizens = this.sovereignStore.getActiveVerifiedDIDs();

    if (activeCitizens.length === 0) {
      logger.warn('No active citizens for payout', { periodId });
      return period;
    }

    // 4. Calculate total verifications
    const totalVerifications = activeCitizens.reduce(
      (sum, citizen) => sum + citizen.verification_count,
      0
    );

    // 5. Calculate payout per verification
    // Formula: total_fees / total_verifications
    const payoutPerVerification = Math.floor(totalFeesReceived / totalVerifications);

    // 6. Update period
    const updatePeriodStmt = this.db.prepare(`
      UPDATE payout_periods
      SET total_fees_received = ?,
          total_verifications = ?,
          total_citizens = ?,
          payout_per_verification = ?,
          status = 'calculated',
          updated_at = datetime('now')
      WHERE period_id = ?
    `);

    updatePeriodStmt.run(
      totalFeesReceived,
      totalVerifications,
      activeCitizens.length,
      payoutPerVerification,
      periodId
    );

    // 7. Calculate individual citizen payouts
    const insertPayoutStmt = this.db.prepare(`
      INSERT INTO citizen_payouts (
        payout_id, period_id, did, verification_count, payout_amount, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `);

    for (const citizen of activeCitizens) {
      const payoutAmount = citizen.verification_count * payoutPerVerification;
      const payoutId = `${periodId}-${citizen.did}`;

      insertPayoutStmt.run(
        payoutId,
        periodId,
        citizen.did,
        citizen.verification_count,
        payoutAmount
      );

      logger.info('Citizen payout calculated', {
        did: citizen.did,
        verifications: citizen.verification_count,
        payout: payoutAmount,
      });
    }

    logger.info('Daily integrity payout calculated', {
      periodId,
      totalFees: totalFeesReceived,
      totalCitizens: activeCitizens.length,
      totalVerifications,
      payoutPerVerification,
    });

    return this.getPeriod(periodId)!;
  }

  /**
   * Distribute payouts to citizens
   * In production, this would interact with the blockchain to send tokens
   */
  async distributePayout(periodId: string): Promise<{
    success: boolean;
    distributed_count: number;
    failed_count: number;
  }> {
    logger.info('Distributing integrity payout', { periodId });

    // Get all pending payouts for this period
    const stmt = this.db.prepare(`
      SELECT * FROM citizen_payouts
      WHERE period_id = ? AND status = 'pending'
    `);

    const payouts = stmt.all(periodId) as CitizenPayout[];

    let distributedCount = 0;
    let failedCount = 0;

    const updateStmt = this.db.prepare(`
      UPDATE citizen_payouts
      SET status = ?,
          distributed_at = datetime('now'),
          transaction_hash = ?
      WHERE payout_id = ?
    `);

    for (const payout of payouts) {
      try {
        // MOCK: In production, send tokens via blockchain transaction
        const txHash = await this.sendTokens(payout.did, payout.payout_amount);

        updateStmt.run('distributed', txHash, payout.payout_id);
        distributedCount++;

        logger.info('Payout distributed', {
          did: payout.did,
          amount: payout.payout_amount,
          txHash,
        });
      } catch (error) {
        updateStmt.run('failed', null, payout.payout_id);
        failedCount++;

        logger.error('Payout distribution failed', {
          did: payout.did,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update period status
    const updatePeriodStmt = this.db.prepare(`
      UPDATE payout_periods
      SET status = 'distributed',
          updated_at = datetime('now')
      WHERE period_id = ?
    `);

    updatePeriodStmt.run(periodId);

    logger.info('Payout distribution complete', {
      periodId,
      distributed: distributedCount,
      failed: failedCount,
    });

    return {
      success: failedCount === 0,
      distributed_count: distributedCount,
      failed_count: failedCount,
    };
  }

  /**
   * Record fee receipt from Global Hub
   * This is called when the hub sends 50% of verification fees to the spoke
   */
  recordFeeReceipt(periodId: string, amountUSOV: number, transactionHash: string): void {
    const receiptId = `${periodId}-${Date.now()}`;

    const stmt = this.db.prepare(`
      INSERT INTO fee_receipts (receipt_id, period_id, amount_usov, transaction_hash)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(receiptId, periodId, amountUSOV, transactionHash);

    logger.info('Fee receipt recorded', {
      periodId,
      amount: amountUSOV,
      txHash: transactionHash,
    });
  }

  /**
   * Get or create payout period
   */
  private getOrCreatePeriod(periodId: string): PayoutPeriod {
    let period = this.getPeriod(periodId);

    if (!period) {
      // Create new period
      const today = new Date(periodId);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stmt = this.db.prepare(`
        INSERT INTO payout_periods (
          period_id, start_date, end_date, status
        ) VALUES (?, ?, ?, 'pending')
      `);

      stmt.run(
        periodId,
        today.toISOString(),
        tomorrow.toISOString()
      );

      period = this.getPeriod(periodId)!;
    }

    return period;
  }

  /**
   * Get payout period by ID
   */
  private getPeriod(periodId: string): PayoutPeriod | null {
    const stmt = this.db.prepare(`
      SELECT * FROM payout_periods WHERE period_id = ?
    `);

    return stmt.get(periodId) as PayoutPeriod | null;
  }

  /**
   * Get total fees received for a period
   */
  private getTotalFeesForPeriod(periodId: string): number {
    const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(amount_usov), 0) as total
      FROM fee_receipts
      WHERE period_id = ?
    `);

    const result = stmt.get(periodId) as { total: number };
    return result.total;
  }

  /**
   * Send tokens to citizen (MOCK implementation)
   * In production, this would interact with the blockchain
   */
  private async sendTokens(did: string, amountUSOV: number): Promise<string> {
    // MOCK: Generate fake transaction hash
    // In production, this would:
    // 1. Create a blockchain transaction
    // 2. Sign with spoke's private key
    // 3. Broadcast to the network
    // 4. Wait for confirmation
    // 5. Return transaction hash

    const txHash = `0x${Math.random().toString(16).substring(2)}`;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return txHash;
  }

  /**
   * Get payout statistics
   */
  getPayoutStats(periodId?: string): any {
    if (periodId) {
      // Stats for specific period
      const periodStmt = this.db.prepare(`
        SELECT * FROM payout_periods WHERE period_id = ?
      `);

      const payoutsStmt = this.db.prepare(`
        SELECT
          COUNT(*) as total_payouts,
          SUM(payout_amount) as total_amount,
          SUM(CASE WHEN status = 'distributed' THEN 1 ELSE 0 END) as distributed_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
        FROM citizen_payouts
        WHERE period_id = ?
      `);

      return {
        period: periodStmt.get(periodId),
        payouts: payoutsStmt.get(periodId),
      };
    } else {
      // Overall stats
      const stmt = this.db.prepare(`
        SELECT
          COUNT(DISTINCT period_id) as total_periods,
          SUM(total_fees_received) as total_fees_all_time,
          SUM(total_verifications) as total_verifications_all_time,
          AVG(total_citizens) as avg_citizens_per_period
        FROM payout_periods
      `);

      return stmt.get();
    }
  }

  /**
   * Get citizen payout history
   */
  getCitizenPayoutHistory(did: string): CitizenPayout[] {
    const stmt = this.db.prepare(`
      SELECT * FROM citizen_payouts
      WHERE did = ?
      ORDER BY created_at DESC
    `);

    return stmt.all(did) as CitizenPayout[];
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    logger.info('Integrity Dividend Engine closed');
  }
}
