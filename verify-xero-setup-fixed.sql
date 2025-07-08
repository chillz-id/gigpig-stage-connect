-- Verify Xero Integration Setup (Fixed)

-- Check if any Xero integrations exist
SELECT 
    'Xero Integrations' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN 'Connected' ELSE 'Not Connected' END as status
FROM xero_integrations;

-- Check columns in xero_integrations table
SELECT 
    'Xero Integration Columns' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'xero_integrations'
ORDER BY ordinal_position;

-- Check recent invoices
SELECT 
    'Recent Invoices' as check_type,
    id,
    invoice_number,
    status,
    total_amount,
    xero_invoice_id,
    last_synced_at,
    created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 5;

-- Check if Xero webhook events have been received
SELECT 
    'Xero Webhooks' as check_type,
    COUNT(*) as count
FROM xero_webhook_events;

-- Check invoice functions
SELECT 
    'Invoice Functions' as check_type,
    proname as function_name,
    pronargs as arg_count
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('generate_invoice_number', 'calculate_invoice_totals', 'process_xero_webhook')
ORDER BY proname;

-- Check if xero tables exist
SELECT 
    'Xero Tables' as check_type,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'xero_%'
ORDER BY table_name;