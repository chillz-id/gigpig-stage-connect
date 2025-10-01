# N8N Credentials Cheat Sheet

## Quick Reference for Environment Variables

This cheat sheet shows exactly what to use for each service in N8N workflows.

### 🔥 Firecrawl API
**Environment Variable:** `FIRECRAWL_API_KEY`
**Location:** `/etc/standup-sydney/credentials.env` line 58
**N8N Usage:**
```
Header: Authorization
Value: Bearer {{ $env.FIRECRAWL_API_KEY }}
```

### 📝 Notion API
**Environment Variable:** `NOTION_API_KEY` or `NOTION_TOKEN` (both same value)
**Location:** `/etc/standup-sydney/credentials.env` lines 23-24
**N8N Usage:**
```
Header: Authorization
Value: Bearer {{ $env.NOTION_API_KEY }}
```

### 📧 Brevo (Email Service)
**Environment Variable:** `BREVO_API_KEY`
**Location:** `/etc/standup-sydney/credentials.env` line 73
**N8N Usage:**
```
Header: api-key
Value: {{ $env.BREVO_API_KEY }}
```
Note: Brevo uses `api-key` header, NOT `Authorization`

### 🎫 Humanitix
**Environment Variable:** `HUMANITIX_API_KEY`
**Location:** `/opt/standup-sydney-mcp/.env` line 65
**N8N Usage:**
```
Header: x-api-key
Value: {{ $env.HUMANITIX_API_KEY }}
```
Note: Humanitix uses `x-api-key` header, NOT `Authorization`

### 🤖 N8N API (for managing N8N itself)
**Environment Variable:** `N8N_API_KEY`
**Location:** `/etc/standup-sydney/credentials.env` line 48
**N8N Usage:**
```
Header: X-N8N-API-KEY
Value: {{ $env.N8N_API_KEY }}
```

### 📊 Metricool
**Environment Variable:** `METRICOOL_USER_TOKEN` or `METRICOOL_API_KEY`
**Location:** `/etc/standup-sydney/credentials.env` lines 14-15
**N8N Usage:**
```
Header: Authorization
Value: Bearer {{ $env.METRICOOL_USER_TOKEN }}
```

### 🔍 Apify
**Environment Variable:** `APIFY_TOKEN` or `APIFY_API_TOKEN`
**Location:** `/etc/standup-sydney/credentials.env` lines 54-55
**N8N Usage:**
```
Header: Authorization
Value: Bearer {{ $env.APIFY_TOKEN }}
```

### 💰 Xero (Accounting)
**Environment Variables:** `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET`
**Location:** `/etc/standup-sydney/credentials.env` lines 34-35
**N8N Usage:** OAuth2 configuration (not simple header auth)

### 💬 Slack
**Environment Variable:** `SLACK_BOT_TOKEN`
**Location:** `/etc/standup-sydney/credentials.env` line 29
**N8N Usage:**
```
Header: Authorization
Value: Bearer {{ $env.SLACK_BOT_TOKEN }}
```

### 🐙 GitHub
**Environment Variable:** `GITHUB_TOKEN` or `GITHUB_PERSONAL_ACCESS_TOKEN`
**Location:** `/etc/standup-sydney/credentials.env` lines 19-20
**N8N Usage:**
```
Header: Authorization
Value: Bearer {{ $env.GITHUB_TOKEN }}
```

### 🤖 OpenAI
**Environment Variable:** `OPENAI_API_KEY`
**Location:** `/etc/standup-sydney/credentials.env` line 39
**N8N Usage:**
```
Header: Authorization
Value: Bearer {{ $env.OPENAI_API_KEY }}
```

### 🧠 Anthropic (Claude)
**Environment Variable:** `ANTHROPIC_API_KEY`
**Location:** `/etc/standup-sydney/credentials.env` line 45
**N8N Usage:**
```
Header: x-api-key
Value: {{ $env.ANTHROPIC_API_KEY }}
```
Note: Anthropic uses `x-api-key` header, NOT `Authorization`

### 🔍 Perplexity
**Environment Variable:** `PERPLEXITY_API_KEY`
**Location:** `/etc/standup-sydney/credentials.env` line 42
**N8N Usage:**
```
Header: Authorization
Value: Bearer {{ $env.PERPLEXITY_API_KEY }}
```

## Important Notes

### Environment Variable Loading
1. **Primary Source:** `/etc/standup-sydney/credentials.env` (master file)
2. **Auto-synced to:** `/opt/standup-sydney-mcp/.env` via sync script
3. **Docker containers:** May need restart to pick up new env vars

### Common Header Patterns
- **Most APIs:** `Authorization: Bearer <token>`
- **Brevo:** `api-key: <token>` (no Bearer prefix)
- **Anthropic:** `x-api-key: <token>` (no Bearer prefix)
- **N8N API:** `X-N8N-API-KEY: <token>` (no Bearer prefix)

### Direct Header Configuration (If Credentials Fail)
Due to 2025 N8N credential bugs, you may need to configure headers directly in HTTP Request nodes:

1. Open HTTP Request node
2. Scroll to "Headers" section
3. Add header with Name and Value from above
4. Save and test

### Testing Credentials
```bash
# Check if environment variable is loaded
docker exec n8n printenv | grep FIRECRAWL

# If not loaded, restart N8N container
docker restart n8n
```

## Quick Copy-Paste Templates

### Standard Bearer Token
```
Name: Authorization
Value: Bearer {{ $env.YOUR_API_KEY_HERE }}
```

### API Key Header
```
Name: api-key
Value: {{ $env.YOUR_API_KEY_HERE }}
```

### Custom Header
```
Name: x-api-key
Value: {{ $env.YOUR_API_KEY_HERE }}
```

---
Last Updated: 2025-08-22
Reference: `/etc/standup-sydney/credentials.env` is the master source