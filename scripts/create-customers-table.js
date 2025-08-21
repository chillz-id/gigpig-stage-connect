#!/usr/bin/env node

/**
 * Create Customers Table
 * Simple script to create customers table using Supabase client
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

async function createCustomersTable() {
  console.log('📊 Creating customers table...\n');

  try {
    // Create customers table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        mobile TEXT,
        location TEXT DEFAULT 'AU',
        marketing_opt_in BOOLEAN DEFAULT false,
        source TEXT DEFAULT 'humanitix',
        
        -- Customer metrics
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        last_order_date TIMESTAMPTZ,
        last_event_id UUID,
        last_event_name TEXT,
        
        -- Customer segmentation  
        customer_segment TEXT DEFAULT 'new',
        preferred_venue TEXT,
        
        -- Brevo synchronization fields
        brevo_contact_id TEXT,
        brevo_sync_status TEXT DEFAULT 'pending',
        brevo_last_sync TIMESTAMPTZ,
        brevo_sync_error TEXT,
        
        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    console.log('Creating table...');
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.log(`❌ Create table failed: ${createError.message}`);
      return;
    }
    
    console.log('✅ Table created successfully');

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);',
      'CREATE INDEX IF NOT EXISTS idx_customers_brevo_sync_status ON public.customers(brevo_sync_status);',
      'CREATE INDEX IF NOT EXISTS idx_customers_segment ON public.customers(customer_segment);'
    ];

    for (const indexSQL of indexes) {
      console.log('Creating index...');
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (error) {
        console.log(`❌ Index creation failed: ${error.message}`);
      } else {
        console.log('✅ Index created');
      }
    }

    // Enable RLS
    console.log('Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.log(`❌ RLS failed: ${rlsError.message}`);
    } else {
      console.log('✅ RLS enabled');
    }

    // Create basic policies
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Service role can manage customers" ON public.customers
       FOR ALL USING (auth.role() = 'service_role');`,
      `CREATE POLICY IF NOT EXISTS "Authenticated users can view customers" ON public.customers
       FOR SELECT USING (auth.role() = 'authenticated');`
    ];

    for (const policySQL of policies) {
      console.log('Creating policy...');
      const { error } = await supabase.rpc('exec_sql', { sql: policySQL });
      if (error) {
        console.log(`❌ Policy creation failed: ${error.message}`);
      } else {
        console.log('✅ Policy created');
      }
    }

    // Test the table
    console.log('\n🧪 Testing customers table...');
    const { data, error: testError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (testError) {
      console.log(`❌ Table test failed: ${testError.message}`);
    } else {
      console.log('✅ Customers table is working!');
      console.log(`Found ${data ? data.length : 0} existing customers`);
    }

    console.log('\n🎉 Customers table setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

createCustomersTable().catch(console.error);