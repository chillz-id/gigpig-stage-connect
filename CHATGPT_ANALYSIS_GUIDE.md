# Stand Up Sydney Platform Analysis Guide for ChatGPT

## 🎯 Project Overview
Stand Up Sydney is a comprehensive comedy platform for event management, comedian bookings, and ticket sales integration. This guide will help you understand and analyze the complete platform architecture.

## 📍 Repository Information
- **Repository**: `gigpig-stage-connect` 
- **Technology Stack**: React 18 + TypeScript + Vite + Supabase + MCP
- **Current State**: Production-ready with recent Humanitix/Brevo integration
- **Lines of Code**: 12,275+ files, 1.1GB total
- **Last Major Update**: August 21, 2025

## 🚀 Start Your Analysis Here

### 1. Core Documentation Files (Read First)
```
/root/CLAUDE.md                          # Main project instructions and guidelines
/root/agents/VERIFIED_DATABASE_SCHEMA.md # Actual database structure (critical)
/root/agents/MCP_TOOLS_DEFINITIVE_GUIDE.md # MCP integration patterns
/root/agents/CLAUDE_CODE_QUICKSTART.md   # Quick start guide for development
/root/agents/CRITICAL_SYSTEM_STATE.md    # Current system status
```

### 2. Architecture Overview

#### Frontend (React 18 + TypeScript)
- **Location**: `/root/agents/src/`
- **Build Tool**: Vite with SWC compiler
- **UI Framework**: Tailwind CSS + 50+ shadcn/ui components
- **State Management**: React Context API + React Query v5
- **Key Features**:
  - Progressive Web App (PWA) with offline support
  - Real-time updates via Supabase subscriptions
  - Comprehensive form validation with React Hook Form + Zod

#### Backend (Supabase + MCP)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with Google OAuth
- **Storage**: Supabase Storage for media files
- **Edge Functions**: Serverless functions in `/supabase/functions/`
- **Project ID**: `pdikjpfulhhpqpxzpgtu`

#### Integrations (15 MCP Servers)
1. **Supabase** - Database operations (28+ tools)
2. **GitHub** - Repository management
3. **Slack** - Team communication
4. **Notion** - Documentation
5. **Xero** - Accounting integration
6. **N8N** - Workflow automation
7. **Metricool** - Social media analytics
8. **Canva** - Design automation
9. **Context7** - Library documentation
10. **Filesystem** - File operations
11. **Magic UI** - Design components
12. **Apify** - Web scraping
13. **Task Master** - AI task management
14. **Brevo** - Email marketing (17,958 subscribers)
15. **Humanitix/Eventbrite** - Ticketing platforms

## 🔍 Key Areas to Analyze

### 1. Recent Major Integration: Humanitix → Brevo
**Location**: `/root/agents/docs/n8n-workflows/`
- Automated customer sync from ticketing platforms to email marketing
- State mapping system for Australian customers
- N8N workflows for both Humanitix (polling) and Eventbrite (webhooks)
- Files:
  - `humanitix-to-brevo-sync-fixed.json`
  - `eventbrite-to-brevo-sync-fixed.json`
  - `/root/agents/src/utils/stateMapping.ts`

### 2. Database Schema
**Key Tables** (30+ total):
- `profiles` - User profiles with roles
- `events` - Comedy shows/events
- `applications` - Comedian applications
- `invoices` - Financial records
- `ticket_sales` - Ticket tracking
- `spot_assignments` - Event spot management
- `agencies` - Talent agency system

### 3. Component Architecture
```
src/components/
├── ui/                     # 50+ base components
├── admin/                  # Admin dashboard
├── comedian/               # Comedian features
├── events/                 # Event management
├── invoice/                # Financial features
├── spots/                  # Spot assignment
└── ticket-sales/           # Ticketing integration
```

### 4. Custom Hooks Library
**Location**: `/root/agents/src/hooks/`
- Authentication hooks
- Data fetching hooks with React Query
- Form management hooks
- Real-time subscription hooks

### 5. Testing Framework
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Puppeteer
- **Coverage**: Comprehensive test suites
- **Location**: `/root/agents/tests/`

## 🔴 Critical Issues & Solutions

### Historical Issues (Resolved)
1. **Profile System Disaster**
   - **Problem**: Zero profiles existed despite users being registered
   - **Cause**: Missing `handle_new_user` trigger
   - **Solution**: Created proper trigger and migration
   - **File**: `/root/agents/EMERGENCY_FIX.sql`

2. **Security Vulnerabilities (Fixed January 2025)**
   - Exposed API keys in Git
   - SQL injection vulnerabilities
   - File upload security issues
   - **Solution**: Complete security audit and fixes

### Current Priority Issues
1. **Google Auth** - Users not saving after OAuth
2. **Event Publishing** - Authentication error fix needed
3. **Invoice System** - Needs consolidation

## 📊 Performance & Optimization

### Build Optimization
- Manual code splitting for optimal loading
- Vendor bundles separation
- Tree shaking and minification
- Source maps for debugging

### Frontend Performance
- Lazy loading with React.lazy()
- React Query caching (5min stale time)
- Optimistic UI updates
- Image optimization components

## 🚦 Development Workflow

### Commands
```bash
cd /root/agents
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run test         # Run all tests
npm run lint         # ESLint
```

### Multi-Agent System
- **Location**: `/root/.claude-multi-agent/`
- Frontend Agent (branch: agent-1-frontend)
- Backend Agent (branch: agent-2-backend)
- Testing Agent (branch: agent-3-testing)
- Dashboard: http://localhost:5173

## 📈 Business Metrics

### Platform Statistics
- **Email Subscribers**: 17,958 (Brevo)
- **Ticketing Platforms**: Humanitix + Eventbrite
- **User Roles**: member, comedian, promoter, admin, photographer
- **Active Features**: Event management, spot assignments, invoicing, ticket sync

### Recent Achievements
- ✅ Complete Humanitix API integration
- ✅ Automated state mapping for customers
- ✅ N8N workflow automation
- ✅ PWA implementation with offline support
- ✅ 50+ shadcn/ui components integrated

## 🎯 Questions to Explore

1. **Architecture Analysis**
   - How can the component structure be optimized?
   - Are there opportunities for better code splitting?
   - Can the hook-based architecture be improved?

2. **Performance Review**
   - What are the current performance bottlenecks?
   - How can React Query caching be optimized?
   - Are there unnecessary re-renders?

3. **Integration Opportunities**
   - How can the MCP servers be better utilized?
   - What additional automations would benefit the platform?
   - Can the N8N workflows be optimized?

4. **Security Assessment**
   - Are all RLS policies properly configured?
   - Is the authentication flow secure?
   - Are there any exposed sensitive data?

5. **Scalability Planning**
   - How will the platform handle 10x growth?
   - What database optimizations are needed?
   - Should certain features be moved to edge functions?

## 📚 Additional Resources

### Documentation Files
- `/root/agents/docs/` - Integration documentation
- `/root/agents/DEVELOPER_ONBOARDING_GUIDE.md` - Developer guide
- `/root/agents/knowledge-graph-entries/` - Historical issues

### API Documentation
- `/root/HUMANITIXopenapi.yaml` - Humanitix API spec
- `/root/agents/docs/mcp/` - MCP server documentation

### Migration History
- `/root/agents/supabase/migrations/` - All database migrations
- `/root/agents/scripts/` - Migration scripts

## 🤝 How to Provide Best Analysis

1. **Start with the architecture** - Understand the overall system design
2. **Review recent changes** - Focus on Humanitix/Brevo integration
3. **Identify patterns** - Look for repeated code or architectural patterns
4. **Suggest improvements** - Based on modern React best practices
5. **Consider scalability** - Think about future growth needs
6. **Security first** - Always consider security implications

## 📞 Contact for Questions
This platform is actively maintained. Check git commit history for recent contributors and development patterns.

---

**Note**: This guide was prepared on August 21, 2025, specifically for ChatGPT analysis. The codebase is production-ready with all critical issues resolved and comprehensive documentation available.