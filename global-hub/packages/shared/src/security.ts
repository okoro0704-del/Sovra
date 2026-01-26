import * as crypto from 'crypto';

/**
 * Security utilities for SOVRN Protocol
 * All biometric data is hashed using HMAC-SHA256 to ensure no raw data is stored
 */

const HMAC_SECRET = process.env.HMAC_SECRET || 'default-secret-change-in-production';

/**
 * Generate HMAC-SHA256 hash for biometric data
 * @param data - The biometric data to hash (PFF, NIN, etc.)
 * @param secret - Optional secret key (defaults to HMAC_SECRET env var)
 * @returns Hexadecimal hash string
 */
export function hashBiometricData(data: string, secret?: string): string {
  const secretKey = secret || HMAC_SECRET;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Verify biometric data against a hash
 * @param data - The biometric data to verify
 * @param hash - The stored hash to compare against
 * @param secret - Optional secret key (defaults to HMAC_SECRET env var)
 * @returns True if the hash matches
 */
export function verifyBiometricHash(data: string, hash: string, secret?: string): boolean {
  const computedHash = hashBiometricData(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(hash, 'hex')
  );
}

/**
 * Hash API key for storage
 * @param apiKey - The API key to hash
 * @returns Hexadecimal hash string
 */
export function hashApiKey(apiKey: string): string {
  return hashBiometricData(apiKey);
}

/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hexadecimal token string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash PFF (Personal Fingerprint) data
 * @param pffData - The PFF biometric data
 * @returns Hexadecimal hash string
 */
export function hashPFF(pffData: string): string {
  return hashBiometricData(pffData);
}

/**
 * Hash NIN (National Identification Number) data
 * @param ninData - The NIN data
 * @returns Hexadecimal hash string
 */
export function hashNIN(ninData: string): string {
  return hashBiometricData(ninData);
}
