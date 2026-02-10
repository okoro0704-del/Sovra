# Spoke: Global

**The universal endpoint** – single API for all spokes. Uses shared **@sovrn/core-logic** (Minting, Face Audit, WebAuthn).

## Structure

```
spokes/global
  apps/
    api   → The universal endpoint (country-agnostic)
```

## Apps

- **apps/api** – Express API; health and placeholder `/v1` until full route modules (sovryn, stats, registry) are added or proxied from a spoke.

## Relation to Nigeria

- **spokes/nigeria** is optional and adds special rules (e.g. NDPR, NIMC, SPOKE_COUNTRY_CODE=NG).
- This API can serve as the single public entry; Nigeria-specific logic can run in nigeria or be invoked by this API with config.

## Run

```bash
cd spokes/global && npm install && npm run dev:api
```

Health: `http://localhost:3001/health`
