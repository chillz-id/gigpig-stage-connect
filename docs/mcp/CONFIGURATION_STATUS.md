# MCP Configuration Status

This checklist captures which Model Context Protocol servers are configured and what secrets they require. Use `node scripts/check-mcp-env.js` (see below) to re-run the verification locally without leaking token values.

| MCP | Command / URL | Required secrets | Status |
| --- | ------------- | ---------------- | ------ |
| supabase | `npx -y @supabase/mcp-server-supabase@latest --project-ref=pdikjpfulhhpqpxzpgtu` | `SUPABASE_ACCESS_TOKEN` | ✅ present |
| github | `npx -y @modelcontextprotocol/server-github@latest` | `GITHUB_PERSONAL_ACCESS_TOKEN` | ✅ present |
| notion | `https://mcp.notion.com/mcp` | `NOTION_TOKEN` | ✅ present |
| slack | `npx -y @modelcontextprotocol/server-slack@latest` | `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` | ✅ present |
| metricool | `uvx --upgrade mcp-metricool` | `METRICOOL_USER_TOKEN`, `METRICOOL_USER_ID` | ✅ present |
| xero | `npx -y @xeroapi/xero-mcp-server@latest` | `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` | ✅ present |
| canva | `npx -y @canva/cli@latest mcp` | (none) | ✅ ready |
| context7 | `https://mcp.context7.com/mcp` | (API key baked into URL) | ✅ ready |
| filesystem | `npx -y @modelcontextprotocol/server-filesystem@latest` | (none) | ✅ ready |
| @magicuidesign/mcp | `npx -y @magicuidesign/mcp@latest start` | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | ✅ present |
| apify | `npx -y @apify/actor-mcp@latest` | `APIFY_TOKEN` | ✅ present |
| n8n | `npx -y @modelcontextprotocol/server-n8n@latest` | `N8N_API_KEY`, `N8N_API_URL` | ✅ present |
| linear | `npx -y @modelcontextprotocol/server-linear@latest` | `LINEAR_API_KEY` | ✅ present |
| brave-search | `npx -y @modelcontextprotocol/server-brave@latest` | `BRAVE_API_KEY` | ✅ present |
| task-master | `node scripts/taskmaster-orchestrator.js` | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | ✅ present |
| wix | `npx -y @wix/mcp-server@latest` | `WIX_API_KEY`, `WIX_APP_ID`, `WIX_SITE_ID` | ✅ present |

## Quick verification script

```bash
node scripts/check-mcp-env.js
```

The script reports a ✅/⚠️ summary so you can safely confirm tokens exist without printing them. Add any new variables there if you extend `.mcp.json`.

## Next actions

1. Populate `WIX_APP_ID` if the Wix MCP should be live; otherwise remove it from `.mcp.json` to avoid startup failures.
2. Add `scripts/check-mcp-env.js` to your workflow (e.g. `npm run mcp:check`) so contributors can validate tokens before invoking MCP-enabled agents.
3. When onboarding new services, copy the block above and document the required env vars here.
