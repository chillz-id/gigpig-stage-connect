-- Complete Invoicing System Setup
-- This migration creates all invoice tables from scratch if they don't exist

-- =====================================
-- CREATE ALL TABLES FIRST
-- =====================================

-- Main invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('promoter', 'comedian', 'other')),
  invoice_number TEXT UNIQUE NOT NULL,
  promoter_id UUID REFERENCES public.profiles(id),
  comedian_id UUID REFERENCES public.profiles(id),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  tax_rate DECIMAL(5,2) DEFAULT 10,
  tax_treatment TEXT DEFAULT 'inclusive' CHECK (tax_treatment IN ('inclusive', 'exclusive', 'none')),
  subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  xero_invoice_id TEXT,
  last_synced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  item_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice recipients
CREATE TABLE IF NOT EXISTS public.invoice_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_address TEXT,
  recipient_phone TEXT,
  recipient_type TEXT DEFAULT 'individual' CHECK (recipient_type IN ('individual', 'company')),
  company_name TEXT,
  abn TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice payments
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Xero integration settings
CREATE TABLE IF NOT EXISTS public.xero_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tenant_id TEXT NOT NULL,
  tenant_name TEXT,
  organization_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Xero OAuth tokens
CREATE TABLE IF NOT EXISTS public.xero_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  tenant_id TEXT NOT NULL,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Xero invoice mapping
CREATE TABLE IF NOT EXISTS public.xero_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  xero_invoice_id TEXT NOT NULL,
  xero_invoice_number TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
  last_sync_error TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(invoice_id),
  UNIQUE(xero_invoice_id)
);

-- Xero contacts mapping
CREATE TABLE IF NOT EXISTS public.xero_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  xero_contact_id TEXT NOT NULL UNIQUE,
  xero_contact_name TEXT,
  xero_contact_email TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring invoices
CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_type TEXT NOT NULL,
  promoter_id UUID REFERENCES public.profiles(id),
  comedian_id UUID REFERENCES public.profiles(id),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  tax_rate DECIMAL(5,2) DEFAULT 10,
  description TEXT,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  next_invoice_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Xero webhook events
CREATE TABLE IF NOT EXISTS public.xero_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- NOW ADD INDEXES
-- =====================================

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_promoter_id ON public.invoices(promoter_id);
CREATE INDEX IF NOT EXISTS idx_invoices_comedian_id ON public.invoices(comedian_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_recipients_invoice_id ON public.invoice_recipients(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);

CREATE INDEX IF NOT EXISTS idx_xero_invoices_invoice_id ON public.xero_invoices(invoice_id);
CREATE INDEX IF NOT EXISTS idx_xero_invoices_xero_invoice_id ON public.xero_invoices(xero_invoice_id);

-- =====================================
-- ADD MISSING COLUMNS (if tables existed)
-- =====================================

-- Add missing columns to invoices table (will be skipped if column exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'xero_invoice_id') THEN
    ALTER TABLE public.invoices ADD COLUMN xero_invoice_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'last_synced_at') THEN
    ALTER TABLE public.invoices ADD COLUMN last_synced_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'paid_at') THEN
    ALTER TABLE public.invoices ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'created_by') THEN
    ALTER TABLE public.invoices ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add missing columns to xero_integrations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'xero_integrations' AND column_name = 'tenant_name') THEN
    ALTER TABLE public.xero_integrations ADD COLUMN tenant_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'xero_integrations' AND column_name = 'token_expires_at') THEN
    ALTER TABLE public.xero_integrations ADD COLUMN token_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- =====================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_webhook_events ENABLE ROW LEVEL SECURITY;

-- =====================================
-- FUNCTIONS FOR INVOICE OPERATIONS
-- =====================================

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(
  p_invoice_type TEXT,
  p_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_month TEXT;
  v_sequence INT;
  v_invoice_number TEXT;
BEGIN
  -- Determine prefix
  v_prefix := CASE p_invoice_type
    WHEN 'promoter' THEN 'PRO'
    WHEN 'comedian' THEN 'COM'
    ELSE 'INV'
  END;
  
  -- Get year and month
  v_year := TO_CHAR(p_date, 'YYYY');
  v_month := TO_CHAR(p_date, 'MM');
  
  -- Get next sequence number
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER
    )
  ), 0) + 1
  INTO v_sequence
  FROM public.invoices
  WHERE invoice_number LIKE v_prefix || '-' || v_year || v_month || '-%';
  
  -- Generate invoice number
  v_invoice_number := v_prefix || '-' || v_year || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_invoice_number;
END;
$$;

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals(p_invoice_id UUID)
RETURNS TABLE(
  subtotal DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tax_rate DECIMAL(5,2);
  v_tax_treatment TEXT;
BEGIN
  -- Get tax settings from invoice
  SELECT tax_rate, tax_treatment
  INTO v_tax_rate, v_tax_treatment
  FROM public.invoices
  WHERE id = p_invoice_id;
  
  -- Calculate totals based on tax treatment
  IF v_tax_treatment = 'inclusive' THEN
    -- Tax is included in the item totals
    SELECT 
      SUM(total) - SUM(total * v_tax_rate / (100 + v_tax_rate)),
      SUM(total * v_tax_rate / (100 + v_tax_rate)),
      SUM(total)
    INTO subtotal, tax_amount, total_amount
    FROM public.invoice_items
    WHERE invoice_id = p_invoice_id;
  ELSIF v_tax_treatment = 'exclusive' THEN
    -- Tax is added to the item totals
    SELECT 
      SUM(total),
      SUM(total * v_tax_rate / 100),
      SUM(total * (1 + v_tax_rate / 100))
    INTO subtotal, tax_amount, total_amount
    FROM public.invoice_items
    WHERE invoice_id = p_invoice_id;
  ELSE
    -- No tax
    SELECT 
      SUM(total),
      0,
      SUM(total)
    INTO subtotal, tax_amount, total_amount
    FROM public.invoice_items
    WHERE invoice_id = p_invoice_id;
  END IF;
  
  RETURN QUERY SELECT 
    COALESCE(subtotal, 0)::DECIMAL(10,2),
    COALESCE(tax_amount, 0)::DECIMAL(10,2),
    COALESCE(total_amount, 0)::DECIMAL(10,2);
END;
$$;

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_paid DECIMAL(10,2);
  v_invoice_total DECIMAL(10,2);
BEGIN
  -- Calculate total payments
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM public.invoice_payments
  WHERE invoice_id = NEW.invoice_id;
  
  -- Get invoice total
  SELECT total_amount
  INTO v_invoice_total
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  -- Update invoice status if fully paid
  IF v_total_paid >= v_invoice_total THEN
    UPDATE public.invoices
    SET 
      status = 'paid',
      paid_at = NOW()
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment status updates
DROP TRIGGER IF EXISTS update_invoice_payment_status_trigger ON public.invoice_payments;
CREATE TRIGGER update_invoice_payment_status_trigger
AFTER INSERT OR UPDATE ON public.invoice_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_payment_status();

-- Function to check and update overdue invoices
CREATE OR REPLACE FUNCTION public.check_overdue_invoices()
RETURNS TABLE(updated_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH updated AS (
    UPDATE public.invoices
    SET status = 'overdue'
    WHERE status = 'sent'
    AND due_date < NOW()
    RETURNING id
  )
  SELECT COUNT(*)::INT
  INTO updated_count
  FROM updated;
  
  RETURN QUERY SELECT updated_count;
END;
$$;

-- Function to process Xero webhook
CREATE OR REPLACE FUNCTION public.process_xero_webhook(
  p_events JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event JSONB;
  v_result JSONB = '[]'::JSONB;
BEGIN
  FOR v_event IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    -- Store webhook event
    INSERT INTO public.xero_webhook_events (
      event_id,
      event_type,
      resource_type,
      resource_id,
      tenant_id,
      event_date
    ) VALUES (
      v_event->>'eventId',
      v_event->>'eventType',
      v_event->>'resourceType',
      v_event->>'resourceId',
      v_event->>'tenantId',
      (v_event->>'eventDateUtc')::TIMESTAMPTZ
    )
    ON CONFLICT (event_id) DO NOTHING;
    
    -- Add to result
    v_result = v_result || jsonb_build_object(
      'eventId', v_event->>'eventId',
      'status', 'received'
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- Function to create invoice from event ticket sales
CREATE OR REPLACE FUNCTION public.create_invoice_from_event(
  p_event_id UUID,
  p_recipient_type TEXT,
  p_recipient_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_event RECORD;
  v_total_sales DECIMAL(10,2);
  v_invoice_type TEXT;
  v_invoice_number TEXT;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Calculate total sales (check if ticket_sales table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_sales') THEN
    SELECT COALESCE(SUM(net_revenue), 0)
    INTO v_total_sales
    FROM public.ticket_sales
    WHERE event_id = p_event_id;
  ELSE
    v_total_sales := 0;
  END IF;
  
  -- Determine invoice type
  v_invoice_type := p_recipient_type;
  
  -- Generate invoice number
  v_invoice_number := generate_invoice_number(v_invoice_type);
  
  -- Create invoice
  INSERT INTO public.invoices (
    invoice_type,
    invoice_number,
    promoter_id,
    comedian_id,
    sender_name,
    sender_email,
    issue_date,
    due_date,
    currency,
    tax_rate,
    tax_treatment,
    subtotal_amount,
    tax_amount,
    total_amount,
    notes,
    status,
    created_by
  ) VALUES (
    v_invoice_type,
    v_invoice_number,
    CASE WHEN p_recipient_type = 'promoter' THEN p_recipient_id ELSE NULL END,
    CASE WHEN p_recipient_type = 'comedian' THEN p_recipient_id ELSE NULL END,
    'Stand Up Sydney',
    'billing@standupSydney.com',
    NOW(),
    NOW() + INTERVAL '30 days',
    'AUD',
    10,
    'inclusive',
    v_total_sales * 0.909, -- Assuming 10% GST inclusive
    v_total_sales * 0.091,
    v_total_sales,
    'Invoice for event: ' || v_event.title,
    'draft',
    auth.uid()
  )
  RETURNING id INTO v_invoice_id;
  
  -- Add line items if we have ticket sales
  IF v_total_sales > 0 AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_sales') THEN
    INSERT INTO public.invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      subtotal,
      tax_amount,
      total
    )
    SELECT 
      v_invoice_id,
      'Ticket Sales - ' || platform || ' (' || SUM(quantity_sold) || ' tickets)',
      SUM(quantity_sold),
      AVG(gross_revenue / NULLIF(quantity_sold, 0)),
      SUM(net_revenue) * 0.909,
      SUM(net_revenue) * 0.091,
      SUM(net_revenue)
    FROM public.ticket_sales
    WHERE event_id = p_event_id
    GROUP BY platform;
  ELSE
    -- Add a placeholder line item
    INSERT INTO public.invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      subtotal,
      tax_amount,
      total
    ) VALUES (
      v_invoice_id,
      'Event: ' || v_event.title,
      1,
      0,
      0,
      0,
      0
    );
  END IF;
  
  -- Add recipient
  INSERT INTO public.invoice_recipients (
    invoice_id,
    recipient_name,
    recipient_email,
    recipient_type
  )
  SELECT 
    v_invoice_id,
    COALESCE(p.full_name, p.email),
    p.email,
    'individual'
  FROM public.profiles p
  WHERE p.id = p_recipient_id;
  
  RETURN v_invoice_id;
END;
$$;

-- =====================================
-- RLS POLICIES
-- =====================================

-- Update RLS policies for better access control
DROP POLICY IF EXISTS "Invoice creators can manage their invoices" ON public.invoices;
CREATE POLICY "Invoice creators can manage their invoices" ON public.invoices
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

-- Policy for invoice items
DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON public.invoice_items;
CREATE POLICY "Users can view invoice items for their invoices" ON public.invoice_items
FOR SELECT TO authenticated
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

-- Policy for invoice recipients
DROP POLICY IF EXISTS "Users can view invoice recipients for their invoices" ON public.invoice_recipients;
CREATE POLICY "Users can view invoice recipients for their invoices" ON public.invoice_recipients
FOR SELECT TO authenticated
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

-- Policy for invoice payments
DROP POLICY IF EXISTS "Users can view invoice payments for their invoices" ON public.invoice_payments;
CREATE POLICY "Users can view invoice payments for their invoices" ON public.invoice_payments
FOR SELECT TO authenticated
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

-- Policy for Xero integrations
DROP POLICY IF EXISTS "Users can manage their Xero integrations" ON public.xero_integrations;
CREATE POLICY "Users can manage their Xero integrations" ON public.xero_integrations
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- Policy for Xero tokens
DROP POLICY IF EXISTS "Users can manage their Xero tokens" ON public.xero_tokens;
CREATE POLICY "Users can manage their Xero tokens" ON public.xero_tokens
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- =====================================
-- GRANT PERMISSIONS
-- =====================================

GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_recipients TO authenticated;
GRANT ALL ON public.invoice_payments TO authenticated;
GRANT ALL ON public.xero_integrations TO authenticated;
GRANT ALL ON public.xero_tokens TO authenticated;
GRANT ALL ON public.xero_invoices TO authenticated;
GRANT ALL ON public.xero_contacts TO authenticated;
GRANT ALL ON public.recurring_invoices TO authenticated;
GRANT ALL ON public.xero_webhook_events TO authenticated;

GRANT EXECUTE ON FUNCTION public.generate_invoice_number TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_invoice_totals TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_overdue_invoices TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invoice_from_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_xero_webhook TO authenticated;

-- =====================================
-- VERIFY INSTALLATION
-- =====================================

-- This query will show all invoice-related tables that were created
SELECT 'Tables created:' as message;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%invoice%' OR table_name LIKE '%xero%')
ORDER BY table_name;