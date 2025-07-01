
-- First, let's modify the invoices table to support comedian invoices and add new fields
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS comedian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_email TEXT,
ADD COLUMN IF NOT EXISTS sender_address TEXT,
ADD COLUMN IF NOT EXISTS sender_phone TEXT,
ADD COLUMN IF NOT EXISTS sender_abn TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS client_mobile TEXT,
ADD COLUMN IF NOT EXISTS gst_treatment TEXT DEFAULT 'inclusive' CHECK (gst_treatment IN ('inclusive', 'exclusive', 'none'));

-- Modify the invoice_recipients table to add mobile field
ALTER TABLE public.invoice_recipients 
ADD COLUMN IF NOT EXISTS recipient_mobile TEXT;

-- Update the invoice number generation function to be truly global
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get the next sequential number globally across all users
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number ~ '^INV-\d+$';
  
  -- Format as INV-00001, INV-00002, etc.
  invoice_number := 'INV-' || LPAD(next_number::TEXT, 5, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to allow comedians to manage their own invoices
DROP POLICY IF EXISTS "Promoters can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Promoters can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Promoters can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Promoters can delete their own invoices" ON public.invoices;

-- Create new policies that work for both promoters and comedians
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (
    (promoter_id = auth.uid()) OR 
    (comedian_id = auth.uid())
  );

CREATE POLICY "Users can insert their own invoices" ON public.invoices
  FOR INSERT WITH CHECK (
    (promoter_id = auth.uid()) OR 
    (comedian_id = auth.uid())
  );

CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE USING (
    (promoter_id = auth.uid()) OR 
    (comedian_id = auth.uid())
  );

CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE USING (
    (promoter_id = auth.uid()) OR 
    (comedian_id = auth.uid())
  );

-- Update RLS policies for invoice_items to work with comedian invoices
DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert invoice items for their invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update invoice items for their invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice items for their invoices" ON public.invoice_items;

CREATE POLICY "Users can view invoice items for their invoices" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can insert invoice items for their invoices" ON public.invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can update invoice items for their invoices" ON public.invoice_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can delete invoice items for their invoices" ON public.invoice_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

-- Update RLS policies for invoice_recipients
DROP POLICY IF EXISTS "Users can view recipients for their invoices" ON public.invoice_recipients;
DROP POLICY IF EXISTS "Users can insert recipients for their invoices" ON public.invoice_recipients;
DROP POLICY IF EXISTS "Users can update recipients for their invoices" ON public.invoice_recipients;
DROP POLICY IF EXISTS "Users can delete recipients for their invoices" ON public.invoice_recipients;

CREATE POLICY "Users can view recipients for their invoices" ON public.invoice_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can insert recipients for their invoices" ON public.invoice_recipients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can update recipients for their invoices" ON public.invoice_recipients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can delete recipients for their invoices" ON public.invoice_recipients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

-- Update RLS policies for invoice_payments
DROP POLICY IF EXISTS "Users can view payments for their invoices" ON public.invoice_payments;
DROP POLICY IF EXISTS "Users can insert payments for their invoices" ON public.invoice_payments;
DROP POLICY IF EXISTS "Users can update payments for their invoices" ON public.invoice_payments;
DROP POLICY IF EXISTS "Users can delete payments for their invoices" ON public.invoice_payments;

CREATE POLICY "Users can view payments for their invoices" ON public.invoice_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can insert payments for their invoices" ON public.invoice_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can update payments for their invoices" ON public.invoice_payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can delete payments for their invoices" ON public.invoice_payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );
