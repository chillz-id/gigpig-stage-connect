-- Simple check for Xero tables

-- 1. List all xero tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'xero_%'
ORDER BY table_name;

-- 2. Check if xero_integrations exists and show its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'xero_integrations'
ORDER BY ordinal_position;

-- 3. Count records in each xero table (if they exist)
SELECT 'xero_integrations' as table_name, COUNT(*) as record_count
FROM xero_integrations
UNION ALL
SELECT 'xero_invoices' as table_name, COUNT(*) as record_count  
FROM xero_invoices
UNION ALL
SELECT 'xero_tokens' as table_name, COUNT(*) as record_count
FROM xero_tokens
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'xero_tokens')
UNION ALL
SELECT 'xero_contacts' as table_name, COUNT(*) as record_count
FROM xero_contacts
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'xero_contacts')
UNION ALL
SELECT 'xero_webhook_events' as table_name, COUNT(*) as record_count
FROM xero_webhook_events
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'xero_webhook_events');