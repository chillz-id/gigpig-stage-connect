#!/usr/bin/env node

/**
 * Database Integrity Check Script
 * Checks database structure and critical data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table ${tableName}: ${error.message}`);
      return false;
    }
    console.log(`✅ Table ${tableName}: EXISTS`);
    return true;
  } catch (err) {
    console.log(`❌ Table ${tableName}: ${err.message}`);
    return false;
  }
}

async function checkTableCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Count ${tableName}: ${error.message}`);
      return 0;
    }
    console.log(`📊 Count ${tableName}: ${count} records`);
    return count;
  } catch (err) {
    console.log(`❌ Count ${tableName}: ${err.message}`);
    return 0;
  }
}

async function checkRLSPolicies() {
  try {
    // Check if we can query system tables
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ RLS Policies: Cannot access system tables (${error.message})`);
      return false;
    }
    console.log(`✅ RLS Policies: Can access system tables`);
    return true;
  } catch (err) {
    console.log(`❌ RLS Policies: ${err.message}`);
    return false;
  }
}

async function checkAuthStatus() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log(`❌ Auth Status: ${error.message}`);
      return false;
    }
    
    if (user) {
      console.log(`✅ Auth Status: User logged in (${user.email})`);
      return true;
    } else {
      console.log(`⚠️  Auth Status: No user logged in`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Auth Status: ${err.message}`);
    return false;
  }
}

async function runDatabaseIntegrityCheck() {
  console.log('🔍 Starting Database Integrity Check...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    tables: {},
    auth: {},
    overall: 'PASS'
  };
  
  // Core tables to check
  const coreTables = [
    'profiles',
    'events',
    'applications',
    'invoices',
    'vouches',
    'notifications',
    'event_spots',
    'event_applications'
  ];
  
  console.log('📋 Checking table existence...');
  for (const table of coreTables) {
    const exists = await checkTableExists(table);
    results.tables[table] = { exists };
    if (!exists) results.overall = 'FAIL';
  }
  
  console.log('\n📊 Checking table data...');
  for (const table of coreTables) {
    if (results.tables[table].exists) {
      const count = await checkTableCount(table);
      results.tables[table].count = count;
    }
  }
  
  console.log('\n🔐 Checking authentication...');
  results.auth.userLoggedIn = await checkAuthStatus();
  
  console.log('\n🛡️  Checking RLS policies...');
  results.auth.rlsAccess = await checkRLSPolicies();
  
  // Critical checks
  console.log('\n🚨 Critical Checks:');
  
  // Check if profiles table has data
  if (results.tables.profiles && results.tables.profiles.count === 0) {
    console.log('❌ CRITICAL: No profiles found - profile creation may be broken');
    results.overall = 'CRITICAL';
  }
  
  // Check if events table has data
  if (results.tables.events && results.tables.events.count === 0) {
    console.log('⚠️  WARNING: No events found - event creation may be broken');
    if (results.overall === 'PASS') results.overall = 'WARNING';
  }
  
  // Save results
  fs.writeFileSync(
    './database-integrity-report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📋 Summary:');
  console.log(`Overall Status: ${results.overall}`);
  console.log(`Tables Checked: ${Object.keys(results.tables).length}`);
  console.log(`Tables Exist: ${Object.values(results.tables).filter(t => t.exists).length}`);
  console.log(`Report saved to: database-integrity-report.json`);
  
  return results;
}

// Run check if called directly
if (require.main === module) {
  runDatabaseIntegrityCheck()
    .then(results => {
      const exitCode = results.overall === 'CRITICAL' ? 2 : 
                       results.overall === 'FAIL' ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Database check failed:', error);
      process.exit(1);
    });
}

module.exports = { runDatabaseIntegrityCheck };