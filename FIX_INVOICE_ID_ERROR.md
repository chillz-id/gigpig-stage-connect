# Fix for "invoice_id" Column Error

## Error
```
ERROR: 42703: column "invoice_id" does not exist
```

## Solution

This error occurs because the invoice-related tables are missing the required `invoice_id` column. You need to run the invoice system migration.

### Option 1: Run the Complete Invoice Migration

```sql
-- Run the complete invoice migration at:
-- /root/agents/invoice-migration.sql
```

This migration will:
- Create all invoice-related tables with proper columns
- Add the `invoice_id` column to:
  - `invoice_items`
  - `invoice_recipients`  
  - `invoice_payments`
  - `xero_invoices`
- Set up proper indexes and foreign keys

### Option 2: Quick Fix - Add Missing Columns Only

If tables exist but are missing columns, run:

```sql
-- Add invoice_id to invoice_items if missing
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE;

-- Add invoice_id to invoice_recipients if missing  
ALTER TABLE public.invoice_recipients
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE;

-- Add invoice_id to invoice_payments if missing
ALTER TABLE public.invoice_payments
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE;

-- Add invoice_id to xero_invoices if missing
ALTER TABLE public.xero_invoices
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_recipients_invoice_id ON public.invoice_recipients(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_xero_invoices_invoice_id ON public.xero_invoices(invoice_id);
```

### Option 3: Check Which Table is Missing the Column

Run this query to identify which table is causing the error:

```sql
-- Check if invoice_items has invoice_id
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
  AND column_name = 'invoice_id';

-- Check if invoice_recipients has invoice_id  
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'invoice_recipients' 
  AND column_name = 'invoice_id';

-- Check if invoice_payments has invoice_id
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'invoice_payments' 
  AND column_name = 'invoice_id';
```

## Recommended Action

1. First, check which tables are missing the column using Option 3
2. If multiple tables are affected, run the complete migration (Option 1)
3. If only specific tables need the column, use Option 2

The complete invoice migration file is available at:
`/root/agents/invoice-migration.sql`