/**
 * Core SOVRYN Logic - Shared by all spokes (Nigeria, Ghana, UK, etc.)
 * Spokes import this and pass their Supabase client + config.
 * Unified Foundation: 1 VIDA always routes to central Global Foundation Vault.
 */

export const VIDA_TOTAL = 11;
export const VIDA_ARCHITECT = 5;
export const VIDA_NATIONAL_BLOCK = 5;
export const VIDA_FOUNDATION = 1;

/** Unified Foundation: 1 VIDA always routes to the central Global Foundation Vault, regardless of which Spoke the user joined through. */
export function getGlobalFoundationAddress(env: NodeJS.ProcessEnv = process.env): string {
  return env.GLOBAL_FOUNDATION_VAULT || env.FOUNDATION_ADDRESS || '0xFOUNDATION_PLACEHOLDER';
}

export interface ReleaseVidaCapParams {
  citizenUid: string;
  architectVaultAddress: string;
  countryCode?: string;
  nationalBlockAddress: string;
  foundationAddress: string;
}

/** ISO 3166-1 alpha-2 country code (e.g. NG, GH, GB). Used for National Block routing. */
export type CountryCode = string;
