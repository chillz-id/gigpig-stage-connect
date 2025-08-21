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

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies...\n');

  try {
    // 1. Enable RLS on tables
    console.log('1. Enabling RLS on tables...');
    await executeSQLViaManagementAPI(`
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;`);
    console.log('✓ RLS enabled');

    // 2. Drop existing policies to avoid conflicts
    console.log('\n2. Dropping existing policies...');
    await executeSQLViaManagementAPI(`
DROP POLICY IF EXISTS "Service role can do anything" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;`);
    console.log('✓ Existing policies dropped');

    // 3. Create policies for profiles
    console.log('\n3. Creating profiles policies...');
    
    // Service role bypass
    await executeSQLViaManagementAPI(`
CREATE POLICY "Service role bypass" ON public.profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);`);
    
    // Anon can insert during signup
    await executeSQLViaManagementAPI(`
CREATE POLICY "Enable insert for signup" ON public.profiles
    FOR INSERT TO anon WITH CHECK (true);`);
    
    // Users can view their own profile
    await executeSQLViaManagementAPI(`
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);`);
    
    // Users can update their own profile
    await executeSQLViaManagementAPI(`
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);`);
    
    console.log('✓ Profile policies created');

    // 4. Create policies for user_roles
    console.log('\n4. Creating user_roles policies...');
    
    // Service role bypass
    await executeSQLViaManagementAPI(`
CREATE POLICY "Service role bypass" ON public.user_roles
    FOR ALL TO service_role USING (true) WITH CHECK (true);`);
    
    // Anon can insert during signup
    await executeSQLViaManagementAPI(`
CREATE POLICY "Enable insert for signup" ON public.user_roles
    FOR INSERT TO anon WITH CHECK (true);`);
    
    // Users can view their own roles
    await executeSQLViaManagementAPI(`
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);`);
    
    console.log('✓ User roles policies created');

    // 5. Verify the setup
    console.log('\n5. Verifying RLS setup...');
    const checkResult = await executeSQLViaManagementAPI(`
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_roles');`);
    
    console.log('✓ RLS verification:', checkResult);

    console.log('\n✅ RLS policies fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRLSPolicies();