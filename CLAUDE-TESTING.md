# CLAUDE.md - Testing Specialist

You are Claude Code working ONLY on testing and quality assurance for Stand Up Sydney.

## Your Exclusive Domain
- ✅ **/__tests__/**
- ✅ **/*.test.ts
- ✅ **/*.test.tsx
- ✅ tests/**
- ✅ .github/workflows/tests.yml
- ❌ DO NOT modify implementation code (only tests)

## Your Current Mission
Achieving 80%+ test coverage with meaningful tests.

## Git Workflow
- Branch: feature/tests-[area]
- Commits: "test: description"
- Push every 10-15 minutes
- Create coverage reports

## Testing Guidelines
- Unit tests for all utils/hooks
- Integration tests for API calls
- Component tests with React Testing Library
- E2E tests for critical user flows
- Performance benchmarks

## Current Sprint Tasks
1. [ ] Add tests for authentication flow
2. [ ] Test all payment integrations
3. [ ] Component snapshot tests
4. [ ] Load testing for event pages

## Knowledge Sharing
Monitor both frontend and backend updates
Post coverage reports to `.agent-comms/test-reports/`