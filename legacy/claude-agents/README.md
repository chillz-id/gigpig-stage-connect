# Stand Up Sydney - Unified Agent System

This directory contains the **unified agent system** for Stand Up Sydney, consolidating and optimizing agent capabilities from multiple previous implementations.

## 🚀 Agent Specifications

### 1. Frontend Specialist (`frontend-specialist.md`)
**Focus**: React/TypeScript UI development, component architecture, user experience
- **Model**: Sonnet
- **Domain**: Components, pages, styling, theme system, PWA features
- **Key Skills**: shadcn/ui components, Tailwind CSS, accessibility, performance optimization
- **Never Modifies**: Backend logic, hooks, API calls, database operations

### 2. Backend Specialist (`backend-specialist.md`) 
**Focus**: API integrations, custom hooks, business logic, external service integration
- **Model**: Sonnet  
- **Domain**: Hooks, services, integrations, database types, edge functions
- **Key Skills**: React Query, Supabase, MCP integration, real-time features
- **Never Modifies**: UI components, only creates hooks and services

### 3. Database Administrator (`database-administrator.md`)
**Focus**: Database schema, migrations, RLS policies, data integrity, performance
- **Model**: Sonnet
- **Domain**: Schema design, SQL migrations, Row Level Security, indexing
- **Key Skills**: PostgreSQL optimization, Supabase administration, security policies
- **Responsibilities**: Schema evolution, migration management, data protection

### 4. Testing Specialist (`testing-specialist.md`)
**Focus**: Comprehensive testing, quality assurance, 80%+ coverage, CI/CD integration  
- **Model**: Sonnet
- **Domain**: Unit tests, integration tests, E2E tests, performance testing
- **Key Skills**: Jest + RTL, Playwright, accessibility testing, test automation
- **Standards**: 80%+ coverage, comprehensive user workflow testing

### 5. Comedy Content Specialist (`comedy-content-specialist.md`)
**Focus**: Comedy industry expertise, content curation, authentic comedy workflows
- **Model**: Opus (for domain expertise and content creation)
- **Domain**: Sydney comedy scene, industry standards, venue relationships
- **Key Skills**: Comedy industry knowledge, content writing, professional standards
- **Unique Value**: Ensures platform authentically serves comedy community needs

## 🔄 Agent Consolidation Summary

### Previous Systems Analyzed:
- **System 1** (`.claude-agents/`): 4 agents with documentation format
- **System 2** (`.claude/agents/`): 5 agents with YAML frontmatter

### Consolidation Strategy:
1. **Merged Testing Capabilities**: Combined E2E Playwright expertise with comprehensive QA approach
2. **Separated Database Concerns**: Distinct Database Administrator for specialized schema management
3. **Preserved Comedy Domain**: Maintained industry-specific expertise for authenticity
4. **Unified Documentation**: Consistent YAML frontmatter with comprehensive sections
5. **Optimized Models**: Sonnet for technical work, Opus for content and domain expertise

### Key Improvements:
- **Eliminated Redundancy**: No overlapping responsibilities between agents
- **Enhanced Specialization**: Each agent has clear, focused domain expertise  
- **Better Coverage**: More comprehensive testing approach combining multiple methodologies
- **Industry Authenticity**: Preserved comedy-specific knowledge for platform credibility
- **Consistent Standards**: Unified documentation format and quality expectations

## 🎯 Agent Usage Guidelines

### When to Use Each Agent:

**Frontend Specialist**: UI components, styling, user experience, accessibility, performance optimization
```bash
# Use for: Component creation, styling updates, theme system, responsive design
Task: "Create a new comedian profile card component with responsive design"
```

**Backend Specialist**: Custom hooks, API integration, business logic, external services
```bash  
# Use for: Data fetching hooks, service layer, MCP integrations, real-time features
Task: "Create a hook for managing spot assignments with real-time updates"
```

**Database Administrator**: Schema changes, migrations, RLS policies, performance optimization
```bash
# Use for: Database structure changes, security policies, performance tuning
Task: "Create migration for photographer profiles with proper RLS policies"  
```

**Testing Specialist**: Test coverage, quality assurance, E2E workflows, performance testing
```bash
# Use for: Test creation, coverage analysis, workflow validation, performance benchmarks
Task: "Create comprehensive E2E tests for the invoice generation workflow"
```

**Comedy Content Specialist**: Industry-specific features, content curation, workflow design
```bash
# Use for: Comedy industry guidance, content creation, feature validation
Task: "Design the comedian application workflow to match industry standards"
```

## ⚡ Quick Start

### Individual Agent Usage:
```bash
# Use Task tool to launch specific agent
Task("Create responsive event listing page", "frontend-specialist")
Task("Implement invoice generation hook", "backend-specialist")  
Task("Add RLS policies for new table", "database-administrator")
Task("Add E2E tests for user registration", "testing-specialist")
Task("Review comedian bio guidelines", "comedy-content-specialist")
```

### Multi-Agent Coordination:
```bash
# Launch multiple agents for complex features
Task("Design photographer profile system", "database-administrator") 
Task("Create photographer profile components", "frontend-specialist")
Task("Build photographer booking hooks", "backend-specialist")
Task("Test photographer workflows", "testing-specialist")
Task("Validate industry requirements", "comedy-content-specialist")
```

## 🔗 Integration Points

### Agent Collaboration Patterns:
1. **Database → Backend**: Schema design informs hook architecture
2. **Backend → Frontend**: Hooks consumed by UI components  
3. **Testing**: Validates all other agents' work with comprehensive coverage
4. **Comedy Content**: Guides all agents on industry-specific requirements

### Shared Resources:
- **Types**: All agents reference `/src/types/` for consistency
- **Standards**: Common coding standards and architectural patterns  
- **Documentation**: Shared understanding of Stand Up Sydney domain
- **Quality Gates**: Testing specialist validates all implementations

## 📋 Migration Checklist

- [x] Analyze all 8 agents across both systems
- [x] Design unified agent specifications  
- [x] Create consolidated agent system with 5 optimized specialists
- [ ] Test agent functionality with sample tasks
- [ ] Clean up duplicate agents and update documentation
- [ ] Update CLAUDE.md with new agent system references

## 🎪 Stand Up Sydney Context

This agent system is specifically designed for the **Stand Up Sydney comedy platform** with deep understanding of:
- Multi-role user system (comedians, promoters, agencies, photographers)
- Complex event management and spot assignment workflows
- Financial operations with invoice generation and payment processing
- Real-time features for applications and notifications
- Integration with 13 external services via MCP
- Comedy industry standards and professional practices

The unified agent system ensures **authentic, professional, high-quality** development that serves the Sydney comedy community's unique needs while maintaining technical excellence across all platform components.