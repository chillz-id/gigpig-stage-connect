-- Complete Invoicing System Setup
-- This migration ensures all invoicing tables, functions, and policies are properly configured

-- =====================================
-- ENVIRONMENT VARIABLES CHECK
-- =====================================
-- Ensure the following are set in your Supabase project settings:
-- XERO_CLIENT_ID: Your Xero OAuth2 Client ID
-- XERO_CLIENT_SECRET: Your Xero OAuth2 Client Secret

-- =====================================
-- MISSING INDEXES
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
-- MISSING COLUMNS
-- =====================================

-- Add missing columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS xero_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add missing columns to xero_integrations
ALTER TABLE public.xero_integrations
ADD COLUMN IF NOT EXISTS tenant_name TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

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

-- =====================================
-- XERO WEBHOOK HANDLING
-- =====================================

-- Table for Xero webhook events
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

-- =====================================
-- INVOICE AUTOMATION
-- =====================================

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
  
  -- Calculate total sales
  SELECT COALESCE(SUM(net_revenue), 0)
  INTO v_total_sales
  FROM public.ticket_sales
  WHERE event_id = p_event_id;
  
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
  
  -- Add line items for each ticket platform
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
-- ENHANCED RLS POLICIES
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

-- Policy for Xero integrations
DROP POLICY IF EXISTS "Users can manage their Xero integrations" ON public.xero_integrations;
CREATE POLICY "Users can manage their Xero integrations" ON public.xero_integrations
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- =====================================
-- SAMPLE DATA FOR TESTING
-- =====================================

-- Create sample invoice templates
INSERT INTO public.recurring_invoices (
  invoice_type,
  promoter_id,
  frequency,
  amount,
  currency,
  tax_rate,
  description,
  sender_name,
  sender_email,
  next_invoice_date,
  is_active
)
SELECT 
  'promoter',
  p.id,
  'monthly',
  500.00,
  'AUD',
  10,
  'Monthly platform subscription',
  'Stand Up Sydney',
  'billing@standupSydney.com',
  DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
  true
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'promoter'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_recipients TO authenticated;
GRANT ALL ON public.invoice_payments TO authenticated;
GRANT ALL ON public.xero_integrations TO authenticated;
GRANT ALL ON public.xero_invoices TO authenticated;
GRANT ALL ON public.xero_webhook_events TO authenticated;
GRANT ALL ON public.recurring_invoices TO authenticated;

GRANT EXECUTE ON FUNCTION public.generate_invoice_number TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_invoice_totals TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_overdue_invoices TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invoice_from_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_xero_webhook TO authenticated;

-- Create Edge Function for Xero OAuth (to be deployed separately)
COMMENT ON FUNCTION public.process_xero_webhook IS 'Processes Xero webhook events. For OAuth token exchange, use Supabase Edge Functions with environment variables for XERO_CLIENT_ID and XERO_CLIENT_SECRET';