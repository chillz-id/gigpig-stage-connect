# Documentation Index

This guide highlights where to find working reference material after the repository cleanup.

## Active References
- `README.md` – high-level orientation.
- `AGENTS.md` (root of repo) – contributor workflow overview.
- `docs/` – curated implementation guides that are still relevant to day-to-day development. Start with `docs/DOCUMENTATION_INDEX.md` inside that folder for domain deep dives.

## Archived Material
Legacy status reports, incident logs, and historical MCP walkthroughs now live under `docs/archive/`. Nothing in that directory is required for feature work, but it is preserved for context. Key examples:
- `docs/archive/CRITICAL_SYSTEM_STATE.md`
- `docs/archive/COMPLETE_MCP_STATUS_REPORT.md`
- `docs/archive/PRODUCTION_READINESS_MASTER_PLAN.md`

## Legacy Automation & Data
The following directories were consolidated under `legacy/` to keep the active workspace lean. They can be referenced if you need to retrace past fixes, but linting and builds ignore them.
- `legacy/analysis-results`
- `legacy/comprehensive-tracking`
- `legacy/debugging-sessions`
- `legacy/knowledge-graph-*`
- `legacy/test-results`
- `legacy/webhook-logs`

## Scripts
- `scripts/` – runnable utilities that remain part of the workflow (e.g., `kg-check.js`, sitemap helpers).
- `scripts/legacy/` – ad-hoc remediation scripts that caused lint noise. Keep for forensic use only.

## Tests
- `tests/` – maintained Jest suites (unit, smoke, invoice checks).
- `tests/legacy/` – exploratory/unused suites parked until they are either revived or deleted.

## Next Steps
1. Update any onboarding material that referenced the old root-level Markdown files to point at `docs/archive/`.
2. When reviving a legacy script or test, migrate it back into the active directory and bring it up to current standards before reenabling lint.
