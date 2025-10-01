# Root-Level Cleanup Plan

This inventory covers the files and directories that live at `/root` outside the `agents/` repo. It helps separate the pieces we must keep for the live platform from the leftovers that can be archived or deleted once confirmed.

## Keep (active services / tooling)
- `.n8n/` – production n8n instance data; leave untouched.
- `.pm2/` – process manager state for long-running services.
- `.npm/`, `.npm-global/`, `.npmrc` – global package cache; consider pruning with `npm cache clean --force` later but keep for now.
- `.local/`, `.cache/`, `.config/`, `.docker/`, `.ssh/`, `.mcp-auth/` – runtime caches and credentials.
- `.claude-multi-agent/`, `.cursor/`, `.cursor-server/`, `.codex/` – tooling currently in use on the droplet (CLI / editor integrations).
- `agents/` – cleaned project repo.
- `n8n-import-ready/`, `n8n-workflows-import.json`, `import-n8n-workflows.js` – keep until confirmed obsolete; they may back up deployed workflows.

## Candidate archive (move into `/root/legacy` once verified)
- Top-level documentation dumps: `AGENTS.md`, `API_DOCUMENTATION.md`, `CLAUDE_*.md`, `KNOWLEDGE_GRAPH_*.md`, `SECURITY_*.md`, etc. These duplicate materials archived inside `agents/`.
- One-off workflow exports: `comprehensive-humanitix-workflow*.json`, `fixed-humanitix-workflow*.json`, `all-workflows-ready-to-import.json`, `standup-sydney-dashboard.json`.
- Setup scripts no longer used (`setup-claudeui*.sh`, `deploy-claudeui*.sh`, `do-standupsydney-init.sh`, `sync-*.sh`, `manual-fix.sh`).
- MagicMic assets (`magicmic_reel_downloads/`, `magicmic_analysis_summary.md`, `magicmiccomedy_reels_results.json`).
- Taskmaster helpers (`announce-taskmaster.py`, `check_taskmaster.py`, `test-taskmaster.py`, `workflow-fix-summary.md`).
- Misc JSON/CSV snapshots (`ALL ORDERS HUMANITIX.xlsx`, `database-accuracy-monitor.json`, `top_5_reel_urls.txt`).
- BFG cleanup folder `agents.bfg-report/`.

## Candidate removal (delete after backup)
- Root-level `node_modules/`, `package.json`, `package-lock.json` – remnants of earlier experiments; not referenced by services.
- Temporary files: `temp.json`, `log-issue`, `log-solution`.
- `legacy_tmp/` – staging area created during cleanup; empty after archival move.

## Proposed next steps
1. Create a dedicated archive folder (e.g. `/root/legacy`) and move the “candidate archive” items there.
2. Back up or diff the archive vs. what is already in `agents/docs/archive/`; delete duplicates once confident they are stored in git.
3. Remove the “candidate removal” items once you confirm no scripts refer to them.
4. After the move, rerun `du -h --max-depth=1 /root` to confirm the root dir is mostly runtime state + the `agents/` repo.

This document is a starting checklist—update it as you verify whether any of the  archive candidates are still in use.
