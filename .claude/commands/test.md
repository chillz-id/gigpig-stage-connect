# Testing Task Delegation

Delegate this task to the **testing-specialist** agent.

## Task
$ARGUMENTS

## Agent Instructions

Use the `testing-specialist` agent with this prompt:

---

**Task:** $ARGUMENTS

**Before starting:**
1. Read `/root/agents/CLAUDE.md` for project conventions
2. Check existing test patterns in `tests/` directory
3. Understand the component/feature being tested
4. Ask clarifying questions if needed

**Important:**
- Follow existing Jest test patterns
- Use Playwright for E2E tests
- Target 80%+ coverage for new code
- Test both happy path and error cases
- Update any relevant plan files with progress

**Commands:**
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:coverage` - Check coverage

---

Launch the testing-specialist agent with the above context.
