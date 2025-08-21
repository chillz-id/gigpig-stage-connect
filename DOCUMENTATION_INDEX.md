# 📚 DOCUMENTATION INDEX - Stand Up Sydney Platform

**Purpose**: Categorized index of all documentation to prevent confusion and ensure quick access

## 🚀 START HERE (New Claude Code Sessions)

### Essential Reading Order
1. **`CLAUDE_CODE_QUICKSTART.md`** - Single entry point with everything needed
2. **`CRITICAL_SYSTEM_STATE.md`** - Current system status (100% ready)
3. **`/root/CLAUDE.md`** - Detailed project instructions
4. **`VERIFIED_DATABASE_SCHEMA.md`** - Actual database structure (no assumptions)

### Quick Reference
- **MCP Tools**: `MCP_TOOLS_DEFINITIVE_GUIDE.md` - Simple names, no prefixes
- **Startup Check**: `scripts/claude-startup-check.js` - Run first always

## 📋 BY CATEGORY

### 🔧 System Configuration & Setup
| File | Purpose | When to Use |
|------|---------|-------------|
| `CRITICAL_SYSTEM_STATE.md` | Current working state | Understanding what's configured |
| `MCP_TOKEN_REQUIREMENTS.md` | Complete MCP token guide | MCP issues or setup |
| `STARTUP_VERIFICATION_COMPLETE.md` | What's already done | Prevent redundant work |
| `ADDITIONAL_API_KEYS.md` | Extra credentials | Reference for tokens |
| `.mcp.json` | MCP server configuration | MCP server issues |

### 🎯 Development Guides
| File | Purpose | When to Use |
|------|---------|-------------|
| `CLAUDE_CODE_GUIDE.md` | Task implementation priorities | Feature development planning |
| `MCP_TOOLS_DEFINITIVE_GUIDE.md` | How to use MCP tools | When using database/GitHub/Slack tools |
| `VERIFIED_DATABASE_SCHEMA.md` | Actual DB structure | Before any database work |
| `DEVELOPER_ONBOARDING_GUIDE.md` | Development setup | New developer setup |

### 🤖 Agent System
| File | Purpose | When to Use |
|------|---------|-------------|
| `.claude-agents/README.md` | Unified agent system | Using Task tool with specialists |
| `.claude-agents/frontend-specialist.md` | React/UI expert | UI component work |
| `.claude-agents/backend-specialist.md` | API/hooks expert | Business logic implementation |
| `.claude-agents/database-administrator.md` | Schema expert | Database changes |
| `.claude-agents/testing-specialist.md` | QA expert | Test coverage and E2E |
| `.claude-agents/comedy-content-specialist.md` | Domain expert | Industry-specific features |

### 🧪 Testing & Quality
| File | Purpose | When to Use |
|------|---------|-------------|
| `COMPREHENSIVE_TEST_REPORT.md` | Test status overview | Understanding test coverage |
| `COMEDIAN_WORKFLOW_TEST_SUMMARY.md` | User workflow testing | E2E test planning |
| `TEST_RESULTS_SUMMARY.md` | Test outcomes | Quality assessment |
| `CLAUDE-TESTING.md` | Testing strategy | Test implementation |

### 📊 Implementation Status
| File | Purpose | When to Use |
|------|---------|-------------|
| `COMPLETE_MCP_STATUS_REPORT.md` | MCP implementation status | MCP functionality overview |
| `MISSING_RESOURCES_REPORT.md` | What still needs building | Gap analysis |
| `PRODUCTION_READINESS_MASTER_PLAN.md` | Production checklist | Release planning |
| `ENHANCEMENT_SUMMARY.md` | Feature improvements | Enhancement planning |

### 🏗️ Architecture & Design
| File | Purpose | When to Use |
|------|---------|-------------|
| `FRONTEND_ARCHITECTURE_MAP.md` | Frontend structure | Component organization |
| `WORKFLOW-DIAGRAMS.md` | System workflows | Understanding user flows |
| `MULTI-AGENT-SYSTEM.md` | Agent architecture | Multi-agent development |

### 🎪 Feature Implementation
| File | Purpose | When to Use |
|------|---------|-------------|
| `SPOT_CONFIRMATION_IMPLEMENTATION.md` | Spot assignment feature | Comedian booking system |
| `INVOICE_SYSTEM_ANALYSIS.md` | Financial system | Payment processing |
| `AGENCY_SYSTEM_IMPLEMENTATION.md` | Agency features | Talent management |
| `TICKET_SALES_INTEGRATION_SETUP.md` | Ticketing platform | Revenue tracking |

### 📝 Task-Specific Files
| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| `TASK_P1-*` | Priority 1 critical tasks | Blocking issues |
| `TASK_P2-*` | Priority 2 user experience | UX improvements |
| `TASK_P3-*` | Priority 3 business logic | Feature enhancements |
| `TASK_P4-*` | Priority 4 admin features | Dashboard improvements |
| `TASK_P5-*` | Priority 5 polish | Advanced features |

## 🔍 BY USE CASE

### "I'm starting a new Claude Code session"
1. `CLAUDE_CODE_QUICKSTART.md`
2. `CRITICAL_SYSTEM_STATE.md`
3. Run `scripts/claude-startup-check.js`

### "I need to use MCP tools"
1. `MCP_TOOLS_DEFINITIVE_GUIDE.md` - Simple names (list_tables, execute_sql)
2. `MCP_TOKEN_REQUIREMENTS.md` - If tools not accessible

### "I'm working with the database"
1. `VERIFIED_DATABASE_SCHEMA.md` - Actual structure
2. `database-administrator.md` - Use specialist agent

### "I'm implementing a specific task"
1. `CLAUDE_CODE_GUIDE.md` - Priority order
2. `TASK_P*-*` files for specific implementation details

### "I'm building UI components"
1. `frontend-specialist.md` - Use specialist agent
2. `FRONTEND_ARCHITECTURE_MAP.md` - Component structure

### "I need to understand what's already done"
1. `STARTUP_VERIFICATION_COMPLETE.md` - Setup status
2. `CRITICAL_SYSTEM_STATE.md` - Working components

## ⚠️ OBSOLETE/ARCHIVED FILES

### Files That Are Outdated
- Various old status reports from before August 2025
- Previous MCP setup attempts (superceded by working configuration)
- Old task files that don't reflect current priorities

### Still Valid but Historical
- Implementation summaries for completed features
- Test reports showing past results
- Architecture documentation (still accurate)

## 🎯 QUICK DECISION TREE

```
New session? → CLAUDE_CODE_QUICKSTART.md
Need MCP tools? → MCP_TOOLS_DEFINITIVE_GUIDE.md
Database work? → VERIFIED_DATABASE_SCHEMA.md
Feature development? → CLAUDE_CODE_GUIDE.md + TASK files
System issues? → CRITICAL_SYSTEM_STATE.md
Using agents? → .claude-agents/README.md
Testing? → testing-specialist.md
```

## 📌 KEY INSIGHTS

1. **Start with QUICKSTART** - It has everything for immediate productivity
2. **MCP tools use simple names** - No prefixes (except filesystem)
3. **Database schema is verified** - No assumptions, actual structure documented
4. **All setup is complete** - Focus on application features, not configuration
5. **5 specialist agents available** - Use Task tool for complex work

**Goal**: No more hunting through documentation. Every file has a clear purpose and use case.