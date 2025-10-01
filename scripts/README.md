# Active Scripts

The cleanup archived most one-off utilities to `scripts/legacy/`. The remaining scripts are intentionally kept because they are referenced by `package.json` or help with day-to-day workflows.

- `kg-check.js` – wraps the knowledge-graph maintenance commands (`npm run kg:*`).
- `test-webhooks.js` – triggers sample Humanitix/Eventbrite payloads.
- `verify-invoice-system.js` – quick invoice integrity check.
- `run-invoice-migration.sh` – Supabase migration wrapper used in CI/manual runs.
- `generate-sitemap.js`, `submit-sitemap.js`, `monitor-sitemap.js` – sitemap management pipeline.
- `get-sample-order.js` – fetches a recent order for debugging.
- `check-mcp-env.js` – verifies that all secrets required by `.mcp.json` are present.

If you need a script from `scripts/legacy/`, move it back here and make sure it passes `npm run lint` before relying on it.
