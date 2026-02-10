/**
 * PFF Protocol → SOVRYN Chain handshake
 *
 * When a user is Vitalized in Supabase, trigger a call to the SovereignMint
 * smart contract on the SOVRYN Chain. Architect priority: specifically check
 * for the Architect's wallet and release 1.1 VIDA (spendable) + 4.0 VIDA (hard-locked).
 * Gasless: meta-transaction so SOVRYN covers gas. Once mined, update dashboard balance.
 */

import { supabase } from '../config/supabase';
import { getArchitectFromCitizens } from './sovrynAudit';
import { mintForArchitect, getBalance } from '../blockchain/sovrynProvider';

export interface VitalizedChainResult {
  success: boolean;
  isArchitect?: boolean;
  architectWallet?: string;
  transactionHash?: string;
  blockNumber?: number;
  spendable?: string;
  locked?: string;
  balanceUpdated?: boolean;
  error?: string;
}

/**
 * Check if the vitalized user is the Architect (by citizens.uid = wallet or is_architect).
 * If so, call SovereignMint on SOVRYN Chain (meta-tx), then update balance cache for dashboard.
 */
export async function onVitalizedTriggerChainHandshake(
  vitalizedUidOrWallet: string
): Promise<VitalizedChainResult> {
  const architectResult = await getArchitectFromCitizens();
  if (!architectResult.success || !architectResult.architect) {
    return { success: false, error: architectResult.error || 'Architect not found' };
  }

  const architect = architectResult.architect;
  const isArchitect =
    architect.is_architect &&
    (architect.uid.toLowerCase() === vitalizedUidOrWallet.toLowerCase() ||
     (architect.vault_address && architect.vault_address.toLowerCase() === vitalizedUidOrWallet.toLowerCase()));

  if (!isArchitect) {
    return { success: true, isArchitect: false };
  }

  let architectWallet = (architect.vault_address || architect.uid || '').trim();
  if (!architectWallet) {
    return { success: false, error: 'Architect wallet address not set in citizens (vault_address or uid)' };
  }
  if (!architectWallet.startsWith('0x')) {
    architectWallet = '0x' + architectWallet;
  }
  if (architectWallet.length < 42 || architectWallet === '0xARCHITECT_ADDRESS_PLACEHOLDER') {
    const envWallet = (process.env.ARCHITECT_VAULT_ADDRESS || process.env.ARCHITECT_WALLET_ADDRESS || '').trim();
    if (envWallet && envWallet.startsWith('0x') && envWallet.length >= 42) {
      architectWallet = envWallet;
    } else {
      return { success: false, error: 'Architect wallet address invalid; set ARCHITECT_VAULT_ADDRESS in env or in citizens' };
    }
  }

  const mintResult = await mintForArchitect(architectWallet);
  if (!mintResult.success) {
    return {
      success: false,
      isArchitect: true,
      architectWallet,
      error: mintResult.error || 'Chain mint failed',
    };
  }

  // Once mined: update balance cache so dashboard can show real-time balance
  const balanceResult = await getBalance(architectWallet);
  const spendable = balanceResult.spendable || mintResult.spendableAmount || '0';
  const locked = balanceResult.locked || mintResult.lockedAmount || '0';

  const { error: updateError } = await supabase.from('citizens').update({
    metadata: {
      ...((architect as any).metadata || {}),
      last_chain_balance: { spendable, locked },
      last_chain_tx: mintResult.transactionHash,
      last_chain_block: mintResult.blockNumber,
    },
    updated_at: new Date().toISOString(),
  }).eq('uid', architect.uid);

  return {
    success: true,
    isArchitect: true,
    architectWallet,
    transactionHash: mintResult.transactionHash,
    blockNumber: mintResult.blockNumber,
    spendable,
    locked,
    balanceUpdated: !updateError,
    error: updateError?.message,
  };
}
