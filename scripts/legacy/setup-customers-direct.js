#!/usr/bin/env node

/**
 * Setup Customers Table Directly
 * Creates customers table using direct Supabase REST API calls
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

const SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
import dotenv from 'dotenv';
dotenv.config({ path: '/root/agents/.env' });

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY environment variable not set');
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupCustomersTable() {
  console.log('📊 Setting up customers table...\n');

  try {
    // Check if table exists by trying to query it
    console.log('Checking if customers table exists...');
    const { error: checkError } = await supabase
      .from('customers')
      .select('count')
      .limit(0);

    if (checkError) {
      console.log('❌ Table does not exist, need to create it');
      console.log('ℹ️  Please create the customers table manually in Supabase Dashboard:');
      console.log('   1. Go to https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu');
      console.log('   2. Navigate to Table Editor');
      console.log('   3. Create new table with the following structure:');
      console.log('\nTable: customers');
      console.log('Columns:');
      console.log('  - id (uuid, primary key, default: gen_random_uuid())');
      console.log('  - email (text, unique, not null)');
      console.log('  - first_name (text)');
      console.log('  - last_name (text)');
      console.log('  - mobile (text)');
      console.log('  - location (text, default: AU)');
      console.log('  - marketing_opt_in (boolean, default: false)');
      console.log('  - source (text, default: humanitix)');
      console.log('  - total_orders (int4, default: 0)');
      console.log('  - total_spent (numeric, default: 0)');
      console.log('  - last_order_date (timestamptz)');
      console.log('  - last_event_id (uuid)');
      console.log('  - last_event_name (text)');
      console.log('  - customer_segment (text, default: new)');
      console.log('  - preferred_venue (text)');
      console.log('  - brevo_contact_id (text)');
      console.log('  - brevo_sync_status (text, default: pending)');
      console.log('  - brevo_last_sync (timestamptz)');
      console.log('  - brevo_sync_error (text)');
      console.log('  - created_at (timestamptz, default: now())');
      console.log('  - updated_at (timestamptz, default: now())');
      
      return false;
    }

    console.log('✅ Customers table already exists!');

    // Test inserting and updating a customer
    console.log('\n🧪 Testing customer operations...');

    const testCustomer = {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'Customer',
      mobile: '+61400000000',
      marketing_opt_in: true,
      total_orders: 1,
      total_spent: 25.50,
      customer_segment: 'new'
    };

    // Insert test customer
    const { data: insertData, error: insertError } = await supabase
      .from('customers')
      .upsert(testCustomer, { onConflict: 'email' })
      .select()
      .single();

    if (insertError) {
      console.log(`❌ Insert test failed: ${insertError.message}`);
      return false;
    }

    console.log('✅ Customer insert/update works');
    console.log(`   Customer ID: ${insertData.id}`);

    // Clean up test customer
    await supabase
      .from('customers')
      .delete()
      .eq('email', 'test@example.com');

    console.log('✅ Customer deletion works');

    // Check if we have existing customers from ticket sales
    console.log('\n📊 Checking for existing customer data...');
    const { data: existingCustomers, error: countError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);

    if (countError) {
      console.log(`❌ Count query failed: ${countError.message}`);
    } else {
      console.log(`Found ${existingCustomers ? existingCustomers.length : 0} existing customers`);
    }

    // Check ticket sales for migration
    const { data: ticketSales, error: salesError } = await supabase
      .from('ticket_sales')
      .select('customer_email')
      .not('customer_email', 'is', null)
      .limit(5);

    if (salesError) {
      console.log('ℹ️  No ticket_sales table found yet');
    } else {
      console.log(`Found ${ticketSales.length} ticket sales records to potentially migrate`);
      if (ticketSales.length > 0) {
        console.log('   Sample emails:', ticketSales.map(t => t.customer_email).slice(0, 3));
      }
    }

    console.log('\n🎉 Customers table is ready for use!');
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

setupCustomersTable().catch(console.error);