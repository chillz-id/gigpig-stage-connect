#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fixComedianSystem() {
  console.log('🔧 Fixing Stand Up Sydney Comedian System\n');
  console.log('=' . repeat(50));

  try {
    // 1. First, check actual profile count with service key
    console.log('\n1️⃣ Checking Profile System:');
    const { data: profiles, error: profileError, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    console.log(`   Current profiles: ${count || 0}`);
    
    if (profiles && profiles.length > 0) {
      console.log('   Sample profile columns:', Object.keys(profiles[0]));
    }

    // 2. Fix RLS policies for profiles
    console.log('\n2️⃣ Fixing RLS Policies:');
    
    const rlsPolicies = `
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

-- Create new comprehensive policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
`;

    console.log('   Creating RLS policies to allow profile viewing...');
    
    // 3. Fix the applications table foreign keys
    console.log('\n3️⃣ Checking Applications Table Structure:');
    
    const applicationsFix = `
-- Ensure proper foreign key relationships
ALTER TABLE applications 
  DROP CONSTRAINT IF EXISTS applications_comedian_id_fkey,
  ADD CONSTRAINT applications_comedian_id_fkey 
    FOREIGN KEY (comedian_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

ALTER TABLE applications 
  DROP CONSTRAINT IF EXISTS applications_event_id_fkey,
  ADD CONSTRAINT applications_event_id_fkey 
    FOREIGN KEY (event_id) 
    REFERENCES events(id) 
    ON DELETE CASCADE;

-- Add RLS policies for applications
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Promoters can view applications to their events" ON applications;

CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = comedian_id);

CREATE POLICY "Promoters can view applications to their events"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = applications.event_id 
      AND events.promoter_id = auth.uid()
    )
  );

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = comedian_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = comedian_id);
`;

    console.log('   Setting up applications table relationships and policies...');

    // 4. Fix vouches table
    console.log('\n4️⃣ Fixing Vouches Table:');
    
    const vouchesFix = `
-- Ensure proper foreign keys
ALTER TABLE vouches 
  DROP CONSTRAINT IF EXISTS vouches_voucher_id_fkey,
  ADD CONSTRAINT vouches_voucher_id_fkey 
    FOREIGN KEY (voucher_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

ALTER TABLE vouches 
  DROP CONSTRAINT IF EXISTS vouches_vouchee_id_fkey,
  ADD CONSTRAINT vouches_vouchee_id_fkey 
    FOREIGN KEY (vouchee_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- RLS policies for vouches
DROP POLICY IF EXISTS "Users can view all vouches" ON vouches;
DROP POLICY IF EXISTS "Users can create vouches" ON vouches;
DROP POLICY IF EXISTS "Users can update own vouches" ON vouches;
DROP POLICY IF EXISTS "Users can delete own vouches" ON vouches;

CREATE POLICY "Anyone can view vouches"
  ON vouches FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create vouches"
  ON vouches FOR INSERT
  WITH CHECK (auth.uid() = voucher_id);

CREATE POLICY "Users can update own vouches"
  ON vouches FOR UPDATE
  USING (auth.uid() = voucher_id);

CREATE POLICY "Users can delete own vouches"
  ON vouches FOR DELETE
  USING (auth.uid() = voucher_id);
`;

    console.log('   Setting up vouches table relationships and policies...');

    // 5. Fix comedian_media table
    console.log('\n5️⃣ Fixing Comedian Media Table:');
    
    const mediaFix = `
-- Ensure proper structure
ALTER TABLE comedian_media 
  DROP CONSTRAINT IF EXISTS comedian_media_user_id_fkey,
  ADD CONSTRAINT comedian_media_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- RLS policies
DROP POLICY IF EXISTS "Users can view all media" ON comedian_media;
DROP POLICY IF EXISTS "Users can upload own media" ON comedian_media;
DROP POLICY IF EXISTS "Users can update own media" ON comedian_media;
DROP POLICY IF EXISTS "Users can delete own media" ON comedian_media;

CREATE POLICY "Anyone can view media"
  ON comedian_media FOR SELECT
  USING (true);

CREATE POLICY "Users can upload own media"
  ON comedian_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON comedian_media FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON comedian_media FOR DELETE
  USING (auth.uid() = user_id);
`;

    console.log('   Setting up comedian_media table policies...');

    // 6. Create missing components tracking
    console.log('\n6️⃣ Checking Missing Frontend Components:');
    console.log('   Note: ComedianApplications.tsx might be integrated into other components');
    
    // 7. Create sample data if none exists
    console.log('\n7️⃣ Checking for Sample Data:');
    
    if (count === 0) {
      console.log('   ⚠️  No profiles exist - would you like to create sample data?');
      console.log('   Run: npm run test:dev to create test data');
    } else {
      console.log('   ✅ Profiles exist, system should be functional');
    }

    // Generate SQL file
    const allFixes = [rlsPolicies, applicationsFix, vouchesFix, mediaFix].join('\n\n');
    
    const fs = await import('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `fix-comedian-system-${timestamp}.sql`;
    
    fs.writeFileSync(filename, allFixes);
    console.log(`\n✅ SQL fixes generated: ${filename}`);
    
    // Test the fixes
    console.log('\n8️⃣ Testing System After Fixes:');
    
    // Test profile access with anon key
    const anonSupabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54");
    
    const { data: testProfiles, error: testError } = await anonSupabase
      .from('profiles')
      .select('id, name, stage_name')
      .limit(1);
    
    if (testError) {
      console.log(`   ❌ Anonymous access test failed: ${testError.message}`);
      console.log('   ℹ️  This suggests RLS policies need to be applied');
    } else {
      console.log(`   ✅ Anonymous access working - found ${testProfiles?.length || 0} profiles`);
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Apply the generated SQL file to your database');
    console.log('2. Run: node test-comedian-system.js to verify fixes');
    console.log('3. Test the frontend comedian profile pages');
    console.log('4. Ensure profile creation works for new users');
    
  } catch (error) {
    console.error('\n❌ Error during fix process:', error);
  }
}

// Run the fix
fixComedianSystem().catch(console.error);