# Auth, Profiles, and Routing

## Overview
Supabase Auth provides user sessions; profile data and roles live in Postgres. React contexts keep the active profile and roles in sync and drive route resolution. Public profile URLs are slugs under `/{profileType}/{slug}/…` (e.g., `/comedian/anthony-skinner/dashboard`, `/org/id-comedy`).

## Data
- Tables: `profiles` (core user record), `user_roles` (member/comedian/comedian_lite/co_promoter/admin/photographer/videographer), `comedians`, `manager_profiles`, `organization_profiles`, `venues`, `photographers`, `slug_history` (301 redirect support), `requested_profiles` (404 tracking), `sidebar_preferences` (per-profile UI state).
- Slug rules: generated via slugify; unique per profile type; redirect support via `slug_history` trigger. See `docs/features/PROFILE_URLS.md` for reserved slugs and trigger details.
- RLS: policies on profile tables restrict write access to owners; admins read across profiles via `user_roles.role = 'admin'` checks.

## Frontend entry points
- `src/contexts/AuthContext.tsx` – session listener, role hydration, `hasRole/hasAnyRole`, co-promoter helper.
- `src/contexts/ProfileContext.tsx` – fetches profile list for authenticated user and wires to Active Profile.
- `src/contexts/ActiveProfileContext.tsx` – stores active profile (id/type/slug/name/avatar) in localStorage; `getProfileUrl(page)` maps organization → `/org/{slug}`.
- `src/components/ProtectedRoute.tsx` – blocks routes unless authenticated and optionally checks `requiredRole`.
- `src/components/profile/ProfileSwitcher.tsx` – UI for picking active profile; uses ProfileContext data.
- `src/pages/Auth.tsx`, `src/pages/AuthCallback.tsx` – email/password + OAuth entry, callback handling.
- `src/pages/ProfileManagement.tsx`, `src/pages/PublicProfile.tsx` – profile editing and public profile router (lazy-loads profile sections).

## Routing patterns
- Authenticated dashboard shell mounts at `/` with nested routes under profile paths.
- Profile URLs use `/{type}/{slug}/{page}`; `organization` is abbreviated to `/org`. Types currently routed: comedian, manager, photographer, organization, venue; comedian_lite piggybacks on comedian routes via role checks.
- Not-found profile attempts log into `requested_profiles` and prompt for Instagram handle for outreach.

## Dependencies & side-effects
- Slug changes write to `slug_history`; redirects handled server-side via Supabase edge function/Next middleware equivalent (check for usage before changing slug handling).
- Sidebar state persists per `(user_id, profile_type, profile_id)`; changing profile without clearing storage can leave stale UI state.
- Service worker caches `/src/pages/Profile.tsx` etc.; when adding lazy routes ensure Vite builds without dynamic import errors (see errors in user report when module failed to fetch).

## Known gaps / actions
- ActiveProfileContext types omit `comedian_lite`; role checks elsewhere include it. If adding dedicated comedian_lite routing, extend context type + URL helper.
- Feature toggles per organization (see 02-organization-and-permissions) are not enforced in routing yet.
- Keep PROFILE_URLS doc aligned when adding new profile types or reserved slugs.
