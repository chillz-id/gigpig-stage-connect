# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Working Directory

**All development work must be done from `/root/agents/`**. This is the git repository root containing the Vite + React TypeScript application.

```bash
cd /root/agents  # Always start here
```

The `/root/` directory contains N8N workflows, legacy scripts, and operational utilities that are **not part of active development**.

## Development Commands

```bash
cd /root/agents

# Core workflow
npm run dev                           # Dev server on port 8080
npm run build                         # Production build (includes TypeScript checks)
npm run build:dev                     # Development build
npm run lint                          # ESLint + TypeScript (must pass before commits)
npm run validate                      # Run lint + build + test together

# Testing - Unit
npm run test                          # All Jest unit tests
npm run test -- path/to/file.test.ts  # Single test file
npm run test -- --testNamePattern="pattern"  # Filter by test name
npm run test:watch                    # Watch mode (re-runs on file changes)
npm run test:coverage                 # Coverage report

# Testing - E2E (Playwright)
npm run test:e2e                      # Playwright E2E tests (headless)
npm run test:e2e:headed               # E2E with visible browser
npm run test:e2e:debug                # E2E with Playwright inspector
npm run test:e2e:ui                   # E2E with interactive UI mode
npm run test:e2e:auth                 # Auth-specific E2E tests

# Integration testing
npm run test:webhook:humanitix        # Test Humanitix webhook
npm run test:webhook:eventbrite       # Test Eventbrite webhook
npm run test:invoice                  # Invoice system verification

# Database
npm run migrate:dry-run               # Test migration safely
npm run migrate:safe                  # Run safe migration
```

## Project Overview

**Stand Up Sydney** is a comedy industry platform connecting comedians, photographers, videographers, organizations, and venues. Core features: event management, booking workflows, ticketing integration (Humanitix, Eventbrite), invoice generation (Stripe, Xero), and multi-role user profiles.

## Architecture

### Tech Stack
- **Vite + React 18 + TypeScript** with strict type checking
- **shadcn/ui + Radix UI** styled with Tailwind CSS
- **TanStack Query** for server state (5min stale, 10min cache)
- **React Hook Form + Zod** for forms and validation
- **Supabase** for database, auth, real-time, and RLS policies
- **Stripe** for payments; **Xero** for accounting
- **Vercel** for deployment

### Build Configuration
- **Dev server**: Port 8080 with HMR
- **Chunk strategy**: `vendor` (all node_modules), `mobile`, `pwa` (feature-specific)
- **Minification**: Terser with console/debugger removal in production
- **Source maps**: Enabled for production debugging

### Key Directories (within /root/agents/)
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
scripts/            # Operational utilities
supabase/
├── migrations/     # Database migrations
└── functions/      # Edge Functions
Architecture/       # System documentation
Plans/              # Implementation plans
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
  profileType,     // 'comedian' | 'manager' | 'photographer' | 'videographer' | 'organization' | 'venue' | null
  slug,            // URL slug from params
  profileData,     // Full profile data (id, name, avatar_url, user_id, etc.)
  isOwner,         // true if current user owns this profile
  isLoading,
  error,
  permissions,     // array of permission strings (future use)
  refreshProfile,
} = useActiveProfile();
```

**Important:** Always check `isLoading` and `error` before using `profileData` to avoid null reference errors.

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

**ESLint Ignore Patterns**: The following directories are excluded from linting:
- `dist/`, `legacy/**`, `docs/archive/**`, `scripts/**`, `tests/legacy/**`, `.worktrees/**`

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

## Environment Configuration

Copy `.env.example` to `.env.local` with required variables:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_APP_URL` (defaults to `http://localhost:8080`)

Optional integrations: `RESEND_API_KEY`, `META_ACCESS_TOKEN`, Filestash config (see `.env.example`).

## Git Workflow

**PR Requirements** (see `.github/PULL_REQUEST_TEMPLATE.md`):
- Summary and Linear issue link (`Closes SUS-XXX`)
- Safety checklist (migrations tested, tests pass, lint passes)
- Rollback plan (required)
- Type of change and testing steps

**Pre-commit**: Run `npm run lint` and `npm run test`

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

## Workflow & Agent Delegation

### Recommended Workflow

For non-trivial tasks, consider following this workflow:

1. **Brainstorm** - Use `superpowers:brainstorming` to refine the idea
2. **Plan** - Use `/plan <task>` to create a plan file
3. **Implement** - Write code following TDD where appropriate
4. **Review** - Use `superpowers:requesting-code-review` to verify
5. **Verify** - Use `/done` to run verification checklist

### Slash Commands

| Command | Purpose |
|---------|---------|
| `/plan <task>` | Create a new implementation plan |
| `/continue` | Resume the most recent active plan |
| `/status` | List all active plans and progress |
| `/frontend <task>` | Delegate to frontend-specialist agent |
| `/backend <task>` | Delegate to backend-specialist agent |
| `/n8n <task>` | Delegate to n8n-expert agent |
| `/test <task>` | Delegate to testing-specialist agent |
| `/done` | Run verification checklist before completion |

### Specialized Agents

Delegate domain-specific work to specialized agents:

| Agent | When to Use |
|-------|-------------|
| `frontend-specialist` | React components, styling, Tailwind, UI bugs |
| `backend-specialist` | APIs, hooks, Supabase queries, auth |
| `database-admin` | Migrations, schema changes, RLS policies |
| `testing-specialist` | Jest tests, Playwright E2E, coverage |
| `n8n-expert` | N8N workflow automation |
| `seo-specialist` | Meta tags, structured data, sitemaps |
| `marketing-specialist` | Landing pages, CTAs, conversion |
| `framer-specialist` | Framer components, CMS, design |

### Plan Files

All significant tasks should have a plan file:
- **Location**: `/root/agents/Plans/YYYY-MM-DD-<task>.md`
- **Template**: `/root/agents/Plans/TEMPLATE.md`
- **Update as you go**: Mark completed items, add notes
- **Reference in handoffs**: Always point agents to the plan

## Key Documentation

| File | Purpose |
|------|---------|
| `Architecture/00-QUICK-START.md` | Agent onboarding guide with code locations |
| `Architecture/01-SYSTEM-MAP.md` | High-level architecture diagrams |
| `AGENTS.md` | Git workflow and profile routing details |
| `QUICK_REFERENCE.md` | Lineup & Deals component API reference |
| `docs/features/PROFILE_URLS.md` | Profile URL system documentation |
| `Plans/TEMPLATE.md` | Plan file template |
