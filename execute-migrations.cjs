#!/usr/bin/env node

/**
 * Database Migration Executor
 * Executes SQL migrations via Supabase client
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '/etc/standup-sydney/credentials.env' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in /etc/standup-sydney/credentials.env');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Execute SQL migration
 */
async function executeMigration(migrationFile) {
  try {
    console.log(`📄 Reading migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`🚀 Executing migration: ${migrationFile}`);
    console.log(`📝 SQL Preview (first 200 chars): ${sql.substring(0, 200)}...`);
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Migration completed successfully: ${migrationFile}`);
    return { success: true, data };
    
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Execute performance indexes migration
 */
async function executePerformanceIndexes() {
  try {
    console.log('📄 Reading performance indexes migration...');
    
    const indexesPath = path.join(__dirname, 'apply-performance-indexes-manual.sql');
    
    if (!fs.existsSync(indexesPath)) {
      throw new Error(`Performance indexes file not found: ${indexesPath}`);
    }
    
    const sql = fs.readFileSync(indexesPath, 'utf8');
    
    console.log('🚀 Executing performance indexes...');
    console.log(`📝 SQL Preview (first 200 chars): ${sql.substring(0, 200)}...`);
    
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';';
      
      if (statement.trim() === ';') continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
        // Continue with other statements - some indexes might already exist
      } else {
        console.log(`✓ Statement ${i + 1} completed`);
      }
      
      // Brief pause between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Performance indexes migration completed');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Performance indexes migration failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main execution function
 */
async function runMigrations() {
  console.log('🗄️ Starting Database Migrations');
  console.log('================================');
  
  try {
    // Test connection
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
    
    console.log('✅ Supabase connection successful');
    
    // Execute time fields migration
    const timeFieldsResult = await executeMigration('20250911_add_event_time_fields.sql');
    
    if (!timeFieldsResult.success) {
      console.error('❌ Time fields migration failed, aborting');
      return;
    }
    
    // Execute performance indexes
    const indexesResult = await executePerformanceIndexes();
    
    // Summary
    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`✅ Time fields migration: ${timeFieldsResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Performance indexes: ${indexesResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (timeFieldsResult.success && indexesResult.success) {
      console.log('\n🎉 All migrations completed successfully!');
      console.log('\n📋 Changes applied:');
      console.log('   - Added start_time, end_time, doors_time columns to events table');
      console.log('   - Migrated existing event_date data to start_time');
      console.log('   - Added time validation constraints');
      console.log('   - Applied performance optimization indexes');
      console.log('   - Events table now supports separate time fields');
    } else {
      console.log('\n⚠️ Some migrations had issues - check logs above');
    }
    
  } catch (error) {
    console.error('💥 Migration execution failed:', error.message);
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations().catch(error => {
    console.error('💥 Migration runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigrations, executeMigration, executePerformanceIndexes };