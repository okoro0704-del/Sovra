/**
 * Dynamic Nationality: determine country_code for National Block (IP / passport / metadata).
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface GetNationalityOptions {
  requestHeaders?: Record<string, string | undefined>;
  defaultCountryCode?: string;
}

const DEFAULT_COUNTRY = 'NG';

export async function getCitizenNationality(
  supabase: SupabaseClient,
  citizenUid: string,
  options: GetNationalityOptions = {}
): Promise<string> {
  const { requestHeaders = {}, defaultCountryCode } = options;
  const envDefault = process.env.SPOKE_COUNTRY_CODE || defaultCountryCode || DEFAULT_COUNTRY;

  const { data: citizen } = await supabase
    .from('citizens')
    .select('id, sovereign_identity_id, metadata')
    .eq('uid', citizenUid)
    .maybeSingle();

  if (citizen?.sovereign_identity_id) {
    const { data: si } = await supabase
      .from('sovereign_identity')
      .select('iso3166_code')
      .eq('id', citizen.sovereign_identity_id)
      .maybeSingle();
    if (si?.iso3166_code && si.iso3166_code.length >= 2) {
      return normalizeCountryCode(si.iso3166_code);
    }
  }

  const meta = citizen?.metadata as Record<string, unknown> | undefined;
  if (meta?.country_code && typeof meta.country_code === 'string') return normalizeCountryCode(meta.country_code);
  if (meta?.iso3166_code && typeof meta.iso3166_code === 'string') return normalizeCountryCode(meta.iso3166_code);

  const cfCountry = requestHeaders['cf-ipcountry'];
  if (cfCountry && cfCountry !== 'XX') return normalizeCountryCode(cfCountry);
  const override = requestHeaders['x-country-override'];
  if (override) return normalizeCountryCode(override);

  return envDefault;
}

function normalizeCountryCode(code: string): string {
  const s = code.trim().toUpperCase();
  return s.length === 2 ? s : s.slice(0, 2);
}
