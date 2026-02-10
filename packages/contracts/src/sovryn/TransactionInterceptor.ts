/**
 * TransactionInterceptor.ts - Sovryn Transaction Gating
 * 
 * "No presence, no vault. No heartbeat, no Bitcoin."
 * 
 * This module intercepts ALL Sovryn contract calls and enforces the
 * Sovereign_Active flag check. If the flag is false, the user is
 * automatically redirected to the PFF Presence Scan.
 * 
 * Logic:
 * 1. Before any Sovryn transaction, check Sovereign_Active flag
 * 2. If false, throw SovereignGateError with redirect instructions
 * 3. If true, allow transaction to proceed
 * 4. Record activity to extend session timeout
 * 
 * This ensures that the user's Bitcoin vault is INVISIBLE unless
 * they have completed a recent PFF heartbeat scan.
 */

import { getSovereignSessionManager } from './SovereignSession';

// ============ TYPES ============

export class SovereignGateError extends Error {
  public readonly code: string;
  public readonly requiresPresenceScan: boolean;
  public readonly redirectTo: string;

  constructor(message: string, code: string = 'SOVEREIGN_GATE_LOCKED') {
    super(message);
    this.name = 'SovereignGateError';
    this.code = code;
    this.requiresPresenceScan = true;
    this.redirectTo = 'Welcome'; // PFF Presence Scan screen
  }
}

export interface InterceptorResult<T> {
  success: boolean;
  data?: T;
  error?: SovereignGateError;
}

// ============ TRANSACTION INTERCEPTOR ============

/**
 * Intercept and gate Sovryn transaction
 * 
 * This is the PRIMARY enforcement point for the Sovereign_Active flag.
 * 
 * @param transaction - The Sovryn transaction to execute
 * @param transactionName - Human-readable name for logging
 * @returns Transaction result or throws SovereignGateError
 */
export async function interceptSovrynTransaction<T>(
  transaction: () => Promise<T>,
  transactionName: string = 'Sovryn Transaction'
): Promise<T> {
  const sessionManager = getSovereignSessionManager();

  console.log(`[TRANSACTION INTERCEPTOR] 🔍 Checking Sovereign_Active for: ${transactionName}`);

  // CRITICAL CHECK: Is Sovereign_Active flag true?
  if (!sessionManager.isSovereignActive()) {
    const session = sessionManager.getSession();

    if (!session) {
      // No session at all - user never vitalized
      console.log('[TRANSACTION INTERCEPTOR] ❌ No session - Vault INVISIBLE');
      throw new SovereignGateError(
        'Your Sovryn vault is invisible. Complete PFF Presence Scan to unlock your Bitcoin.',
        'NO_SESSION'
      );
    }

    if (!session.sovereignActive) {
      // Session exists but Sovereign_Active = false (presence proof expired)
      console.log('[TRANSACTION INTERCEPTOR] 🔒 Sovereign_Active = false - Vault LOCKED');
      throw new SovereignGateError(
        'Your presence proof has expired. Scan your heartbeat to unlock your Sovryn vault.',
        'PRESENCE_EXPIRED'
      );
    }
  }

  // ✅ Sovereign_Active = true, allow transaction
  console.log(`[TRANSACTION INTERCEPTOR] ✅ Sovereign_Active = true - Executing: ${transactionName}`);

  // Record activity to extend session
  sessionManager.recordActivity();

  try {
    const result = await transaction();
    console.log(`[TRANSACTION INTERCEPTOR] ✅ Transaction complete: ${transactionName}`);
    return result;
  } catch (error: any) {
    console.error(`[TRANSACTION INTERCEPTOR] ❌ Transaction failed: ${transactionName}`, error);
    throw error;
  }
}

/**
 * Safe interceptor that returns result object instead of throwing
 */
export async function interceptSovrynTransactionSafe<T>(
  transaction: () => Promise<T>,
  transactionName: string = 'Sovryn Transaction'
): Promise<InterceptorResult<T>> {
  try {
    const data = await interceptSovrynTransaction(transaction, transactionName);
    return { success: true, data };
  } catch (error) {
    if (error instanceof SovereignGateError) {
      return { success: false, error };
    }
    throw error; // Re-throw non-gate errors
  }
}

/**
 * Create a gated version of a function
 * 
 * Usage:
 * const gatedTrade = createGatedFunction(sovryn.trade, 'Spot Trade');
 * await gatedTrade({ fromToken, toToken, amount });
 */
export function createGatedFunction<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  transactionName: string
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return interceptSovrynTransaction(
      () => fn(...args),
      transactionName
    );
  };
}

/**
 * Decorator for gating class methods
 * 
 * Usage:
 * class SovrynClient {
 *   @GatedTransaction('Spot Trade')
 *   async trade(params: TradeParams) { ... }
 * }
 */
export function GatedTransaction(transactionName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return interceptSovrynTransaction(
        () => originalMethod.apply(this, args),
        transactionName
      );
    };

    return descriptor;
  };
}

/**
 * Check if transaction would be allowed (without executing)
 */
export function canExecuteSovrynTransaction(): {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
} {
  const sessionManager = getSovereignSessionManager();

  if (!sessionManager.isSovereignActive()) {
    const session = sessionManager.getSession();

    if (!session) {
      return {
        allowed: false,
        reason: 'No active session. Complete PFF Presence Scan to unlock your vault.',
        redirectTo: 'Welcome',
      };
    }

    if (!session.sovereignActive) {
      return {
        allowed: false,
        reason: 'Presence proof expired. Scan your heartbeat to unlock your vault.',
        redirectTo: 'Welcome',
      };
    }
  }

  return { allowed: true };
}
