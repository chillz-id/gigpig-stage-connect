# Auth Gateway for Filestash (Supabase Storage)

Purpose: Exchange the app JWT for a short-lived Filestash session token that encodes allowed storage scopes (profile/org prefixes). The Filestash Supabase driver validates this token for every operation.

Flow:
1. User hits `/media-library` in the app.
2. App backend endpoint `/api/filestash/token`:
   - Validates app JWT (existing auth).
   - Loads allowed scopes (profiles owned + orgs with `file_manager` permission).
   - Issues a signed token: `{ scopes: [...], exp: now + 15m }` with `FILESTASH_SESSION_SECRET`.
3. UI passes `token` to Filestash (query/header). Driver calls `validateScope(token, path)` before touching storage.

Env:
```
FILESTASH_SESSION_SECRET=change-me
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Scope format (aligned to routes):
- Profiles: `profiles/comedian/{slug}`, `profiles/manager/{slug}`, `profiles/photographer/{slug}`, `profiles/venue/{slug}`
- Orgs: `orgs/{org_slug}`

Implement an endpoint in your app server (Express/Next API) that returns:
```json
{ "token": "<signed>", "expires_in": 900 }
```

Then embed Filestash with `?token=<signed>` or a custom header; ensure reverse proxy keeps it same-origin.

Example runnable gateway
- `filestash/auth-gateway/server.js` — minimal HTTP server issuing tokens via Supabase auth.getUser; run with env above.
