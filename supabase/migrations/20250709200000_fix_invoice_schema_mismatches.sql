-- Fix Invoice Database Schema Mismatches
-- This migration addresses the field name mismatches and missing columns identified in the core functionality fix plan

-- =====================================
-- CREATE MISSING TABLES IF NOT EXISTS
-- =====================================

-- Create webhook_logs table for ticket sync logging
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================

-- Add missing columns to invoices table
DO $$ 
BEGIN
  -- Add invoice_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_type') THEN
    ALTER TABLE public.invoices ADD COLUMN invoice_type TEXT NOT NULL DEFAULT 'other' CHECK (invoice_type IN ('promoter', 'comedian', 'other'));
  END IF;
  
  -- Add comedian_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'comedian_id') THEN
    ALTER TABLE public.invoices ADD COLUMN comedian_id UUID REFERENCES public.profiles(id);
  END IF;
  
  -- Add sender_phone column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'sender_phone') THEN
    ALTER TABLE public.invoices ADD COLUMN sender_phone TEXT;
  END IF;
  
  -- Add sender_address column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'sender_address') THEN
    ALTER TABLE public.invoices ADD COLUMN sender_address TEXT;
  END IF;
  
  -- Add sender_abn column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'sender_abn') THEN
    ALTER TABLE public.invoices ADD COLUMN sender_abn TEXT;
  END IF;
  
  -- Add client_address column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'client_address') THEN
    ALTER TABLE public.invoices ADD COLUMN client_address TEXT;
  END IF;
  
  -- Add client_mobile column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'client_mobile') THEN
    ALTER TABLE public.invoices ADD COLUMN client_mobile TEXT;
  END IF;
  
  -- Add gst_treatment column if it doesn't exist (maps to tax_treatment)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'gst_treatment') THEN
    ALTER TABLE public.invoices ADD COLUMN gst_treatment TEXT DEFAULT 'inclusive' CHECK (gst_treatment IN ('inclusive', 'exclusive', 'none'));
  END IF;
  
  -- Add tax_treatment column if it doesn't exist (alias for gst_treatment)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_treatment') THEN
    ALTER TABLE public.invoices ADD COLUMN tax_treatment TEXT DEFAULT 'inclusive' CHECK (tax_treatment IN ('inclusive', 'exclusive', 'none'));
  END IF;
  
  -- Add deposit-related columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'deposit_amount') THEN
    ALTER TABLE public.invoices ADD COLUMN deposit_amount DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'deposit_percentage') THEN
    ALTER TABLE public.invoices ADD COLUMN deposit_percentage DECIMAL(5,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'deposit_due_days_before_event') THEN
    ALTER TABLE public.invoices ADD COLUMN deposit_due_days_before_event INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'deposit_due_date') THEN
    ALTER TABLE public.invoices ADD COLUMN deposit_due_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'deposit_status') THEN
    ALTER TABLE public.invoices ADD COLUMN deposit_status TEXT DEFAULT 'not_required' CHECK (deposit_status IN ('not_required', 'pending', 'paid', 'overdue', 'partial'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'deposit_paid_date') THEN
    ALTER TABLE public.invoices ADD COLUMN deposit_paid_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'deposit_paid_amount') THEN
    ALTER TABLE public.invoices ADD COLUMN deposit_paid_amount DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'event_date') THEN
    ALTER TABLE public.invoices ADD COLUMN event_date DATE;
  END IF;
  
  -- Add subtotal column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal') THEN
    ALTER TABLE public.invoices ADD COLUMN subtotal DECIMAL(10,2);
  END IF;
  
  -- Add terms column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'terms') THEN
    ALTER TABLE public.invoices ADD COLUMN terms TEXT;
  END IF;
END $$;

-- =====================================
-- ADD MISSING COLUMNS TO INVOICE_ITEMS
-- =====================================

DO $$ 
BEGIN
  -- Add unit_price column if it doesn't exist (maps to rate)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'unit_price') THEN
    ALTER TABLE public.invoice_items ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Add subtotal column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'subtotal') THEN
    ALTER TABLE public.invoice_items ADD COLUMN subtotal DECIMAL(10,2);
  END IF;
  
  -- Add tax_amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'tax_amount') THEN
    ALTER TABLE public.invoice_items ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Add total column as total_price if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'total_price') THEN
    ALTER TABLE public.invoice_items ADD COLUMN total_price DECIMAL(10,2);
  END IF;
  
  -- Add item_order column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'item_order') THEN
    ALTER TABLE public.invoice_items ADD COLUMN item_order INTEGER DEFAULT 0;
  END IF;
  
  -- Update subtotal from rate and quantity if subtotal is null
  UPDATE public.invoice_items 
  SET subtotal = COALESCE(rate, 0) * COALESCE(quantity, 1)
  WHERE subtotal IS NULL;
  
  -- Update unit_price from rate if it's null or zero
  UPDATE public.invoice_items 
  SET unit_price = COALESCE(rate, 0)
  WHERE unit_price IS NULL OR unit_price = 0;
  
  -- Update total_price from subtotal + tax_amount
  UPDATE public.invoice_items 
  SET total_price = COALESCE(subtotal, 0) + COALESCE(tax_amount, 0)
  WHERE total_price IS NULL;
END $$;

-- =====================================
-- ADD MISSING COLUMNS TO INVOICE_RECIPIENTS
-- =====================================

DO $$ 
BEGIN
  -- Add recipient_mobile column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_recipients' AND column_name = 'recipient_mobile') THEN
    ALTER TABLE public.invoice_recipients ADD COLUMN recipient_mobile TEXT;
  END IF;
  
  -- Add recipient_abn column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_recipients' AND column_name = 'recipient_abn') THEN
    ALTER TABLE public.invoice_recipients ADD COLUMN recipient_abn TEXT;
  END IF;
  
  -- Add company_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_recipients' AND column_name = 'company_name') THEN
    ALTER TABLE public.invoice_recipients ADD COLUMN company_name TEXT;
  END IF;
END $$;

-- =====================================
-- ADD MISSING COLUMNS TO INVOICE_PAYMENTS
-- =====================================

DO $$ 
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_payments' AND column_name = 'status') THEN
    ALTER TABLE public.invoice_payments ADD COLUMN status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed'));
  END IF;
  
  -- Add is_deposit column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_payments' AND column_name = 'is_deposit') THEN
    ALTER TABLE public.invoice_payments ADD COLUMN is_deposit BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add recorded_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_payments' AND column_name = 'recorded_by') THEN
    ALTER TABLE public.invoice_payments ADD COLUMN recorded_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- =====================================
-- UPDATE RLS POLICIES FOR BETTER ACCESS
-- =====================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view invoices for their events" ON public.invoices;
DROP POLICY IF EXISTS "Users can manage invoices for their events" ON public.invoices;
DROP POLICY IF EXISTS "Invoice creators can manage their invoices" ON public.invoices;

-- Create more permissive policies for comedians
CREATE POLICY "Invoice access for all roles" ON public.invoices
FOR ALL TO authenticated
USING (
  created_by = auth.uid() OR
  promoter_id = auth.uid() OR
  comedian_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'promoter', 'comedian')
  )
);

-- Update invoice items policy
DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON public.invoice_items;
CREATE POLICY "Users can access invoice items for their invoices" ON public.invoice_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = invoice_items.invoice_id
    AND (
      created_by = auth.uid() OR
      promoter_id = auth.uid() OR
      comedian_id = auth.uid()
    )
  )
);

-- Update invoice recipients policy
DROP POLICY IF EXISTS "Users can view invoice recipients for their invoices" ON public.invoice_recipients;
CREATE POLICY "Users can access invoice recipients for their invoices" ON public.invoice_recipients
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = invoice_recipients.invoice_id
    AND (
      created_by = auth.uid() OR
      promoter_id = auth.uid() OR
      comedian_id = auth.uid()
    )
  )
);

-- Update invoice payments policy
DROP POLICY IF EXISTS "Users can view invoice payments for their invoices" ON public.invoice_payments;
CREATE POLICY "Users can access invoice payments for their invoices" ON public.invoice_payments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = invoice_payments.invoice_id
    AND (
      created_by = auth.uid() OR
      promoter_id = auth.uid() OR
      comedian_id = auth.uid()
    )
  )
);

-- =====================================
-- ENABLE RLS ON NEW TABLES
-- =====================================

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for webhook logs (admin only)
CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- =====================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================

-- Indexes for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON public.webhook_logs(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_timestamp ON public.webhook_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON public.webhook_logs(processed);

-- Additional indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON public.invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_comedian_id ON public.invoices(comedian_id);
CREATE INDEX IF NOT EXISTS idx_invoices_deposit_status ON public.invoices(deposit_status);
CREATE INDEX IF NOT EXISTS idx_invoices_deposit_due_date ON public.invoices(deposit_due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_event_date ON public.invoices(event_date);

-- =====================================
-- SYNC GST_TREATMENT WITH TAX_TREATMENT
-- =====================================

-- Update gst_treatment to match tax_treatment where both exist
UPDATE public.invoices 
SET gst_treatment = tax_treatment 
WHERE tax_treatment IS NOT NULL AND gst_treatment IS NULL;

-- Update tax_treatment to match gst_treatment where both exist
UPDATE public.invoices 
SET tax_treatment = gst_treatment 
WHERE gst_treatment IS NOT NULL AND tax_treatment IS NULL;

-- =====================================
-- GRANT PERMISSIONS
-- =====================================

GRANT ALL ON public.webhook_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invoice_number TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_invoice_totals TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_overdue_invoices TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invoice_from_event TO authenticated;

-- =====================================
-- VERIFY MIGRATION SUCCESS
-- =====================================

-- This will help verify the migration was successful
SELECT 'Invoice schema migration completed successfully' as message;

-- Show updated invoice table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'invoices'
ORDER BY ordinal_position;