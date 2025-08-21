#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApplicationFormIntegration() {
  console.log('Testing Application Form Integration...\n');

  try {
    // Check if applications table has the new columns
    console.log('1. Checking applications table schema...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('applications')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Error checking table:', tableError);
      return;
    }

    // Get table columns
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'applications' });

    if (columnsError) {
      // Fallback method - try to insert a test row and see what happens
      console.log('   Using fallback method to check columns...');
      
      const testData = {
        event_id: '00000000-0000-0000-0000-000000000000',
        comedian_id: '00000000-0000-0000-0000-000000000000',
        spot_type: 'Feature',
        availability_confirmed: true,
        requirements_acknowledged: true,
        message: 'Test message'
      };

      const { error: insertError } = await supabase
        .from('applications')
        .insert(testData);

      if (insertError) {
        console.log('   Column check results:', insertError.message);
        if (insertError.message.includes('column')) {
          console.log('   ❌ Missing required columns in applications table');
          console.log('   Required columns: spot_type, availability_confirmed, requirements_acknowledged');
        }
      } else {
        console.log('   ✅ All required columns exist in applications table');
        
        // Clean up test data
        await supabase
          .from('applications')
          .delete()
          .eq('event_id', '00000000-0000-0000-0000-000000000000');
      }
    } else {
      console.log('   Found columns:', columns.map(c => c.column_name).join(', '));
      
      const requiredColumns = ['spot_type', 'availability_confirmed', 'requirements_acknowledged'];
      const missingColumns = requiredColumns.filter(col => 
        !columns.some(c => c.column_name === col)
      );

      if (missingColumns.length > 0) {
        console.log('   ❌ Missing columns:', missingColumns.join(', '));
      } else {
        console.log('   ✅ All required columns exist');
      }
    }

    // Check for any existing applications with new fields
    console.log('\n2. Checking for applications using new fields...');
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('id, spot_type, availability_confirmed, requirements_acknowledged')
      .not('spot_type', 'is', null)
      .limit(5);

    if (appError) {
      console.log('   Error querying applications:', appError.message);
    } else {
      console.log(`   Found ${applications?.length || 0} applications with spot_type set`);
      if (applications && applications.length > 0) {
        console.log('   Sample data:', applications[0]);
      }
    }

    // Check RLS policies
    console.log('\n3. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'applications' });

    if (!policyError && policies) {
      console.log(`   Found ${policies.length} RLS policies for applications table`);
      const insertPolicy = policies.find(p => p.cmd === 'INSERT');
      if (insertPolicy) {
        console.log('   ✅ INSERT policy exists');
      } else {
        console.log('   ❌ No INSERT policy found');
      }
    }

    console.log('\n✅ Application Form Integration Test Complete');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Helper RPC function (add to database if not exists)
const createHelperFunctions = `
-- Get table columns
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text
  FROM information_schema.columns c
  WHERE c.table_name = $1
    AND c.table_schema = 'public';
END;
$$;

-- Get policies for table
CREATE OR REPLACE FUNCTION get_policies_for_table(table_name text)
RETURNS TABLE(policyname text, cmd text, qual text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.policyname::text,
    p.cmd::text,
    p.qual::text
  FROM pg_policies p
  WHERE p.tablename = $1
    AND p.schemaname = 'public';
END;
$$;
`;

testApplicationFormIntegration();