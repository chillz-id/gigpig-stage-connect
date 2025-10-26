# Stand Up Sydney 🎭

**Comedy Industry Platform** connecting comedians, promoters, venues, managers, and agencies.

## Quick Start

```bash
cd /root/agents
npm install
npm run dev  # Dev server on http://localhost:8080
```

See [CLAUDE.md](CLAUDE.md) for comprehensive developer documentation.

## Features

### Multi-Profile System
- Create multiple professional identities under one account
- Quick switching between comedian, promoter, manager, photographer roles
- Profile-specific dashboards and navigation
- See [MULTI_PROFILE_SYSTEM_README.md](MULTI_PROFILE_SYSTEM_README.md)

### Profile URLs
- Clean, user-friendly URLs for all profile types
- Format: `/{type}/{slug}/{page}` (e.g., `/comedian/chillz-skinner/dashboard`)
- 301 redirects when slugs change
- 404 tracking for recruitment insights
- Per-profile sidebar preferences
- See [docs/features/PROFILE_URLS.md](docs/features/PROFILE_URLS.md) for details

### Event Management
- Create and manage comedy shows
- Ticketing integration (Humanitix, Eventbrite)
- Booking workflow for comedian applications
- Venue and date coordination

### Booking System
- Comedian spot confirmation flow
- Promoter application review
- Invoice generation via Stripe
- Xero accounting integration

### CRM & Admin Tools
- Contact management for comedians, venues, promoters
- Task tracking and deal pipeline
- Media library for event photos
- Analytics dashboard

### PWA Support
- Installable progressive web app
- Offline support
- Push notifications
- Native app-like experience

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript (strict mode)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **State**: TanStack Query + React Context
- **Database**: Supabase (PostgreSQL + Auth + Realtime + RLS)
- **Payments**: Stripe
- **Accounting**: Xero
- **Testing**: Jest + Playwright
- **Deployment**: Vercel

## Project Structure

```
/root/agents/
├── src/
│   ├── pages/          # React Router pages (lazy loaded)
│   ├── components/     # Domain-organized UI components
│   │   ├── auth/
│   │   ├── events/
│   │   ├── comedian/
│   │   ├── promoter/
│   │   ├── profile/    # Profile URLs components
│   │   └── ui/         # shadcn/ui components
│   ├── contexts/       # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API integrations
│   ├── utils/          # Utility functions
│   └── integrations/
│       └── supabase/   # Supabase client + types
├── tests/
│   ├── e2e/            # Playwright E2E tests
│   └── *.test.ts       # Jest unit tests
├── docs/               # Feature documentation
│   └── features/
│       └── PROFILE_URLS.md
├── scripts/            # Operational utilities
├── Plans/              # Architectural decisions
└── supabase/
    └── migrations/     # Database migrations
```

## Development

**Core Commands:**
```bash
npm run dev              # Dev server (port 8080)
npm run build            # Production build
npm run lint             # ESLint + TypeScript checks
npm test                 # Jest unit tests
npm run test:e2e         # Playwright E2E tests
npm run test:coverage    # Coverage report
```

**Testing:**
```bash
npm run test:watch       # Watch mode
npm run test:smoke       # Smoke tests only
npm run test:e2e:headed  # E2E with browser visible
npm run test:e2e:ui      # E2E with UI mode
```

**Utilities:**
```bash
npm run kg:check         # Knowledge graph check
npm run sitemap:generate # Generate sitemap
npm run migrate:dry-run  # Test database migration
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Comprehensive developer guide (start here!)
- **[AGENTS.md](AGENTS.md)** - Git workflow and coding conventions
- **[MULTI_PROFILE_SYSTEM_README.md](MULTI_PROFILE_SYSTEM_README.md)** - Multi-profile feature guide
- **[docs/features/PROFILE_URLS.md](docs/features/PROFILE_URLS.md)** - Profile URLs & routing
- **Plans/** - Implementation plans and architectural decisions

## Contributing

1. Read [AGENTS.md](AGENTS.md) for git workflow and PR requirements
2. All work done from `/root/agents/` directory
3. Follow TypeScript strict mode (no implicit anys)
4. Use `@/` imports for shared modules
5. Run `npm run lint` before commits
6. Add tests for new features
7. Update documentation

**Pull Request Checklist:**
- [ ] Tests pass (`npm test` + `npm run test:e2e`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Migration tested (if database changes)
- [ ] Rollback plan documented
- [ ] PR template filled out

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-key
VITE_APP_URL=http://localhost:8080
```

See [CLAUDE.md](CLAUDE.md) for full environment variable documentation.

## Architecture Highlights

**Lazy Loading:**
- Eager: Index, Auth, AuthCallback (critical path)
- Lazy: All other pages (on-demand)
- Manual chunk splitting in vite.config.ts

**Query Strategy (TanStack Query):**
- Stale time: 5 minutes
- Cache time: 10 minutes
- Refetch on reconnect only
- Smart retry logic (no retry on 404)

**Type Safety:**
- Strict TypeScript config enabled
- Auto-generated Supabase types
- No implicit anys allowed
- Array access null-checked

**Multi-Role System:**
- Users can have multiple roles (comedian, promoter, manager, etc.)
- Route protection with `<ProtectedRoute roles={[...]} />`
- Per-profile state management
- Profile-specific navigation and URLs

## License

Proprietary - Stand Up Sydney Platform
