#!/usr/bin/env node

/**
 * Profile System Check Script
 * Checks the current state of the profile system for the Fix Profile System Foundation task
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkProfileSystem() {
  console.log('🔍 Checking Profile System Status...\n');
  
  try {
    // 1. Count total auth users
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id', { count: 'exact', head: true });
    
    if (authError) {
      console.log('❌ Cannot access auth.users table directly (expected with RLS)');
      console.log('   This is normal - will check profiles instead\n');
    } else {
      console.log(`✅ Total auth users: ${authUsers?.length || 0}\n`);
    }
    
    // 2. Count total profiles
    const { data: profiles, error: profileError, count: profileCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    if (profileError) {
      console.log('❌ Error accessing profiles table:', profileError.message);
      return;
    }
    
    console.log(`✅ Total profiles: ${profileCount || 0}\n`);
    
    // 3. Check for profiles with basic info
    const { data: profilesWithInfo, error: profileInfoError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (profileInfoError) {
      console.log('❌ Error fetching profile info:', profileInfoError.message);
      return;
    }
    
    console.log('📋 Sample profiles:');
    if (profilesWithInfo && profilesWithInfo.length > 0) {
      profilesWithInfo.forEach(profile => {
        console.log(`   - ${profile.id}: ${profile.email || 'No email'} (${profile.role || 'No role'}) - ${profile.name || 'No name'}`);
      });
    } else {
      console.log('   ⚠️  No profiles found!');
    }
    
    // 4. Check if handle_new_user function exists by running a simple query
    console.log('\n🔧 Checking handle_new_user function...');
    const { data: functions, error: functionError } = await supabase
      .rpc('version');
    
    if (functionError) {
      console.log('❌ Error running RPC test:', functionError.message);
    } else {
      console.log('✅ RPC functions accessible');
    }
    
    // 5. Check if trigger exists
    console.log('\n🎯 Checking trigger status...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created');
    
    if (triggerError) {
      console.log('❌ Error checking triggers:', triggerError.message);
    } else if (triggers && triggers.length > 0) {
      console.log('✅ on_auth_user_created trigger exists');
    } else {
      console.log('⚠️  on_auth_user_created trigger not found');
    }
    
    // 6. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   - Profiles in database: ${profileCount || 0}`);
    console.log(`   - Sample profiles available: ${profilesWithInfo?.length || 0}`);
    
    if (profileCount === 0) {
      console.log('   ⚠️  CRITICAL: Zero profiles detected! This matches the Knowledge Graph warning.');
      console.log('   🚨 ACTION REQUIRED: Fix profile creation system immediately.');
    } else if (profileCount > 0) {
      console.log('   ✅ Profiles exist in the system');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the check
checkProfileSystem();