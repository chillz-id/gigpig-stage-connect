# Legacy Test Suites

Exploratory and partially scaffolded tests are parked here so the active Jest
configuration can focus on maintained suites. When you need one of these flows,
migrate it back into `tests/` and update it to match the current application
structure before running in CI.

## Remaining Tests

- `events/` - Event template and validation test scaffolds
- `invoices/` - Invoice operations test scaffolds

These may be useful as reference for test patterns but need updates before use.

## Cleanup History

- 2025-11-25: Removed `application-workflow.test.ts` (placeholder tests only)
- 2025-11-25: Removed `debugging-session/` (tested removed infrastructure)
- 2025-11-25: Removed `spot-confirmation-hooks.test.ts` (outdated)
- 2025-11-25: Removed `screenshots/` (test artifacts)
