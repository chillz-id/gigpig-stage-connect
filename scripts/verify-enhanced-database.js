#!/usr/bin/env node

/**
 * Verify Enhanced Database Schema
 * Confirms the enhanced customer fields are properly added
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

async function verifyEnhancedDatabase() {
  console.log('🔍 Verifying Enhanced Database Schema...\n');

  try {
    // Test 1: Check if enhanced fields exist
    console.log('📊 Test 1: Checking enhanced customer fields...');
    const { data: customers, error: schemaError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, mobile, date_of_birth, address, company, marketing_opt_in')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema error:', schemaError);
      return false;
    }

    if (customers && customers.length > 0) {
      const sample = customers[0];
      console.log('✅ Enhanced fields verified:');
      console.log(`   📧 Email: ${sample.email}`);
      console.log(`   👤 Name: ${sample.first_name} ${sample.last_name}`);
      console.log(`   📱 Mobile: ${sample.mobile || 'N/A'}`);
      console.log(`   🎂 Date of Birth: ${sample.date_of_birth !== undefined ? 'Field exists ✓' : 'Missing ❌'}`);
      console.log(`   🏠 Address: ${sample.address !== undefined ? 'Field exists ✓' : 'Missing ❌'}`);
      console.log(`   🏢 Company: ${sample.company !== undefined ? 'Field exists ✓' : 'Missing ❌'}`);
      console.log(`   📧 Marketing Opt-in: ${sample.marketing_opt_in}`);
    } else {
      console.log('ℹ️  No customers found, but schema appears correct');
    }

    // Test 2: Verify always opt-in policy
    console.log('\n📧 Test 2: Verifying opt-in policy...');
    const { data: optInStats, error: optInError } = await supabase
      .from('customers')
      .select('marketing_opt_in')
      .not('marketing_opt_in', 'is', null);

    if (optInError) {
      console.error('❌ Opt-in check error:', optInError);
    } else if (optInStats) {
      const totalCustomers = optInStats.length;
      const optedInCustomers = optInStats.filter(c => c.marketing_opt_in === true).length;
      console.log(`✅ Opt-in status: ${optedInCustomers}/${totalCustomers} customers opted in`);
      
      if (optedInCustomers === totalCustomers) {
        console.log('🎉 Perfect! All customers are opted into marketing');
      }
    }

    // Test 3: Check if analytics view exists
    console.log('\n📈 Test 3: Checking enhanced analytics view...');
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('customer_analytics')
      .select('*')
      .limit(1);

    if (analyticsError) {
      console.log('⚠️  Analytics view issue:', analyticsError.message);
    } else {
      console.log('✅ Enhanced analytics view working');
      if (analyticsData && analyticsData.length > 0) {
        const sample = analyticsData[0];
        console.log(`   Sample data: ${sample.full_name}, Segment: ${sample.loyalty_status}`);
      }
    }

    console.log('\n🎉 Database Enhancement Verification Complete!');
    console.log('\n📋 Ready for N8N Workflow Update:');
    console.log('   1. Go to: http://170.64.129.59:5678');
    console.log('   2. Find: "Humanitix to Brevo Customer Sync" workflow');
    console.log('   3. Import enhanced version from: /root/agents/n8n-workflows/humanitix-brevo-sync.json');
    console.log('   4. Activate the workflow');

    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification
verifyEnhancedDatabase().catch(console.error);