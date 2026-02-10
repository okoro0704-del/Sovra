/**
 * AgnosticGateway.ts - App-Agnostic Payment Gateway
 * 
 * "Pay with any PFF-connected App. The chain doesn't care about the app name."
 * 
 * This module implements the agnostic gateway logic for VIDA Cap payments.
 * The chain only validates PFF certification, not the app identity.
 * 
 * Features:
 * - App-agnostic payment processing
 * - PFF certification validation
 * - SOVEREIGN_AUTH verification
 * - Multi-app support (Vitalia One, Vitalia Business, Third-party apps)
 * 
 * Born in Lagos, Nigeria. Built for Universal Access.
 */

import { ethers } from 'ethers';
import {
  SovereignAuthSignature,
  PFFCertification,
  verifySovereignAuth,
  validatePFFCertification,
} from './PFFAuthListener';

// ============ TYPES ============

export interface PaymentRequest {
  /** Citizen address (payer) */
  from: string;
  
  /** Recipient address */
  to: string;
  
  /** Amount in VIDA Cap (18 decimals) */
  amount: string;
  
  /** PFF certification from app */
  pffCertification: PFFCertification;
  
  /** SOVEREIGN_AUTH signature */
  sovereignAuth: SovereignAuthSignature;
  
  /** Optional payment metadata */
  metadata?: {
    description?: string;
    reference?: string;
    tags?: string[];
  };
}

export interface PaymentResult {
  /** Payment success */
  success: boolean;
  
  /** Transaction hash (if successful) */
  txHash?: string;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Amount transferred (after burn) */
  amountTransferred?: string;
  
  /** Amount burned (1% if applicable) */
  amountBurned?: string;
}

export interface GatewayStats {
  /** Total payments processed */
  totalPayments: number;
  
  /** Total volume (VIDA Cap) */
  totalVolume: string;
  
  /** Unique apps used */
  uniqueApps: Set<string>;
  
  /** Payments by app */
  paymentsByApp: Map<string, number>;
}

// ============ STATE ============

const gatewayStats: GatewayStats = {
  totalPayments: 0,
  totalVolume: '0',
  uniqueApps: new Set(),
  paymentsByApp: new Map(),
};

// ============ CORE FUNCTIONS ============

/**
 * Process payment from any PFF-connected app
 * 
 * The chain is app-agnostic: it only validates PFF certification,
 * not the app identity.
 * 
 * @param request Payment request
 * @param pffPublicKey PFF Protocol public key
 * @returns Payment result
 */
export async function processPaymentFromAnyApp(
  request: PaymentRequest,
  pffPublicKey: string
): Promise<PaymentResult> {
  console.log('[AGNOSTIC GATEWAY] Processing payment from app...');
  console.log(`[AGNOSTIC GATEWAY] App ID: ${request.pffCertification.appId} (IGNORED)`);
  console.log(`[AGNOSTIC GATEWAY] From: ${request.from}`);
  console.log(`[AGNOSTIC GATEWAY] To: ${request.to}`);
  console.log(`[AGNOSTIC GATEWAY] Amount: ${ethers.utils.formatEther(request.amount)} VIDA Cap`);
  
  // STEP 1: Validate PFF certification (app-agnostic)
  const certValid = await validatePFFCertification(request.pffCertification);
  if (!certValid) {
    return {
      success: false,
      error: 'Invalid PFF certification',
    };
  }
  
  // STEP 2: Verify SOVEREIGN_AUTH signature
  const authValidation = await verifySovereignAuth(request.sovereignAuth, pffPublicKey);
  if (!authValidation.isValid) {
    return {
      success: false,
      error: `SOVEREIGN_AUTH verification failed: ${authValidation.error}`,
    };
  }
  
  // STEP 3: Verify citizen address matches
  if (request.from.toLowerCase() !== request.sovereignAuth.citizenAddress.toLowerCase()) {
    return {
      success: false,
      error: 'Citizen address mismatch',
    };
  }
  
  // STEP 4: Process payment (in production, call VidaCapGodcurrency contract)
  // For now, simulate transaction
  const txHash = await simulatePayment(request);
  
  // STEP 5: Update stats
  updateGatewayStats(request);
  
  console.log('[AGNOSTIC GATEWAY] ✅ Payment processed');
  console.log(`[AGNOSTIC GATEWAY] TX Hash: ${txHash}`);
  
  return {
    success: true,
    txHash,
    amountTransferred: request.amount,
    amountBurned: '0', // Calculated by contract
  };
}

/**
 * Simulate payment (in production, call smart contract)
 */
async function simulatePayment(request: PaymentRequest): Promise<string> {
  // Simulate blockchain transaction
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return `0x${Math.random().toString(16).substring(2, 66)}`;
}

/**
 * Update gateway statistics
 */
function updateGatewayStats(request: PaymentRequest): void {
  gatewayStats.totalPayments++;
  
  const currentVolume = ethers.BigNumber.from(gatewayStats.totalVolume);
  const paymentAmount = ethers.BigNumber.from(request.amount);
  gatewayStats.totalVolume = currentVolume.add(paymentAmount).toString();
  
  gatewayStats.uniqueApps.add(request.pffCertification.appId);
  
  const appCount = gatewayStats.paymentsByApp.get(request.pffCertification.appId) || 0;
  gatewayStats.paymentsByApp.set(request.pffCertification.appId, appCount + 1);
}

/**
 * Get gateway statistics
 */
export function getGatewayStats(): {
  totalPayments: number;
  totalVolume: string;
  uniqueApps: number;
  paymentsByApp: Record<string, number>;
} {
  return {
    totalPayments: gatewayStats.totalPayments,
    totalVolume: gatewayStats.totalVolume,
    uniqueApps: gatewayStats.uniqueApps.size,
    paymentsByApp: Object.fromEntries(gatewayStats.paymentsByApp),
  };
}

/**
 * Check if app is PFF-certified (app-agnostic check)
 *
 * This function demonstrates the app-agnostic nature:
 * We don't maintain a whitelist of app names.
 * We only check if the PFF certification is valid.
 */
export async function isAppPFFCertified(
  cert: PFFCertification
): Promise<boolean> {
  // The chain doesn't care about app name
  // Only validates PFF certification
  return validatePFFCertification(cert);
}

/**
 * Create PFF certification for an app
 *
 * This would be called by the PFF Protocol when certifying a new app.
 */
export function createPFFCertification(
  appId: string,
  pffVersion: string,
  validityDays: number = 365
): PFFCertification {
  const now = Date.now();
  const expiresAt = now + validityDays * 24 * 60 * 60 * 1000;

  // Generate certification hash
  const certificationHash = ethers.utils.id(
    `${appId}_${pffVersion}_${now}_${expiresAt}`
  );

  return {
    appId,
    pffVersion,
    certificationHash,
    isValid: true,
    expiresAt,
  };
}

/**
 * Validate payment request (without processing)
 */
export async function validatePaymentRequest(
  request: PaymentRequest,
  pffPublicKey: string
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Validate addresses
  if (!ethers.utils.isAddress(request.from)) {
    errors.push('Invalid sender address');
  }

  if (!ethers.utils.isAddress(request.to)) {
    errors.push('Invalid recipient address');
  }

  // Validate amount
  try {
    const amount = ethers.BigNumber.from(request.amount);
    if (amount.lte(0)) {
      errors.push('Amount must be greater than zero');
    }
  } catch {
    errors.push('Invalid amount format');
  }

  // Validate PFF certification
  const certValid = await validatePFFCertification(request.pffCertification);
  if (!certValid) {
    errors.push('Invalid PFF certification');
  }

  // Validate SOVEREIGN_AUTH
  const authValidation = await verifySovereignAuth(request.sovereignAuth, pffPublicKey);
  if (!authValidation.isValid) {
    errors.push(`SOVEREIGN_AUTH invalid: ${authValidation.error}`);
  }

  // Validate address match
  if (request.from.toLowerCase() !== request.sovereignAuth.citizenAddress.toLowerCase()) {
    errors.push('Sender address does not match SOVEREIGN_AUTH');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Reset gateway stats (for testing)
 */
export function resetGatewayStats(): void {
  gatewayStats.totalPayments = 0;
  gatewayStats.totalVolume = '0';
  gatewayStats.uniqueApps.clear();
  gatewayStats.paymentsByApp.clear();
  console.log('[AGNOSTIC GATEWAY] Stats reset');
}

