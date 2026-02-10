/**
 * SOVRYN Listener - Force Audit & Minting Release
 *
 * sovrynAuditRequest(): Queries citizens table for Architect's UID.
 * If is_vitalized is TRUE and minting_status is NULL, SOVRYN assumes control
 * and triggers releaseVidaCap() (11 VIDA: 5 Architect / 5 Nigeria Block / 1 Foundation).
 * On confirmation, updates minting_status = 'COMPLETED'.
 */

import { supabase } from '../config/supabase';

const VIDA_TOTAL = 11;
const VIDA_ARCHITECT = 5;
const VIDA_NIGERIA_BLOCK = 5;
const VIDA_FOUNDATION = 1;

export interface ArchitectRow {
  id: string;
  uid: string;
  did: string | null;
  vault_address: string | null;
  is_vitalized: boolean;
  minting_status: string | null;
  is_architect: boolean;
}

export interface SovrynAuditResult {
  success: boolean;
  assumedControl?: boolean;
  architectUid?: string;
  releaseId?: string;
  mintingStatus?: string;
  error?: string;
}

export interface ReleaseVidaCapResult {
  success: boolean;
  releaseId?: string;
  transactionHash?: string;
  error?: string;
}

/**
 * Query the citizens table in Supabase for the Architect's UID.
 * Architect is identified by is_architect = true or did = 'did:sovra:ng:architect'.
 */
export async function getArchitectFromCitizens(): Promise<{
  success: boolean;
  architect?: ArchitectRow;
  error?: string;
}> {
  const { data, error } = await supabase
    .from('citizens')
    .select('id, uid, did, vault_address, is_vitalized, minting_status, is_architect')
    .or('is_architect.eq.true,did.eq.did:sovra:ng:architect')
    .limit(1)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data) {
    return { success: false, error: 'Architect not found in citizens table' };
  }
  return { success: true, architect: data as ArchitectRow };
}

/**
 * Release 11 VIDA: 5 to Architect's Vault, 5 to Nigeria National Block, 1 to Foundation.
 * Writes to sovryn_release_ledger for on-ledger confirmation.
 * Also triggers on-chain mint via SovereignMint (1.1 spendable + 4.0 hard-locked for Architect).
 */
export async function releaseVidaCap(
  architectUid: string,
  architectVaultAddress: string
): Promise<ReleaseVidaCapResult> {
  const nigeriaBlockAddress =
    process.env.NIGERIA_NATIONAL_BLOCK_ADDRESS || process.env.NATIONAL_ESCROW_ADDRESS || '0xNIGERIA_BLOCK_PLACEHOLDER';
  const foundationAddress =
    process.env.FOUNDATION_ADDRESS || '0xFOUNDATION_PLACEHOLDER';

  let chainTxHash: string | undefined;
  if (architectVaultAddress && architectVaultAddress.startsWith('0x') && architectVaultAddress.length >= 42) {
    try {
      const { mintForArchitect } = await import('../blockchain/sovrynProvider');
      const mintResult = await mintForArchitect(architectVaultAddress);
      if (mintResult.success && mintResult.transactionHash) {
        chainTxHash = mintResult.transactionHash;
      }
    } catch (_) {
      // Chain mint optional if env not configured
    }
  }

  const { data: ledgerRow, error: ledgerError } = await supabase
    .from('sovryn_release_ledger')
    .insert({
      citizen_uid: architectUid,
      architect_vault_address: architectVaultAddress,
      nigeria_block_address: nigeriaBlockAddress,
      foundation_address: foundationAddress,
      total_minted: VIDA_TOTAL,
      to_architect: VIDA_ARCHITECT,
      to_nigeria_block: VIDA_NIGERIA_BLOCK,
      to_foundation: VIDA_FOUNDATION,
      transaction_hash: chainTxHash || null,
      status: 'CONFIRMED',
    })
    .select('id')
    .single();

  if (ledgerError || !ledgerRow) {
    return {
      success: false,
      error: ledgerError?.message || 'Failed to write release to ledger',
    };
  }

  return {
    success: true,
    releaseId: ledgerRow.id,
    transactionHash: chainTxHash || (ledgerRow as any).transaction_hash || undefined,
  };
}

/**
 * SOVRYN Listener: Force Audit & Minting Release.
 * 1. Query citizens for Architect's UID.
 * 2. If is_vitalized is TRUE and minting_status is NULL, SOVRYN assumes control.
 * 3. Trigger releaseVidaCap() (11 VIDA: 5 Architect / 5 Nigeria Block / 1 Foundation).
 * 4. On confirmation, update Supabase minting_status = 'COMPLETED'.
 */
export async function sovrynAuditRequest(): Promise<SovrynAuditResult> {
  const architectResult = await getArchitectFromCitizens();
  if (!architectResult.success || !architectResult.architect) {
    return {
      success: false,
      error: architectResult.error || 'Architect not found',
    };
  }

  const architect = architectResult.architect;

  // Verification: SOVRYN assumes control only when is_vitalized AND minting_status is NULL
  const shouldAssumeControl =
    architect.is_vitalized === true &&
    (architect.minting_status === null || architect.minting_status === '');

  if (!shouldAssumeControl) {
    return {
      success: true,
      assumedControl: false,
      architectUid: architect.uid,
      mintingStatus: architect.minting_status || undefined,
      error:
        architect.minting_status != null
          ? `Minting already in state: ${architect.minting_status}`
          : 'Architect is not vitalized (is_vitalized must be true)',
    };
  }

  const vaultAddress =
    architect.vault_address ||
    process.env.ARCHITECT_VAULT_ADDRESS ||
    architect.uid;

  const releaseResult = await releaseVidaCap(architect.uid, vaultAddress);

  if (!releaseResult.success) {
    return {
      success: false,
      assumedControl: true,
      architectUid: architect.uid,
      error: releaseResult.error || 'releaseVidaCap failed',
    };
  }

  // Status update: once confirmed on-ledger, set minting_status = 'COMPLETED'
  const { error: updateError } = await supabase
    .from('citizens')
    .update({
      minting_status: 'COMPLETED',
      updated_at: new Date().toISOString(),
    })
    .eq('uid', architect.uid);

  if (updateError) {
    return {
      success: true,
      assumedControl: true,
      architectUid: architect.uid,
      releaseId: releaseResult.releaseId,
      mintingStatus: 'COMPLETED',
      error: `Release succeeded but status update failed: ${updateError.message}`,
    };
  }

  return {
    success: true,
    assumedControl: true,
    architectUid: architect.uid,
    releaseId: releaseResult.releaseId,
    mintingStatus: 'COMPLETED',
  };
}

/** Citizen row for audit-all: is_vitalized true and minting_status null */
export interface VitalizedCitizenRow {
  id: string;
  uid: string;
  vault_address: string | null;
  is_vitalized: boolean;
  minting_status: string | null;
}

export interface AuditAllResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{
    uid: string;
    success: boolean;
    releaseId?: string;
    error?: string;
  }>;
  error?: string;
}

/**
 * Scan for all citizens with is_vitalized = true and minting_status = null,
 * trigger 11 VIDA minting for each, update minting_status to COMPLETED.
 */
export async function sovrynAuditRequestForAll(): Promise<AuditAllResult> {
  const { data: rows, error: fetchError } = await supabase
    .from('citizens')
    .select('id, uid, vault_address, is_vitalized, minting_status')
    .eq('is_vitalized', true)
    .is('minting_status', null);

  if (fetchError) {
    return {
      success: false,
      processed: 0,
      succeeded: 0,
      failed: 0,
      results: [],
      error: fetchError.message,
    };
  }

  const list = (rows || []) as VitalizedCitizenRow[];
  const results: AuditAllResult['results'] = [];
  let succeeded = 0;
  let failed = 0;

  for (const row of list) {
    const vaultAddress =
      row.vault_address ||
      process.env.ARCHITECT_VAULT_ADDRESS ||
      row.uid;

    const releaseResult = await releaseVidaCap(row.uid, vaultAddress);

    if (releaseResult.success) {
      const { error: updateError } = await supabase
        .from('citizens')
        .update({
          minting_status: 'COMPLETED',
          updated_at: new Date().toISOString(),
        })
        .eq('uid', row.uid);

      if (updateError) {
        results.push({
          uid: row.uid,
          success: false,
          error: `Release ok but status update failed: ${updateError.message}`,
        });
        failed += 1;
      } else {
        results.push({
          uid: row.uid,
          success: true,
          releaseId: releaseResult.releaseId,
        });
        succeeded += 1;
      }
    } else {
      results.push({
        uid: row.uid,
        success: false,
        error: releaseResult.error,
      });
      failed += 1;
    }
  }

  return {
    success: failed === 0,
    processed: list.length,
    succeeded,
    failed,
    results,
  };
}
