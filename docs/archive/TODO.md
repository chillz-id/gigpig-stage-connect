# Production Readiness Roadmap

## 0. Foundations
- [ ] Commit the repository re-structure (docs → `docs/archive`, `legacy/`, script moves) so the working tree is clean.
- [ ] Decide what to do with `legacy/` in version control (keep tracked vs. add to `.gitignore`).
- [x] Restore `WIX_APP_ID` or remove the Wix MCP block from `.mcp.json`.
- [ ] Archive or delete outdated assets sitting at `/root` (see `docs/ROOT_CLEANUP_PLAN.md`).

## 1. Codebase Hygiene
- [ ] Work through the remaining `react-hooks/exhaustive-deps` and `react-refresh/only-export-components` warnings (`npm run lint`).
- [ ] Replace `any` usage across services/hooks with real types (rule currently disabled to unblock lint; re-enable once addressed).
- [ ] Convert legacy `.js` helpers inside `src/` to TypeScript when possible (e.g. utils, services).
- [ ] Prune unused components/pages that still live under `src/` after the doc/scripts cleanup.

## 2. Testing & QA
- [ ] Reconfigure smoke tests to use Playwright (or install Chromium dependencies) so `npm run test:smoke` passes in CI.
- [ ] Audit Jest suites under `tests/legacy/`; migrate kept flows back into `tests/`.
- [ ] Add targeted unit tests for invoice, event, and notification services before launch.
- [ ] Stand up an automated regression pass (Jest + Playwright) in CI.

## 3. Build & Deploy
- [ ] Fix the Vite build OOM (`npm run build` exit 137) – investigate chunk splitting or run on higher-memory runner.
- [ ] Verify production env bundles (set `NODE_ENV=production` and boot the app against staging Supabase).
- [ ] Document droplet deployment steps (build, env sync, pm2/systemd config, rollback plan).

## 4. Integrations & Services
- [ ] Smoke test each MCP endpoint (`node scripts/check-mcp-env.js` + manual `npx` startup) and document usage quirks in `docs/mcp/`.
- [ ] Validate N8N workflows against the cleaned repository – ensure exported JSON matches what’s deployed.
- [ ] Harden Supabase migrations (`supabase/migrations` vs. archived SQL dumps) and remove obsolete `.sql` files left in `legacy/` once confirmed.
- [ ] Review Stripe/Xero credentials in `.env` backups and delete outdated ones after rotation.

## 5. Observability & Operations
- [ ] Wire up runtime logging/monitoring (Grafana dashboards, Sentry, etc.) with the cleaned code.
- [ ] Create an incident response checklist referencing the new file layout (`AGENTS.md`, `docs/`, `legacy/`).
- [ ] Schedule credential rotation cadence (document in `docs/security/` once created).

Use this checklist as a living doc—update as we clear items or discover new gaps on the path to production.
