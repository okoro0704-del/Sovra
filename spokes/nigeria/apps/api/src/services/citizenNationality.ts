/**
 * Dynamic Nationality: determine a citizen's National Block (country_code) via
 * sovereign_identity.iso3166_code, metadata/passport_hash-derived country, or IP geolocation.
 * Used by Core SOVRYN Logic so 5 VIDA flow to the correct national_reserves record.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface GetNationalityOptions {
  /** Request headers for IP/country (e.g. cf-ipcountry on Netlify, x-country-override for testing) */
  requestHeaders?: Record<string, string | undefined>;
  /** Fallback when no country can be determined (e.g. spoke default) */
  defaultCountryCode?: string;
}

const DEFAULT_COUNTRY = 'NG';

/**
 * get_citizen_nationality: returns ISO 3166-1 alpha-2 country_code for the citizen.
 * 1. sovereign_identity.iso3166_code (from passport/identity)
 * 2. citizen metadata.country_code
 * 3. IP geolocation: cf-ipcountry (Netlify), x-country-override (testing), or geo header
 * 4. SPOKE_COUNTRY_CODE env or default (e.g. NG)
 */
export async function getCitizenNationality(
  supabase: SupabaseClient,
  citizenUid: string,
  options: GetNationalityOptions = {}
): Promise<string> {
  const { requestHeaders = {}, defaultCountryCode } = options;
  const envDefault = process.env.SPOKE_COUNTRY_CODE || defaultCountryCode || DEFAULT_COUNTRY;

  // 1. From sovereign_identity (passport/identity binding)
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

  // 2. From citizen metadata (e.g. country_code or passport_hash-derived)
  const meta = citizen?.metadata as Record<string, unknown> | undefined;
  if (meta?.country_code && typeof meta.country_code === 'string') {
    return normalizeCountryCode(meta.country_code);
  }
  if (meta?.iso3166_code && typeof meta.iso3166_code === 'string') {
    return normalizeCountryCode(meta.iso3166_code);
  }

  // 3. IP geolocation / headers (Netlify: cf-ipcountry, or x-country-override for testing)
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
