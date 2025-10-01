# 🚀 Stand Up Sydney - Developer Onboarding Guide

**Welcome to the Stand Up Sydney comedy platform development team!**

## 🎯 Project Overview

**Stand Up Sydney** is a comprehensive comedy platform for event management, comedian bookings, and ticket sales integration.

### Core Features:
- **Event Management**: Promoters create comedy events with full management capabilities
- **Comedian Applications**: Comics apply for spots, get assigned, confirm participation
- **Ticket Integration**: Real-time sync with Humanitix & Eventbrite + manual entry for other platforms
- **Settlement System**: Track attendance, calculate payouts, generate invoices
- **Multi-Agent Development**: AI-powered development assistance with specialized agents

### Technology Stack:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + 50+ shadcn/ui components
- **Backend**: Supabase (PostgreSQL) with Row Level Security + Edge Functions
- **Authentication**: Supabase Auth with Google OAuth
- **Real-time**: WebSocket + Supabase subscriptions
- **Testing**: Jest + React Testing Library + Puppeteer E2E
- **AI Integration**: Claude Code with MCP (Model Context Protocol) for 13 external services

## 🏗️ System Architecture

### Production Environment:
- **Server**: DigitalOcean droplet at `170.64.252.55`
- **Frontend**: React app served on port `8080` (dynamic)
- **Database**: Supabase project `pdikjpfulhhpqpxzpgtu`
- **Multi-Agent System**: Ports `3001` (WebSocket), `3002` (Master API), `5173` (Dashboard)

### Key Directories:
```
/root/agents/                    # Main React application
├── src/
│   ├── components/             # 50+ UI components organized by domain
│   ├── hooks/                  # Custom React hooks for business logic
│   ├── services/               # API and business logic services
│   ├── types/                  # TypeScript definitions
│   └── pages/                  # Route components
├── supabase/migrations/        # Database migrations
├── tests/                      # Jest + React Testing Library tests
└── .mcp.json                  # MCP server configuration (13 integrations)

/root/.claude-multi-agent/      # AI development system
├── scripts/                    # Knowledge Graph and automation scripts
├── agents/                     # Individual AI agent directories
└── dashboard/                  # Monitoring UI
```

## 🔑 Access Setup

### 1. SSH Access
You'll need SSH access to the DigitalOcean droplet:
```bash
ssh root@170.64.252.55
```

### 2. Development Environment Setup
Once you have SSH access:

```bash
# Navigate to the frontend directory
cd /root/agents

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
# Server will start on dynamic port (usually 8080)

# Run tests
npm run test

# Build for production
npm run build
```

### 3. Database Access
- **Supabase Dashboard**: https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu
- **Direct SQL**: Use MCP tools or Supabase SQL editor
- **Migrations**: Located in `/root/agents/supabase/migrations/`

### 4. Multi-Agent System Access
```bash
# Access the AI development dashboard
http://170.64.252.55:5173

# WebSocket API for real-time agent communication
ws://170.64.252.55:3001

# Master orchestrator API
http://170.64.252.55:3002
```

## 🛠️ Development Workflow

### Daily Startup (MANDATORY):
```bash
# 1. Run mandatory verification (prevents catastrophic failures)
cd /root/agents && ./startup-verification.sh

# 2. Check Knowledge Graph for similar work/issues
node /root/.claude-multi-agent/scripts/claude-startup-check.js

# 3. Start development server
npm run dev
```

### Feature Development Pattern:
1. **Create Types**: Add TypeScript definitions in `/src/types/`
2. **Build Hooks**: Custom hooks in `/src/hooks/`
3. **Create Components**: UI components in `/src/components/[domain]/`
4. **Add Routes**: Update routing in `/src/App.tsx`
5. **Write Tests**: Add tests in `/tests/`
6. **Run Linting**: `npm run lint`

### Testing Strategy:
```bash
# Unit tests
npm run test

# E2E tests
npm run test:dev

# Specific test suites
npm run test:profile
npm run test:events
npm run test:webhook:humanitix

# Coverage reports
npm run test:coverage
```

## 🔧 Key Development Commands

```bash
# Frontend Development
npm run dev                     # Start dev server
npm run build                   # Production build
npm run preview                 # Preview build
npm run lint                    # ESLint

# Testing
npm run test                    # All tests
npm run test:watch             # Watch mode
npm run test:smoke             # Quick health check

# Database & Migrations
# Use MCP tools instead of direct Supabase CLI:
node -e "import('./scripts/apply-migration.js')"

# Knowledge Graph (AI System)
npm run kg:check               # Check for issues
npm run kg:issue               # Log new issue
npm run kg:solution            # Log successful fix
```

## 📊 Current System Status

### ✅ Completed Features:
- **Event Creation & Management**: Full CRUD with validation
- **Comedian Applications**: Apply, review, assign system
- **Ticket Sales Integration**: Humanitix & Eventbrite webhooks working
- **PWA Implementation**: Offline support, installable app
- **Multi-Agent System**: 3 specialized AI agents (Frontend, Backend, Testing)
- **Security System**: Row Level Security, authentication, CSRF protection

### 🚧 In Progress:
- **Settlement System**: Manual platform entry for Groupon, Promotix, etc.
- **Invoice Templates**: Customizable PDF generation
- **Spot Confirmation**: Comedian spot confirmation workflow

### 🔍 Architecture Highlights:

#### Hook-Based Architecture:
```typescript
// Business logic in custom hooks
export const useEventData = (eventId: string) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEvent(eventId),
    staleTime: 5 * 60 * 1000,
  });
  return { event: data, error, isLoading };
};
```

#### MCP Integration (13 Services):
- Supabase (28+ database tools)
- GitHub, Slack, Notion, Xero
- N8N workflow automation
- And 8 more integrated services

#### Security-First Design:
- Row Level Security on all tables
- Environment variable encryption
- CSRF protection utilities
- Comprehensive input validation with Zod

## ⚠️ Critical Guidelines

### MANDATORY Protocols (Prevents System Disasters):
1. **Always run startup verification** before any work
2. **Never assume database schema** - verify with actual queries
3. **Use MCP tools** instead of direct database access
4. **Follow existing patterns** - check similar components first
5. **Test thoroughly** - aim for 80%+ meaningful coverage

### Common Pitfalls to Avoid:
- ❌ Skipping startup verification (causes catastrophic failures)
- ❌ Making database schema assumptions
- ❌ Using wrong MCP tool naming (use simple names: `list_tables`)
- ❌ Creating duplicate functionality without checking existing code
- ❌ Committing without running tests and linting

### Code Style:
- **File Naming**: kebab-case for files, PascalCase for components
- **No Comments**: Unless explicitly requested (code should be self-documenting)
- **TypeScript**: Strict typing throughout
- **Testing**: Jest + React Testing Library patterns

## 🎓 Learning Resources

### Key Files to Read:
1. `/root/agents/CLAUDE.md` - Complete project documentation
2. `/root/agents/MCP_TOOLS_DEFINITIVE_GUIDE.md` - MCP integration guide
3. `/root/agents/VERIFIED_DATABASE_SCHEMA.md` - Actual database structure
4. `/root/agents/src/components/` - Component patterns and conventions

### Understanding the Codebase:
- **React Query**: Used for all API state management
- **Zustand**: Some local state management
- **React Hook Form + Zod**: Form handling and validation
- **Tailwind + shadcn/ui**: Styling system
- **Supabase**: Database, auth, real-time, storage

## 🚀 Getting Started Checklist

1. [ ] Get SSH access to `170.64.252.55`
2. [ ] Run startup verification: `./startup-verification.sh`
3. [ ] Start development server: `npm run dev`
4. [ ] Access development site at `http://170.64.252.55:8080`
5. [ ] Run test suite to ensure everything works: `npm run test`
6. [ ] Check AI dashboard: `http://170.64.252.55:5173`
7. [ ] Read `/root/agents/CLAUDE.md` completely
8. [ ] Try creating a simple component to understand the patterns

## 🆘 Getting Help

### When You're Stuck:
1. **Check Knowledge Graph**: `node claude-graph-integration.js find "your issue"`
2. **Ask AI Agents**: Use the multi-agent system for assistance
3. **Review Similar Code**: Find similar components/features
4. **Run Tests**: Often tests show how things are supposed to work

### Emergency Contacts:
- Check system logs: `sudo journalctl -f`
- Database issues: Check Supabase dashboard
- AI system issues: Check `http://170.64.252.55:5173`

## 🎯 Immediate Next Steps

Your first tasks could be:
1. **Explore the codebase** - understand the architecture
2. **Run the development server** and explore the UI
3. **Check the settlement system requirements** - this is the current priority
4. **Review the test suite** - understand how testing works
5. **Try the AI development tools** - see how the multi-agent system helps

Welcome to the team! The system is designed to prevent catastrophic failures through mandatory verification and AI assistance. Follow the protocols, and you'll have a smooth development experience.

---

**Remember**: This platform has sophisticated safeguards and AI assistance. Use them - they exist because past failures taught us their importance.