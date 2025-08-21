#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMissingResources() {
  console.log('Checking Supabase resources...\n');

  // Storage buckets to check
  const requiredBuckets = ['profile-images', 'comedian-media', 'event-media'];
  
  // RPC functions to check
  const requiredFunctions = [
    'is_co_promoter_for_event',
    'get_comedian_stats',
    'get_vouch_stats',
    'get_existing_vouch',
    'calculate_commission_splits',
    'get_photographer_vouches',
    'generate_recurring_invoice',
    'link_external_event',
    'get_user_task_statistics',
    'get_team_task_statistics',
    'get_task_completion_trends',
    'get_tour_details',
    'calculate_tour_statistics',
    'calculate_negotiation_strategy',
    'process_automated_deal_response',
    'update_agency_analytics',
    'get_agency_dashboard_data',
    'get_user_flight_statistics',
    'get_flight_delay_trends'
  ];

  // Check storage buckets
  console.log('=== Storage Buckets ===');
  for (const bucket of requiredBuckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      if (error) {
        console.log(`❌ ${bucket}: ${error.message}`);
      } else {
        console.log(`✅ ${bucket}: Available`);
      }
    } catch (err) {
      console.log(`❌ ${bucket}: ${err.message}`);
    }
  }

  // Check RPC functions
  console.log('\n=== RPC Functions ===');
  for (const func of requiredFunctions) {
    try {
      // Try to call the function with minimal params
      const { data, error } = await supabase.rpc(func, {});
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.log(`❌ ${func}: Not found`);
      } else if (error) {
        // Function exists but may have parameter issues
        console.log(`⚠️  ${func}: Exists (${error.message})`);
      } else {
        console.log(`✅ ${func}: Available`);
      }
    } catch (err) {
      console.log(`❌ ${func}: ${err.message}`);
    }
  }

  // Check critical tables
  console.log('\n=== Critical Tables ===');
  const criticalTables = [
    'profiles',
    'events',
    'comedian_bookings',
    'vouches',
    'agencies',
    'artist_management',
    'deal_negotiations',
    'tasks',
    'tours',
    'flights'
  ];

  for (const table of criticalTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Available`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log('Check the missing resources above and run the setup-all-supabase-resources.sql script in your Supabase SQL editor.');
  console.log('\nFor edge functions, deploy them using:');
  console.log('supabase functions deploy [function-name]');
}

checkMissingResources().catch(console.error);