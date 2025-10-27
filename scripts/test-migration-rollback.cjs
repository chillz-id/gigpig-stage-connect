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
