-- Verify Xero Integration Setup

-- Check if any Xero integrations exist
SELECT 
    'Xero Integrations' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN 'Connected' ELSE 'Not Connected' END as status
FROM xero_integrations
WHERE is_active = true;

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