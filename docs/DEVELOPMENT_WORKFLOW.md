# Development Workflow

This document outlines the development workflow for the Stand Up Sydney platform.

---

## Quick Reference

```bash
# Start new feature
git checkout main && git pull origin main
git checkout -b feature/my-feature-name

# Commit (pre-commit hooks auto-run)
git add . && git commit -m "feat: description"

# Push for preview deployment
git push -u origin feature/my-feature-name

# Merge to production (after testing preview)
git checkout main && git merge feature/my-feature-name && git push
```

**Vercel auto-deploys:** Preview URL for branches, production for `main`.

---

## Pros & Cons of This Workflow

### Pros

| Benefit | Why It Matters |
|---------|----------------|
| **Preview deployments** | Test every branch on a real URL before merging |
| **Pre-commit hooks** | Catch lint errors before they reach CI |
| **Fast feedback** | No waiting for CI - errors caught locally |
| **Clean history** | Conventional commits make changes traceable |
| **Easy rollback** | Each feature is isolated; revert one commit if needed |
| **No broken main** | Main always deploys; branches catch issues first |

### Cons

| Drawback | Mitigation |
|----------|------------|
| **Branch proliferation** | Delete branches after merging (`git branch -d feature/x`) |
| **Preview URL confusion** | Check Vercel dashboard or GitHub PR for correct URL |
| **Pre-commit can slow commits** | Only runs on staged files; use `--no-verify` for WIP commits (sparingly) |
| **Merge conflicts** | Keep branches short-lived; merge main into feature regularly |
| **No staging environment** | Preview URLs serve as staging; add dedicated staging if needed later |

### When to Skip This Process

- **Typo fixes**: Can commit directly to main for single-character fixes
- **Emergency hotfixes**: Use `hotfix/*` branch, merge ASAP, then clean up
- **Documentation only**: `docs:` commits can go to main if no code changes

---

## Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production code (deployed to gigpigs.app) | Protected, requires PR |
| `feature/*` | New features | None |
| `fix/*` | Bug fixes | None |
| `hotfix/*` | Urgent production fixes | None |
| `cleanup/*` | Code organization/cleanup | None |

## Daily Workflow

### Starting New Work

```bash
# 1. Make sure you're on main and up to date
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/my-feature-name

# 3. Make your changes, commit often
git add .
git commit -m "feat: add new feature"

# 4. Push and create PR when ready
git push -u origin feature/my-feature-name
gh pr create
```

### Commit Messages (Conventional Commits)

Use these prefixes for clear, consistent commit history:

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feat:` | New feature | `feat: add event calendar view` |
| `fix:` | Bug fix | `fix: resolve login redirect issue` |
| `refactor:` | Code change (no behavior change) | `refactor: extract EventCard component` |
| `chore:` | Maintenance tasks | `chore: update dependencies` |
| `docs:` | Documentation only | `docs: add API documentation` |
| `style:` | Formatting, no code change | `style: fix indentation` |
| `test:` | Adding or updating tests | `test: add unit tests for auth` |

### Before Committing

Pre-commit hooks run automatically. To run manually:

```bash
# Run linting only
npm run lint

# Run full validation (lint + build + test)
npm run validate

# Run just tests
npm run test
```

### Pre-commit Hooks

The project uses Husky + lint-staged to automatically:
1. Run ESLint on all staged `.ts` and `.tsx` files
2. Auto-fix fixable issues

If the hook fails, fix the issues before committing.

## Deployment

### Vercel Integration

- **Production**: Auto-deploys from `main` branch to gigpigs.app
- **Preview**: Every branch/PR gets a preview URL automatically

### Deployment Commands

```bash
# Build locally to catch issues before pushing
npm run build

# Check Vercel deployment status
vercel list

# View deployment logs
vercel logs [deployment-url]
```

## Testing

### Unit Tests

```bash
npm run test                    # All tests
npm run test -- path/to/file    # Specific file
npm run test:coverage           # Coverage report
```

### E2E Tests (Playwright)

```bash
npm run test:e2e                # Headless
npm run test:e2e:headed         # With browser visible
npm run test:e2e:debug          # With Playwright inspector
```

## Code Quality Standards

### TypeScript

- Strict mode enabled
- No implicit any
- Null safety enforced
- Array access must be null-checked

### ESLint Rules

- No `variant="outline"` on buttons (use `variant="secondary"` instead)
- React hooks rules enforced
- No unused variables or imports

### File Organization

```
src/
├── pages/          # Route components (lazy-loaded)
├── components/     # Reusable components
│   ├── ui/         # shadcn/ui primitives
│   └── [domain]/   # Domain-specific components
├── hooks/          # Custom React hooks
├── services/       # API integrations
├── contexts/       # React contexts
├── types/          # TypeScript definitions
└── utils/          # Utility functions
```

## Common Issues

### Build Fails with "variant=outline" Error

Replace `variant="outline"` with `variant="secondary"` or `variant="ghost"`.

### Import Errors

Always use `@/` aliases:
```typescript
// Good
import { Button } from '@/components/ui/button';

// Bad
import { Button } from '../../../components/ui/button';
```

### React Load Order Issues

If you see `forwardRef undefined` or `createContext undefined` errors in production:
- Check `vite.config.ts` manual chunks configuration
- All vendor dependencies should be in a single chunk

## Getting Help

- Check `CLAUDE.md` for codebase overview
- Check `Architecture/00-QUICK-START.md` for key code locations
- Check `AGENTS.md` for git workflow details

## Environment Setup

```bash
# Copy environment file
cp .env.example .env.local

# Required variables
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
```
