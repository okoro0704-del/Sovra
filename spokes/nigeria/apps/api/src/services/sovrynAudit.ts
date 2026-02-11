/**
 * SOVRYN Listener - Force Audit & Minting Release (Core SOVRYN Logic)
 * Dynamic Nationality: get_citizen_nationality() uses IP or passport_hash to determine National Block.
 * Multi-National Reserves: 5 VIDA flow to national_reserves record for the user's country_code.
 * Unified Foundation: 1 VIDA always routes to central Global Foundation Vault (any Spoke).
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
 * Release 11 VIDA: 5 to Architect, 5 to National Block (by country_code), 1 to Global Foundation.
 * Uses national_reserves.country_code for the 5 VIDA; Foundation always from getGlobalFoundationAddress().
 */
export async function releaseVidaCap(
  citizenUid: string,
  architectVaultAddress: string,
  countryCode: string
): Promise<ReleaseVidaCapResult> {
  const nationalBlockAddress = await getNationalBlockAddress(supabase, countryCode);
  const foundationAddress = getGlobalFoundationAddress();

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

  const countryCode = await getCitizenNationality(supabase, architect.uid, {
    defaultCountryCode: process.env.SPOKE_COUNTRY_CODE || 'NG',
  });
  const releaseResult = await releaseVidaCap(architect.uid, vaultAddress, countryCode);

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

/**
 * Get citizen by citizen_hash (from Supabase webhook) or citizen_uid.
 * Tries: 1) citizens.uid = citizen_uid or citizen_hash, 2) sovereign_identity.face_hash = citizen_hash then citizen by sovereign_identity_id.
 */
export async function getCitizenByHashOrUid(citizenHash?: string, citizenUid?: string): Promise<{
  success: boolean;
  citizen?: VitalizedCitizenRow & { id: string };
  error?: string;
}> {
  const uid = (citizenUid ?? citizenHash ?? '').trim();
  const hashForFace = (citizenHash ?? '').trim();

  if (!uid && !hashForFace) {
    return { success: false, error: 'Missing citizen_hash or citizen_uid in request body' };
  }

  if (uid) {
    const { data: byUid, error: e1 } = await supabase
      .from('citizens')
      .select('id, uid, vault_address, is_vitalized, minting_status')
      .eq('uid', uid)
      .maybeSingle();
    if (!e1 && byUid) {
      return { success: true, citizen: byUid as VitalizedCitizenRow & { id: string } };
    }
  }

  if (hashForFace) {
    const { data: si, error: e2 } = await supabase
      .from('sovereign_identity')
      .select('id')
      .eq('face_hash', hashForFace)
      .maybeSingle();
    if (!e2 && si) {
      const { data: civ, error: e3 } = await supabase
        .from('citizens')
        .select('id, uid, vault_address, is_vitalized, minting_status')
        .eq('sovereign_identity_id', si.id)
        .maybeSingle();
      if (!e3 && civ) {
        return { success: true, citizen: civ as VitalizedCitizenRow & { id: string } };
      }
    }
  }

  return { success: false, error: 'Citizen not found for given citizen_hash or citizen_uid' };
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
 * trigger 11 VIDA minting for each (with get_citizen_nationality for National Block), update minting_status to COMPLETED.
 */
export async function sovrynAuditRequestForAll(options?: {
  requestHeaders?: Record<string, string | undefined>;
  /** When set, use this country_code for every citizen (which National Block to credit). Defaults to user's detected location per citizen. */
  countryCodeOverride?: string;
}): Promise<AuditAllResult> {
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
  const requestHeaders = options?.requestHeaders ?? {};
  const countryCodeOverride = options?.countryCodeOverride?.trim().toUpperCase().slice(0, 2);

  for (const row of list) {
    const vaultAddress =
      row.vault_address ||
      process.env.ARCHITECT_VAULT_ADDRESS ||
      row.uid;

    const countryCode = countryCodeOverride ?? await getCitizenNationality(supabase, row.uid, {
      requestHeaders,
      defaultCountryCode: process.env.SPOKE_COUNTRY_CODE || 'NG',
    });
    const releaseResult = await releaseVidaCap(row.uid, vaultAddress, countryCode);

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

/** Result for single-citizen audit (webhook / PFF bridge). */
export interface SovrynAuditForCitizenResult {
  success: boolean;
  citizenUid?: string;
  releaseId?: string;
  transactionHash?: string;
  mintingStatus?: string;
  error?: string;
  /** Set when mint failed so PFF can show "Minting Retrying..." */
  code?: 'CITIZEN_NOT_FOUND' | 'CONDITIONS_NOT_MET' | 'MINTING_FAILED' | 'STATUS_UPDATE_FAILED';
}

/**
 * SOVRYN audit for one citizen (webhook from Supabase with citizen_hash).
 * 1. Resolve citizen by citizen_hash or citizen_uid.
 * 2. Confirm citizen exists, is_vitalized and minting_status is null.
 * 3. Call releaseVidaCap (11 VIDA: 5 User, 5 Nation, 1 Foundation).
 * 4. On success update citizens.minting_status = 'COMPLETED'.
 * Returns clear error + code so PFF can show "Minting Retrying..." on failure.
 */
export async function sovrynAuditRequestForCitizen(citizenHash?: string, citizenUid?: string): Promise<SovrynAuditForCitizenResult> {
  const lookup = await getCitizenByHashOrUid(citizenHash, citizenUid);
  if (!lookup.success || !lookup.citizen) {
    return {
      success: false,
      error: lookup.error || 'Citizen not found',
      code: 'CITIZEN_NOT_FOUND',
    };
  }

  const citizen = lookup.citizen;
  const shouldMint =
    citizen.is_vitalized === true &&
    (citizen.minting_status === null || citizen.minting_status === '');

  if (!shouldMint) {
    return {
      success: false,
      citizenUid: citizen.uid,
      mintingStatus: citizen.minting_status ?? undefined,
      error:
        citizen.minting_status != null
          ? `Minting already in state: ${citizen.minting_status}`
          : 'Citizen is not vitalized (is_vitalized must be true)',
      code: 'CONDITIONS_NOT_MET',
    };
  }

  const vaultAddress =
    citizen.vault_address ||
    process.env.ARCHITECT_VAULT_ADDRESS ||
    citizen.uid;

  const countryCode = await getCitizenNationality(supabase, citizen.uid, {
    defaultCountryCode: process.env.SPOKE_COUNTRY_CODE || 'NG',
  });
  const releaseResult = await releaseVidaCap(citizen.uid, vaultAddress, countryCode);

  if (!releaseResult.success) {
    return {
      success: false,
      citizenUid: citizen.uid,
      error: releaseResult.error || 'Chain or ledger mint failed',
      code: 'MINTING_FAILED',
    };
  }

  const { error: updateError } = await supabase
    .from('citizens')
    .update({
      minting_status: 'COMPLETED',
      updated_at: new Date().toISOString(),
    })
    .eq('uid', citizen.uid);

  if (updateError) {
    return {
      success: false,
      citizenUid: citizen.uid,
      releaseId: releaseResult.releaseId,
      transactionHash: releaseResult.transactionHash,
      mintingStatus: 'COMPLETED',
      error: `Mint succeeded but status update failed: ${updateError.message}`,
      code: 'STATUS_UPDATE_FAILED',
    };
  }

  return {
    success: true,
    citizenUid: citizen.uid,
    releaseId: releaseResult.releaseId,
    transactionHash: releaseResult.transactionHash,
    mintingStatus: 'COMPLETED',
  };
}
