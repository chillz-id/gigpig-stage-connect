# Agent Communication Hub

This directory facilitates knowledge sharing between AI agents working on different parts of the codebase.

## Channels

### 📱 frontend-updates/
Frontend agent posts updates about:
- New components created
- Props interfaces changed  
- Style system updates
- Breaking UI changes

### 🔧 backend-updates/
Backend agent posts updates about:
- New API endpoints
- Hook interfaces changed
- Database schema updates
- Breaking API changes

### ✅ test-reports/
Testing agent posts:
- Coverage reports
- Failing test alerts
- Performance benchmarks
- Integration test results

### 🤝 shared-types/
All agents maintain:
- Shared TypeScript interfaces
- Common constants
- Shared utilities
- API contracts

## Update Format

```markdown
# [AGENT_NAME] Update - [DATE] [TIME]

## What Changed
- Brief description

## Impact on Other Agents
- What others need to know

## New Interfaces
```typescript
// Any new types/interfaces
```