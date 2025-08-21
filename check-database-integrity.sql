-- ============================================
-- CHECK DATABASE INTEGRITY
-- ============================================

-- 1. Check if auth.users table exists and is accessible
SELECT 
    'auth.users table check' as check_name,
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
    ) as result;

-- 2. Check auth.users structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position
LIMIT 10;

-- 3. Check for any locks on auth.users
SELECT 
    pg_locks.pid,
    pg_stat_activity.usename,
    pg_stat_activity.query,
    pg_stat_activity.state,
    pg_locks.mode,
    pg_locks.granted
FROM pg_locks
JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
WHERE pg_locks.relation = 'auth.users'::regclass::oid;

-- 4. Check if there are any constraints preventing inserts
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass;

-- 5. Check current user count
SELECT COUNT(*) as user_count FROM auth.users;

-- 6. Check if profiles table has foreign key to auth.users
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'f';

-- 7. Check for any database-wide issues
SELECT 
    datname,
    pg_database_size(datname) as size_bytes,
    pg_size_pretty(pg_database_size(datname)) as size_pretty
FROM pg_database
WHERE datname = current_database();

-- 8. Check for any trigger errors
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass);

-- 9. Test if we can insert into profiles directly
-- This will fail if there are issues
BEGIN;
INSERT INTO public.profiles (id, email, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'test@test.com', now(), now());
ROLLBACK;