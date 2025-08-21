-- Check if there's a trigger to create profiles on user signup

-- 1. Check for profile creation trigger
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
   OR proname LIKE '%profile%'
   OR tgname LIKE '%profile%';

-- 2. Check if there's a function to handle new user profiles
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname LIKE '%new_user%' 
   OR proname LIKE '%create_profile%'
   OR proname LIKE '%handle_new_user%'
LIMIT 5;

-- 3. Check auth.users table to see users without profiles
SELECT 
    'Users without profiles:' as info,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Get sample of users without profiles
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
LIMIT 5;