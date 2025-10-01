#!/usr/bin/env node

/**
 * Check Database Columns
 * Verify if time columns exist in events table
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '/etc/standup-sydney/credentials.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkColumns() {
  try {
    console.log('🔍 Checking events table structure...');
    
    // Try to select the time columns to see if they exist
    const { data, error } = await supabase
      .from('events')
      .select('id, event_date, start_time, end_time, doors_time')
      .limit(1);
    
    if (error) {
      console.error('❌ Error checking columns:', error.message);
      
      // If specific columns don't exist, the error will mention them
      if (error.message.includes('start_time') || 
          error.message.includes('end_time') || 
          error.message.includes('doors_time')) {
        console.log('📝 Time columns do not exist - need to add them');
        return false;
      }
    } else {
      console.log('✅ Time columns exist and are accessible');
      console.log('📊 Sample data structure:', data?.[0] ? Object.keys(data[0]) : 'No events found');
      return true;
    }
    
  } catch (err) {
    console.error('💥 Check failed:', err.message);
    return false;
  }
}

async function manualMigration() {
  console.log('\n🛠️ Attempting manual column addition...');
  
  // Try using Supabase's REST API for DDL operations
  try {
    const statements = [
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIME;',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIME;',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS doors_time TIME;'
    ];
    
    for (const statement of statements) {
      console.log(`⚡ Executing: ${statement}`);
      
      // Use fetch to hit Supabase's SQL endpoint directly
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({ query: statement })
      });
      
      if (response.ok) {
        console.log('✅ Statement executed successfully');
      } else {
        console.log(`⚠️ Statement response: ${response.status} ${response.statusText}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Manual migration failed:', error.message);
  }
}

async function main() {
  console.log('🗄️ Database Column Verification');
  console.log('==============================');
  
  const columnsExist = await checkColumns();
  
  if (!columnsExist) {
    await manualMigration();
    
    // Check again
    console.log('\n🔄 Verifying after migration...');
    await checkColumns();
  }
  
  // Show current events count
  try {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`\n📊 Total events in database: ${count}`);
    }
  } catch (err) {
    console.log('⚠️ Could not get events count');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkColumns };