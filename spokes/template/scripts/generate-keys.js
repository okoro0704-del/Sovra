/**
 * Generate cryptographic keys for the spoke
 * Run with: npm run generate:keys
 */

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import crypto from 'crypto';

console.log('🔐 Generating cryptographic keys for SOVRN Spoke...\n');

// Generate Ed25519 key pair for spoke identity
const keyPair = nacl.sign.keyPair();

console.log('='.repeat(80));
console.log('SPOKE IDENTITY KEYS (Ed25519)');
console.log('='.repeat(80));
console.log('\nSPOKE_PRIVATE_KEY=');
console.log(naclUtil.encodeBase64(keyPair.secretKey));
console.log('\nSPOKE_PUBLIC_KEY=');
console.log(naclUtil.encodeBase64(keyPair.publicKey));

// Generate database encryption key (AES-256)
const encryptionKey = crypto.randomBytes(32);

console.log('\n' + '='.repeat(80));
console.log('DATABASE ENCRYPTION KEY (AES-256)');
console.log('='.repeat(80));
console.log('\nDATABASE_ENCRYPTION_KEY=');
console.log(encryptionKey.toString('hex'));

// Generate JWT secret
const jwtSecret = crypto.randomBytes(64);

console.log('\n' + '='.repeat(80));
console.log('JWT SECRET');
console.log('='.repeat(80));
console.log('\nJWT_SECRET=');
console.log(jwtSecret.toString('hex'));

console.log('\n' + '='.repeat(80));
console.log('⚠️  SECURITY WARNING');
console.log('='.repeat(80));
console.log('\n1. Copy these keys to your .env file');
console.log('2. NEVER commit .env to version control');
console.log('3. Store private keys in a secure vault (e.g., HashiCorp Vault)');
console.log('4. Rotate keys periodically');
console.log('5. Share SPOKE_PUBLIC_KEY with SOVRN Global Hub for registration\n');

