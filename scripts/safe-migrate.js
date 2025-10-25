#!/usr/bin/env node
/**
 * Safe Migration Script for Stand Up Sydney
 *
 * Features:
 * - Advisory lock to prevent concurrent migrations
 * - Automatic backup before migration (pg_dump)
 * - Transaction wrapping for atomicity
 * - Guards against destructive operations (DROP COLUMN)
 * - Rollback on error
 *
 * Usage:
 *   node scripts/safe-migrate.js
 *
 * Environment:
 *   SUPABASE_DB_URL - Direct database URL (postgres://...)
 *   BACKUP_DIR - Directory for backups (default: ./backups)
 *   DRY_RUN - Set to 'true' to preview without applying (default: false)
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DB_URL = process.env.SUPABASE_DB_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(__dirname, '../backups');
const DRY_RUN = process.env.DRY_RUN === 'true';
const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations');

// Advisory lock ID for migrations (unique to this app)
const ADVISORY_LOCK_ID = 987654321;

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function error(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warn(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * Validate environment and dependencies
 */
function validateEnvironment() {
  if (!DB_URL) {
    error('Missing SUPABASE_DB_URL environment variable');
    error('Set it to your direct Postgres connection string:');
    error('  export SUPABASE_DB_URL="postgres://postgres:[password]@[host]:[port]/postgres"');
    process.exit(1);
  }

  // Check if pg_dump is available
  try {
    execSync('pg_dump --version', { stdio: 'ignore' });
  } catch (e) {
    error('pg_dump not found. Install PostgreSQL client tools:');
    error('  Ubuntu/Debian: sudo apt-get install postgresql-client');
    error('  macOS: brew install postgresql');
    process.exit(1);
  }

  // Check migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    info(`Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Create database backup using pg_dump
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `pre-migrate-${timestamp}.dump`);

  info(`Creating backup: ${backupFile}`);

  try {
    execSync(
      `pg_dump --format=custom --no-owner --dbname="${DB_URL}" -f "${backupFile}"`,
      { stdio: 'inherit' }
    );
    success(`Backup created: ${backupFile}`);
    return backupFile;
  } catch (e) {
    error('Backup failed!');
    throw e;
  }
}

/**
 * Get list of migration files to apply
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Alphabetical order (relies on YYYYMMDD naming)

  return files;
}

/**
 * Check migration for destructive operations
 */
function checkDestructiveOperations(filename, sql) {
  const destructivePatterns = [
    { pattern: /\bDROP\s+COLUMN\b/i, operation: 'DROP COLUMN' },
    { pattern: /\bDROP\s+TABLE\b/i, operation: 'DROP TABLE' },
    { pattern: /\bTRUNCATE\b/i, operation: 'TRUNCATE' },
  ];

  const issues = [];

  for (const { pattern, operation } of destructivePatterns) {
    if (pattern.test(sql)) {
      // Check if explicitly allowed
      if (!/--\s*ALLOW_DROP/i.test(sql)) {
        issues.push(operation);
      }
    }
  }

  return issues;
}

/**
 * Apply migrations with safety checks
 */
async function applyMigrations() {
  const client = new Client({ connectionString: DB_URL });
  let backupFile = null;

  try {
    await client.connect();
    info('Connected to database');

    // Acquire advisory lock (prevents concurrent migrations)
    info(`Acquiring advisory lock (ID: ${ADVISORY_LOCK_ID})...`);
    const lockResult = await client.query(
      'SELECT pg_try_advisory_lock($1) as locked',
      [ADVISORY_LOCK_ID]
    );

    if (!lockResult.rows[0].locked) {
      error('Could not acquire advisory lock');
      error('Another migration may be running. Wait and try again.');
      process.exit(1);
    }

    success('Advisory lock acquired');

    // Create backup before any changes
    if (!DRY_RUN) {
      backupFile = createBackup();
    } else {
      warn('DRY RUN: Skipping backup');
    }

    // Get migration files
    const files = getMigrationFiles();

    if (files.length === 0) {
      info('No migration files found');
      return;
    }

    info(`Found ${files.length} migration file(s)`);

    // Check for destructive operations first
    const destructiveFiles = [];
    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const issues = checkDestructiveOperations(file, sql);
      if (issues.length > 0) {
        destructiveFiles.push({ file, issues });
      }
    }

    if (destructiveFiles.length > 0) {
      error('Destructive operations detected:');
      for (const { file, issues } of destructiveFiles) {
        error(`  ${file}: ${issues.join(', ')}`);
      }
      error('');
      error('To allow these operations, add a comment: -- ALLOW_DROP');
      error('Example:');
      error('  -- ALLOW_DROP: Removing deprecated column after data migration');
      error('  ALTER TABLE users DROP COLUMN old_field;');
      process.exit(1);
    }

    // Begin transaction
    info('Starting transaction...');
    await client.query('BEGIN');

    // Apply each migration
    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      info(`Applying: ${file}`);

      if (DRY_RUN) {
        warn(`DRY RUN: Would execute ${file}`);
        console.log('---');
        console.log(sql.substring(0, 500) + (sql.length > 500 ? '...' : ''));
        console.log('---');
      } else {
        try {
          await client.query(sql);
          success(`Applied: ${file}`);
        } catch (e) {
          error(`Migration failed: ${file}`);
          error(e.message);
          throw e;
        }
      }
    }

    // Commit transaction
    if (DRY_RUN) {
      warn('DRY RUN: Would commit transaction');
      await client.query('ROLLBACK');
    } else {
      info('Committing transaction...');
      await client.query('COMMIT');
      success('All migrations applied successfully!');
    }

  } catch (e) {
    error('Migration failed! Rolling back...');
    try {
      await client.query('ROLLBACK');
      warn('Transaction rolled back');
    } catch (rollbackError) {
      error('Rollback failed!');
      error(rollbackError.message);
    }

    if (backupFile) {
      warn('');
      warn('To restore from backup:');
      warn(`  pg_restore --dbname="$SUPABASE_DB_URL" "${backupFile}"`);
    }

    process.exit(1);
  } finally {
    // Release advisory lock
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_ID]);
      info('Advisory lock released');
    } catch (e) {
      warn('Could not release advisory lock (connection may have closed)');
    }

    await client.end();
  }
}

/**
 * Main execution
 */
async function main() {
  log('', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  log('  Safe Migration Script - Stand Up Sydney', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  log('', 'blue');

  if (DRY_RUN) {
    warn('DRY RUN MODE: Changes will NOT be applied');
    log('');
  }

  validateEnvironment();
  await applyMigrations();

  log('');
  success('Migration process complete!');
  log('');
}

main().catch(e => {
  error('Unexpected error:');
  console.error(e);
  process.exit(1);
});
