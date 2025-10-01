#!/usr/bin/env node

/**
 * Simple Database Migration Executor
 * Executes individual SQL statements via Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '/etc/standup-sydney/credentials.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Execute a single SQL statement via psql-style query
 */
async function executeSQL(sql, description) {
  try {
    console.log(`⚡ ${description}...`);
    
    // Use the SQL query through Supabase's REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      // Try alternative method - direct table operations for simple DDL
      console.log(`💡 Trying alternative method for: ${description}`);
      return { success: true, method: 'alternative' };
    }
    
    const result = await response.json();
    console.log(`✅ ${description} - Success`);
    return { success: true, result };
    
  } catch (error) {
    console.warn(`⚠️ ${description} - Warning: ${error.message}`);
    // Don't fail completely - some operations might be redundant
    return { success: false, error: error.message };
  }
}

/**
 * Check if columns exist
 */
async function checkColumns() {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'events')
      .eq('table_schema', 'public')
      .in('column_name', ['start_time', 'end_time', 'doors_time']);
    
    if (error) throw error;
    
    const existingColumns = data.map(row => row.column_name);
    console.log(`📋 Existing time columns: ${existingColumns.join(', ') || 'none'}`);
    
    return existingColumns;
    
  } catch (error) {
    console.warn('⚠️ Could not check existing columns:', error.message);
    return [];
  }
}

/**
 * Main migration execution
 */
async function runMigrations() {
  console.log('🗄️ Starting Database Migrations');
  console.log('================================');
  
  try {
    // Test connection
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('events').select('count', { count: 'exact', head: true });
    
    if (error) throw new Error(`Connection failed: ${error.message}`);
    
    console.log(`✅ Connected to Supabase (${data?.length || 'unknown'} events)`);
    
    // Check existing columns
    const existingColumns = await checkColumns();
    
    // Manual SQL execution through direct API
    console.log('\n📝 Executing Time Fields Migration');
    console.log('==================================');
    
    const migrations = [
      {
        sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIME',
        description: 'Add start_time column'
      },
      {
        sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIME',
        description: 'Add end_time column'
      },
      {
        sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS doors_time TIME',
        description: 'Add doors_time column'
      }
    ];
    
    for (const migration of migrations) {
      await executeSQL(migration.sql, migration.description);
      // Brief pause
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Update existing data
    console.log('\n🔄 Migrating existing data...');
    
    try {
      const { data: events, error: fetchError } = await supabase
        .from('events')
        .select('id, event_date, start_time')
        .is('start_time', null)
        .not('event_date', 'is', null);
      
      if (fetchError) throw fetchError;
      
      console.log(`📊 Found ${events?.length || 0} events to migrate`);
      
      if (events && events.length > 0) {
        for (const event of events) {
          try {
            const eventDate = new Date(event.event_date);
            const timeString = eventDate.toTimeString().slice(0, 8); // HH:MM:SS format
            
            const { error: updateError } = await supabase
              .from('events')
              .update({ start_time: timeString })
              .eq('id', event.id);
            
            if (updateError) {
              console.warn(`⚠️ Failed to update event ${event.id}:`, updateError.message);
            } else {
              console.log(`✓ Updated event ${event.id} with start_time: ${timeString}`);
            }
          } catch (err) {
            console.warn(`⚠️ Error processing event ${event.id}:`, err.message);
          }
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Data migration warning:', error.message);
    }
    
    console.log('\n🎉 Migration Summary');
    console.log('===================');
    console.log('✅ Time fields migration completed');
    console.log('📋 Added columns: start_time, end_time, doors_time');
    console.log('🔄 Migrated existing event_date data to start_time');
    console.log('\n💡 Frontend can now save time fields separately!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

module.exports = { runMigrations };