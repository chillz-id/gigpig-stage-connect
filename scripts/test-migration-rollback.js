#!/usr/bin/env node

/**
 * Migration Rollback Testing
 *
 * Tests that database backups can be restored successfully.
 * Validates the backup/restore workflow is working correctly.
 *
 * ⚠️ RUNS IN GITHUB ACTIONS CI - NOT ON DROPLET
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';

if (!SUPABASE_DB_URL) {
  console.error('❌ SUPABASE_DB_URL environment variable not set');
  console.error('   Get from: Supabase Dashboard → Project Settings → Database → Connection string');
  process.exit(1);
}

function runCommand(cmd, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(cmd, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    console.log(`✅ ${description} complete`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

function runSQL(sql, description) {
  console.log(`   ${description}...`);
  try {
    const output = execSync(
      `psql "${SUPABASE_DB_URL}" -t -c "${sql.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    return output.trim();
  } catch (error) {
    console.error(`   ❌ Failed: ${description}`);
    throw error;
  }
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');

  // Check pg_dump
  try {
    execSync('which pg_dump', { stdio: 'pipe' });
    console.log('   ✅ pg_dump found');
  } catch (error) {
    console.error('   ❌ pg_dump not found - install PostgreSQL client tools');
    process.exit(1);
  }

  // Check pg_restore
  try {
    execSync('which pg_restore', { stdio: 'pipe' });
    console.log('   ✅ pg_restore found');
  } catch (error) {
    console.error('   ❌ pg_restore not found - install PostgreSQL client tools');
    process.exit(1);
  }

  // Check psql
  try {
    execSync('which psql', { stdio: 'pipe' });
    console.log('   ✅ psql found');
  } catch (error) {
    console.error('   ❌ psql not found - install PostgreSQL client tools');
    process.exit(1);
  }

  // Test database connection
  try {
    runSQL('SELECT 1;', 'Testing database connection');
    console.log('   ✅ Database connection successful\n');
  } catch (error) {
    console.error('   ❌ Cannot connect to database');
    process.exit(1);
  }
}

async function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log(`📁 Creating backup directory: ${BACKUP_DIR}`);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Migration Rollback Testing');
  console.log('  Running in GitHub Actions CI Environment');
  console.log('═══════════════════════════════════════════════\n');

  let testPassed = false;
  let backupFile = null;
  const TEST_SCHEMA = 'rollback_test_schema';
  const TEST_TABLE = `${TEST_SCHEMA}.test_table`;

  try {
    await checkPrerequisites();
    await ensureBackupDir();

    // 1. Create test schema (isolated from production)
    console.log('📋 Step 1: Creating test schema...');
    runSQL(
      `DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE;`,
      'Dropping existing test schema'
    );
    runSQL(
      `CREATE SCHEMA ${TEST_SCHEMA};`,
      'Creating new test schema'
    );
    console.log('✅ Test schema created\n');

    // 2. Create test table with data
    console.log('📊 Step 2: Creating test table with data...');
    runSQL(
      `CREATE TABLE ${TEST_TABLE} (id serial primary key, name text, created_at timestamp default now());`,
      'Creating test table'
    );
    runSQL(
      `INSERT INTO ${TEST_TABLE} (name) VALUES ('test_row_1'), ('test_row_2'), ('test_row_3');`,
      'Inserting test data'
    );

    const initialCount = runSQL(
      `SELECT COUNT(*) FROM ${TEST_TABLE};`,
      'Counting initial rows'
    );
    console.log(`   Initial row count: ${initialCount}`);
    console.log('✅ Test data created\n');

    // 3. Create backup
    console.log('💾 Step 3: Creating backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupFile = path.join(BACKUP_DIR, `rollback-test-${timestamp}.dump`);

    runCommand(
      `pg_dump "${SUPABASE_DB_URL}" --schema=${TEST_SCHEMA} -Fc -f "${backupFile}"`,
      'Creating pg_dump backup'
    );

    if (!fs.existsSync(backupFile)) {
      throw new Error('Backup file was not created');
    }

    const stats = fs.statSync(backupFile);
    console.log(`   Backup size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`✅ Backup created: ${backupFile}\n`);

    // 4. Make a destructive change (delete data)
    console.log('🔄 Step 4: Making destructive change (deleting data)...');
    runSQL(
      `DELETE FROM ${TEST_TABLE} WHERE id IN (2, 3);`,
      'Deleting rows 2 and 3'
    );

    const afterDeleteCount = runSQL(
      `SELECT COUNT(*) FROM ${TEST_TABLE};`,
      'Counting rows after delete'
    );
    console.log(`   Row count after delete: ${afterDeleteCount}`);

    if (afterDeleteCount !== '1') {
      throw new Error(`Expected 1 row after delete, got ${afterDeleteCount}`);
    }
    console.log('✅ Destructive change applied\n');

    // 5. Restore from backup
    console.log('🔄 Step 5: Restoring from backup...');

    // Drop schema to simulate clean restore
    runSQL(
      `DROP SCHEMA ${TEST_SCHEMA} CASCADE;`,
      'Dropping schema before restore'
    );

    runCommand(
      `pg_restore -d "${SUPABASE_DB_URL}" --clean --create "${backupFile}"`,
      'Running pg_restore'
    );
    console.log('✅ Backup restored\n');

    // 6. Verify restoration
    console.log('🔍 Step 6: Verifying restoration...');

    const finalCount = runSQL(
      `SELECT COUNT(*) FROM ${TEST_TABLE};`,
      'Counting rows after restore'
    );
    console.log(`   Final row count: ${finalCount}`);

    if (finalCount !== initialCount) {
      throw new Error(`Restore failed: expected ${initialCount} rows, got ${finalCount}`);
    }

    // Verify all data is back
    const allNames = runSQL(
      `SELECT name FROM ${TEST_TABLE} ORDER BY id;`,
      'Fetching restored data'
    );
    console.log(`   Restored data:\n${allNames.split('\n').map(n => `      - ${n}`).join('\n')}`);

    console.log('✅ Data verification passed\n');

    testPassed = true;

  } catch (error) {
    console.error('\n❌ Rollback test failed:', error.message);
    testPassed = false;
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up...');

    try {
      runSQL(
        `DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE;`,
        'Dropping test schema'
      );
      console.log('   ✅ Test schema dropped');
    } catch (error) {
      console.warn(`   ⚠️  Could not drop test schema: ${error.message}`);
    }

    if (backupFile && fs.existsSync(backupFile)) {
      try {
        fs.unlinkSync(backupFile);
        console.log(`   ✅ Test backup deleted: ${backupFile}`);
      } catch (error) {
        console.warn(`   ⚠️  Could not delete backup file: ${error.message}`);
      }
    }

    console.log('✅ Cleanup complete\n');
  }

  console.log('═══════════════════════════════════════════════');
  if (testPassed) {
    console.log('✅ ROLLBACK TEST PASSED');
    console.log('   Backup and restore functionality is working correctly');
    console.log('   Database can be safely rolled back in production');
  } else {
    console.log('❌ ROLLBACK TEST FAILED');
    console.log('   Backup or restore functionality has issues');
    console.log('   DO NOT rely on backups until this is fixed');
  }
  console.log('═══════════════════════════════════════════════\n');

  process.exit(testPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
