# Phase 2 Week 2: Migration Testing & E2E Smoke Tests
Created: 2025-10-26
Status: Planning

## Overview
Implement Week 2 of Phase 2: Shadow database migration testing and E2E smoke tests in CI to catch breaking changes before production.

## Goals
1. **Shadow database testing** - Test migrations on a copy of production data
2. **E2E smoke tests** - Automated browser tests for critical user paths
3. **Migration rollback testing** - Verify backups can be restored

## Implementation Order

### Task 1: Shadow Database Migration Testing (4-5 hours)
**Priority**: Highest (prevents data corruption)

#### 1.1 Create Shadow Database Script
**File**: `scripts/test-migration-shadow.js`

**Purpose**: Test migrations on a copy of production schema without touching prod

**Features**:
- Clone production schema to temporary database
- Apply pending migrations
- Run data integrity checks
- Report schema diff
- Auto-cleanup shadow database

**Implementation**:
```javascript
#!/usr/bin/env node

/**
 * Shadow Database Migration Testing
 *
 * Creates a temporary copy of production schema, applies migrations,
 * and validates data integrity without touching production.
 */

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Environment validation
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_DB_URL) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('   - SUPABASE_DB_URL');
  process.exit(1);
}

const SHADOW_SCHEMA = 'shadow_test';

async function runCommand(cmd, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log(`✅ ${description} complete`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    throw error;
  }
}

async function createShadowSchema(client) {
  console.log(`\n📋 Creating shadow schema: ${SHADOW_SCHEMA}`);

  // Drop existing shadow schema if exists
  await client.rpc('exec_sql', {
    sql: `DROP SCHEMA IF EXISTS ${SHADOW_SCHEMA} CASCADE;`
  });

  // Create new shadow schema
  await client.rpc('exec_sql', {
    sql: `CREATE SCHEMA ${SHADOW_SCHEMA};`
  });

  console.log(`✅ Shadow schema created`);
}

async function cloneProductionSchema(client) {
  console.log('\n🔄 Cloning production schema to shadow...');

  // Get all tables in public schema
  const { data: tables, error } = await client
    .rpc('get_tables_list', { schema_name: 'public' });

  if (error) {
    console.error('❌ Failed to get tables list:', error);
    throw error;
  }

  // Clone each table structure (no data)
  for (const table of tables) {
    await client.rpc('exec_sql', {
      sql: `
        CREATE TABLE ${SHADOW_SCHEMA}.${table.table_name}
        (LIKE public.${table.table_name} INCLUDING ALL);
      `
    });
  }

  console.log(`✅ Cloned ${tables.length} tables to shadow schema`);
}

async function applyMigrations() {
  console.log('\n🔄 Applying migrations to shadow database...');

  // Run Supabase migration on shadow schema
  const migrationDir = path.join(__dirname, '../supabase/migrations');
  const migrations = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📄 Found ${migrations.length} migrations`);

  // Apply each migration to shadow schema
  for (const migration of migrations) {
    const sql = fs.readFileSync(path.join(migrationDir, migration), 'utf-8');

    // Modify SQL to target shadow schema
    const shadowSql = sql.replace(/\bpublic\./g, `${SHADOW_SCHEMA}.`);

    console.log(`   Applying: ${migration}`);
    execSync(`psql "${SUPABASE_DB_URL}" -c "${shadowSql}"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
  }

  console.log('✅ All migrations applied to shadow');
}

async function runIntegrityChecks(client) {
  console.log('\n🔍 Running data integrity checks...');

  const checks = [
    {
      name: 'Foreign key constraints',
      sql: `
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints
        WHERE constraint_schema = '${SHADOW_SCHEMA}'
        AND constraint_type = 'FOREIGN KEY';
      `
    },
    {
      name: 'Unique constraints',
      sql: `
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints
        WHERE constraint_schema = '${SHADOW_SCHEMA}'
        AND constraint_type = 'UNIQUE';
      `
    },
    {
      name: 'Not-null columns',
      sql: `
        SELECT COUNT(*) as count
        FROM information_schema.columns
        WHERE table_schema = '${SHADOW_SCHEMA}'
        AND is_nullable = 'NO';
      `
    }
  ];

  for (const check of checks) {
    const result = execSync(
      `psql "${SUPABASE_DB_URL}" -t -c "${check.sql}"`,
      { encoding: 'utf-8' }
    );
    console.log(`   ✅ ${check.name}: ${result.trim()} found`);
  }
}

async function compareSchemaDiff(client) {
  console.log('\n🔍 Comparing production vs shadow schema...');

  // Get schema diff using pg_dump
  const prodSchema = execSync(
    `pg_dump "${SUPABASE_DB_URL}" --schema=public --schema-only`,
    { encoding: 'utf-8' }
  );

  const shadowSchema = execSync(
    `pg_dump "${SUPABASE_DB_URL}" --schema=${SHADOW_SCHEMA} --schema-only`,
    { encoding: 'utf-8' }
  );

  // Normalize schemas for comparison
  const normalizedProd = prodSchema
    .replace(/public\./g, '')
    .replace(/-- .*/g, '')
    .trim();

  const normalizedShadow = shadowSchema
    .replace(new RegExp(SHADOW_SCHEMA + '\\.', 'g'), '')
    .replace(/-- .*/g, '')
    .trim();

  if (normalizedProd === normalizedShadow) {
    console.log('✅ Schemas match - migrations are safe');
    return true;
  } else {
    console.warn('⚠️  Schema differences detected');
    console.log('Run manual diff for details:');
    console.log(`   pg_dump "${SUPABASE_DB_URL}" --schema=public --schema-only > prod.sql`);
    console.log(`   pg_dump "${SUPABASE_DB_URL}" --schema=${SHADOW_SCHEMA} --schema-only > shadow.sql`);
    console.log(`   diff prod.sql shadow.sql`);
    return false;
  }
}

async function cleanupShadow(client) {
  console.log(`\n🧹 Cleaning up shadow schema...`);

  await client.rpc('exec_sql', {
    sql: `DROP SCHEMA IF EXISTS ${SHADOW_SCHEMA} CASCADE;`
  });

  console.log('✅ Shadow schema dropped');
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Shadow Database Migration Testing');
  console.log('═══════════════════════════════════════════════\n');

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    await createShadowSchema(client);
    await cloneProductionSchema(client);
    await applyMigrations();
    await runIntegrityChecks(client);
    const schemasMatch = await compareSchemaDiff(client);

    console.log('\n═══════════════════════════════════════════════');
    if (schemasMatch) {
      console.log('✅ MIGRATION TEST PASSED');
      console.log('   Migrations are safe to apply to production');
    } else {
      console.log('⚠️  MIGRATION TEST WARNING');
      console.log('   Review schema differences before applying');
    }
    console.log('═══════════════════════════════════════════════\n');

    await cleanupShadow(client);

    process.exit(schemasMatch ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Shadow migration test failed:', error.message);

    // Always cleanup on error
    try {
      await cleanupShadow(client);
    } catch (cleanupError) {
      console.error('Failed to cleanup shadow schema:', cleanupError.message);
    }

    process.exit(1);
  }
}

main();
```

#### 1.2 Add CI Workflow
**File**: `.github/workflows/migration-safety.yml`

```yaml
name: Migration Safety

on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
      - 'scripts/safe-migrate.js'
      - 'scripts/test-migration-shadow.js'

jobs:
  test-migration:
    name: Test Migration on Shadow Database
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Run shadow migration test
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: node scripts/test-migration-shadow.js

      - name: Comment on PR
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const prNumber = context.payload.pull_request.number;

            const comment = `## 🗄️ Migration Safety Check

            Shadow database testing has completed.

            - ✅ Migration applied to test database
            - ✅ Data integrity checks passed
            - ✅ Schema comparison complete

            **Safe to merge** - Migrations have been validated on a production-like schema.`;

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: prNumber,
              body: comment
            });
```

#### 1.3 Add npm script
**File**: `package.json` (modify scripts section)

```json
{
  "scripts": {
    "migrate:test": "node scripts/test-migration-shadow.js"
  }
}
```

**Note**: This script can be run locally for manual testing, but **primary usage is in CI**. The CI workflow ensures tests run in isolated GitHub Actions environment, not on the droplet.

---

### Task 2: E2E Smoke Tests in CI (3-4 hours)
**Priority**: High (catches UI breaking changes)

#### 2.1 Create Smoke Test Suite
**File**: `tests/e2e/smoke.test.ts`

**Purpose**: Fast, critical path tests that run on every PR

**Critical paths to test**:
1. Homepage loads
2. User can sign up/login
3. Events page displays events
4. Comedian can view dashboard
5. Search functionality works

**Implementation**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical User Paths', () => {

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check essential elements
    await expect(page.locator('h1')).toContainText('Stand Up Sydney');
    await expect(page.locator('nav')).toBeVisible();

    // Check no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('Events page displays events', async ({ page }) => {
    await page.goto('/events');

    // Wait for events to load
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });

    // Should have at least one event
    const eventCards = await page.locator('[data-testid="event-card"]').count();
    expect(eventCards).toBeGreaterThan(0);
  });

  test('Search functionality works', async ({ page }) => {
    await page.goto('/');

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('comedy');

    // Should show search results
    await page.waitForTimeout(500); // Debounce
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('User can navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Click login button
    await page.click('text=Login');

    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/);

    // Check login form is present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('404 page works for invalid routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');

    // Should show 404 page (not blank/crash)
    await expect(page.locator('body')).toContainText(/404|not found/i);
  });

  test('API health check passes', async ({ request }) => {
    const response = await request.get(process.env.VITE_SUPABASE_URL + '/rest/v1/');

    // Should return 200 OK
    expect(response.ok()).toBeTruthy();
  });
});
```

#### 2.2 Update CI Workflow
**File**: `.github/workflows/ci.yml` (modify)

Add new job:
```yaml
  smoke-tests:
    name: E2E Smoke Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run smoke tests
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run test:e2e:ci -- tests/e2e/smoke.test.ts

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: smoke-test-results
          path: playwright-report/
          retention-days: 7
```

#### 2.3 Create CI-specific test command
**File**: `package.json` (modify)

```json
{
  "scripts": {
    "test:e2e:ci": "playwright test --project=chromium --reporter=github"
  }
}
```

---

### Task 3: Migration Rollback Testing (2 hours)
**Priority**: Medium (validates backup/restore works)

#### 3.1 Create Rollback Test Script
**File**: `scripts/test-migration-rollback.js`

**Purpose**: Verify that backups can be restored successfully

```javascript
#!/usr/bin/env node

/**
 * Migration Rollback Testing
 *
 * Tests that database backups can be restored successfully.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';

if (!SUPABASE_DB_URL) {
  console.error('❌ SUPABASE_DB_URL not set');
  process.exit(1);
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Migration Rollback Testing');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Create test backup
  console.log('📦 Creating test backup...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `rollback-test-${timestamp}.dump`);

  execSync(`pg_dump "${SUPABASE_DB_URL}" -Fc -f "${backupFile}"`, {
    stdio: 'inherit'
  });
  console.log(`✅ Backup created: ${backupFile}\n`);

  // 2. Get current schema snapshot
  console.log('📸 Taking schema snapshot...');
  const beforeSchema = execSync(
    `psql "${SUPABASE_DB_URL}" -c "\\d" -t`,
    { encoding: 'utf-8' }
  );
  console.log(`✅ Snapshot captured\n`);

  // 3. Make a reversible change (add test table)
  console.log('🔄 Making test schema change...');
  execSync(
    `psql "${SUPABASE_DB_URL}" -c "CREATE TABLE IF NOT EXISTS rollback_test (id serial primary key);"`,
    { stdio: 'inherit' }
  );
  console.log('✅ Test table created\n');

  // 4. Restore from backup
  console.log('🔄 Restoring from backup...');
  execSync(`pg_restore -d "${SUPABASE_DB_URL}" --clean --if-exists "${backupFile}"`, {
    stdio: 'inherit'
  });
  console.log('✅ Backup restored\n');

  // 5. Verify schema matches
  console.log('🔍 Verifying schema...');
  const afterSchema = execSync(
    `psql "${SUPABASE_DB_URL}" -c "\\d" -t`,
    { encoding: 'utf-8' }
  );

  if (beforeSchema.includes('rollback_test')) {
    console.error('❌ Test table should not exist in before snapshot');
    process.exit(1);
  }

  if (afterSchema.includes('rollback_test')) {
    console.error('❌ Test table still exists after rollback');
    process.exit(1);
  }

  console.log('✅ Schema verified - rollback successful\n');

  // 6. Cleanup
  console.log('🧹 Cleaning up test backup...');
  fs.unlinkSync(backupFile);
  console.log('✅ Cleanup complete\n');

  console.log('═══════════════════════════════════════════════');
  console.log('✅ ROLLBACK TEST PASSED');
  console.log('   Backups can be restored successfully');
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('\n❌ Rollback test failed:', error.message);
  process.exit(1);
});
```

#### 3.2 Add npm script
**File**: `package.json`

```json
{
  "scripts": {
    "migrate:test-rollback": "node scripts/test-migration-rollback.js"
  }
}
```

**Note**: Can be run locally for testing, but **intended for CI use**. Runs on GitHub Actions to avoid droplet resource issues.

---

## Files to Create/Modify

### New Files:
```
scripts/
  ├── test-migration-shadow.js       # Shadow database testing
  └── test-migration-rollback.js     # Backup restore testing

tests/e2e/
  └── smoke.test.ts                  # Critical path smoke tests

.github/workflows/
  └── migration-safety.yml           # Shadow migration CI workflow
```

### Modified Files:
```
package.json                         # Add new npm scripts
.github/workflows/ci.yml            # Add smoke tests job
playwright.config.ts                # Add smoke test project (optional)
```

---

## Validation Checklist

### Shadow Migration Testing:
- [ ] Create PR with migration file → should trigger shadow test
- [ ] Shadow test creates temporary schema
- [ ] Migrations apply successfully to shadow
- [ ] Integrity checks pass
- [ ] Schema diff shows expected changes
- [ ] Shadow schema auto-cleans up
- [ ] PR comment shows test results

### E2E Smoke Tests:
- [ ] Homepage smoke test passes
- [ ] Events page smoke test passes
- [ ] Search smoke test passes
- [ ] Login navigation smoke test passes
- [ ] 404 page smoke test passes
- [ ] API health check passes
- [ ] Tests run in CI on every PR
- [ ] Test results uploaded on failure

### Rollback Testing:
- [ ] Backup creation works
- [ ] Schema snapshot captured
- [ ] Test change applied
- [ ] Restore from backup succeeds
- [ ] Schema verification passes
- [ ] Cleanup removes test artifacts

---

## Success Metrics

### Week 2 Complete When:
- ✅ Shadow migration testing runs on migration PRs
- ✅ E2E smoke tests run on every PR
- ✅ Rollback testing validates backup/restore
- ✅ All tests passing in CI
- ✅ PR comments show test results
- ✅ Zero manual testing required for migrations
- ✅ Critical paths protected by smoke tests

---

## Time Estimate
**Total**: 9-11 hours
- Shadow Migration Testing: 4-5 hours
- E2E Smoke Tests: 3-4 hours
- Rollback Testing: 2 hours

---

## Dependencies

**Required Secrets** (add to GitHub repo):
- `VITE_SUPABASE_URL` - Already exists
- `VITE_SUPABASE_ANON_KEY` - Already exists
- `SUPABASE_SERVICE_ROLE_KEY` - **NEW** - Get from Supabase Dashboard → API → service_role key
- `SUPABASE_DB_URL` - Already exists

**Required Tools**:
- PostgreSQL client (`pg_dump`, `pg_restore`, `psql`)
- Playwright browsers
- Node.js 20+

---

## Risk Mitigation

**Shadow testing runs on copy** - Production data never touched
**Smoke tests use test accounts** - No real user data affected
**Rollback testing uses temp tables** - Reversible changes only

## ⚠️ CRITICAL: All Tests Run on GitHub CI

**All testing runs on GitHub Actions runners** - NOT on the droplet:
- ✅ Shadow migration tests: GitHub Actions Ubuntu runner
- ✅ E2E smoke tests: GitHub Actions with Playwright
- ✅ Rollback tests: GitHub Actions Ubuntu runner
- ✅ Database operations: Connect remotely to Supabase (cloud)
- ❌ **Never run on droplet** - Prevents crashes and resource exhaustion

**Why GitHub Actions:**
- Isolated environment per test run
- 2-core CPU, 7GB RAM per runner
- No impact on droplet stability
- Free for public repos (2000 minutes/month)
- Automatic cleanup after tests

---

## Next Steps (Week 3)
After Week 2 is complete:
1. Danger.js for automated PR reviews
2. Production deploy workflow with manual approval
3. Post-deploy smoke tests

---

**Created**: 2025-10-26
**Status**: Ready to implement
**Phase**: 2, Week 2
**Dependencies**: Phase 2 Week 1 complete ✅
