# Monorepo Structure

```
/root
  /apps
    /api            → Global API (universal endpoint); Netlify base = apps/api
  /packages
    /core-logic     → Shared: Minting, Face Audit, WebAuthn
    /contracts      → (existing)
    /pff-engine     → (existing)
  /spokes
    /global         → (optional) spokes/global/apps/api
    /nigeria        → Optional: Special rules for Nigeria
      /apps
        /admin-dashboard
        /api
        /pff-gateway
        ...
    /template       → (existing) Spoke template + SOVRYN_SPOKE_TEMPLATE.md
  /global-hub       → (existing) Chain, API, packages/shared
```

## Packages

| Package | Purpose |
|--------|--------|
| **packages/core-logic** | Shared Minting (VIDA constants, getGlobalFoundationAddress), Face Audit (face hash verification interface), WebAuthn (passkey interface). Used by spokes/global and spokes/nigeria. |
| packages/contracts | (existing) |
| packages/pff-engine | (existing) |

## Spokes

| Spoke | Purpose |
|-------|--------|
| **spokes/global** | The universal endpoint. **apps/api** is the single country-agnostic API; uses @sovrn/core-logic. |
| **spokes/nigeria** | Optional: Nigeria-specific rules (NDPR, NIMC, SPOKE_COUNTRY_CODE=NG, national_reserves). Same Core SOVRYN logic, plus local config and apps (admin-dashboard, pff-gateway). |
| spokes/template | Base for new spokes (e.g. Ghana, UK). |

## Workspaces (root package.json)

- `packages/*`
- `global-hub/packages/*`
- `spokes/*/apps/*`

## Quick start

- **Global API (Netlify base):** `cd apps/api && npm install && npm run dev` → http://localhost:3000/health. Set SOVRYN_SECRET and SUPABASE_URL (e.g. in Netlify env).
- **Nigeria API:** `cd spokes/nigeria && npm run dev:api`
- **Core logic:** `cd packages/core-logic && npm run build`
