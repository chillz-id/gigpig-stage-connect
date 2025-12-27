# Scripts Directory

This directory contains actively maintained utility scripts for the Stand Up Sydney platform.

## Active Scripts

### JavaScript Utilities (referenced by package.json)

| Script | Purpose | npm Command |
|--------|---------|-------------|
| `kg-check.js` | Knowledge-graph maintenance | `npm run kg:*` |
| `test-webhooks.js` | Trigger sample webhook payloads | `npm run test:webhooks` |
| `verify-invoice-system.js` | Invoice integrity check | `npm run test:invoice` |
| `generate-sitemap.js` | Generate sitemap | `npm run sitemap:generate` |
| `submit-sitemap.js` | Submit sitemap to search engines | `npm run sitemap:submit` |
| `monitor-sitemap.js` | Monitor sitemap status | `npm run sitemap:monitor` |
| `get-sample-order.js` | Fetch recent order for debugging | Direct execution |
| `check-mcp-env.js` | Verify MCP secrets are present | Direct execution |

### Shell Scripts (development workflow)

| Script | Purpose | Usage |
|--------|---------|-------|
| `run-invoice-migration.sh` | Supabase migration wrapper | `./scripts/run-invoice-migration.sh` |
| `regenerate-types.sh` | Generate TS types from Supabase | `./scripts/regenerate-types.sh` |
| `sync-env-vars.sh` | Synchronize environment variables | `./scripts/sync-env-vars.sh` |
| `replace-outline-variants.sh` | Replace component variants | `./scripts/replace-outline-variants.sh` |

### Root-Level Scripts

These scripts live in the repo root for easy access:

| Script | Purpose |
|--------|---------|
| `deploy-edge-functions.sh` | Deploy Supabase edge functions |
| `deploy-fixes.sh` | Quick deployment for hotfixes |
| `start-webhook-handler.sh` | Start webhook handler service |
| `test-core-flows.sh` | Test critical platform flows |

## Archive

The `archive/` subdirectory contains one-off scripts used for specific setup tasks or migrations. Retained for reference but not actively maintained.

Contents include:
- DNS setup scripts (`check-dns.sh`, `wait-for-*.sh`)
- One-time migration scripts (`migrate-imports.sh`)
- Infrastructure deployment scripts (outdated)
- Integration setup scripts

**Security Note:** `archive/setup-humanitix-notion-sync.sh` contains a hardcoded API key that should be rotated.

If you need a script from `archive/`, move it back here and ensure it passes `npm run lint` before use.
