# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AISUPERTOOLS - AI Development Ecosystem

## Project Architecture

AISUPERTOOLS is a comprehensive AI development ecosystem with multiple interconnected components:

### Core Components
- **gigpig-stage-connect-fresh/** - Main production app (iD Comedy platform)
- **01_CLAUDE_TOOLS/** - Claudia desktop app (Tauri-based project management)
- **06_MCP_SERVERS/** - Model Context Protocol servers for Claude integrations
- **07_DXT/** - Desktop Extensions framework and tools

### Supporting Infrastructure
- **02_INSTALOADER/** - Instagram automation tools
- **03_PYTHON_ENV/** - Isolated Python environment for AI tools
- **04_UTILITIES/** - Development setup scripts and integrations
- **05_PROJECTS/** - Additional project workspace

## Development Commands

### iD Comedy Platform (Primary Production App)
```bash
cd gigpig-stage-connect-fresh
npm run dev              # Development server
npm run build           # Production build
npm run lint            # ESLint
npm test                # Jest tests
npm run test:smoke      # Smoke tests for critical paths
npm run test:design     # Design system validation
npm run test:profile    # Profile functionality tests
```

### Claudia Desktop App
```bash
cd 01_CLAUDE_TOOLS/claudia/claudia
npm run tauri dev       # Development mode
npm run tauri build     # Production build
npm run dev             # Frontend only (Vite)
npm run build           # TypeScript + Vite build
```

### MCP Servers
```bash
cd 06_MCP_SERVERS/playwright-mcp-server
npm run build           # TypeScript compilation
npm run dev             # Development with tsx
npm test                # Jest tests
npm run install-browsers # Install Playwright browsers (WSL: use sudo)

# Test MCP connectivity
node error-analysis-test.js  # Comprehensive error handling tests
```

### DXT Extensions
```bash
cd 07_DXT/dxt
npm run build           # TypeScript build
npm run dev             # Watch mode
npm run test            # Jest tests
npm run lint            # ESLint + TypeScript check
```

## Technology Stack

### Frontend
- **React 18.3.1** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS 4.x** with custom design system
- **Radix UI** for accessible components
- **Framer Motion** for animations

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage)
- **Node.js** MCP servers with TypeScript
- **Playwright** for browser automation

### Desktop
- **Tauri** (Rust backend + TypeScript frontend)
- **DXT Framework v0.2.0** for extensions

## Key Architecture Patterns

### Supabase Integration
- Real-time subscriptions for live data
- Row Level Security (RLS) policies
- OAuth integration (Google, GitHub)
- File storage with automatic optimization

### MCP Server Pattern
```typescript
// Standard tool definition
{
  name: "tool_name",
  description: "Clear description",
  parameters: { /* JSON schema */ }
}
```
- Environment-based configuration
- Comprehensive error handling
- Session management for stateful operations

### React Component Architecture
- Context providers for global state
- Custom hooks for business logic
- Component composition with Radix primitives
- Responsive design patterns

### Testing Strategy
- **Unit Tests**: Jest for components and utilities
- **Smoke Tests**: Critical user flows
- **E2E Tests**: Playwright for browser automation
- **Design System Tests**: Component validation

## Project-Specific Details

### iD Comedy Platform
- **Live URL**: https://gigpig-stage-connect.vercel.app/
- **GitHub**: https://github.com/chillz-id/gigpig-stage-connect.git
- **Status**: ✅ Production-ready (rebranded July 1, 2025)
- **Key Features**: Event management, user authentication, responsive design
- **Theme System**: Business/Pleasure toggle (defaults to Business)

### Claudia Desktop App
- Tauri-based project management tool
- Session tracking and MCP integration
- Cross-platform compatibility

### MCP Servers
- **Playwright MCP**: 10 browser automation tools (completed July 2, 2025)
- **Notion MCP**: Workspace management
- **Supabase MCP**: Database operations
- **Smart File Manager**: Production-ready file operations

### DXT Extensions
- **Magic UI Designer**: AI-powered component generator
- **Smart File Manager**: Advanced file operations with metadata
- **GitHub Bridge**: Git integration utilities

## Common Development Workflows

### Starting Development
1. Navigate to target project directory
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Run tests to verify: `npm test`

### Before Committing
1. Run linting: `npm run lint`
2. Run tests: `npm test`
3. Build to verify: `npm run build`

### MCP Server Development
1. Create server in `06_MCP_SERVERS/[name]/`
2. Implement MCP protocol interface
3. Add to `mcp-servers-config.json`
4. Test with `node error-analysis-test.js`

### DXT Extension Development
1. Create extension in `07_DXT/[name]/`
2. Define `manifest.json` following DXT 0.2.0 spec
3. Implement MCP server in `server/index.js`
4. Validate with custom test scripts

## Environment Setup

### Required Tools
- Node.js ≥16.0.0
- Python 3.8+ (for AI tools)
- Rust (for Tauri builds)
- Git with GitHub CLI

### Environment Variables
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` for iD Comedy
- `NOTION_API_KEY` for Notion MCP
- Various OAuth tokens for integrations

### Platform-Specific Notes
- **WSL2**: Primary development environment
- **Playwright**: Run `sudo npx playwright install-deps` in WSL
- **File Permissions**: Ensure proper permissions on Unix systems

## Troubleshooting

### Common Issues
- **Port conflicts**: Check if dev servers use different ports
- **Build failures**: `rm -rf node_modules package-lock.json && npm install`
- **MCP connection**: Verify Claude Desktop configuration
- **Playwright browsers**: Install system dependencies with sudo

### Debug Commands
```bash
# Check versions
node --version
npm config list

# Test MCP connectivity
curl -X POST http://localhost:3000/mcp/tools

# Validate DXT extensions
cd 07_DXT/[extension-name] && node server/validate.js
```

## Project Status (July 2025)

### Recently Completed
- ✅ iD Comedy platform rebranding and UI enhancements
- ✅ Playwright MCP server with 10 automation tools
- ✅ SPA routing fixes and infrastructure improvements
- ✅ Comprehensive test suites for all major components

### Current Focus
- MCP server ecosystem expansion
- DXT extension framework maturation
- Cross-platform desktop app optimization

## 🎯 **CURRENT SESSION STATUS - July 3, 2025 01:45 PM - ✅ FASTMCP SUCCESS!**

### **DIGITAL OCEAN SERVER STATUS**
- **Droplet**: SUS-GigPig (170.64.252.55) - 4 vCPU/8GB RAM, Sydney region
- **Stand Up Sydney Platform**: DEPLOYED but Vite server STOPPED
- **Issue**: Vite development server not running on port 8080
- **N8N Automation**: Running on port 5678
- **Firewall**: UFW configured, port 8080 opened
- **Dev Server**: Vite running with --host 0.0.0.0 --port 8080

### **MCP CONFIGURATION STATUS**
- **Digital Ocean MCP**: Configured in mcp.json with official @digitalocean/mcp package
- **API Token**: [REDACTED]
- **Issue**: Cursor showing "0 tools enabled" - MCP not connecting properly
- **Fix Applied**: Added -y flag to npx command for auto-install
- **Next**: Restart Cursor to test connection

### **IMMEDIATE NEXT STEPS AFTER CURSOR RESTART**
1. **Test Digital Ocean MCP**: Check if tools are now enabled after restart
2. **Fix connectivity issue**: Use MCP or direct SSH to resolve browser access
3. **Diagnose network blocking**: Check Digital Ocean cloud firewall vs server config
4. **Complete setup phases**: Nginx, SSL, automation migration after connectivity fixed

### **CRITICAL FILES MODIFIED THIS SESSION**
- **mcp.json**: Configured official Digital Ocean MCP with API token and -y flag
- **Shows.tsx**: Still using placeholder due to regex errors in original
- **supabase.ts**: Basic config file created
- **Firewall**: UFW ports 3000, 5678, 8080 opened

### **TROUBLESHOOTING FOCUS**
Primary issue: Server runs internally but external browser access blocked
- Digital Ocean cloud firewall potentially blocking port 8080
- Network interface binding issues
- Vite dev server external access configuration
- May need Nginx reverse proxy setup

### **FALLBACK PLAN IF MCP FAILS**
Direct SSH troubleshooting commands:
```bash
ssh developer@170.64.252.55
ps aux | grep vite
sudo ss -tlnp | grep :8080
curl -I http://localhost:8080
```

### Memorized Actions
- Tested MCP integration with Digital Ocean server
- Configured server firewall and ports
- Identified potential network blocking issues

---

*This file should be updated when project structure or key workflows change significantly.*
*Last updated: 2025-07-03 02:20 AM - Current session preserved for continuity after Cursor restart*