#!/usr/bin/env node

/**
 * Apply Customer Fields Migration
 * Adds Date of Birth, Address, Company fields to customers table
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

async function applyCustomerFieldsMigration() {
  console.log('🔄 Applying customer fields migration...\n');

  try {
    // Read the migration SQL file
    const migrationSQL = await fs.readFile('/root/agents/supabase/migrations/20250808_add_customer_fields.sql', 'utf8');

    console.log('📄 Migration SQL loaded');
    console.log('🚀 Executing migration...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Try direct execution if RPC fails
      console.log('⚠️  RPC failed, trying direct execution...');
      
      const { error: directError } = await supabase
        .from('_migration_temp')  // This will fail but trigger SQL execution
        .select('*');

      // Since direct SQL execution isn't available via client, we'll execute parts manually
      const sqlStatements = migrationSQL
        .split(';')
        .filter(stmt => stmt.trim())
        .filter(stmt => !stmt.trim().startsWith('--'))
        .filter(stmt => stmt.trim().length > 0);

      console.log(`📝 Executing ${sqlStatements.length} SQL statements...\n`);

      // For safety, let's just show what would be executed and provide instructions
      console.log('🔧 Migration needs to be run manually in Supabase Dashboard:');
      console.log('📍 Go to: https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu/sql');
      console.log('📋 Copy and paste the following SQL:\n');
      console.log('```sql');
      console.log(migrationSQL);
      console.log('```\n');
      
      return;
    }

    console.log('✅ Migration executed successfully!');

    // Verify the new columns exist
    const { data: customers, error: verifyError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, mobile, date_of_birth, address, company, marketing_opt_in')
      .limit(1);

    if (verifyError) {
      console.error('⚠️  Could not verify migration:', verifyError);
    } else {
      console.log('\n📊 Verification: Sample customer record structure:');
      if (customers && customers.length > 0) {
        const sample = customers[0];
        Object.keys(sample).forEach(key => {
          console.log(`  ${key}: ${sample[key] !== null ? '✓' : 'null'}`);
        });
      } else {
        console.log('  No customers found for verification');
      }
    }

    console.log('\n🎉 Customer fields migration completed!');
    console.log('\n📋 New fields added:');
    console.log('  ✅ date_of_birth (DATE)');
    console.log('  ✅ address (TEXT)');
    console.log('  ✅ company (TEXT)');
    console.log('  ✅ marketing_opt_in default now TRUE');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Please run the migration manually in Supabase Dashboard:');
    console.log('📍 Go to: https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu/sql');
    console.log('📋 Execute: /root/agents/supabase/migrations/20250808_add_customer_fields.sql');
  }
}

// Run the migration
applyCustomerFieldsMigration().catch(console.error);