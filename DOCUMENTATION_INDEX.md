# Documentation Index

This guide highlights where to find working reference material. Updated 2025-11-26.

## Canonical Documentation

### Core References
| File | Purpose |
|------|---------|
| `README.md` | Project overview and quick start |
| `CLAUDE.md` | Developer guide for Claude Code sessions |
| `AGENTS.md` | Git workflow and contributor guidelines |
| `QUICK_REFERENCE.md` | Development quick reference |

### Architecture Documentation (NEW)
| File | Purpose |
|------|---------|
| `Architecture/00-QUICK-START.md` | **Start here** - Agent onboarding guide |
| `Architecture/01-SYSTEM-MAP.md` | High-level architecture with diagrams |
| `Architecture/02-DIRECTORY-GUIDE.md` | Annotated directory tree |
| `Architecture/03-FEATURE-CONNECTIONS.md` | How features interact |
| `Architecture/04-DATABASE-OVERVIEW.md` | Schema and relationships |
| `Architecture/05-COMMON-PATTERNS.md` | Code patterns with examples |
| `Architecture/diagrams/` | Mermaid diagram source files |

### Feature Documentation
| Location | Contents |
|----------|----------|
| `docs/features/PLATFORM_FEATURES.md` | **Master feature inventory** (canonical) |
| `docs/features/PROFILE_URLS.md` | Profile URL system documentation |
| `Plans/` | Active implementation plans (dated) |
| `docs/plans/` | Event Management System plans |

### Integration Guides
| Location | Contents |
|----------|----------|
| `docs/eventbrite/` | Eventbrite integration |
| `docs/crm/` | CRM system documentation |
| `docs/migrations/` | Database migration guides |

## Archived Material

`docs/archive/` contains historical documents preserved for reference:
- Completion reports (`PHASE_*_COMPLETE.md`, `*_COMPLETE.md`)
- Component architecture snapshots
- Implementation status reports
- CRM phase completion docs

**Note:** Nothing in `docs/archive/` is required for feature work.

## Scripts

| Directory | Contents |
|-----------|----------|
| `scripts/` | Active utilities (see `scripts/README.md`) |
| `scripts/archive/` | One-off setup/migration scripts |

## Tests

| Directory | Contents |
|-----------|----------|
| `tests/` | Active Jest test suites |
| `tests/e2e/` | Playwright E2E tests |

## Data (gitignored)

| Directory | Contents |
|-----------|----------|
| `data/` | Local data exports (Eventbrite CSVs, reports) |

## Cleanup History

**2025-11-25**: Archived completion reports, one-off scripts, and legacy directories. See `Plans/Cleanup-Execution-Plan-20251124.md` for details.
