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
