# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Setup (use --legacy-peer-deps due to @toast-ui/react-image-editor requiring React 17)
npm install --legacy-peer-deps

# Core workflow
npm run dev                           # Dev server (port 8080 via vite.config.ts)
npm run build                         # Production build (includes TypeScript checks)
npm run lint                          # ESLint + TypeScript (must pass before commits)

# Testing
npm run test                          # All Jest unit tests
npm run test -- path/to/file.test.ts  # Single test file
npm run test -- --testNamePattern="pattern"  # Filter by test name
npm run test:coverage                 # Coverage report

npm run test:e2e                      # Playwright E2E tests (headless)
npm run test:e2e:headed               # E2E with visible browser
npm run test:e2e:debug                # E2E with Playwright inspector

# Integration testing
npm run test:webhook:humanitix        # Test Humanitix webhook
npm run test:webhook:eventbrite       # Test Eventbrite webhook
npm run test:invoice                  # Invoice system verification

# Database migrations
npm run migrate:dry-run               # Test migration safely
npm run migrate:safe                  # Run safe migration
```

## Project Overview

**Stand Up Sydney** is a comedy industry platform connecting comedians, photographers, videographers, organizations, and venues. Core features: event management, booking workflows, ticketing integration (Humanitix, Eventbrite), invoice generation (Stripe, Xero), and multi-role user profiles.

## Architecture

### Tech Stack
- **Vite 7 + React 19 + TypeScript** with strict type checking
- **shadcn/ui + Radix UI** styled with Tailwind CSS
- **TanStack Query** for server state (5min stale, 10min cache)
- **React Hook Form + Zod** for forms and validation
- **Supabase** for database, auth, real-time, and RLS policies
- **Xero** for accounting integration
- **Vercel** for deployment

### Key Directories
```
src/
├── pages/          # React Router pages (lazy-loaded except Index, Auth, AuthCallback)
├── components/     # Domain-organized: auth/, events/, comedian/, photographer/, crm/, ui/
├── services/       # API integrations: Humanitix, Eventbrite, Stripe, Xero
├── hooks/          # Custom React hooks (organized by domain: crm/, events/)
├── contexts/       # AuthContext, UserContext, ProfileContext, ThemeContext
├── integrations/supabase/  # Client and auto-generated types
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
tests/              # Jest unit tests, E2E in tests/e2e/
scripts/            # Operational utilities (archive/ contains legacy scripts)
supabase/
├── migrations/     # Database migrations
└── functions/      # Edge Functions
```

### Context Provider Order (App.tsx)
```
ErrorBoundary → HelmetProvider → QueryClientProvider → ThemeProvider →
AuthProvider → UserProvider → DesignSystemInitializer → Router
```

### Route Priority (App.tsx)
1. Static routes first: `/dashboard`, `/shows`, `/comedians`, etc.
2. Dynamic profile routes: `/:profileType/:slug/*`
3. 404 catch-all: `*` handled by `NotFoundHandler`

**Important**: Static routes must be declared **before** dynamic `/:profileType/:slug` routes or they'll never match.

### Multi-Role System
Users can have multiple roles: Comedian, Photographer, Videographer, Manager, Organization, Admin.

**Profile URL pattern**: `/:profileType/:slug/:page` (e.g., `/comedian/chillz-skinner/dashboard`)

**Profile Types → Database Tables**:
- `comedian` → `comedians`, `manager` → `managers`
- `photographer` → `photographers`, `videographer` → `videographers`
- `organization` → `organizations`, `venue` → `venues`

Route protection: `<ProtectedRoute roles={['comedian', 'photographer']} />`

### Profile Context API
```typescript
const {
  profileType,     // 'comedian' | 'manager' | 'organization' | 'venue' | null
  slug,            // URL slug from params
  profileData,     // Full profile data (id, name, avatar_url, user_id, etc.)
  isOwner,         // true if current user owns this profile
  isLoading,
  error,
  refreshProfile,
} = useActiveProfile();
```

## TypeScript Configuration

Strict mode enabled in `tsconfig.json` (composite config):
- `strict: true`, `noImplicitAny: true`
- `strictNullChecks: true` - Null safety enforced
- `noUncheckedIndexedAccess: true` - Array access must be null-checked
- `exactOptionalPropertyTypes: true` - Strict optional properties
- `noUnusedLocals: true`, `noUnusedParameters: true`

Note: `tsconfig.app.json` relaxes some rules for build compatibility, but IDE tooling uses the strict composite config.

## Design System Rules

**CRITICAL - No outline variant**: The ESLint config enforces `design-system/no-outline-variant` as an error. Never use `variant="outline"` on Button components. Use `variant="secondary"` or `variant="ghost"` instead.

```tsx
// WRONG - will fail lint
<Button variant="outline">Click me</Button>

// CORRECT
<Button variant="secondary">Click me</Button>
<Button variant="ghost">Click me</Button>
```

## Coding Conventions

- **Imports**: Always use `@/` aliases (e.g., `@/components/ui/button`), never relative paths for shared modules
- **Components**: PascalCase filenames with named exports (`export function InvoicePanel()`)
- **Hooks/Services**: camelCase with descriptive prefixes (`useInvoiceSync`, `invoiceService`)
- **Indentation**: 2 spaces
- **Tailwind**: Order classes layout → spacing → color
- **Tests**: `.test.ts`/`.test.tsx` files colocated with their source
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`)

## Common Patterns

### Data Fetching (TanStack Query)
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => fetchResource(id),
});
```

### Form Handling (React Hook Form + Zod)
```typescript
const form = useForm<FormSchema>({
  resolver: zodResolver(schema),
  defaultValues: {...}
});
```

### Protected Routes
```tsx
<ProtectedRoute roles={['comedian', 'admin']}>
  <MyPage />
</ProtectedRoute>
```

### Sidebar Layout Pattern
The platform uses a fixed sidebar with explicit width calculations to prevent content overlap:

```tsx
// PlatformLayout.tsx - Main content width calculation
const sidebarWidth = state === 'collapsed' ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)';
<main style={{ width: `calc(100vw - ${sidebarWidth})` }}>
```

**Sidebar collapse behavior** (UnifiedSidebar.tsx):
- Use `group-data-[collapsible=icon]:hidden` on labels/badges/chevrons to hide when collapsed
- Use `shrink-0` on icons to prevent shrinking
- CSS variables: `--sidebar-width` (16rem), `--sidebar-width-icon` (3rem)

## Environment Configuration

Copy `.env.example` to `.env` with required variables:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_APP_URL` (defaults to `http://localhost:8080`)

Optional integrations: `RESEND_API_KEY`, `META_ACCESS_TOKEN` (see `.env.example`).

## Git Workflow

**PR Requirements** (see `.github/PULL_REQUEST_TEMPLATE.md`):
- Summary and Linear issue link (`Closes SUS-XXX`)
- Safety checklist (migrations tested, tests pass, lint passes)
- Rollback plan (required)
- Type of change and testing steps

**Pre-commit**: Run `npm run lint` and `npm run test`

### Atomic Commits (REQUIRED)

Each commit should be:
1. **Single-purpose** - One logical change per commit
2. **Self-contained** - Can be reverted independently without breaking other features
3. **Testable** - The fix can be verified in isolation

**DO NOT** bundle multiple unrelated fixes in one commit. If a commit message needs "and" to describe changes, split it.

```bash
# WRONG - bundled commit
git commit -m "fix: applications display, org profile state, and lineup drag-drop"

# CORRECT - atomic commits
git commit -m "fix(applications): fix session-based apps date parsing"
git commit -m "fix(org-profile): map location field to state column"
git commit -m "fix(lineup): implement drag-drop reorder mutation"
```

### Pre-Commit Verification Checklist

**Before committing any fix, verify it works with REAL production data:**

```bash
# 1. Run TypeScript check
npx tsc --noEmit

# 2. Run linter
npm run lint

# 3. CRITICAL: Query production data to verify the fix
# Use Supabase MCP to test with real data, not assumptions
```

**For data-dependent fixes, ALWAYS:**

1. **Query the actual data format** before writing parsing code
   ```sql
   -- Example: Check actual date format before writing parser
   SELECT start_date_local FROM sessions_htx LIMIT 5;
   -- Result: "2025-12-29 19:00:00" (space separator, NOT ISO "T")
   ```

2. **Simulate the fix with SQL** to verify it works
   ```sql
   -- Test the parsing logic against real data
   SELECT
     SPLIT_PART(start_date_local::text, ' ', 1) as parsed_date,
     SPLIT_PART(start_date_local::text, ' ', 2) as parsed_time
   FROM sessions_htx WHERE ...;
   ```

3. **Test in browser** after hot-reload before committing

**Common verification queries:**
```sql
-- Check if RLS allows access
SELECT * FROM table_name LIMIT 1;

-- Verify data format assumptions
SELECT column_name, pg_typeof(column_name) FROM table_name LIMIT 1;

-- Test join conditions
SELECT a.*, b.* FROM table_a a LEFT JOIN table_b b ON a.id = b.ref_id LIMIT 5;
```

### Post-Push Verification

After pushing, verify on deployed preview:
1. Clear browser cache (Ctrl+Shift+R)
2. Test the specific feature that was fixed
3. Check browser console for errors
4. If broken, revert immediately: `git revert HEAD && git push`

## Database Notes

**Supabase Types**: Auto-generated in `src/integrations/supabase/types/`. Regenerate via MCP if schema changes.

**Slug Management**:
- All profile tables have unique `url_slug` column
- Use `generate_unique_slug()` PostgreSQL function for safe generation
- `slug_history` table enables 301 redirects for changed slugs
- Reserved slugs enforced at application layer (`src/utils/slugify.ts`)

**Migrations**: Located in `supabase/migrations/`. Always test with `npm run migrate:dry-run` first.

## Key Code Locations

| Task | Location |
|------|----------|
| Main app entry | `src/App.tsx` |
| Authentication | `src/contexts/AuthContext.tsx` |
| Profile system | `src/contexts/ProfileContext.tsx` |
| Database types | `src/integrations/supabase/types/` |
| UI components | `src/components/ui/` (shadcn/ui) |
| Event management | `src/pages/EventManagement.tsx`, `src/components/event-management/` |
| Invoicing | `src/components/InvoiceForm.tsx`, `src/services/invoiceService.ts` |
| CRM | `src/components/crm/`, `src/pages/crm/`, `src/hooks/crm/` |
| Media library | `src/pages/MediaLibrary.tsx`, `src/components/media-library/` |

## Key Documentation

| File | Purpose |
|------|---------|
| `AGENTS.md` | Profile routing details and ActiveProfileContext API |
| `QUICK_REFERENCE.md` | Lineup & Deals component API reference |
| `docs/features/PROFILE_URLS.md` | Profile URL system documentation |
