import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixProfileCreationTrigger() {
  console.log('🔧 Fixing profile creation trigger...\n');

  try {
    // 1. Check profiles table structure
    console.log('1. Checking profiles table columns...');
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select()
      .limit(1);

    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError);
    } else {
      console.log('✓ Profiles table is accessible');
      if (profilesTest && profilesTest.length > 0) {
        console.log('Sample profile columns:', Object.keys(profilesTest[0]));
      }
    }

    // 2. Check if we can see auth.users (with service key)
    console.log('\n2. Checking auth.users access...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 5
    });

    if (usersError) {
      console.error('❌ Cannot access auth.users:', usersError);
    } else {
      console.log(`✓ Found ${users.length} users in auth.users`);
      
      // Check for users without profiles
      for (const user of users) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
        
        if (!profile) {
          console.log(`⚠️  User ${user.email} (${user.id}) has no profile!`);
        }
      }
    }

    // 3. Create the SQL to fix the trigger
    console.log('\n3. Generating SQL to fix the trigger...');
    console.log('\n📋 Copy and run this SQL in the Supabase SQL Editor:\n');
    
    const fixSQL = `
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile entry for new user
  INSERT INTO public.profiles (
    id,
    email,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    new.email,
    now(),
    now()
  );
  
  -- Create default user role (comedian)
  INSERT INTO public.user_roles (
    user_id,
    role,
    created_at
  ) VALUES (
    new.id,
    'comedian',
    now()
  );
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_roles TO anon, authenticated;

-- Verify the trigger was created
SELECT 
    'Trigger created successfully' as status,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';
`;

    console.log(fixSQL);
    
    console.log('\n4. Alternative: Create missing profiles for existing users...');
    const createMissingProfilesSQL = `
-- Create profiles for any users that don't have one
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
    u.id, 
    u.email,
    u.created_at,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Create comedian role for users without any role
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
    u.id,
    'comedian',
    now()
FROM auth.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE r.user_id IS NULL;
`;

    console.log('\n📋 Also run this to fix existing users without profiles:\n');
    console.log(createMissingProfilesSQL);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
fixProfileCreationTrigger();