# How to Run the Invoice Migration in Production

## Steps to Run the Migration

### 1. Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** (usually in the left sidebar)

### 2. Copy the Migration SQL
Since the migration file is large, you have two options:

#### Option A: Direct Copy
Copy the entire contents of the migration file from:
`/root/agents/supabase/migrations/20250706230000_complete_invoicing_system.sql`

#### Option B: Download and Upload
If you can't access the file directly, I'll provide a download link below.

### 3. Run the Migration
1. In the Supabase SQL Editor, paste the entire SQL content
2. Click **Run** or press `Cmd/Ctrl + Enter`
3. Wait for the migration to complete (should take 10-30 seconds)

### 4. Verify the Migration
After running, verify that the following tables were created:
- `invoices`
- `invoice_items`
- `invoice_recipients`
- `invoice_payments`
- `xero_integrations`
- `xero_tokens`
- `xero_invoices`
- `xero_contacts`
- `xero_webhooks`

You can verify by running this query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%invoice%' OR table_name LIKE '%xero%'
ORDER BY table_name;
```

## What This Migration Does

1. **Creates Invoice Tables**: Complete invoice management system
2. **Adds Indexes**: For optimal query performance
3. **Sets Up RLS**: Row Level Security for data protection
4. **Creates Functions**: Automatic invoice numbering and calculations
5. **Adds Triggers**: For automatic timestamp updates
6. **Xero Integration**: Tables for OAuth tokens and sync status

## Important Notes

- This migration is **idempotent** - safe to run multiple times
- All operations use `IF NOT EXISTS` to prevent errors
- The migration preserves existing data if tables already exist
- Make sure to add Xero credentials to Vercel after migration

## Troubleshooting

If you encounter errors:
1. Check if you have sufficient permissions
2. Ensure you're in the correct Supabase project
3. Look for specific error messages about missing dependencies
4. Contact support if the migration fails

## After Migration

1. Add Xero credentials to Vercel environment variables:
   - `VITE_XERO_CLIENT_ID`
   - `VITE_XERO_CLIENT_SECRET`

2. Configure Xero OAuth redirect URI in your Xero app settings:
   - `https://your-domain.vercel.app/auth/xero-callback`

3. Test the invoice creation flow from the Profile > Invoices tab