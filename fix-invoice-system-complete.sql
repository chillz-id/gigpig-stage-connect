-- Complete Invoice System Fix
-- This migration ensures all invoice tables, columns, and relationships are properly configured

-- =====================================
-- 1. CREATE MISSING TABLES
-- =====================================

-- Create payment_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'square', 'manual')),
  url TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed', 'cancelled')),
  metadata JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on payment_links
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- =====================================
-- 2. FIX INVOICE TABLE STRUCTURE
-- =====================================

-- Add missing columns to invoices table
DO $$ 
BEGIN
  -- Ensure subtotal_amount exists (used by some queries)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal_amount') THEN
    ALTER TABLE public.invoices ADD COLUMN subtotal_amount DECIMAL(10,2);
    -- Copy data from subtotal if it exists
    UPDATE public.invoices SET subtotal_amount = subtotal WHERE subtotal IS NOT NULL;
  END IF;

  -- Add event_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'event_id') THEN
    ALTER TABLE public.invoices ADD COLUMN event_id UUID REFERENCES public.events(id);
  END IF;

  -- Add notes column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'notes') THEN
    ALTER TABLE public.invoices ADD COLUMN notes TEXT;
  END IF;

  -- Add terms column if missing (for invoice terms and conditions)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'terms') THEN
    ALTER TABLE public.invoices ADD COLUMN terms TEXT;
  END IF;

  -- Ensure profile relationship columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'profile_id') THEN
    ALTER TABLE public.invoices ADD COLUMN profile_id UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- =====================================
-- 3. FIX INVOICE ITEMS TABLE
-- =====================================

DO $$ 
BEGIN
  -- Ensure total column exists (frontend expects 'total', not 'total_price')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'total') THEN
    -- If total_price exists, rename it to total
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'total_price') THEN
      ALTER TABLE public.invoice_items RENAME COLUMN total_price TO total;
    ELSE
      -- Otherwise create it
      ALTER TABLE public.invoice_items ADD COLUMN total DECIMAL(10,2);
    END IF;
  END IF;

  -- Ensure rate column exists (some queries use 'rate' instead of 'unit_price')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'rate') THEN
    ALTER TABLE public.invoice_items ADD COLUMN rate DECIMAL(10,2);
    -- Copy data from unit_price if it exists
    UPDATE public.invoice_items SET rate = unit_price WHERE unit_price IS NOT NULL AND rate IS NULL;
  END IF;
END $$;

-- =====================================
-- 4. CREATE MISSING FUNCTIONS
-- =====================================

-- Function to calculate invoice total (if not exists)
CREATE OR REPLACE FUNCTION public.calculate_invoice_total(p_invoice_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(total), 0)
  INTO v_total
  FROM public.invoice_items
  WHERE invoice_id = p_invoice_id;
  
  RETURN v_total;
END;
$$;

-- Function to update invoice status
CREATE OR REPLACE FUNCTION public.update_invoice_status(p_invoice_id UUID, p_status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.invoices
  SET 
    status = p_status,
    updated_at = NOW(),
    paid_at = CASE WHEN p_status = 'paid' THEN NOW() ELSE paid_at END
  WHERE id = p_invoice_id;
  
  RETURN FOUND;
END;
$$;

-- =====================================
-- 5. FIX FOREIGN KEY RELATIONSHIPS
-- =====================================

-- Add foreign key constraints if missing
DO $$
BEGIN
  -- Check and add promoter_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_promoter_id_fkey'
  ) THEN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_promoter_id_fkey 
    FOREIGN KEY (promoter_id) REFERENCES public.profiles(id);
  END IF;

  -- Check and add comedian_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_comedian_id_fkey'
  ) THEN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_comedian_id_fkey 
    FOREIGN KEY (comedian_id) REFERENCES public.profiles(id);
  END IF;

  -- Check and add profile_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_profile_id_fkey'
  ) THEN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id);
  END IF;

  -- Check and add event_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_event_id_fkey'
  ) THEN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES public.events(id);
  END IF;
END $$;

-- =====================================
-- 6. UPDATE RLS POLICIES
-- =====================================

-- Drop all existing invoice policies
DROP POLICY IF EXISTS "Invoice access for all roles" ON public.invoices;
DROP POLICY IF EXISTS "Users can access invoice items for their invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can access invoice recipients for their invoices" ON public.invoice_recipients;
DROP POLICY IF EXISTS "Users can access invoice payments for their invoices" ON public.invoice_payments;
DROP POLICY IF EXISTS "Users can view payment links for their invoices" ON public.invoice_payment_links;
DROP POLICY IF EXISTS "Users can insert payment links for their invoices" ON public.invoice_payment_links;
DROP POLICY IF EXISTS "Users can update payment links for their invoices" ON public.invoice_payment_links;

-- Create comprehensive invoice access policy
CREATE POLICY "Comprehensive invoice access" ON public.invoices
FOR ALL TO authenticated
USING (
  -- User created the invoice
  created_by = auth.uid() OR
  -- User is the promoter
  promoter_id = auth.uid() OR
  -- User is the comedian
  comedian_id = auth.uid() OR
  -- User is the general profile
  profile_id = auth.uid() OR
  -- User is associated with the event
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = invoices.event_id
    AND organizer_id = auth.uid()
  ) OR
  -- User is an admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Create comprehensive invoice items policy
CREATE POLICY "Comprehensive invoice items access" ON public.invoice_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = invoice_items.invoice_id
    AND (
      created_by = auth.uid() OR
      promoter_id = auth.uid() OR
      comedian_id = auth.uid() OR
      profile_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  )
);

-- Create comprehensive invoice recipients policy
CREATE POLICY "Comprehensive invoice recipients access" ON public.invoice_recipients
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = invoice_recipients.invoice_id
    AND (
      created_by = auth.uid() OR
      promoter_id = auth.uid() OR
      comedian_id = auth.uid() OR
      profile_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  )
);

-- Create comprehensive invoice payments policy
CREATE POLICY "Comprehensive invoice payments access" ON public.invoice_payments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = invoice_payments.invoice_id
    AND (
      created_by = auth.uid() OR
      promoter_id = auth.uid() OR
      comedian_id = auth.uid() OR
      profile_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  )
);

-- Create comprehensive invoice payment links policy
CREATE POLICY "Comprehensive payment links access" ON public.invoice_payment_links
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = invoice_payment_links.invoice_id
    AND (
      created_by = auth.uid() OR
      promoter_id = auth.uid() OR
      comedian_id = auth.uid() OR
      profile_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  )
);

-- Create payment links policy
CREATE POLICY "Payment links access" ON public.payment_links
FOR ALL TO authenticated
USING (true);  -- Allow all authenticated users to view payment links

-- =====================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_invoices_profile_id ON public.invoices(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_event_id ON public.invoices(event_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_total ON public.invoice_items(total);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON public.payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_provider ON public.payment_links(provider);

-- =====================================
-- 8. SYNC DATA FIELDS
-- =====================================

-- Sync subtotal_amount with subtotal
UPDATE public.invoices 
SET subtotal_amount = subtotal 
WHERE subtotal IS NOT NULL AND subtotal_amount IS NULL;

-- Sync subtotal with subtotal_amount
UPDATE public.invoices 
SET subtotal = subtotal_amount 
WHERE subtotal_amount IS NOT NULL AND subtotal IS NULL;

-- Calculate totals for invoice items where missing
UPDATE public.invoice_items 
SET total = COALESCE(subtotal, 0) + COALESCE(tax_amount, 0)
WHERE total IS NULL;

-- Sync rate with unit_price in invoice_items
UPDATE public.invoice_items 
SET rate = unit_price 
WHERE unit_price IS NOT NULL AND rate IS NULL;

UPDATE public.invoice_items 
SET unit_price = rate 
WHERE rate IS NOT NULL AND unit_price IS NULL;

-- =====================================
-- 9. GRANT PERMISSIONS
-- =====================================

GRANT ALL ON public.payment_links TO authenticated;
GRANT ALL ON public.invoice_payment_links TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_invoice_total TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_invoice_status TO authenticated;

-- =====================================
-- 10. CREATE TEST DATA (Optional)
-- =====================================

-- Create a sample invoice to verify system works
DO $$
DECLARE
  v_test_profile_id UUID;
  v_test_invoice_id UUID;
BEGIN
  -- Get a test profile (first admin or promoter)
  SELECT id INTO v_test_profile_id
  FROM public.profiles
  WHERE role IN ('admin', 'promoter')
  LIMIT 1;

  IF v_test_profile_id IS NOT NULL THEN
    -- Create test invoice
    INSERT INTO public.invoices (
      invoice_type,
      invoice_number,
      promoter_id,
      profile_id,
      sender_name,
      sender_email,
      issue_date,
      due_date,
      currency,
      tax_rate,
      tax_treatment,
      gst_treatment,
      subtotal,
      subtotal_amount,
      tax_amount,
      total_amount,
      status,
      created_by
    ) VALUES (
      'promoter',
      'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
      v_test_profile_id,
      v_test_profile_id,
      'Stand Up Sydney Test',
      'test@standupSydney.com',
      NOW(),
      NOW() + INTERVAL '30 days',
      'AUD',
      10,
      'inclusive',
      'inclusive',
      100,
      100,
      10,
      110,
      'draft',
      v_test_profile_id
    ) RETURNING id INTO v_test_invoice_id;

    -- Create test invoice items
    INSERT INTO public.invoice_items (
      invoice_id,
      description,
      quantity,
      rate,
      unit_price,
      subtotal,
      tax_amount,
      total,
      item_order
    ) VALUES (
      v_test_invoice_id,
      'Test Service Item',
      1,
      100,
      100,
      100,
      10,
      110,
      1
    );

    -- Create test recipient
    INSERT INTO public.invoice_recipients (
      invoice_id,
      recipient_name,
      recipient_email,
      recipient_type
    ) VALUES (
      v_test_invoice_id,
      'Test Recipient',
      'recipient@test.com',
      'individual'
    );

    RAISE NOTICE 'Test invoice created with ID: %', v_test_invoice_id;
  END IF;
END $$;

-- =====================================
-- 11. FINAL VERIFICATION
-- =====================================

-- Report on the migration status
SELECT 
  'Invoice System Migration Complete' as status,
  (SELECT COUNT(*) FROM public.invoices) as total_invoices,
  (SELECT COUNT(*) FROM public.invoice_items) as total_items,
  (SELECT COUNT(*) FROM public.invoice_recipients) as total_recipients,
  (SELECT COUNT(*) FROM public.invoice_payments) as total_payments;