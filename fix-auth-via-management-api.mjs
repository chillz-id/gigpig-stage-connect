import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu';

async function executeSQLViaManagementAPI(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to execute SQL: ${error}`);
  }

  return await response.json();
}

async function fixAuthIssues() {
  console.log('🔧 Fixing auth issues via Supabase Management API...\n');

  try {
    // 1. Drop existing trigger
    console.log('1. Dropping existing trigger...');
    await executeSQLViaManagementAPI(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    console.log('✓ Trigger dropped');

    // 2. Create the function
    console.log('\n2. Creating handle_new_user function...');
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Try to create profile
    BEGIN
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
        ) ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            -- Log but don't fail
            RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
    END;
    
    -- Try to create role
    BEGIN
        INSERT INTO public.user_roles (
            user_id,
            role,
            created_at
        ) VALUES (
            new.id,
            'comedian',
            now()
        ) ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            -- Log but don't fail
            RAISE WARNING 'Could not create role for user %: %', new.id, SQLERRM;
    END;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

    await executeSQLViaManagementAPI(createFunctionSQL);
    console.log('✓ Function created');

    // 3. Create the trigger
    console.log('\n3. Creating trigger...');
    await executeSQLViaManagementAPI(`
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();`);
    console.log('✓ Trigger created');

    // 4. Grant permissions
    console.log('\n4. Granting permissions...');
    await executeSQLViaManagementAPI(`
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_roles TO anon, authenticated;`);
    console.log('✓ Permissions granted');

    // 5. Check the result
    console.log('\n5. Verifying setup...');
    const checkResult = await executeSQLViaManagementAPI(`
SELECT 
    'Trigger exists' as check_type,
    EXISTS(
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) as result;`);
    
    console.log('✓ Setup verification:', checkResult);

    console.log('\n✅ Auth issues fixed successfully!');
    console.log('You should now be able to create new accounts.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If Management API doesn't work, provide alternative
    console.log('\n📋 Alternative: Run this SQL directly in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu/sql/new');
    console.log('\nCopy and paste the SQL from emergency-fix-auth.sql');
  }
}

fixAuthIssues();