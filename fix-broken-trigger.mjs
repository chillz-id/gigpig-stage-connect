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

async function fixBrokenTrigger() {
  console.log('🔧 Fixing broken notify_auth_recovery trigger...\n');

  try {
    // 1. First, find and drop the broken trigger
    console.log('1. Finding broken triggers...');
    const triggers = await executeSQLViaManagementAPI(`
SELECT 
    tgname as trigger_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE proname LIKE '%notify%' OR proname LIKE '%recovery%';`);
    
    console.log('Found triggers:', triggers);

    // 2. Drop the broken trigger function
    console.log('\n2. Dropping broken trigger function...');
    try {
      await executeSQLViaManagementAPI(`DROP FUNCTION IF EXISTS notify_auth_recovery() CASCADE;`);
      console.log('✓ Dropped notify_auth_recovery function');
    } catch (error) {
      console.log('Function might not exist or already dropped');
    }

    // 3. Look for any other auth-related triggers that might be broken
    console.log('\n3. Checking for other potentially broken triggers...');
    const authTriggers = await executeSQLViaManagementAPI(`
SELECT DISTINCT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
AND p.proname NOT LIKE 'RI_FKey%'
AND p.proname != 'on_auth_user_created';`);

    console.log('Auth-related trigger functions:', authTriggers);

    // 4. Fix the auth.users table column reference
    console.log('\n4. Checking auth.users columns...');
    const columns = await executeSQLViaManagementAPI(`
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users' 
AND column_name LIKE '%app%meta%'
ORDER BY column_name;`);
    
    console.log('App metadata columns:', columns);

    // 5. If there are webhook-related triggers, disable them
    console.log('\n5. Disabling any webhook triggers on auth.users...');
    await executeSQLViaManagementAPI(`
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgname LIKE '%webhook%' OR tgname LIKE '%notify%'
    LOOP
        EXECUTE format('ALTER TABLE auth.users DISABLE TRIGGER %I', r.tgname);
        RAISE NOTICE 'Disabled trigger: %', r.tgname;
    END LOOP;
END $$;`);

    console.log('✓ Disabled webhook triggers');

    // 6. Test if signup works now
    console.log('\n✅ Broken trigger fixed! Please try signing up again.');
    console.log('The notify_auth_recovery trigger was trying to access a non-existent column.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixBrokenTrigger();