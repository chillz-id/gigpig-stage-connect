# 🚀 CLAUDE CODE QUICKSTART - Stand Up Sydney Platform

**Last Updated**: August 8, 2025  
**System Status**: ✅ 100% Ready (All MCP servers configured)  
**Purpose**: Single entry point for Claude Code sessions - READ THIS FIRST!

## 🔴 MANDATORY FIRST ACTION

```bash
# Run this IMMEDIATELY when starting any Claude Code session:
node /root/agents/scripts/claude-startup-check.js
```

This checks:
- ✅ MCP configuration (15/15 servers ready)
- ✅ Database connectivity
- ✅ Critical system health
- ✅ Known issues from Knowledge Graph

## 📍 CRITICAL PATHS & LOCATIONS

### Working Directory Structure
```
/root/                          # Root directory
├── agents/                     # Main application (YOU ARE HERE)
│   ├── src/                   # React application source
│   ├── tests/                 # Test files
│   ├── public/                # Static assets
│   ├── .mcp.json             # MCP configuration (100% ready)
│   ├── .env                  # Environment variables
│   └── package.json          # Dependencies
├── CLAUDE.md                  # Project instructions
└── .claude-multi-agent/       # Multi-agent system (if exists)
```

### Key Configuration Files
- **MCP Config**: `/root/agents/.mcp.json` (All 15 servers configured)
- **Environment**: `/root/agents/.env` (Contains all tokens)
- **Database URL**: `https://pdikjpfulhhpqpxzpgtu.supabase.co`
- **Dev Server Port**: 8080 (default)
- **E2E Test Port**: 8083 (Playwright)

## 🎯 MCP TOOLS - HOW THEY ACTUALLY WORK

### ✅ CORRECT Usage (Simple Names)
```javascript
// Database operations
list_tables              // List all tables
execute_sql             // Run SQL queries
apply_migration         // Apply migrations

// GitHub operations  
create_issue            // Create GitHub issue
create_pull_request     // Create PR

// File operations
mcp__filesystem__read_file    // Read files
mcp__filesystem__write_file   // Write files
```

### ❌ WRONG (Do NOT Use)
```javascript
mcp__supabase__list_tables    // NO! Wrong prefix
supabase_list_tables          // NO! Wrong format
```

**KEY**: Most MCP tools use simple names. Only filesystem uses the prefix format.

## 🗄️ DATABASE PATTERNS - VERIFIED & WORKING

### Critical Facts
1. **NO `role` column in profiles table** - Roles are in separate `user_roles` table
2. **Use existing RLS patterns** - Copy from working migrations
3. **Profile trigger exists** - `handle_new_user` creates profiles automatically

### Correct Role Check Pattern
```sql
-- Check if user is admin
EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
)
```

## 🚨 COMMON PITFALLS & SOLUTIONS

### 1. "MCP tools not accessible"
**Cause**: Missing Personal Access Tokens  
**Solution**: Already fixed! All tokens configured. If issue persists, restart Claude Code.

### 2. "Database field doesn't exist"
**Cause**: Assuming schema structure  
**Solution**: Check `/root/agents/VERIFIED_DATABASE_SCHEMA.md` for actual structure

### 3. "Authentication Required" on event publish
**Cause**: Missing auth headers or RLS policy issue  
**Solution**: Check auth token is passed, verify RLS policies

### 4. "Profile not created after OAuth"
**Cause**: Missing database trigger  
**Solution**: Trigger already exists (`handle_new_user`), check if it's enabled

## 🤖 AGENT SYSTEM OVERVIEW

### Available Specialists (Use with Task tool)
1. **frontend-specialist** - React/UI components
2. **backend-specialist** - Hooks/API integration  
3. **database-administrator** - Schema/migrations
4. **testing-specialist** - Test coverage/E2E
5. **comedy-content-specialist** - Domain expertise

### Example Usage
```javascript
Task("Create responsive event card", "frontend-specialist")
Task("Build invoice generation hook", "backend-specialist")
Task("Add E2E tests for registration", "testing-specialist")
```

## ⚡ QUICK COMMAND REFERENCE

### Development
```bash
cd /root/agents
npm run dev                    # Start dev server (port 8080)
npm run build                  # Production build
npm run test                   # Run tests
npm run lint                   # Lint code
```

### Testing
```bash
npm run test:e2e              # Run E2E tests (Playwright)
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
```

### MCP Verification
```bash
node verify-mcp-ready.js      # Check MCP tokens
node /root/agents/scripts/claude-startup-check.js  # Full startup check
```

### Knowledge Graph (if available)
```bash
npm run kg:check              # Check for issues
npm run kg:issue              # Log new issue
npm run kg:solution           # Log solution
```

## 📋 CRITICAL DOCUMENTATION FILES

1. **MUST READ**:
   - `/root/CLAUDE.md` - Main project instructions
   - `/root/agents/VERIFIED_DATABASE_SCHEMA.md` - Actual DB structure
   - `/root/agents/MCP_TOOLS_DEFINITIVE_GUIDE.md` - How MCP tools work

2. **REFERENCE WHEN NEEDED**:
   - `/root/agents/MCP_TOKEN_REQUIREMENTS.md` - Token documentation
   - `/root/agents/CLAUDE_CODE_GUIDE.md` - Task implementation guide
   - `/root/agents/.claude-agents/README.md` - Agent system details

3. **TROUBLESHOOTING**:
   - `/root/agents/knowledge-graph-entries/mcp-tools-not-accessible.json`
   - `/root/agents/MCP_ROOT_CAUSE_ANALYSIS_AND_SOLUTION.md`

## 🎯 CURRENT PRIORITIES (From CLAUDE_CODE_GUIDE.md)

### Priority 1 (CRITICAL - Blocking)
1. **Google Auth** - Users not saving after OAuth
2. **Event Publishing** - Authentication error fix  
3. **Google Maps** - Integration broken

### Priority 2 (User Experience)
4. **Social Links** - @username conversion
5. **Media Upload** - Photo/video functionality
6. **Invoice System** - Consolidation needed

## ✅ SYSTEM READINESS CHECKLIST

- ✅ **MCP Servers**: 15/15 configured (100% ready)
- ✅ **Database**: Connected to Supabase project
- ✅ **E2E Testing**: Playwright configured on port 8083
- ✅ **Agent System**: 5 specialized agents ready
- ✅ **Knowledge Graph**: Critical issues documented
- ✅ **Startup Checks**: Include MCP verification
- ✅ **Documentation**: Comprehensive guides available

## 🚀 READY TO START!

1. Run the startup check (mandatory first action above)
2. Review any critical issues found
3. Use simple MCP tool names (not prefixed)
4. Reference VERIFIED_DATABASE_SCHEMA.md for DB work
5. Launch agents with Task tool for complex features

**No more "back and forth/fuck around" - everything you need is documented and ready!**