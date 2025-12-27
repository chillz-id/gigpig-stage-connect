# Media Library (Filestash + Supabase Storage)

## Overview
Media handling is being moved to Filestash backed by Supabase Storage. React embeds fetch a signed Filestash session token from a Supabase Edge Function and load the Filestash UI inside the platform. Storage paths are scoped by profile/org to keep files separated.

## Data
- Bucket: `media-library` in Supabase Storage.
- Metadata tables: `media_files`, `media_folders` (legacy UI still references these for lists/links).
- Pathing (new): `profiles/{profile_type}/{slug}/…` and `orgs/{org_slug}/…` inferred from active profile/URL.

## Frontend entry points
- `src/pages/MediaLibrary.tsx` (user-level) and `src/pages/organization/OrganizationMediaLibrary.tsx` (org-level) now embed Filestash.
- `src/components/filestash/FilestashEmbed.tsx` – fetches token via Supabase functions, builds iframe URL from `VITE_FILESTASH_URL`, renders embedded UI.
- Legacy components: `src/components/MediaLibraryManager.tsx`, `src/hooks/organization/useOrganizationMedia.ts` still exist; replace with Filestash embed where needed.

## Backend / infra
- Supabase Edge Function: `supabase/functions/filestash-token/index.ts` issues 15m JWTs with scopes derived from routes (`/comedian/:slug`, `/manager/:slug`, `/photographer/:slug`, `/venue/:slug`, `/org/:slug`).
- Custom driver scaffold for Filestash: `filestash/custom-driver/supabase-storage.js` validates tokens and proxies list/read/write/remove to Supabase Storage.
- Docker: `docker-compose.filestash.yml` runs Filestash on port 8334. Configure to use the custom driver and forward the `token` param/header.
- Plan doc: `Plans/MediaLibrary-Filestash-Integration-20251125.md` tracks decisions and remaining steps.

## Required secrets/config
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=media-library` set via `supabase secrets` and used by the edge function.
- Filestash: `FILESTASH_SESSION_SECRET` (strong secret) passed to container; `VITE_FILESTASH_URL` in app env pointing at reverse-proxied Filestash (e.g., `https://gigpigs.app/filestash`).

## Flow
1) User opens media page → `FilestashEmbed` calls `supabase.functions.invoke('filestash-token')` to get signed token with scopes.
2) Embed loads Filestash iframe at `VITE_FILESTASH_URL/?token=...` → custom driver validates token and scopes requests to the correct storage prefix.
3) Files read/write/delete go straight to Supabase Storage; public URLs can be derived via signed URLs or Storage public setting.

## Known gaps / actions
- Replace remaining legacy media UIs (org media page) with the embed once Filestash is reachable.
- Migrate existing files from `media-library/{user.id}/…` to scoped prefixes and update `media_files.storage_path/public_url` accordingly.
- Configure reverse proxy (e.g., `/filestash` on gigpigs.app) and remove temporary `.env.filestash` once secrets are centralized.
