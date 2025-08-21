-- ============================================
-- DIAGNOSE STORAGE BUCKET ISSUES
-- ============================================
-- Run this in Supabase SQL Editor to diagnose why buckets aren't being created

-- 1. Check if storage schema exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = 'storage'
) as storage_schema_exists;

-- 2. Check if storage.buckets table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'storage' AND table_name = 'buckets'
) as storage_buckets_table_exists;

-- 3. List all existing buckets
SELECT 
    'Existing buckets:' as info,
    id,
    name,
    public,
    file_size_limit,
    created_at
FROM storage.buckets
ORDER BY created_at;

-- 4. Check current user permissions
SELECT 
    'Current user permissions:' as info,
    current_user,
    has_schema_privilege('storage', 'USAGE') as can_use_storage,
    has_table_privilege('storage.buckets', 'INSERT') as can_insert_buckets,
    has_table_privilege('storage.buckets', 'SELECT') as can_select_buckets;

-- 5. Try to create a test bucket with detailed error capture
DO $$
DECLARE
    error_message TEXT;
    error_detail TEXT;
    error_hint TEXT;
BEGIN
    -- Try to insert test bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('test-bucket-' || gen_random_uuid(), 'test-bucket', true);
    
    RAISE NOTICE 'Test bucket created successfully - storage is working!';
    
    -- Clean up test bucket
    DELETE FROM storage.buckets WHERE name = 'test-bucket';
    
EXCEPTION
    WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS 
            error_message = MESSAGE_TEXT,
            error_detail = PG_EXCEPTION_DETAIL,
            error_hint = PG_EXCEPTION_HINT;
            
        RAISE NOTICE 'Storage bucket creation failed!';
        RAISE NOTICE 'Error: %', error_message;
        RAISE NOTICE 'Detail: %', error_detail;
        RAISE NOTICE 'Hint: %', error_hint;
END $$;

-- 6. Check if there are any policies blocking bucket creation
SELECT 
    'Storage policies:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'buckets'
ORDER BY policyname;

-- 7. Try alternative INSERT syntax (some Supabase versions need this)
-- This attempts to create the profile-images bucket with a simpler syntax
INSERT INTO storage.buckets (id, name, public)
SELECT 'profile-images', 'profile-images', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profile-images'
);

-- Check if it worked
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-images')
        THEN '✅ profile-images bucket created with alternative syntax!'
        ELSE '❌ profile-images bucket still missing'
    END as result;

-- 8. Show Supabase version info
SELECT 
    'Supabase version info:' as info,
    current_setting('server_version') as postgres_version,
    current_database() as database_name;

-- Final status
SELECT '🔍 Diagnostic complete. Check the output above for issues.' as status;