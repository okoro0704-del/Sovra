# SOVRYN Spoke Template

This document describes how to duplicate the Nigeria API into **spokes/ghana**, **spokes/uk**, etc., while all call the same **Core SOVRYN Logic** in the hub.

## Core SOVRYN Logic (shared)

- **@sovrn/shared** (`global-hub/packages/shared`): `sovrynCore.ts`
  - `VIDA_TOTAL`, `VIDA_ARCHITECT`, `VIDA_NATIONAL_BLOCK`, `VIDA_FOUNDATION`
  - **Unified Foundation:** `getGlobalFoundationAddress()` — 1 VIDA always routes to the central Global Foundation Vault (env: `GLOBAL_FOUNDATION_VAULT` or `FOUNDATION_ADDRESS`), regardless of which Spoke the user joined through.

- **Spoke services** (each spoke implements or reuses):
  - `getCitizenNationality(supabase, citizenUid, { requestHeaders })` — IP geolocation or passport_hash / sovereign_identity.iso3166_code → `country_code`
  - `getNationalBlockAddress(supabase, countryCode)` — lookup `national_reserves` by `country_code`; 5 VIDA flow to that record.
  - `releaseVidaCap(citizenUid, architectVaultAddress, countryCode)` — uses shared constants and the above; writes to `sovryn_release_ledger` with `country_code` and `national_block_address`.

## Duplicating a Spoke (e.g. Ghana, UK)

1. **Copy spoke structure**
   - Copy `spokes/nigeria/apps/api` to `spokes/ghana/apps/api` (or equivalent).
   - Keep the same route layout: `POST /v1/sovryn/audit`, `POST /v1/sovryn/audit-all`, etc.

2. **Spoke-specific env**
   - `SPOKE_COUNTRY_CODE=GH` (or `GB`, etc.) — default when nationality cannot be determined.
   - Same Supabase (shared) or a spoke-specific DB; ensure `national_reserves` has a row for the spoke’s `country_code` (e.g. GH, GB) with the correct `vault_address`.

3. **Shared Supabase**
   - `national_reserves` table with `country_code` column — 5 VIDA flow to the record for the user’s detected country.
   - `citizens`, `sovereign_identity`, `sovryn_release_ledger` — shared or per-spoke as needed.
   - **Unified Foundation:** Do not override the 1 VIDA foundation address per spoke; use `GLOBAL_FOUNDATION_VAULT` / `FOUNDATION_ADDRESS` only.

4. **Routes**
   - Spoke routes (e.g. `sovryn.ts`) simply call the same Core SOVRYN Logic (e.g. `sovrynAuditRequest()`, `sovrynAuditRequestForAll({ requestHeaders: req.headers })`). No hardcoded country in the logic — nationality is dynamic via `get_citizen_nationality()`.

## Summary

| Concern | Where |
|--------|--------|
| Dynamic nationality | `getCitizenNationality()` — sovereign_identity.iso3166_code, metadata, IP (cf-ipcountry / x-country-override), else SPOKE_COUNTRY_CODE |
| Multi-national reserves | `national_reserves.country_code` → vault_address; 5 VIDA to that record |
| Unified Foundation | `getGlobalFoundationAddress()` — 1 VIDA always to central vault (GLOBAL_FOUNDATION_VAULT / FOUNDATION_ADDRESS) |
| Spoke template | Duplicate Nigeria API routes; same Core SOVRYN Logic; set SPOKE_COUNTRY_CODE and national_reserves row per country |
