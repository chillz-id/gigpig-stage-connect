-- Complete Database Analysis for Stand Up Sydney
-- =============================================

-- 1. List all tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;

-- 2. List all columns for each table with detailed information
SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.column_default,
    c.is_nullable,
    c.is_identity,
    c.identity_generation
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY t.table_schema, t.table_name, c.ordinal_position;

-- 3. Check all constraints (primary keys, foreign keys, unique, check)
SELECT 
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    cc.check_clause
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.check_constraints AS cc
    ON cc.constraint_name = tc.constraint_name
    AND cc.constraint_schema = tc.constraint_schema
WHERE tc.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_type;

-- 4. List all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, indexname;

-- 5. List all triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY trigger_schema, event_object_table, trigger_name;

-- 6. List all functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    t.typname as return_type,
    l.lanname as language,
    p.prosrc as source_code
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
LEFT JOIN pg_type t ON t.oid = p.prorettype
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;

-- 7. Check RLS (Row Level Security) policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, policyname;

-- 8. Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;

-- 9. List all views
SELECT 
    table_schema,
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

-- 10. Check storage buckets (Supabase specific)
SELECT * FROM storage.buckets;

-- 11. Check storage objects count per bucket
SELECT 
    bucket_id,
    COUNT(*) as object_count,
    SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects
GROUP BY bucket_id;

-- 12. Check auth schema tables
SELECT 
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 13. Sample data from critical tables (first 5 rows each)
-- Users table
SELECT * FROM auth.users LIMIT 5;

-- Profiles table
SELECT * FROM public.profiles LIMIT 5;

-- User roles table
SELECT * FROM public.user_roles LIMIT 5;

-- Events table
SELECT * FROM public.events LIMIT 5;

-- Comedians table
SELECT * FROM public.comedians LIMIT 5;

-- 14. Check for any custom types/enums
SELECT 
    n.nspname as schema,
    t.typname as type_name,
    t.typtype as type_type,
    e.enumlabel as enum_value
FROM pg_type t
LEFT JOIN pg_namespace n ON n.oid = t.typnamespace
LEFT JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND t.typtype IN ('e', 'c', 'd')
ORDER BY n.nspname, t.typname, e.enumsortorder;