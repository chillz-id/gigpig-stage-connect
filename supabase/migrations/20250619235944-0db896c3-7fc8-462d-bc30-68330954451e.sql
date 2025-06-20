
-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  payment_terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create invoice line items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create invoice recipients table (for sending invoices to multiple recipients)
CREATE TABLE public.invoice_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create invoice payments table (to track payments against invoices)
CREATE TABLE public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all invoice tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices (promoters can only see their own invoices)
CREATE POLICY "Promoters can view their own invoices" ON public.invoices
  FOR SELECT USING (promoter_id = auth.uid());

CREATE POLICY "Promoters can insert their own invoices" ON public.invoices
  FOR INSERT WITH CHECK (promoter_id = auth.uid());

CREATE POLICY "Promoters can update their own invoices" ON public.invoices
  FOR UPDATE USING (promoter_id = auth.uid());

CREATE POLICY "Promoters can delete their own invoices" ON public.invoices
  FOR DELETE USING (promoter_id = auth.uid());

-- RLS policies for invoice_items
CREATE POLICY "Users can view invoice items for their invoices" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

CREATE POLICY "Users can insert invoice items for their invoices" ON public.invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

CREATE POLICY "Users can update invoice items for their invoices" ON public.invoice_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

CREATE POLICY "Users can delete invoice items for their invoices" ON public.invoice_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

-- RLS policies for invoice_recipients
CREATE POLICY "Users can view recipients for their invoices" ON public.invoice_recipients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

CREATE POLICY "Users can insert recipients for their invoices" ON public.invoice_recipients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

CREATE POLICY "Users can update recipients for their invoices" ON public.invoice_recipients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

CREATE POLICY "Users can delete recipients for their invoices" ON public.invoice_recipients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

-- RLS policies for invoice_payments
CREATE POLICY "Users can view payments for their invoices" ON public.invoice_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

CREATE POLICY "Users can insert payments for their invoices" ON public.invoice_payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

CREATE POLICY "Users can update payments for their invoices" ON public.invoice_payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

CREATE POLICY "Users can delete payments for their invoices" ON public.invoice_payments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND promoter_id = auth.uid())
  );

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get the next sequential number
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number ~ '^INV-\d+$';
  
  -- Format as INV-00001, INV-00002, etc.
  invoice_number := 'INV-' || LPAD(next_number::TEXT, 5, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice totals when items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_subtotal DECIMAL(10,2);
  invoice_tax_amount DECIMAL(10,2);
  invoice_total DECIMAL(10,2);
  tax_rate DECIMAL(5,2);
BEGIN
  -- Get the tax rate for this invoice
  SELECT invoices.tax_rate INTO tax_rate
  FROM public.invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Calculate new subtotal
  SELECT COALESCE(SUM(total_price), 0) INTO invoice_subtotal
  FROM public.invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Calculate tax amount
  invoice_tax_amount := invoice_subtotal * (tax_rate / 100);
  
  -- Calculate total
  invoice_total := invoice_subtotal + invoice_tax_amount;
  
  -- Update the invoice
  UPDATE public.invoices
  SET 
    subtotal = invoice_subtotal,
    tax_amount = invoice_tax_amount,
    total_amount = invoice_total,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice totals when items are modified
CREATE TRIGGER update_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_totals();
