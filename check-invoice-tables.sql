-- Check existing invoice-related tables and their structure

-- 1. List all invoice and xero related tables
SELECT 
    'EXISTING TABLES:' as section;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%invoice%' OR table_name LIKE '%xero%')
ORDER BY table_name;

-- 2. Check columns in invoices table (if it exists)
SELECT 
    '-------------------',
    'INVOICES TABLE STRUCTURE:' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'invoices'
ORDER BY ordinal_position;

-- 3. Check columns in invoice_items table (if it exists)
SELECT 
    '-------------------',
    'INVOICE_ITEMS TABLE STRUCTURE:' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'invoice_items'
ORDER BY ordinal_position;

-- 4. Check existing indexes
SELECT 
    '-------------------',
    'EXISTING INDEXES:' as section;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (tablename LIKE '%invoice%' OR tablename LIKE '%xero%')
ORDER BY tablename, indexname;

-- 5. Check existing functions
SELECT 
    '-------------------',
    'EXISTING FUNCTIONS:' as section;
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND (proname LIKE '%invoice%' OR proname LIKE '%xero%')
ORDER BY proname;

-- 6. Check RLS policies
SELECT 
    '-------------------',
    'EXISTING RLS POLICIES:' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename LIKE '%invoice%' OR tablename LIKE '%xero%')
ORDER BY tablename, policyname;