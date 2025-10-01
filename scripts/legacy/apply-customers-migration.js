#!/usr/bin/env node

/**
 * Apply Customers Table Migration
 * Creates the customers table and related functions using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyMigration() {
  console.log('📊 Applying customers table migration...\n');

  try {
    // Read the migration file
    const migrationSQL = await fs.readFile('supabase/migrations/20250808_create_customers_table.sql', 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`Executing statement ${i + 1}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          console.log(`❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
        errorCount++;
      }

      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n=== Migration Summary ===`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      
      // Test the customers table
      console.log('\n🧪 Testing customers table...');
      const { data, error } = await supabase
        .from('customers')
        .select('count')
        .limit(1);

      if (error) {
        console.log(`❌ Table test failed: ${error.message}`);
      } else {
        console.log('✅ Customers table is ready!');
      }
    }

  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

applyMigration().catch(console.error);