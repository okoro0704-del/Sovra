/**
 * Multi-National Reserves: look up National Block vault address by country_code.
 * national_reserves table uses country_code column; 5 VIDA flow to the record for the user's country.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get the vault address for a country's National Block from national_reserves.
 * Falls back to env NIGERIA_NATIONAL_BLOCK_ADDRESS for NG or NATIONAL_ESCROW_ADDRESS.
 */
export async function getNationalBlockAddress(
  supabase: SupabaseClient,
  countryCode: string
): Promise<string> {
  const code = countryCode.trim().toUpperCase().slice(0, 2);
  const { data, error } = await supabase
    .from('national_reserves')
    .select('vault_address')
    .eq('country_code', code)
    .maybeSingle();

  if (!error && data?.vault_address) {
    return data.vault_address;
  }

  // Fallback: env per-country or generic
  if (code === 'NG') {
    return process.env.NIGERIA_NATIONAL_BLOCK_ADDRESS || process.env.NATIONAL_ESCROW_ADDRESS || '0xNIGERIA_BLOCK_PLACEHOLDER';
  }
  return process.env.NATIONAL_ESCROW_ADDRESS || `0xNATIONAL_${code}_PLACEHOLDER`;
}
