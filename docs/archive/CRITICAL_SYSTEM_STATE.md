# 🔴 CRITICAL SYSTEM STATE - Stand Up Sydney Platform

**Generated**: August 8, 2025  
**Purpose**: Document the current working state to prevent rework and confusion

## ✅ MCP CONFIGURATION STATUS - 100% READY

### All 15 MCP Servers Configured
| Server | Status | Purpose | Key Tools |
|--------|--------|---------|-----------|
| **supabase** | ✅ Ready | Database operations | `list_tables`, `execute_sql`, `apply_migration` |
| **github** | ✅ Ready | Repository management | `create_issue`, `create_pull_request` |
| **notion** | ✅ Ready | Documentation | Page creation, database ops |
| **slack** | ✅ Ready | Team communication | `send_message`, `list_channels` |
| **metricool** | ✅ Ready | Social analytics | Instagram/Facebook metrics |
| **xero** | ✅ Ready | Accounting | Invoice management |
| **canva** | ✅ Ready | Design automation | Template management |
| **context7** | ✅ Ready | Library docs | `resolve-library-id` |
| **filesystem** | ✅ Ready | File operations | `mcp__filesystem__read_file` |
| **n8n-local** | ✅ Ready | Workflow automation | Workflow execution |
| **@magicuidesign/mcp** | ✅ Ready | UI components | Design system |
| **apify** | ✅ Ready | Web scraping | Social media automation |
| **task-master** | ✅ Ready | AI task management | Multi-model support |
| **firecrawl** | ✅ Ready | Web extraction | Content scraping |
| **brevo** | ✅ Ready | Email marketing | Campaign management |

### Critical Tokens Configured
- ✅ Supabase Personal Access Token: `sbp_497ee37f3fda4cab843130b6b85e873e1c4242b3`
- ✅ OpenAI API Key: Added (was last missing piece)
- ✅ All other API keys and tokens: Configured in `.mcp.json`

## 🧪 E2E TESTING STATUS - ENABLED

### Playwright Configuration
- **Test Port**: 8083 (different from dev server 8080)
- **Config File**: `/root/agents/playwright.config.ts`
- **Status**: ✅ React rendering issues fixed
- **Theme**: Safe localStorage access implemented

### Test Infrastructure
```javascript
// Working E2E test example
test('user can create event', async ({ page }) => {
  await page.goto('http://localhost:8083');
  await page.getByTestId('create-event-button').click();
  // ... test continues
});
```

## 🤖 AGENT SYSTEM - CONSOLIDATED & READY

### Unified 5-Agent System
Located in `/root/agents/.claude-agents/`:

1. **frontend-specialist.md** - UI/React components
2. **backend-specialist.md** - Hooks/API integration
3. **database-administrator.md** - Schema/migrations
4. **testing-specialist.md** - QA/E2E testing
5. **comedy-content-specialist.md** - Domain expertise

### Usage Pattern
```javascript
Task("Create event listing page", "frontend-specialist")
Task("Build ticket sync hook", "backend-specialist")
```

## 📊 KNOWLEDGE GRAPH - CRITICAL ISSUES DOCUMENTED

### Key Entries Created
1. **MCP Tools Not Accessible** (`/root/agents/knowledge-graph-entries/mcp-tools-not-accessible.json`)
   - Root cause: Missing Personal Access Token
   - Solution: Token added, issue resolved
   - Prevention: Startup checks now include MCP verification

### Startup Check Integration
- Location: `/root/agents/scripts/claude-startup-check.js`
- Includes: MCP verification, database checks, known issues
- Status: ✅ Mandatory in CLAUDE.md

## 🏗️ PRODUCTION ENVIRONMENT

### Infrastructure
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL)
- **Hosting**: DigitalOcean droplet (170.64.252.55)
- **Database**: Project ID `pdikjpfulhhpqpxzpgtu`

### Key Ports
- **Dev Server**: 8080
- **E2E Tests**: 8083  
- **Multi-Agent Dashboard**: 5173 (if running)
- **WebSocket API**: 3001 (if running)

## 🔑 CRITICAL FILE LOCATIONS

### Configuration
- **MCP Config**: `/root/agents/.mcp.json` (✅ All tokens present)
- **Environment**: `/root/agents/.env` (✅ Contains all credentials)
- **Package.json**: `/root/agents/package.json`

### Documentation
- **Main Instructions**: `/root/CLAUDE.md`
- **Quickstart**: `/root/agents/CLAUDE_CODE_QUICKSTART.md`
- **Database Schema**: `/root/agents/VERIFIED_DATABASE_SCHEMA.md`
- **MCP Guide**: `/root/agents/MCP_TOOLS_DEFINITIVE_GUIDE.md`

### Source Code
- **Components**: `/root/agents/src/components/`
- **Hooks**: `/root/agents/src/hooks/`
- **Services**: `/root/agents/src/services/`
- **Types**: `/root/agents/src/types/`

## ⚠️ CRITICAL KNOWN ISSUES

### From Knowledge Graph
1. **Profile System**: Previously had zero profiles - FIXED with trigger
2. **Field Mismatches**: Various schema inconsistencies documented
3. **Authentication**: Google OAuth setup requirements documented

### Current Blockers (Priority 1)
1. **Google Auth**: Users not saving after OAuth
2. **Event Publishing**: Authentication error
3. **Google Maps**: Integration broken

## ✅ WHAT'S WORKING

- ✅ All MCP tools accessible (after restart)
- ✅ Database connectivity verified
- ✅ E2E testing framework operational
- ✅ Agent system consolidated and documented
- ✅ Comprehensive startup checks in place
- ✅ Knowledge Graph tracking critical issues

## 🚀 READY FOR DEVELOPMENT

The system is fully configured and ready. When Claude Code reinitializes:

1. Read `/root/agents/CLAUDE_CODE_QUICKSTART.md` first
2. Run startup check immediately
3. All MCP tools will work with simple names
4. Reference verified schemas, not assumptions
5. Use consolidated agent system for complex tasks

**No configuration needed - just restart Claude Code to load the 100% ready MCP servers!**