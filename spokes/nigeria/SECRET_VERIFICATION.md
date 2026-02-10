# Secret Verification: Supabase Webhook ↔ Netlify

## Double-check: `x-sovryn-key` must match `SOVRYN_SECRET` exactly

1. **Netlify Environment Variables**  
   Set `SOVRYN_SECRET` to a strong secret (e.g. a long random string). This is the “Sovereign Secret”.

2. **Supabase Webhook**  
   When the webhook calls the SOVRYN audit endpoint (e.g. `POST /api/audit` on Netlify or `POST /v1/sovryn/audit-all` on the Nigeria API), it **must** send the request header:
   ```http
   x-sovryn-key: <exact value of SOVRYN_SECRET>
   ```
   Copy the **exact** value from Netlify’s `SOVRYN_SECRET` into the webhook’s `x-sovryn-key` header. No extra spaces or different casing.

3. **Verification**  
   - If the header is missing or different, the API returns `401` and the audit does not run.  
   - In Netlify logs you should see `SOVRYN AUDIT RECEIVED FROM SUPABASE` when the handshake is received and the secret is valid.

## Summary

| Where              | Variable / Header   | Must match        |
|--------------------|---------------------|-------------------|
| Netlify (env)      | `SOVRYN_SECRET`     | —                 |
| Supabase Webhook   | Header `x-sovryn-key` | `SOVRYN_SECRET` |

Keep `SOVRYN_SECRET` and the webhook’s `x-sovryn-key` in sync so cloud cross-talk stays secure.
