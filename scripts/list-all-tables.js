#!/usr/bin/env node

/**
 * List all tables in the database
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

async function listAllTables() {
  console.log('🔍 Checking available tables...\n');

  try {
    // Try to get a list of tables by attempting to query them
    const possibleTables = [
      'ticket_sales',
      'humanitix_sales', 
      'eventbrite_sales',
      'orders',
      'sales',
      'purchases',
      'transactions',
      'events',
      'profiles',
      'customers'
    ];

    const existingTables = [];

    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error) {
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          existingTables.push({ name: tableName, count });
          console.log(`✅ ${tableName} (${count} records)`);
          
          // Show sample structure for the first few records
          if (data && data.length > 0) {
            console.log(`   Sample fields: ${Object.keys(data[0]).slice(0, 5).join(', ')}...`);
          }
        }
      } catch (e) {
        // Table doesn't exist, skip
      }
    }

    if (existingTables.length === 0) {
      console.log('❌ No ticket-related tables found');
      console.log('\n🔍 Let me check if customers table exists...');
      
      try {
        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        console.log(`✅ customers table exists with ${count} records`);
      } catch (e) {
        console.log('❌ customers table not found either');
      }
    } else {
      console.log(`\n📊 Found ${existingTables.length} relevant tables`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
listAllTables().catch(console.error);