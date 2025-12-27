# Repository Guidelines

## Project Structure & Module Organization
Core Vite + React TypeScript code sits in `src/`, with components, hooks, and styles colocated by feature. Shared assets live in `public/`, while `tailwind.config.ts` and `vite.config.ts` define global build and styling rules. Automation scripts belong in `scripts/` or the existing top-level utilities (`*.cjs`/`*.mjs`) so related tasks stay grouped. Tests land in `tests/`, and integration references such as `supabase/`, `docs/`, and gitignored `credentials/` document external systems.

## Build, Test, and Development Commands
- `npm run dev` – start the hot-reloading dev server on port 8080.
- `npm run build` / `npm run build:dev` – output production or dev bundles to `dist/`.
- `npm run preview` – serve the compiled bundle for smoke checks.
- `npm run lint` – apply the shared ESLint rules across TypeScript and React files.
- `npm run test` / `npm run test:unit` – execute the Jest suites.
- `npm run test:e2e` – run Playwright headless; add `:headed` for interactive runs.
- `npm run sitemap:generate` – example pattern for defining additional automation in `scripts/`.

## Coding Style & Naming Conventions
Build features in TypeScript (`.ts`/`.tsx`) with React function components. ESLint enforces 2-space indentation, single quotes, and trailing commas when supported. Keep Tailwind utilities in generator order. Components use PascalCase, hooks start with `use`, and shared utilities stay camelCase. Node helpers remain ES modules with descriptive filenames such as `check-profiles.mjs`.

## Testing Guidelines
Colocate focused unit tests (`Component.test.tsx`) with their sources and use `tests/` for cross-feature scenarios. Regenerate snapshots intentionally and run `npm run test:coverage` when touching core flows. Playwright fixtures belong in `tests/e2e`; document new suites in `README.md` or `docs/` so operators understand the coverage surface. Execute the relevant Jest set plus Playwright before merging workflow or API changes.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`). Keep commits scoped, and ship schema or migration scripts alongside dependent code. Pull requests should summarize intent, list verification commands (`npm run test`, `npm run test:e2e` as needed), and link to Linear or issue-tracker IDs. Provide UI screenshots and flag required environment or credential updates.

## Security & Configuration Tips
Keep secrets in `.env.local` or gitignored `credentials/`. Validate automation touching Humanitix, Notion, or n8n in staging first and respect documented rate limits.

## Profile URLs & Routing Development Notes

### Route Architecture
The app uses a **route-based architecture** with nested dynamic segments (`/:profileType/:slug/:page`). Static routes like `/dashboard`, `/shows`, `/comedians` must be declared **before** dynamic profile routes in `App.tsx` to ensure proper route matching priority.

### Working with Profile Routes

**Adding new profile pages:**
1. Add route to nested routes in profile routing section of `App.tsx`
2. Wrap with `<ProtectedRoute>` if page requires authentication
3. Use `useActiveProfile()` hook to access profile state and ownership status
4. Access profile data via `profileData` from context (no need for separate fetch)

**Testing profile routing:**
- Unit tests: `tests/utils/slugify.test.ts`, `tests/hooks/useSlugValidation.test.tsx`
- Context tests: `tests/contexts/ActiveProfileContext.test.tsx`
- E2E tests: `tests/e2e/profile-urls.spec.ts` (covers routing, 404s, profile switching)

**Common pitfalls:**
- Don't add static routes after dynamic `/:profileType/:slug` route (they'll never match)
- Always validate slug format before database checks using `validateSlug()` utility
- Check `isOwner` from `useActiveProfile()` before showing edit/delete actions
- Remember to exclude current profile ID when checking slug uniqueness during edits

### Database Considerations

**Profile tables with url_slug:**
- `comedians`, `managers`, `organizations`, `venues` all have `url_slug` column
- `url_slug` is UNIQUE and NOT NULL per table
- Use `generate_unique_slug()` PostgreSQL function for safe slug generation
- Reserved slugs enforced at application layer (see `RESERVED_SLUGS` in `src/utils/slugify.ts`)

**Slug history tracking:**
- When updating `url_slug`, call `record_slug_change()` to create `slug_history` entry
- Old URLs automatically redirect via 301 (preserves SEO value)
- Check `slug_history` before showing 404 to handle old URLs gracefully

**Requested profiles analytics:**
- 404s on profile routes trigger `record_profile_request()` PostgreSQL function
- Captures slug attempted, optional Instagram handle, requesting user ID
- Admins can query `requested_profiles` table for recruitment insights

### Per-Profile State Management

**Sidebar preferences:**
- Scoped to composite key: `(user_id, profile_type, profile_id)`
- Each profile maintains independent sidebar state (hidden items, custom order)
- Use `useSidebarPreferences()` hook with profile context for automatic scoping
- Legacy global preferences have NULL `profile_type` and `profile_id`

**Profile switching:**
- Use `ActiveProfileContext` for profile-aware navigation
- Profile switcher preserves current page context when switching (e.g., `/comedian/a/gigs` → `/manager/b/gigs`)
- Sidebar state automatically switches when profile changes

### ActiveProfileContext API

```typescript
const {
  profileType,        // 'comedian' | 'manager' | 'organization' | 'venue' | null
  slug,               // URL slug from params
  profileData,        // Full profile data (id, name, avatar_url, user_id, etc.)
  isOwner,            // true if current user owns this profile
  isLoading,          // loading state
  error,              // fetch error if any
  permissions,        // array of permission strings (future use)
  refreshProfile,     // manually refetch profile data
} = useActiveProfile();
```

**Important:** Always check `isLoading` and `error` before using `profileData` to avoid null reference errors.

### Migration Notes

**Backfilling slugs:**
- Existing profiles without `url_slug` auto-assigned during migration via `slugify(name)`
- Duplicates get numeric suffix: `john-doe`, `john-doe-2`, `john-doe-3`
- Users can customize slugs in profile settings

**Testing migrations:**
- Always test migrations locally with `npm run migrate:dry-run` first
- Verify uniqueness constraints don't block migration with duplicate names
- Check `generate_unique_slug()` function handles edge cases (empty names, special chars, etc.)
