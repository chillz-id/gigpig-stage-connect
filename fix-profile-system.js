#!/usr/bin/env node

/**
 * Fix Profile System Foundation
 * This script addresses the critical issue where zero profiles exist in the database
 * Task: Fix Profile System Foundation from Phase 1: Critical Foundation
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fixProfileSystem() {
  console.log('🔧 Starting Profile System Foundation Fix...\n');
  
  // Create a comprehensive migration to fix the profile system
  const migrationSQL = `
-- Profile System Foundation Fix Migration
-- Generated at: ${new Date().toISOString()}

-- 1. Ensure profiles table exists with correct schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Ensure user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. Create or update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', '')
  );
  
  -- Set default role as member
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 4. Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Fix any existing users without profiles
INSERT INTO public.profiles (id, email, name, avatar_url)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'name', au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data ->> 'avatar_url', au.raw_user_meta_data ->> 'picture', '')
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 6. Ensure all users have at least member role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'member'::user_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id AND ur.role = 'member'
WHERE ur.user_id IS NULL;

-- 7. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. Create basic RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
`;

  // Save the migration to a file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const migrationFile = `supabase/migrations/${timestamp}_fix_profile_system_foundation.sql`;
  
  console.log(`📄 Creating migration file: ${migrationFile}`);
  fs.writeFileSync(migrationFile, migrationSQL);
  
  // Now let's test the current state
  console.log('\n🔍 Testing current profile system state...');
  
  try {
    // Check current profile count
    const { data: profiles, error: profileError, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    if (profileError) {
      console.log('❌ Error accessing profiles:', profileError.message);
    } else {
      console.log(`✅ Current profiles count: ${count || 0}`);
    }
    
    // Check if we can access the profiles table structure
    const { data: sampleProfiles, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Error accessing profiles table:', sampleError.message);
    } else {
      console.log('✅ Profiles table is accessible');
      if (sampleProfiles && sampleProfiles.length > 0) {
        console.log('   Sample profile columns:', Object.keys(sampleProfiles[0]));
      }
    }
    
    // Summary
    console.log('\n📊 ACTIONS TAKEN:');
    console.log(`   ✅ Created migration file: ${migrationFile}`);
    console.log('   ✅ Migration includes:');
    console.log('      - profiles table creation/verification');
    console.log('      - user_roles table creation/verification');
    console.log('      - handle_new_user function creation');
    console.log('      - on_auth_user_created trigger creation');
    console.log('      - Backfill for existing users');
    console.log('      - RLS policies');
    console.log('      - Proper permissions');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Apply the migration to your Supabase database');
    console.log('   2. Test user registration to ensure profiles are created');
    console.log('   3. Verify that existing users get profiles');
    console.log('   4. Run the check script again to confirm fix');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the fix
fixProfileSystem().catch(console.error);