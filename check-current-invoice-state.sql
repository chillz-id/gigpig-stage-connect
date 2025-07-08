-- Check current state of invoice tables in Supabase

-- 1. List all invoice/xero related tables
SELECT 
    'TABLES' as check_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%invoice%' OR table_name LIKE '%xero%' OR table_name = 'payments')
ORDER BY table_name;

-- 2. Check invoices table structure
SELECT 
    'INVOICES_COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'invoices'
ORDER BY ordinal_position;

-- 3. Check for Xero-specific columns in invoices
SELECT 
    'XERO_COLUMNS' as check_type,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'invoices'
AND column_name IN ('xero_invoice_id', 'last_synced_at', 'paid_at', 'created_by');

-- 4. Check what Xero tables exist
SELECT 
    'XERO_TABLES' as check_type,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('xero_integrations', 'xero_tokens', 'xero_invoices', 'xero_contacts', 'xero_webhook_events')
ORDER BY table_name;

-- 5. Check invoice-related functions
SELECT 
    'FUNCTIONS' as check_type,
    proname as function_name
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND (proname LIKE '%invoice%' OR proname LIKE '%xero%')
ORDER BY proname;