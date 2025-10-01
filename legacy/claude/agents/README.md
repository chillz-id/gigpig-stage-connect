# Claude Code Agents for Stand Up Sydney

This directory contains **Claude Code Agents** (subagents) specialized for the Stand Up Sydney comedy platform development.

## Available Agents

### 🎨 **frontend-specialist**
- **Focus**: React/TypeScript UI development
- **Usage**: `Use the frontend-specialist to update the comedian profile UI`
- **Domain**: Components, pages, styling, responsive design
- **Tools**: shadcn/ui, Tailwind CSS, React Testing Library

### ⚙️ **backend-specialist** 
- **Focus**: Backend API and database operations
- **Usage**: `Use the backend-specialist to create a new API endpoint`
- **Domain**: Hooks, services, integrations, database operations
- **Tools**: Supabase, React Query, MCP integrations

### 🧪 **testing-specialist**
- **Focus**: Comprehensive testing and quality assurance
- **Usage**: `Use the testing-specialist to add comprehensive tests`
- **Domain**: Unit, integration, E2E testing with 80%+ coverage
- **Tools**: Jest, React Testing Library, Puppeteer

### 🎭 **comedy-content**
- **Focus**: Comedy industry expertise and content curation
- **Usage**: `Use the comedy-content agent to improve event descriptions`
- **Domain**: Comedy industry knowledge, content standards, user guidance
- **Tools**: Industry expertise, content optimization

### 🗄️ **database-admin**
- **Focus**: Database administration and migrations
- **Usage**: `Use the database-admin to create a migration`
- **Domain**: Supabase schema, migrations, RLS policies, performance
- **Tools**: SQL, Supabase CLI, database optimization

### 🔄 **n8n-expert**
- **Focus**: N8N workflow automation and integration design
- **Usage**: `Use the n8n-expert to create a complete invoice processing workflow`
- **Domain**: Workflow design, API integrations, automation patterns, error handling
- **Tools**: N8N nodes, webhook design, data transformation, monitoring

### 📋 **notion-expert**
- **Focus**: Notion workspace and database architecture
- **Usage**: `Use the notion-expert to design a comprehensive event management database`
- **Domain**: Database design, template systems, formulas, automation, workspace organization
- **Tools**: Notion API, database design, formula engineering, integration patterns

## Agent Locations

### User-Level (Global)
- **Path**: `/root/.claude/agents/`
- **Scope**: Available from any directory/project
- **Priority**: Lower (overridden by project-specific agents)

### Project-Level (Stand Up Sydney)
- **Path**: `/root/agents/.claude/agents/`
- **Scope**: Only when working in `/root/agents/` directory
- **Priority**: Higher (overrides user-level agents)

## Usage Examples

```bash
# Frontend work
Use the frontend-specialist to create a responsive comedian profile card component

# Backend work  
Use the backend-specialist to add real-time notifications for spot confirmations

# Testing
Use the testing-specialist to create E2E tests for the comedian application workflow

# Content
Use the comedy-content agent to write compelling event descriptions that attract audiences

# Database
Use the database-admin to create a migration adding photographer role support

# N8N Automation
Use the n8n-expert to create a workflow that automatically processes new comedian applications

# Notion Database Design
Use the notion-expert to create a comprehensive event management system with performer tracking
```

## Agent Features

- **YAML Frontmatter**: Proper name, description, tools, model configuration
- **Specialized Prompts**: Tailored for Stand Up Sydney comedy platform
- **Clear Domains**: Defined responsibilities and collaboration boundaries
- **Professional Standards**: Git workflows, commit conventions, quality guidelines
- **Stand Up Sydney Context**: Deep understanding of comedy industry requirements

## Development Workflow

Each agent follows specific branching and commit conventions:
- **Frontend**: `feature/frontend-*`, commits: `feat(ui)`, `fix(ui)`, `style(ui)`
- **Backend**: `feature/backend-*`, commits: `feat(api)`, `fix(api)`, `perf(api)` 
- **Testing**: `feature/tests-*`, commits: `test:`, `fix(test)`, `chore(test)`
- **Database**: `feature/db-*`, commits: `feat(db)`, `fix(db)`, `perf(db)`

## Agent Collaboration

Agents are designed to work together:
- **Frontend ↔ Backend**: UI consumes hooks/services, backend provides clean APIs
- **All ↔ Testing**: Testing agent ensures quality across all domains
- **All ↔ Comedy Content**: Content agent provides industry context and standards
- **All ↔ Database Admin**: Database admin ensures proper data structures

---

**Last Updated**: August 7, 2025  
**Version**: 1.0  
**Platform**: Stand Up Sydney Comedy Platform