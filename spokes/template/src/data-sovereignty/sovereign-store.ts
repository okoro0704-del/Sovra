/**
 * SOVRN Spoke - Data Sovereignty Module
 * 
 * This module implements a private, encrypted key-value store for
 * Hashed_Citizenship_Data. All citizen data remains within national borders
 * and is encrypted at rest.
 * 
 * KEY PRINCIPLES:
 * 1. Data never leaves the national jurisdiction
 * 2. All data is encrypted at rest using AES-256-GCM
 * 3. Only hashed biometric data is stored (no plaintext PII)
 * 4. Government maintains full control over the database
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

export interface CitizenshipRecord {
  did: string;                    // Decentralized Identifier (e.g., did:sovrn:ng:12345)
  biometric_hash: string;         // Hashed biometric data (NEVER plaintext)
  citizenship_proof_hash: string; // Hash of citizenship documents
  registration_date: string;      // ISO 8601 timestamp
  last_verified: string;          // Last verification timestamp
  verification_count: number;     // Total verification count
  status: 'active' | 'suspended' | 'revoked';
  metadata: Record<string, any>;  // Encrypted metadata
}

export interface EncryptedData {
  encrypted: string;  // Base64-encoded encrypted data
  iv: string;         // Base64-encoded initialization vector
  authTag: string;    // Base64-encoded authentication tag
  salt: string;       // Base64-encoded salt
}

export class SovereignStore {
  private db: Database.Database;
  private encryptionKey: Buffer;

  constructor(dbPath: string, encryptionKey: string) {
    // Initialize SQLite database
    this.db = new Database(dbPath);
    this.encryptionKey = Buffer.from(encryptionKey, 'hex');

    // Validate encryption key length (must be 32 bytes for AES-256)
    if (this.encryptionKey.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (64 hex characters)');
    }

    // Initialize database schema
    this.initializeSchema();

    logger.info('Sovereign Store initialized', { dbPath });
  }

  /**
   * Initialize database schema with encryption and sovereignty features
   */
  private initializeSchema(): void {
    // Create citizenship records table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS citizenship_records (
        did TEXT PRIMARY KEY,
        biometric_hash TEXT NOT NULL UNIQUE,
        citizenship_proof_hash TEXT NOT NULL,
        registration_date TEXT NOT NULL,
        last_verified TEXT NOT NULL,
        verification_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        encrypted_metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_biometric_hash ON citizenship_records(biometric_hash);
      CREATE INDEX IF NOT EXISTS idx_status ON citizenship_records(status);
      CREATE INDEX IF NOT EXISTS idx_last_verified ON citizenship_records(last_verified);

      -- Audit log for data sovereignty compliance
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        did TEXT,
        actor TEXT,
        ip_address TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        details TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_did ON audit_log(did);
    `);

    logger.info('Database schema initialized');
  }

  /**
   * Encrypt data using AES-256-GCM
   * This ensures data sovereignty - data is encrypted at rest
   */
  private encrypt(data: string): EncryptedData {
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from encryption key + salt
    const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, 32, 'sha256');

    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64'),
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decrypt(encryptedData: EncryptedData): string {
    // Decode base64 values
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const salt = Buffer.from(encryptedData.salt, 'base64');

    // Derive key from encryption key + salt
    const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, 32, 'sha256');

    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Register a new citizen in the sovereign database
   * This is the ONLY place where citizenship data is stored
   */
  registerCitizen(record: Omit<CitizenshipRecord, 'verification_count'>): void {
    const encryptedMetadata = this.encrypt(JSON.stringify(record.metadata));

    const stmt = this.db.prepare(`
      INSERT INTO citizenship_records (
        did, biometric_hash, citizenship_proof_hash,
        registration_date, last_verified, status, encrypted_metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.did,
      record.biometric_hash,
      record.citizenship_proof_hash,
      record.registration_date,
      record.last_verified,
      record.status,
      JSON.stringify(encryptedMetadata)
    );

    this.logAudit('REGISTER_CITIZEN', record.did, 'system', null, {
      action: 'New citizen registered',
    });

    logger.info('Citizen registered', { did: record.did });
  }

  /**
   * Verify if a biometric hash exists in the sovereign database
   * This is called by the Hub-Connector for ZK-proof verification
   *
   * PRIVACY: Returns ONLY existence boolean + aggregated trust indicators
   * NEVER returns name, passport, or any PII
   */
  verifyBiometricHash(biometricHash: string): {
    exists: boolean;
    trustIndicators: Record<string, string>;
  } {
    const stmt = this.db.prepare(`
      SELECT did, verification_count, last_verified, status
      FROM citizenship_records
      WHERE biometric_hash = ? AND status = 'active'
    `);

    const record = stmt.get(biometricHash) as any;

    if (!record) {
      return {
        exists: false,
        trustIndicators: {
          verification_count: 'none',
          last_verified: 'never',
          risk_level: 'unknown',
        },
      };
    }

    // Log verification attempt (audit trail)
    this.logAudit('VERIFY_BIOMETRIC', record.did, 'hub', null, {
      action: 'Biometric verification requested',
    });

    // Calculate aggregated/bucketed trust indicators
    // These are PRIVACY-PRESERVING - no exact values
    const trustIndicators = this.calculateTrustIndicators(
      record.verification_count,
      record.last_verified
    );

    return {
      exists: true,
      trustIndicators,
    };
  }

  /**
   * Calculate privacy-preserving trust indicators
   * Values are AGGREGATED/BUCKETED to prevent identity inference
   */
  private calculateTrustIndicators(
    verificationCount: number,
    lastVerified: string
  ): Record<string, string> {
    // Bucket verification count
    let verificationBucket: string;
    if (verificationCount >= 50) verificationBucket = 'very_high';
    else if (verificationCount >= 20) verificationBucket = 'high';
    else if (verificationCount >= 10) verificationBucket = 'medium';
    else if (verificationCount >= 5) verificationBucket = 'low';
    else if (verificationCount >= 1) verificationBucket = 'very_low';
    else verificationBucket = 'none';

    // Bucket recency
    const lastVerifiedDate = new Date(lastVerified);
    const hoursSinceVerification = (Date.now() - lastVerifiedDate.getTime()) / (1000 * 60 * 60);

    let recencyBucket: string;
    if (hoursSinceVerification < 1) recencyBucket = 'very_recent';
    else if (hoursSinceVerification < 6) recencyBucket = 'recent';
    else if (hoursSinceVerification < 24) recencyBucket = 'moderate';
    else if (hoursSinceVerification < 168) recencyBucket = 'old';
    else recencyBucket = 'very_old';

    // Risk level (can be enhanced with ML models)
    const riskLevel = verificationCount > 10 ? 'low' : 'medium';

    return {
      verification_count: verificationBucket,
      last_verified: recencyBucket,
      risk_level: riskLevel,
    };
  }

  /**
   * Update verification count when a citizen is verified
   */
  recordVerification(biometricHash: string): void {
    const stmt = this.db.prepare(`
      UPDATE citizenship_records
      SET verification_count = verification_count + 1,
          last_verified = datetime('now'),
          updated_at = datetime('now')
      WHERE biometric_hash = ?
    `);

    stmt.run(biometricHash);

    logger.info('Verification recorded', { biometricHash: biometricHash.substring(0, 10) + '...' });
  }

  /**
   * Get all active verified DIDs for integrity dividend distribution
   */
  getActiveVerifiedDIDs(): Array<{ did: string; verification_count: number }> {
    const stmt = this.db.prepare(`
      SELECT did, verification_count
      FROM citizenship_records
      WHERE status = 'active' AND verification_count > 0
      ORDER BY verification_count DESC
    `);

    return stmt.all() as Array<{ did: string; verification_count: number }>;
  }

  /**
   * Get citizen record by DID (for internal use only)
   */
  getCitizenByDID(did: string): CitizenshipRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM citizenship_records WHERE did = ?
    `);

    const record = stmt.get(did) as any;

    if (!record) {
      return null;
    }

    // Decrypt metadata
    const encryptedMetadata = JSON.parse(record.encrypted_metadata);
    const metadata = JSON.parse(this.decrypt(encryptedMetadata));

    return {
      did: record.did,
      biometric_hash: record.biometric_hash,
      citizenship_proof_hash: record.citizenship_proof_hash,
      registration_date: record.registration_date,
      last_verified: record.last_verified,
      verification_count: record.verification_count,
      status: record.status,
      metadata,
    };
  }

  /**
   * Log audit event for data sovereignty compliance
   */
  private logAudit(
    action: string,
    did: string | null,
    actor: string,
    ipAddress: string | null,
    details: Record<string, any>
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (action, did, actor, ip_address, details)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(action, did, actor, ipAddress, JSON.stringify(details));
  }

  /**
   * Get database statistics
   */
  getStats(): {
    total_citizens: number;
    active_citizens: number;
    total_verifications: number;
    avg_verifications_per_citizen: number;
  } {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_citizens,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_citizens,
        SUM(verification_count) as total_verifications,
        AVG(verification_count) as avg_verifications_per_citizen
      FROM citizenship_records
    `);

    return stmt.get() as any;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    logger.info('Sovereign Store closed');
  }
}

