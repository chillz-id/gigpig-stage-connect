# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 MANDATORY: Knowledge Graph Integration

**CRITICAL**: Before working on ANY task, you MUST consult the Knowledge Graph to prevent catastrophic failures.

### Required Actions:
1. **Start of EVERY session**: Run startup check
   ```bash
   node /root/.claude-multi-agent/scripts/claude-startup-check.js
   ```
   This shows critical issues, recent failures, and required workflow.

2. **Before any significant work**: Query for similar issues
   ```bash
   node /root/.claude-multi-agent/scripts/claude-graph-integration.js check "what you plan to do"
   ```

3. **When discovering issues**: Log them immediately
   ```bash
   node /root/.claude-multi-agent/scripts/claude-graph-integration.js log-issue "Name" "Description" Severity
   ```

4. **After attempting fixes**: Log the outcome
   ```bash
   node /root/.claude-multi-agent/scripts/claude-graph-integration.js log-solution "Issue" "What was done" true/false
   ```

**This is NOT optional** - The Knowledge Graph contains critical information about past failures (like the profile system disaster where zero profiles existed). Ignoring it risks repeating catastrophic mistakes.

See `/root/CLAUDE_KNOWLEDGE_GRAPH_WORKFLOW.md` for detailed workflow.

## 🚨 MANDATORY: Documentation Reading Protocol

**CRITICAL**: When user provides documentation, you MUST read it completely and use exact specifications.

### Required Protocol:
1. **Read ALL provided documentation COMPLETELY** before proceeding
2. **Use EXACT tool names, API endpoints, and specifications** as documented
3. **NEVER assume or invent technical specifications** - if not documented, ask for clarification
4. **Quote exact specifications** when documenting or implementing
5. **Verify against provided sources** before creating any documentation

### Common Failure Patterns to AVOID:
- ❌ Assuming tool naming conventions without reading docs
- ❌ Making up API specifications
- ❌ Inventing configuration formats
- ❌ Guessing parameter names or structures

**FAILURE TO FOLLOW THIS PROTOCOL HAS CAUSED CRITICAL ERRORS** - Including incorrect Context7 tool names and wasted development time.

## Project Overview

Stand Up Sydney - A comedy platform for event management and comedian bookings.

**Important Path Note**: The current working directory is `/root`. The frontend code is located in the `agents/` subdirectory.

- **Frontend**: React 18 + TypeScript application in `/root/agents/`
- **Backend**: Supabase for database, auth, storage + MCP (Model Context Protocol) integration
- **Production**: DigitalOcean droplet (170.64.252.55) with systemd services

## Development Commands

All commands must be run from the `/root/agents/` directory:

```bash
# Development server
npm run dev                    # Starts on dynamic port (default 8080)

# Build commands
npm run build                  # Production build
npm run build:dev             # Development build
npm run preview               # Preview production build

# Linting
npm run lint                  # Run ESLint

# Testing commands
npm run test                  # Run all tests
npm run test:watch            # Watch mode for development
npm run test:coverage         # Generate coverage report

# Specific test suites
npm run test:smoke            # Quick health check
npm run test:design           # Design system tests
npm run test:profile          # Profile functionality tests

# Test with development server
npm run test:dev              # Run dev server with tests
npm run test:ci               # CI pipeline test

# Webhook testing
npm run test:webhook:humanitix  # Test Humanitix webhook
npm run test:webhook:eventbrite # Test Eventbrite webhook
npm run test:webhooks          # Test all webhooks

# Invoice system
npm run test:invoice          # Verify invoice system
npm run migrate:invoice       # Run invoice migrations

# Knowledge Graph commands
npm run kg:start              # Start KG session
npm run kg:check             # Check for issues
npm run kg:issue             # Log new issue
npm run kg:solution          # Log solution
npm run kg:query             # Query knowledge graph
npm run kg:update            # Update knowledge graph
npm run kg:status            # View current status
npm run kg                   # Show help
```

### Running Single Tests
```bash
# Run specific test file
npm run test -- tests/profile.test.ts

# Run tests matching pattern
npm run test -- --testNamePattern="profile creation"

# Run tests with debugging
npm run test -- --detectOpenHandles --forceExit
```

## Architecture Overview

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC compiler for fast builds
- **Styling**: Tailwind CSS + 50+ shadcn/ui components
- **State Management**: React Context API + React Query v5
- **Routing**: React Router v6 with lazy loading for performance
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library + Puppeteer E2E

### Application Structure
```
/root/agents/src/
├── components/
│   ├── ui/                     # 50+ shadcn/ui base components
│   ├── admin/                  # Admin dashboard & management
│   ├── auth/                   # Authentication components
│   ├── comedian/               # Comedian-specific features
│   ├── comedian-profile/       # Comedian profile features
│   ├── events/                 # Event management
│   ├── invoice/                # Financial features
│   ├── photographer-profile/   # Photographer features
│   ├── pwa/                    # Progressive Web App features
│   ├── spots/                  # Spot assignment & confirmation
│   ├── ticket-sales/           # Ticket sales integration
│   └── [domain]/               # Domain-specific components
├── contexts/                   # React Context providers
├── hooks/                      # Custom React hooks
│   └── applications/           # Application-specific hooks
├── services/                   # Business logic layer
├── types/                      # TypeScript type definitions
├── utils/                      # Utility functions
├── pages/                      # Route components
│   └── admin/                  # Admin pages
└── integrations/               # External integrations
```

### Provider Hierarchy & Data Flow
```
ErrorBoundary
  └── QueryClientProvider (React Query)
      └── ThemeProvider
          └── AuthProvider
              └── UserProvider
                  └── DesignSystemInitializer
```

**Key Patterns**:
- **Hook-Based Architecture**: Business logic encapsulated in custom hooks
- **Service Layer**: Complex operations handled by services
- **Type Safety**: Comprehensive TypeScript types throughout
- **Error Boundaries**: Graceful error handling at component level

### Backend Integration
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with Google OAuth
- **Storage**: Supabase Storage for media files
- **Real-time**: Supabase subscriptions for live updates
- **Edge Functions**: Serverless functions in `/supabase/functions/`

### Key Database Tables
- `profiles` - User profiles with roles (member, comedian, promoter, admin, photographer)
- `events` - Comedy events/shows with full management
- `applications` - Comedian applications to events
- `vouches` - Peer recommendations system
- `invoices` - Financial records and billing
- `agencies` - Talent agency management
- `tasks` - Task management system
- `notifications` - User notifications

## Multi-Agent System

The project includes a sophisticated multi-agent system for automated development and maintenance:

### System Components
```
/root/.claude-multi-agent/
├── master-orchestrator.js      # Central coordinator
├── claude-agent-spawner.js     # Agent creation
├── dashboard/                  # Monitoring UI (port 5173)
├── agents/                     # Individual agent directories
└── scripts/                    # Management scripts
```

### Agent Management Commands
```bash
# From /root/.claude-multi-agent/
./scripts/launch-all.sh         # Start entire system
./scripts/submit-task.sh        # Submit tasks to agents

# Monitor agents
http://localhost:5173           # Dashboard UI
http://localhost:3001           # WebSocket API
```

### Agent-Specific Rules
The project has specialized agents with defined responsibilities:
- **Frontend Agent**: UI components, React hooks, user experience (branch: `agent-1-frontend`)
- **Backend Agent**: Database, API, edge functions (branch: `agent-2-backend`)
- **Testing Agent**: Test coverage, quality assurance (branch: `agent-3-testing`)

## Testing Strategy

### Test Structure
- **Unit Tests**: `/tests/` directory with Jest + React Testing Library
- **E2E Tests**: Puppeteer for browser automation
- **Test Types**: `*.test.ts`, `*.test.tsx`, `*.test.js`
- **Coverage**: Comprehensive coverage reporting

### Test Configuration
- **Jest Config**: `jest.config.cjs` with jsdom environment
- **Setup Files**: `tests/setup-react.ts` for React Testing Library
- **Path Mapping**: `@/` alias for src directory
- **Timeout**: 30s for Puppeteer tests

### Testing Best Practices
```bash
# Before running tests, ensure dev server is not running
# Tests use their own server instance

# For debugging test failures
npm run test -- --verbose --detectOpenHandles

# For specific test suites
npm run test -- tests/events/

# For coverage of specific areas
npm run test:coverage -- --collectCoverageFrom='src/hooks/**'
```

## Build & Deployment

### Build Commands
```bash
# Production build
npm run build

# Development build
npm run build:dev

# Preview build locally
npm run preview
```

### Build Optimization (Vite)
- **Compiler**: SWC for fast TypeScript compilation
- **Code Splitting**: Manual chunks for optimal loading
- **Minification**: Terser with advanced optimizations
- **Source Maps**: Enabled for production debugging
- **Bundle Analysis**: Size warnings and compression reporting

### Manual Chunks Strategy
```javascript
{
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'ui-vendor': ['@radix-ui/*'],
  'query-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
  'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
  'utils': ['date-fns', 'clsx', 'tailwind-merge'],
  'editor': ['@tiptap/react', '@tiptap/starter-kit']
}
```

### Deployment Targets
- **Frontend**: Vercel/Railway deployment
- **Backend**: DigitalOcean droplet with PM2 + Nginx
- **Database**: Supabase cloud (project: pdikjpfulhhpqpxzpgtu)

## Database Operations

### Using MCP Tools (Recommended)
The project uses MCP for database operations. Common patterns:

```typescript
// Example: Query profiles using MCP
const profiles = await mcp__supabase__select({
  table: 'profiles',
  columns: ['id', 'name', 'role'],
  filters: { role: 'comedian' }
});

// Example: Insert data using MCP
await mcp__supabase__insert({
  table: 'events',
  data: { name: 'Comedy Night', date: '2024-02-01' }
});
```

### Database Migration Scripts
Instead of Supabase CLI, use the project's migration scripts:

```bash
# Check database structure
node check-database-structure.js

# Apply migrations programmatically
node apply-migration.js

# Verify specific tables
node check-supabase-tables.js

# Fix known issues
node fix-profile-system.js
```

### Migration files location
- SQL migrations: `/root/agents/supabase/migrations/`
- JavaScript migrations: `/root/agents/scripts/`
- Emergency fixes: `/root/agents/EMERGENCY_*.sql`

## MCP (Model Context Protocol) Integration

The platform uses MCP for integrating with 13 external services. Configuration is in `/root/agents/.mcp.json`.

### Available MCP Servers (13 Total)
1. **Supabase** - Database operations (28+ tools including storage, auth, and SQL execution)
2. **GitHub** - Repository management, issues, pull requests
3. **Slack** - Team communication with bot and app capabilities
4. **Notion** - Documentation, page creation, database operations
5. **Xero** - Accounting integration (invoices, contacts, reports)
6. **N8N** - Workflow automation (create, execute, monitor workflows)
7. **Metricool** - Social media analytics for Instagram/Facebook
8. **Canva** - Design automation and template management
9. **Context7** - Up-to-date library documentation
10. **Filesystem** - File operations (scoped to /root/agents)
11. **Magic UI** - Design system components
12. **Apify** - Web scraping and social media automation
13. **Task Master** - AI-powered task management (Anthropic, OpenAI, Perplexity, Google AI)

### MCP Usage Pattern
Most tools use: `mcp__[server-name]__[tool-name]`

**Exception**: Context7 uses direct tool names like `resolve-library-id`

### Common MCP Operations
```bash
# Database operations
mcp__supabase__execute_sql
mcp__supabase__list_tables
mcp__supabase__upload_storage_object

# File operations
mcp__filesystem__read_file
mcp__filesystem__write_file

# Workflow automation
mcp__n8n__create_workflow
mcp__n8n__execute_workflow

# GitHub operations
mcp__github__create_issue
mcp__github__create_pull_request

# Documentation lookup (Context7)
resolve-library-id
get-library-docs
```

### MCP Server Details
- **Configuration**: `/root/agents/.mcp.json`
- **N8N Instance**: http://localhost:5678/api/v1
- **Documentation**: `/root/agents/docs/mcp/` (complete docs for each server)

### Full MCP Documentation
See `/root/agents/docs/mcp/` directory for complete documentation of each MCP server with:
- Overview and purpose
- Configuration details
- Complete list of available tools
- Usage examples with code snippets
- Common use cases
- Troubleshooting guide

## Performance Optimizations

### Frontend Performance
- **Lazy Loading**: Route-based code splitting with React.lazy()
- **React Query**: Intelligent caching with 5min stale time
- **Optimistic Updates**: Immediate UI feedback
- **PWA Support**: Service worker + offline capability
- **Asset Optimization**: WebP/AVIF support

### Build Performance
- **SWC Compiler**: Faster than Babel
- **Manual Chunks**: Vendor code separation
- **Tree Shaking**: Unused code elimination
- **Compression**: Gzip/Brotli ready
- **CDN Ready**: Static asset optimization

### Development Server Configuration
```javascript
// Vite dev server runs with:
- Dynamic port from PORT env var (default 8080)
- IPv6 support (host: "::")
- Security headers pre-configured
- Hot Module Replacement enabled
```

## Security Considerations

### Database Security
- **Row Level Security (RLS)**: Enabled on all tables
- **Role-based Access**: Policies based on user roles
- **Environment Variables**: Secure secrets management
- **CSRF Protection**: Utilities in `/src/utils/csrf.ts`

### Authentication Security
- **JWT Tokens**: Managed by Supabase Auth
- **Google OAuth**: Secure OAuth integration
- **Session Management**: Secure cookie handling
- **Profile Creation**: Automatic via `handle_new_user` trigger

### Development Security Headers
```javascript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}
```

## Error Handling

### Frontend Error Handling
- **Error Boundaries**: Component-level error catching
- **Retry Logic**: Exponential backoff for network requests
- **User Feedback**: Toast notifications via Sonner
- **Graceful Degradation**: Fallback UI states

### Backend Error Handling
- **Database Errors**: Handled by Supabase
- **Network Errors**: Retry with exponential backoff
- **Validation**: Zod schemas for type safety
- **Logging**: Error tracking and monitoring

## Development Workflow

### Feature Development Pattern
1. **Create Types**: Add TypeScript types in `/src/types/`
2. **Build Hooks**: Create custom hooks in `/src/hooks/`
3. **Create Components**: Build UI components in `/src/components/`
4. **Add Routes**: Update routes in `/src/App.tsx`
5. **Write Tests**: Add tests in `/tests/`

### Hook-Based Architecture Example
```typescript
// Custom hook pattern used throughout the project
export const useEventData = (eventId: string) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEvent(eventId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return { event: data, error, isLoading };
};
```

### Service Layer Pattern
```typescript
// Services handle complex business logic
export const eventService = {
  async createEvent(data: EventInput): Promise<Event> {
    // Validation
    const validated = eventSchema.parse(data);
    
    // Business logic
    const event = await supabase
      .from('events')
      .insert(validated)
      .select()
      .single();
      
    // Post-processing
    await notificationService.notifyNewEvent(event);
    
    return event;
  }
};
```

### Component Development
```bash
# Start development server
npm run dev

# Run tests in watch mode during development
npm run test:watch

# Lint code before committing
npm run lint
```

## Knowledge Graph Integration

### Critical Workflow
1. **Always start with**: `node /root/.claude-multi-agent/scripts/claude-startup-check.js`
2. **Check before work**: Query for similar issues
3. **Log discoveries**: Record new issues immediately
4. **Document solutions**: Log successful fixes

### Known Critical Issues
- **Profile System**: Previously had zero profiles due to missing trigger
- **Authentication**: Google OAuth configuration requirements
- **Database**: Missing tables and policies

## Feature Implementation Guidelines

### Priority Rules
- **IMMEDIATE EXECUTION**: Launch parallel Tasks immediately upon feature requests
- **NO CLARIFICATION**: Skip asking implementation type unless critical
- **PARALLEL BY DEFAULT**: Use 7-parallel-Task method for efficiency

### Implementation Workflow
1. **Component**: Create main component file
2. **Styles**: Create component styles/CSS
3. **Tests**: Create test files
4. **Types**: Create type definitions
5. **Hooks**: Create custom hooks/utilities
6. **Integration**: Update routing, imports, exports
7. **Configuration**: Update package.json, docs, config files

### Critical Guidelines
- **MINIMAL CHANGES**: Preserve existing patterns and structures
- **NAMING CONVENTIONS**: Follow established file organization
- **ARCHITECTURE**: Follow project's component patterns
- **UTILITIES**: Use existing functions, avoid duplication

## Common Development Tasks

### Creating a New Feature
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Generate types
# Add to src/types/newFeature.ts

# 3. Create service layer
# Add to src/services/newFeatureService.ts

# 4. Build custom hooks
# Add to src/hooks/useNewFeature.ts

# 5. Create components
# Add to src/components/new-feature/

# 6. Write tests
# Add to tests/new-feature.test.ts

# 7. Update routing if needed
# Modify src/App.tsx
```

### Working with Webhooks
```bash
# Test webhook locally
npm run test:webhook:humanitix

# Check webhook samples
ls /root/agents/scripts/webhook-samples/

# Verify webhook processing
node scripts/test-webhooks.js --platform humanitix --event order.created
```

### PWA Development
- Service worker: `/root/agents/public/sw.js`
- Manifest: `/root/agents/public/manifest.json`
- Offline page: `/root/agents/public/offline.html`
- PWA installer component: `/src/components/pwa/PWAInstaller.tsx`

## Important Notes

### Working Directory Structure
- **Root**: `/root` (current working directory)
- **Frontend**: `/root/agents/` (main React application)
- **Scripts**: `/root/.claude-multi-agent/scripts/`
- **MCP Config**: `/root/agents/.mcp.json`
- **Migrations**: `/root/agents/supabase/migrations/`

### Critical Success Factors
- **Knowledge Graph**: Always use - prevents catastrophic failures
- **TypeScript**: Maintain strict type safety
- **Testing**: Aim for 80%+ meaningful coverage
- **Security**: Apply RLS and proper authentication
- **Performance**: Monitor bundle size and runtime performance

### Development Best Practices
- **Port**: Development server runs on dynamic port (8080 default)
- **Dependencies**: Use exact versions from package.json
- **Build**: Use Vite for fast development and production builds
- **Testing**: Jest with jsdom environment for React components
- **Linting**: ESLint v9 with TypeScript support

### Environment Variables
Key environment variables used:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public anonymous key
- `PORT`: Development server port (default 8080)
- `VITE_*`: Frontend environment variables (auto-loaded by Vite)

### Project-Specific Features
- **Spot Assignment System**: Comedian spot management with confirmations
- **Invoice Templates**: Customizable invoice generation with PDF export
- **Ticket Sales Integration**: Humanitix & Eventbrite webhook handling
- **Multi-Agent Development**: Automated agents for different domains
- **PWA Features**: Offline capability and installable app