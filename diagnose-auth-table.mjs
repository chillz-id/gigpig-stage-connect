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

async function diagnoseAuthTable() {
  console.log('🔍 Diagnosing auth.users table issues...\n');

  try {
    // 1. Check auth.users constraints
    console.log('1. Checking auth.users constraints...');
    const constraints = await executeSQLViaManagementAPI(`
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass
ORDER BY conname;`);
    console.log('Constraints:', JSON.stringify(constraints, null, 2));

    // 2. Check for any locks
    console.log('\n2. Checking for locks on auth.users...');
    const locks = await executeSQLViaManagementAPI(`
SELECT 
    pg_locks.pid,
    pg_locks.mode,
    pg_locks.granted,
    pg_stat_activity.state,
    pg_stat_activity.query
FROM pg_locks
JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
WHERE pg_locks.relation = 'auth.users'::regclass::oid;`);
    console.log('Locks:', locks);

    // 3. Check database size and limits
    console.log('\n3. Checking database statistics...');
    const dbStats = await executeSQLViaManagementAPI(`
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) as size,
    numbackends as active_connections
FROM pg_database
JOIN pg_stat_database ON pg_database.oid = pg_stat_database.datid
WHERE pg_database.datname = current_database();`);
    console.log('Database stats:', dbStats);

    // 4. Check if there are any triggers on auth.users that might be failing
    console.log('\n4. Checking triggers on auth.users...');
    const triggers = await executeSQLViaManagementAPI(`
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;`);
    console.log('Triggers:', triggers);

    // 5. Try to see the actual error by attempting an insert
    console.log('\n5. Testing direct insert into auth.users...');
    try {
      const testInsert = await executeSQLViaManagementAPI(`
BEGIN;
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test_direct_' || extract(epoch from now()) || '@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{}',
    '{}',
    now(),
    now()
);
ROLLBACK;`);
      console.log('Direct insert test passed (rolled back)');
    } catch (error) {
      console.error('Direct insert failed:', error.message);
    }

    // 6. Check if the issue is with the instance_id
    console.log('\n6. Checking instance_id configuration...');
    const instanceCheck = await executeSQLViaManagementAPI(`
SELECT 
    id,
    raw_app_meta_data->>'provider' as provider
FROM auth.users
LIMIT 1;`);
    console.log('Sample user:', instanceCheck);

  } catch (error) {
    console.error('Error during diagnosis:', error.message);
  }
}

diagnoseAuthTable();