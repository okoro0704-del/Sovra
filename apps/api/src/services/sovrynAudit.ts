/**
 * SOVRYN Listener - Force Audit & Minting Release (Global API)
 * Dynamic Nationality + country_code override; 5 VIDA to national_reserves by country; 1 VIDA to Global Foundation.
 */

import { getGlobalFoundationAddress, VIDA_TOTAL, VIDA_ARCHITECT, VIDA_NATIONAL_BLOCK, VIDA_FOUNDATION } from '@sovrn/shared';
import { supabase } from '../config/supabase';
import { getCitizenNationality } from './citizenNationality';
import { getNationalBlockAddress } from './nationalReserves';

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

  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: 'Architect not found in citizens table' };
  return { success: true, architect: data as ArchitectRow };
}

export async function releaseVidaCap(
  citizenUid: string,
  architectVaultAddress: string,
  countryCode: string
): Promise<ReleaseVidaCapResult> {
  const nationalBlockAddress = await getNationalBlockAddress(supabase, countryCode);
  const foundationAddress = getGlobalFoundationAddress();

  let chainTxHash: string | undefined;
  if (architectVaultAddress?.startsWith('0x') && architectVaultAddress.length >= 42) {
    try {
      const { mintForArchitect } = await import('../blockchain/sovrynProvider');
      const mintResult = await mintForArchitect(architectVaultAddress);
      if (mintResult.success && mintResult.transactionHash) chainTxHash = mintResult.transactionHash;
    } catch (_) {}
  }

  const { data: ledgerRow, error: ledgerError } = await supabase
    .from('sovryn_release_ledger')
    .insert({
      citizen_uid: citizenUid,
      architect_vault_address: architectVaultAddress,
      nigeria_block_address: nationalBlockAddress,
      national_block_address: nationalBlockAddress,
      country_code: countryCode,
      foundation_address: foundationAddress,
      total_minted: VIDA_TOTAL,
      to_architect: VIDA_ARCHITECT,
      to_nigeria_block: VIDA_NATIONAL_BLOCK,
      to_foundation: VIDA_FOUNDATION,
      transaction_hash: chainTxHash || null,
      status: 'CONFIRMED',
    })
    .select('id')
    .single();

  if (ledgerError || !ledgerRow) {
    return { success: false, error: ledgerError?.message || 'Failed to write release to ledger' };
  }
  return {
    success: true,
    releaseId: ledgerRow.id,
    transactionHash: chainTxHash ?? (ledgerRow as { transaction_hash?: string }).transaction_hash,
  };
}

export async function sovrynAuditRequest(): Promise<SovrynAuditResult> {
  const architectResult = await getArchitectFromCitizens();
  if (!architectResult.success || !architectResult.architect) {
    return { success: false, error: architectResult.error || 'Architect not found' };
  }
  const architect = architectResult.architect;
  const shouldAssumeControl =
    architect.is_vitalized === true && (architect.minting_status === null || architect.minting_status === '');
  if (!shouldAssumeControl) {
    return {
      success: true,
      assumedControl: false,
      architectUid: architect.uid,
      mintingStatus: architect.minting_status ?? undefined,
      error: architect.minting_status != null ? `Minting already: ${architect.minting_status}` : 'Architect not vitalized',
    };
  }
  const vaultAddress = architect.vault_address || process.env.ARCHITECT_VAULT_ADDRESS || architect.uid;
  const countryCode = await getCitizenNationality(supabase, architect.uid, {
    defaultCountryCode: process.env.SPOKE_COUNTRY_CODE || 'NG',
  });
  const releaseResult = await releaseVidaCap(architect.uid, vaultAddress, countryCode);
  if (!releaseResult.success) {
    return { success: false, assumedControl: true, architectUid: architect.uid, error: releaseResult.error };
  }
  const { error: updateError } = await supabase
    .from('citizens')
    .update({ minting_status: 'COMPLETED', updated_at: new Date().toISOString() })
    .eq('uid', architect.uid);
  if (updateError) {
    return {
      success: true,
      assumedControl: true,
      architectUid: architect.uid,
      releaseId: releaseResult.releaseId,
      mintingStatus: 'COMPLETED',
      error: `Release ok but status update failed: ${updateError.message}`,
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
  results: Array<{ uid: string; success: boolean; releaseId?: string; error?: string }>;
  error?: string;
}

export async function sovrynAuditRequestForAll(options?: {
  requestHeaders?: Record<string, string | undefined>;
  countryCodeOverride?: string;
}): Promise<AuditAllResult> {
  const { data: rows, error: fetchError } = await supabase
    .from('citizens')
    .select('id, uid, vault_address, is_vitalized, minting_status')
    .eq('is_vitalized', true)
    .is('minting_status', null);

  if (fetchError) {
    return { success: false, processed: 0, succeeded: 0, failed: 0, results: [], error: fetchError.message };
  }

  const list = (rows || []) as VitalizedCitizenRow[];
  const results: AuditAllResult['results'] = [];
  let succeeded = 0;
  let failed = 0;
  const requestHeaders = options?.requestHeaders ?? {};
  const countryCodeOverride = options?.countryCodeOverride?.trim().toUpperCase().slice(0, 2);

  for (const row of list) {
    const vaultAddress = row.vault_address || process.env.ARCHITECT_VAULT_ADDRESS || row.uid;
    const countryCode =
      countryCodeOverride ??
      (await getCitizenNationality(supabase, row.uid, {
        requestHeaders,
        defaultCountryCode: process.env.SPOKE_COUNTRY_CODE || 'NG',
      }));
    const releaseResult = await releaseVidaCap(row.uid, vaultAddress, countryCode);

    if (releaseResult.success) {
      const { error: updateError } = await supabase
        .from('citizens')
        .update({ minting_status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('uid', row.uid);
      if (updateError) {
        results.push({ uid: row.uid, success: false, error: `Status update failed: ${updateError.message}` });
        failed += 1;
      } else {
        results.push({ uid: row.uid, success: true, releaseId: releaseResult.releaseId });
        succeeded += 1;
      }
    } else {
      results.push({ uid: row.uid, success: false, error: releaseResult.error });
      failed += 1;
    }
  }

  return { success: failed === 0, processed: list.length, succeeded, failed, results };
}
