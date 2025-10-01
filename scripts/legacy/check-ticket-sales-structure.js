#!/usr/bin/env node

/**
 * Check ticket_sales table structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkTicketSalesStructure() {
  console.log('🔍 Checking ticket_sales table structure...\n');

  try {
    // First check if table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'ticket_sales');

    if (tableError) {
      console.error('❌ Error checking tables:', tableError);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('❌ ticket_sales table does not exist');
      
      // Check what ticket-related tables exist
      const { data: allTables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%ticket%');
        
      console.log('🔍 Available ticket-related tables:', allTables?.map(t => t.table_name) || 'None');
      return;
    }

    console.log('✅ ticket_sales table exists');

    // Get column information
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'ticket_sales')
      .order('ordinal_position');

    if (colError) {
      console.error('❌ Error getting columns:', colError);
      return;
    }

    console.log('\n📋 ticket_sales table columns:');
    columns?.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('ticket_sales')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error getting sample data:', sampleError);
    } else {
      console.log('\n📊 Sample record:');
      console.log(JSON.stringify(sampleData?.[0] || 'No data', null, 2));
    }

    // Get count
    const { count, error: countError } = await supabase
      .from('ticket_sales')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error getting count:', countError);
    } else {
      console.log(`\n📈 Total records: ${count}`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkTicketSalesStructure().catch(console.error);