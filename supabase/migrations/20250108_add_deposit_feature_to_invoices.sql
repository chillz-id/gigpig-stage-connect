-- Add deposit feature to invoices
-- This migration adds deposit functionality to allow upfront payments to secure bookings

-- Add deposit-related columns to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deposit_percentage DECIMAL(5,2) DEFAULT NULL CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100),
ADD COLUMN IF NOT EXISTS deposit_due_days_before_event INTEGER DEFAULT NULL CHECK (deposit_due_days_before_event >= 0),
ADD COLUMN IF NOT EXISTS deposit_due_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'not_required' CHECK (deposit_status IN ('not_required', 'pending', 'paid', 'overdue', 'partial')),
ADD COLUMN IF NOT EXISTS deposit_paid_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deposit_paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ DEFAULT NULL;

-- Add constraint to ensure either amount or percentage is set, not both
ALTER TABLE public.invoices
ADD CONSTRAINT check_deposit_type CHECK (
  (deposit_amount IS NULL AND deposit_percentage IS NULL) OR
  (deposit_amount IS NOT NULL AND deposit_percentage IS NULL) OR
  (deposit_amount IS NULL AND deposit_percentage IS NOT NULL)
);

-- Create deposit_payments table to track which payments are deposits
CREATE TABLE IF NOT EXISTS public.deposit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_record_id UUID NOT NULL REFERENCES public.payment_records(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  deposit_amount DECIMAL(10,2) NOT NULL,
  is_partial BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_record_id)
);

-- Enable RLS on deposit_payments table
ALTER TABLE public.deposit_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for deposit_payments
CREATE POLICY "Users can view deposit payments for their invoices" ON public.deposit_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can insert deposit payments for their invoices" ON public.deposit_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can update deposit payments for their invoices" ON public.deposit_payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

-- Function to calculate deposit due date
CREATE OR REPLACE FUNCTION public.calculate_deposit_due_date(
  p_event_date TIMESTAMPTZ,
  p_days_before INTEGER
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_event_date IS NULL OR p_days_before IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN p_event_date - (p_days_before || ' days')::INTERVAL;
END;
$$;

-- Function to update deposit status based on payments
CREATE OR REPLACE FUNCTION public.update_deposit_status(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deposit_amount DECIMAL(10,2);
  v_deposit_paid DECIMAL(10,2);
  v_deposit_due_date TIMESTAMPTZ;
  v_deposit_required BOOLEAN;
BEGIN
  -- Get invoice deposit details
  SELECT 
    CASE 
      WHEN deposit_amount IS NOT NULL THEN deposit_amount
      WHEN deposit_percentage IS NOT NULL THEN (total_amount * deposit_percentage / 100)
      ELSE 0
    END,
    deposit_due_date,
    (deposit_amount IS NOT NULL OR deposit_percentage IS NOT NULL)
  INTO v_deposit_amount, v_deposit_due_date, v_deposit_required
  FROM public.invoices
  WHERE id = p_invoice_id;
  
  -- If no deposit required, set status and return
  IF NOT v_deposit_required THEN
    UPDATE public.invoices
    SET deposit_status = 'not_required'
    WHERE id = p_invoice_id;
    RETURN;
  END IF;
  
  -- Calculate total deposit payments
  SELECT COALESCE(SUM(dp.deposit_amount), 0)
  INTO v_deposit_paid
  FROM public.deposit_payments dp
  JOIN public.payment_records pr ON dp.payment_record_id = pr.id
  WHERE dp.invoice_id = p_invoice_id
  AND pr.status = 'completed';
  
  -- Update deposit paid amount and status
  UPDATE public.invoices
  SET 
    deposit_paid_amount = v_deposit_paid,
    deposit_status = CASE
      WHEN v_deposit_paid >= v_deposit_amount THEN 'paid'
      WHEN v_deposit_paid > 0 AND v_deposit_paid < v_deposit_amount THEN 'partial'
      WHEN v_deposit_due_date < NOW() THEN 'overdue'
      ELSE 'pending'
    END,
    deposit_paid_date = CASE
      WHEN v_deposit_paid >= v_deposit_amount THEN 
        (SELECT MAX(pr.payment_date) 
         FROM public.deposit_payments dp
         JOIN public.payment_records pr ON dp.payment_record_id = pr.id
         WHERE dp.invoice_id = p_invoice_id
         AND pr.status = 'completed')
      ELSE NULL
    END
  WHERE id = p_invoice_id;
END;
$$;

-- Trigger to update deposit status when payments change
CREATE OR REPLACE FUNCTION public.trigger_update_deposit_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_deposit_status(NEW.invoice_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_deposit_status(OLD.invoice_id);
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on deposit_payments
CREATE TRIGGER update_deposit_status_on_payment
AFTER INSERT OR UPDATE OR DELETE ON public.deposit_payments
FOR EACH ROW
EXECUTE FUNCTION trigger_update_deposit_status();

-- Create trigger on payment_records to update deposit status
CREATE TRIGGER update_deposit_status_on_payment_record
AFTER UPDATE OF status ON public.payment_records
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trigger_update_deposit_status();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_deposit_status ON public.invoices(deposit_status) WHERE deposit_status != 'not_required';
CREATE INDEX IF NOT EXISTS idx_invoices_deposit_due_date ON public.invoices(deposit_due_date) WHERE deposit_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deposit_payments_invoice_id ON public.deposit_payments(invoice_id);

-- Add helpful comments
COMMENT ON COLUMN public.invoices.deposit_amount IS 'Fixed deposit amount required';
COMMENT ON COLUMN public.invoices.deposit_percentage IS 'Deposit as percentage of total amount (0-100)';
COMMENT ON COLUMN public.invoices.deposit_due_days_before_event IS 'Number of days before event date that deposit is due';
COMMENT ON COLUMN public.invoices.deposit_due_date IS 'Calculated absolute date when deposit is due';
COMMENT ON COLUMN public.invoices.deposit_status IS 'Current status of deposit: not_required, pending, paid, overdue, partial';
COMMENT ON COLUMN public.invoices.event_date IS 'Event date used for calculating deposit due date';
COMMENT ON TABLE public.deposit_payments IS 'Tracks which payments are allocated to deposits';