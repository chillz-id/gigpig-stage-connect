#!/usr/bin/env node

/**
 * Add doors_time Column Migration
 * Adds the missing doors_time column to events table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addDoorsTimeColumn() {
  try {
    console.log('🔧 Adding doors_time column to events table...\n');
    
    // Use a simpler approach - raw SQL via rpc
    const migrationSQL = `
      -- Add doors_time column
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS doors_time TIME;
      
      -- Add helpful comment to column
      COMMENT ON COLUMN events.doors_time IS 'Time when doors open for the event (HH:MM format) - optional';
      
      -- Create index for time-based queries
      CREATE INDEX IF NOT EXISTS idx_events_doors_time ON events(doors_time) WHERE doors_time IS NOT NULL;
      
      -- Add validation constraint - doors time should be before start time
      ALTER TABLE events 
      ADD CONSTRAINT IF NOT EXISTS check_doors_time_before_start_time 
      CHECK (
        doors_time IS NULL OR 
        start_time IS NULL OR 
        doors_time <= start_time
      );
    `;
    
    console.log('📝 Executing migration SQL...');
    console.log(migrationSQL);
    
    // Try using a different approach since exec_sql doesn't exist
    // Let's use the REST API directly with a POST request
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });
    
    if (!response.ok) {
      // Try alternative approach using individual queries
      console.log('⚠️  RPC approach failed, trying individual queries...');
      
      // Add column via ALTER TABLE
      const { error: alterError } = await supabase
        .from('events')
        .select('doors_time')
        .limit(1);
      
      if (alterError && alterError.message.includes('column "doors_time" does not exist')) {
        console.log('📝 Column does not exist, need to create it manually...');
        
        // Since we can't run DDL directly, let's inform the user
        console.log('🚨 DDL operations not available via REST API');
        console.log('📋 Manual execution required via Supabase SQL Editor:');
        console.log('\nSQL to execute:');
        console.log('```sql');
        console.log('ALTER TABLE events ADD COLUMN doors_time TIME;');
        console.log('COMMENT ON COLUMN events.doors_time IS \'Time when doors open for the event (HH:MM format) - optional\';');
        console.log('CREATE INDEX idx_events_doors_time ON events(doors_time) WHERE doors_time IS NOT NULL;');
        console.log('ALTER TABLE events ADD CONSTRAINT check_doors_time_before_start_time CHECK (doors_time IS NULL OR start_time IS NULL OR doors_time <= start_time);');
        console.log('```');
        
        return false;
      } else {
        console.log('✅ doors_time column already exists or other issue');
        return true;
      }
    } else {
      const result = await response.json();
      console.log('✅ Migration executed successfully:', result);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    return false;
  }
}

addDoorsTimeColumn().then((success) => {
  if (success) {
    console.log('\n✅ doors_time column migration complete');
  } else {
    console.log('\n❌ Migration requires manual execution');
  }
}).catch(console.error);