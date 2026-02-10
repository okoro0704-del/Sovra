/**
 * Multi-National Reserves: vault address by country_code (national_reserves table).
 */

import { SupabaseClient } from '@supabase/supabase-js';

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

  if (!error && data?.vault_address) return data.vault_address;

  if (code === 'NG') {
    return process.env.NIGERIA_NATIONAL_BLOCK_ADDRESS || process.env.NATIONAL_ESCROW_ADDRESS || '0xNIGERIA_BLOCK_PLACEHOLDER';
  }
  return process.env.NATIONAL_ESCROW_ADDRESS || `0xNATIONAL_${code}_PLACEHOLDER`;
}
