const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
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
    // 1. First check if trigger exists
    console.log('1. Checking for existing trigger...');
    const { data: triggers, error: triggerCheckError } = await supabase.rpc('get_triggers', {
      table_name: 'users',
      schema_name: 'auth'
    }).catch(() => ({ data: null, error: 'Function not available' }));

    if (!triggerCheckError && triggers) {
      console.log('Existing triggers:', triggers);
    }

    // 2. Drop existing trigger if it exists
    console.log('\n2. Dropping existing trigger if exists...');
    await supabase.rpc('exec_sql', {
      query: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;'
    }).catch(() => console.log('Trigger drop skipped'));

    // 3. Create the function
    console.log('\n3. Creating handle_new_user function...');
    const createFunctionSQL = `
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
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Since we can't execute arbitrary SQL via Supabase client, 
    // let's check and fix the issue differently

    // 4. Check profiles table structure
    console.log('\n4. Checking profiles table structure...');
    const { data: profilesInfo, error: profilesError } = await supabase
      .from('profiles')
      .select()
      .limit(0);

    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError);
    } else {
      console.log('✓ Profiles table is accessible');
    }

    // 5. Check user_roles table
    console.log('\n5. Checking user_roles table...');
    const { data: rolesInfo, error: rolesError } = await supabase
      .from('user_roles')
      .select()
      .limit(0);

    if (rolesError) {
      console.error('❌ Error accessing user_roles table:', rolesError);
    } else {
      console.log('✓ User_roles table is accessible');
    }

    // 6. Test creating a profile manually
    console.log('\n6. Testing manual profile creation...');
    const testUserId = 'test-' + Date.now();
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: `test${Date.now()}@example.com`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Manual profile creation failed:', testError);
      console.log('\nThis suggests there might be RLS policies blocking profile creation.');
    } else {
      console.log('✓ Manual profile creation successful');
      // Clean up test profile
      await supabase.from('profiles').delete().eq('id', testUserId);
    }

    console.log('\n🔍 DIAGNOSIS:');
    console.log('The "Database error saving new user" indicates the profile creation trigger is missing or broken.');
    console.log('This needs to be fixed at the database level using the Supabase dashboard or direct SQL access.');
    console.log('\n📝 SOLUTION:');
    console.log('1. Go to the Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Run the SQL from fix-profile-creation-trigger.sql');
    console.log('4. This will create the necessary trigger to auto-create profiles on signup');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
fixProfileCreationTrigger();