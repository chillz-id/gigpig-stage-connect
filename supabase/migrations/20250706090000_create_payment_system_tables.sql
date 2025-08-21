-- Create enhanced invoice database schema for FlexPay payment system
-- This migration extends the existing invoice system with payment records and recurring invoices

-- Create custom types for payment and invoice statuses
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE recurring_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Extend invoice_status enum to include more comprehensive statuses
-- Note: We can't directly modify existing enum, so we'll create a new one if needed
-- The existing invoice table already has status with proper values

-- Create payment_records table to track all payments across different gateways
CREATE TABLE public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_gateway TEXT NOT NULL CHECK (payment_gateway IN ('stripe', 'paypal', 'bank_transfer', 'cash', 'other')),
  gateway_transaction_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT, -- e.g., 'credit_card', 'bank_transfer', 'paypal_account'
  payment_date TIMESTAMPTZ,
  gateway_response JSONB, -- Store gateway-specific response data
  commission_rate DECIMAL(5,4) DEFAULT 0, -- Platform commission rate (e.g., 0.025 for 2.5%)
  commission_amount DECIMAL(10,2) DEFAULT 0, -- Calculated commission amount
  net_amount DECIMAL(10,2) NOT NULL, -- Amount after commission
  refund_amount DECIMAL(10,2) DEFAULT 0, -- Track partial/full refunds
  processor_fee DECIMAL(10,2) DEFAULT 0, -- Payment processor fee
  metadata JSONB DEFAULT '{}', -- Additional payment metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create recurring_invoices table for subscription-based billing
CREATE TABLE public.recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comedian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  subscription_name TEXT NOT NULL,
  frequency recurring_frequency NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for indefinite subscriptions
  next_billing_date DATE NOT NULL,
  last_billing_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_send BOOLEAN NOT NULL DEFAULT true,
  payment_terms TEXT,
  notes TEXT,
  billing_day INTEGER, -- For monthly/yearly (1-31), weekly (1-7 for Mon-Sun)
  invoice_count INTEGER DEFAULT 0, -- Track number of invoices generated
  max_invoices INTEGER, -- NULL for unlimited
  failed_attempts INTEGER DEFAULT 0,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create commission_splits table for handling multi-party payment splits
CREATE TABLE public.commission_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_record_id UUID REFERENCES public.payment_records(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('platform', 'agency', 'comedian', 'promoter', 'venue')),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  split_percentage DECIMAL(5,2) NOT NULL, -- e.g., 15.00 for 15%
  split_amount DECIMAL(10,2) NOT NULL,
  split_status payment_status NOT NULL DEFAULT 'pending',
  payout_method TEXT, -- e.g., 'bank_transfer', 'paypal', 'stripe_connect'
  payout_date TIMESTAMPTZ,
  payout_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payment_gateway_settings table for multi-gateway configuration
CREATE TABLE public.payment_gateway_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway_name TEXT NOT NULL CHECK (gateway_name IN ('stripe', 'paypal', 'bank_transfer')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  configuration JSONB NOT NULL DEFAULT '{}', -- Store gateway-specific settings
  credentials JSONB NOT NULL DEFAULT '{}', -- Encrypted gateway credentials
  webhook_url TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, gateway_name)
);

-- Enable RLS on all new tables
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_records
CREATE POLICY "Users can view payment records for their invoices" ON public.payment_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can insert payment records for their invoices" ON public.payment_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can update payment records for their invoices" ON public.payment_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

-- RLS policies for recurring_invoices
CREATE POLICY "Users can view their own recurring invoices" ON public.recurring_invoices
  FOR SELECT USING (
    (promoter_id = auth.uid()) OR (comedian_id = auth.uid())
  );

CREATE POLICY "Users can insert their own recurring invoices" ON public.recurring_invoices
  FOR INSERT WITH CHECK (
    (promoter_id = auth.uid()) OR (comedian_id = auth.uid())
  );

CREATE POLICY "Users can update their own recurring invoices" ON public.recurring_invoices
  FOR UPDATE USING (
    (promoter_id = auth.uid()) OR (comedian_id = auth.uid())
  );

CREATE POLICY "Users can delete their own recurring invoices" ON public.recurring_invoices
  FOR DELETE USING (
    (promoter_id = auth.uid()) OR (comedian_id = auth.uid())
  );

-- RLS policies for commission_splits
CREATE POLICY "Users can view their own commission splits" ON public.commission_splits
  FOR SELECT USING (
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.payment_records pr
      JOIN public.invoices i ON pr.invoice_id = i.id
      WHERE pr.id = payment_record_id 
      AND ((i.promoter_id = auth.uid()) OR (i.comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can insert commission splits for their payments" ON public.commission_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payment_records pr
      JOIN public.invoices i ON pr.invoice_id = i.id
      WHERE pr.id = payment_record_id 
      AND ((i.promoter_id = auth.uid()) OR (i.comedian_id = auth.uid()))
    )
  );

-- RLS policies for payment_gateway_settings
CREATE POLICY "Users can view their own gateway settings" ON public.payment_gateway_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own gateway settings" ON public.payment_gateway_settings
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_payment_records_invoice_id ON public.payment_records(invoice_id);
CREATE INDEX idx_payment_records_status ON public.payment_records(status);
CREATE INDEX idx_payment_records_gateway ON public.payment_records(payment_gateway);
CREATE INDEX idx_payment_records_date ON public.payment_records(payment_date);

CREATE INDEX idx_recurring_invoices_promoter_id ON public.recurring_invoices(promoter_id);
CREATE INDEX idx_recurring_invoices_comedian_id ON public.recurring_invoices(comedian_id);
CREATE INDEX idx_recurring_invoices_next_billing ON public.recurring_invoices(next_billing_date) WHERE is_active = true;
CREATE INDEX idx_recurring_invoices_active ON public.recurring_invoices(is_active);

CREATE INDEX idx_commission_splits_payment_record_id ON public.commission_splits(payment_record_id);
CREATE INDEX idx_commission_splits_recipient_id ON public.commission_splits(recipient_id);
CREATE INDEX idx_commission_splits_status ON public.commission_splits(split_status);

CREATE INDEX idx_payment_gateway_settings_user_id ON public.payment_gateway_settings(user_id);
CREATE INDEX idx_payment_gateway_settings_enabled ON public.payment_gateway_settings(user_id, is_enabled) WHERE is_enabled = true;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_invoices_updated_at
  BEFORE UPDATE ON public.recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_splits_updated_at
  BEFORE UPDATE ON public.commission_splits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_gateway_settings_updated_at
  BEFORE UPDATE ON public.payment_gateway_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate commission splits automatically
CREATE OR REPLACE FUNCTION public.calculate_commission_splits(
  payment_record_id_param UUID,
  platform_rate DECIMAL(5,2) DEFAULT 2.5,
  agency_rate DECIMAL(5,2) DEFAULT 10.0
) RETURNS void AS $$
DECLARE
  payment_record RECORD;
  platform_amount DECIMAL(10,2);
  agency_amount DECIMAL(10,2);
  comedian_amount DECIMAL(10,2);
BEGIN
  -- Get payment record details
  SELECT pr.*, i.promoter_id, i.comedian_id
  INTO payment_record
  FROM public.payment_records pr
  JOIN public.invoices i ON pr.invoice_id = i.id
  WHERE pr.id = payment_record_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found';
  END IF;

  -- Calculate split amounts
  platform_amount := payment_record.net_amount * (platform_rate / 100);
  agency_amount := payment_record.net_amount * (agency_rate / 100);
  comedian_amount := payment_record.net_amount - platform_amount - agency_amount;

  -- Insert commission splits
  INSERT INTO public.commission_splits 
    (payment_record_id, recipient_type, recipient_id, split_percentage, split_amount)
  VALUES 
    (payment_record_id_param, 'platform', NULL, platform_rate, platform_amount),
    (payment_record_id_param, 'agency', payment_record.promoter_id, agency_rate, agency_amount),
    (payment_record_id_param, 'comedian', payment_record.comedian_id, 100 - platform_rate - agency_rate, comedian_amount);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate next recurring invoice
CREATE OR REPLACE FUNCTION public.generate_recurring_invoice(
  recurring_invoice_id_param UUID
) RETURNS UUID AS $$
DECLARE
  recurring_invoice RECORD;
  new_invoice_id UUID;
  new_invoice_number TEXT;
  next_due_date DATE;
BEGIN
  -- Get recurring invoice details
  SELECT * INTO recurring_invoice
  FROM public.recurring_invoices
  WHERE id = recurring_invoice_id_param AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active recurring invoice not found';
  END IF;

  -- Generate new invoice number
  SELECT generate_invoice_number() INTO new_invoice_number;

  -- Calculate due date (30 days from issue date)
  next_due_date := recurring_invoice.next_billing_date + INTERVAL '30 days';

  -- Create new invoice
  INSERT INTO public.invoices (
    promoter_id,
    comedian_id,
    invoice_number,
    issue_date,
    due_date,
    total_amount,
    currency,
    status,
    payment_terms,
    notes
  ) VALUES (
    recurring_invoice.promoter_id,
    recurring_invoice.comedian_id,
    new_invoice_number,
    recurring_invoice.next_billing_date,
    next_due_date,
    recurring_invoice.amount,
    recurring_invoice.currency,
    CASE WHEN recurring_invoice.auto_send THEN 'sent' ELSE 'draft' END,
    recurring_invoice.payment_terms,
    recurring_invoice.notes
  ) RETURNING id INTO new_invoice_id;

  -- Update recurring invoice
  UPDATE public.recurring_invoices
  SET 
    last_billing_date = next_billing_date,
    next_billing_date = CASE recurring_invoice.frequency
      WHEN 'weekly' THEN next_billing_date + INTERVAL '1 week'
      WHEN 'monthly' THEN next_billing_date + INTERVAL '1 month'
      WHEN 'quarterly' THEN next_billing_date + INTERVAL '3 months'
      WHEN 'yearly' THEN next_billing_date + INTERVAL '1 year'
    END,
    invoice_count = invoice_count + 1,
    updated_at = NOW()
  WHERE id = recurring_invoice_id_param;

  RETURN new_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process scheduled recurring invoices
CREATE OR REPLACE FUNCTION public.process_recurring_invoices()
RETURNS INTEGER AS $$
DECLARE
  recurring_invoice RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Process all active recurring invoices due today or overdue
  FOR recurring_invoice IN
    SELECT id
    FROM public.recurring_invoices
    WHERE is_active = true
      AND next_billing_date <= CURRENT_DATE
      AND (max_invoices IS NULL OR invoice_count < max_invoices)
  LOOP
    BEGIN
      PERFORM public.generate_recurring_invoice(recurring_invoice.id);
      processed_count := processed_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue
      UPDATE public.recurring_invoices
      SET 
        failed_attempts = failed_attempts + 1,
        last_error = SQLERRM,
        updated_at = NOW()
      WHERE id = recurring_invoice.id;
    END;
  END LOOP;

  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.payment_records IS 'Tracks all payments across different payment gateways with commission handling';
COMMENT ON TABLE public.recurring_invoices IS 'Manages subscription-based recurring invoice generation';
COMMENT ON TABLE public.commission_splits IS 'Handles multi-party payment splits for platform, agency, and comedian commissions';
COMMENT ON TABLE public.payment_gateway_settings IS 'Stores user-specific payment gateway configurations';

COMMENT ON FUNCTION public.calculate_commission_splits(UUID, DECIMAL, DECIMAL) IS 'Automatically calculates and creates commission splits for a payment';
COMMENT ON FUNCTION public.generate_recurring_invoice(UUID) IS 'Generates next invoice from a recurring invoice template';
COMMENT ON FUNCTION public.process_recurring_invoices() IS 'Processes all due recurring invoices (to be called by cron job)';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.calculate_commission_splits(UUID, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_recurring_invoice(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_recurring_invoices() TO authenticated;