# Media Library → Filestash Integration Plan
Created: 2025-11-25  
Status: In Progress (scaffold added)

## Current state
- UI: `/media-library` renders `MediaLibraryManager` (custom React) backed by:
  - Supabase Storage bucket `media-library`, paths: `{user.id}/{timestamp}-{name}`.
  - Tables: `media_files`, `media_folders` (+ RPCs: `toggle_epk_featured`, `set_profile_video`, `add_external_video`).
  - Features: folders, tags, headshot flags, EPK featured, profile video.
- Routes: profile/organization paths are explicit:
  - `/comedian/:slug`, `/manager/:slug`, `/photographer/:slug`, `/venue/:slug`, `/org/:slug` (comedian_lite shares `/comedian/:slug` with role gating).

## Target architecture
- Backend: keep Supabase Storage as source of truth; expose it via Filestash using a Supabase-aware connector.
- Scope mapping (aligned to routes):
  - Profiles: `profiles/comedian/{slug}/…`, `profiles/manager/{slug}/…`, `profiles/photographer/{slug}/…`, `profiles/venue/{slug}/…`
  - Orgs: `orgs/{org_slug}/…`
- Auth: App issues a short-lived Filestash session token encoding allowed scopes (profiles user owns + orgs where user has `file_manager` permission). Filestash never sees app JWT directly.
- Integration: self-host Filestash (Docker) behind same-origin reverse proxy; embed in a themed React page with scope selector; keep metadata (headshot/EPK/profile video) via sidecar APIs hitting existing RPCs.

## Components to build
1) **Storage bridge**: WebDAV-like or custom driver that talks to Supabase Storage (list/download/upload/delete) and enforces scoped prefixes.  
2) **Auth gateway**: exchanges app JWT → Filestash session token with allowed scopes; token consumed by bridge.  
3) **UI wrapper**: replace `/media-library` body with embedded Filestash plus scope selector; add side panel to toggle headshot/EPK/profile-video flags via existing RPCs.  
4) **Migration**: copy existing objects from `media-library/{user.id}/...` to new scoped prefixes; update `media_files.storage_path/public_url` accordingly.

## Migration mapping
- From: `media-library/{user.id}/...`
- To (examples):
  - Comedian: `media-library/profiles/comedian/{profile_slug}/...`
  - Manager: `media-library/profiles/manager/{profile_slug}/...`
  - Photographer: `media-library/profiles/photographer/{profile_slug}/...`
  - Venue: `media-library/profiles/venue/{profile_slug}/...`
  - Org: `media-library/orgs/{org_slug}/...`
- Also update DB: `media_files.storage_path`, `media_files.public_url` to reflect new paths.

## Steps to complete
1) Finish Supabase Storage bridge (see `filestash/custom-driver/supabase-storage.js` stub or implement WebDAV proxy) with scope enforcement.  
2) Implement auth gateway (small Node service) that validates app JWT, loads user profile/org scopes, and issues a short-lived token for the bridge.  
3) Update reverse proxy to expose Filestash same-origin.  
4) Build React wrapper for `/media-library`:
   - Scope selector (profiles + orgs with `file_manager` perm)
   - Embed Filestash (iframe or component) passing session token
   - Side panel for metadata toggles → existing RPCs  
5) Migrate existing files to scoped prefixes and update `media_files` rows.  
6) QA: upload/download/delete, headshot/EPK/profile-video toggles, org-scoped access, role denial.  
7) Remove legacy UI once new flow is verified; keep metadata tables.

## Status tracker
- Scaffold added:
  - `docker-compose.filestash.yml` (Filestash container)
  - `filestash/custom-driver/supabase-storage.js` (stub)
  - `filestash/README.md` (env + scope mapping)
- TODO: implement bridge, auth gateway, React wrapper, data migration, QA.
