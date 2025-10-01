#!/usr/bin/env node

/**
 * Check Events Table Schema
 * Queries the events table to see current column structure
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

async function checkEventsSchema() {
  try {
    console.log('🔍 Checking events table schema...\n');
    
    // Get one event to see the current structure
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying events:', error.message);
      return;
    }
    
    if (events && events.length > 0) {
      const columns = Object.keys(events[0]);
      console.log('📋 Current events table columns:');
      columns.forEach((col, i) => {
        console.log(`  ${i + 1}. ${col}`);
      });
      
      // Check for time fields specifically
      const timeFields = ['start_time', 'end_time', 'doors_time'];
      const missingFields = timeFields.filter(field => !columns.includes(field));
      
      console.log('\n⏰ Time fields status:');
      timeFields.forEach(field => {
        const exists = columns.includes(field);
        console.log(`  ${exists ? '✅' : '❌'} ${field}: ${exists ? 'EXISTS' : 'MISSING'}`);
      });
      
      if (missingFields.length > 0) {
        console.log(`\n🚨 Migration needed for: ${missingFields.join(', ')}`);
      } else {
        console.log('\n✅ All time fields are present!');
      }
    } else {
      console.log('📋 No events found in table');
    }
    
    // Try to get schema information via information_schema if possible
    console.log('\n🔍 Attempting to get detailed schema info...');
    
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'events' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (schemaError) {
      console.log('⚠️  Could not get detailed schema info:', schemaError.message);
    } else if (schemaData) {
      console.log('📊 Detailed schema:');
      schemaData.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkEventsSchema().then(() => {
  console.log('\n✅ Schema check complete');
}).catch(console.error);