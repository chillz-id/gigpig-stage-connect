-- ============================================================================
-- Enhance Spots, Applications, and Manager Commission System
-- ============================================================================
-- Created: 2025-10-28
-- Description: Adds tax handling to event spots, shortlist functionality
--              to applications, and commission tracking to manager relationships
--
-- Changes:
--   - event_spots: Add tax fields (tax_included, tax_rate, gross/net amounts)
--   - applications: Add is_shortlisted flag
--   - comedian_managers: Add commission fields
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE event_spots TABLE
-- ============================================================================

-- Add tax and payment tracking fields
ALTER TABLE public.event_spots
ADD COLUMN IF NOT EXISTS tax_included BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 10.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
ADD COLUMN IF NOT EXISTS payment_gross NUMERIC(10,2) CHECK (payment_gross IS NULL OR payment_gross >= 0),
ADD COLUMN IF NOT EXISTS payment_net NUMERIC(10,2) CHECK (payment_net IS NULL OR payment_net >= 0),
ADD COLUMN IF NOT EXISTS payment_tax NUMERIC(10,2) CHECK (payment_tax IS NULL OR payment_tax >= 0),
ADD COLUMN IF NOT EXISTS payment_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN (
  'unpaid',
  'pending',
  'paid',
  'partially_paid',
  'refunded'
));

-- Add index for payment status queries
CREATE INDEX IF NOT EXISTS idx_event_spots_payment_status
ON public.event_spots(payment_status)
WHERE payment_status != 'paid';

-- Comments
COMMENT ON COLUMN public.event_spots.tax_included IS 'If true, payment_amount is gross (includes tax). If false, payment_amount is net (tax excluded)';
COMMENT ON COLUMN public.event_spots.tax_rate IS 'Tax rate percentage (e.g., 10.00 for 10% GST)';
COMMENT ON COLUMN public.event_spots.payment_gross IS 'Total amount including tax';
COMMENT ON COLUMN public.event_spots.payment_net IS 'Amount before tax';
COMMENT ON COLUMN public.event_spots.payment_tax IS 'Tax amount';
COMMENT ON COLUMN public.event_spots.payment_notes IS 'Additional payment notes or terms';
COMMENT ON COLUMN public.event_spots.payment_status IS 'Payment tracking: unpaid, pending, paid, partially_paid, refunded';

-- ============================================================================
-- 2. ENHANCE applications TABLE
-- ============================================================================

-- Add shortlist functionality
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS is_shortlisted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shortlisted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shortlisted_by UUID REFERENCES auth.users(id);

-- Add index for shortlist queries
CREATE INDEX IF NOT EXISTS idx_applications_shortlisted
ON public.applications(event_id, is_shortlisted)
WHERE is_shortlisted = true;

-- Comments
COMMENT ON COLUMN public.applications.is_shortlisted IS 'Flag indicating this applicant has been marked as a favorite/shortlisted';
COMMENT ON COLUMN public.applications.shortlisted_at IS 'Timestamp when application was shortlisted';
COMMENT ON COLUMN public.applications.shortlisted_by IS 'User who shortlisted this application';

-- ============================================================================
-- 3. ENHANCE comedian_managers TABLE
-- ============================================================================

-- Add commission tracking
ALTER TABLE public.comedian_managers
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2) DEFAULT 15.00 CHECK (
  commission_percentage IS NULL OR
  (commission_percentage >= 0 AND commission_percentage <= 100)
),
ADD COLUMN IF NOT EXISTS commission_notes TEXT,
ADD COLUMN IF NOT EXISTS default_commission BOOLEAN DEFAULT false;

-- Add index for commission lookups
CREATE INDEX IF NOT EXISTS idx_comedian_managers_commission
ON public.comedian_managers(comedian_id, is_primary)
WHERE status = 'active';

-- Comments
COMMENT ON COLUMN public.comedian_managers.commission_percentage IS 'Manager commission rate (default 15%)';
COMMENT ON COLUMN public.comedian_managers.commission_notes IS 'Notes about commission arrangement';
COMMENT ON COLUMN public.comedian_managers.default_commission IS 'Use this rate as default for all deals unless overridden';

-- ============================================================================
-- 4. HELPER FUNCTIONS FOR TAX CALCULATIONS
-- ============================================================================

-- Calculate gross/net/tax for a spot payment
CREATE OR REPLACE FUNCTION public.calculate_spot_payment_breakdown(
  p_amount NUMERIC,
  p_tax_included BOOLEAN,
  p_tax_rate NUMERIC
)
RETURNS TABLE (
  gross NUMERIC,
  net NUMERIC,
  tax NUMERIC
) AS $$
BEGIN
  IF p_tax_included THEN
    -- Amount is gross, calculate net and tax
    RETURN QUERY SELECT
      p_amount AS gross,
      ROUND(p_amount / (1 + p_tax_rate / 100), 2) AS net,
      ROUND(p_amount - (p_amount / (1 + p_tax_rate / 100)), 2) AS tax;
  ELSE
    -- Amount is net, calculate gross and tax
    RETURN QUERY SELECT
      ROUND(p_amount * (1 + p_tax_rate / 100), 2) AS gross,
      p_amount AS net,
      ROUND(p_amount * p_tax_rate / 100, 2) AS tax;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_spot_payment_breakdown IS 'Calculate gross/net/tax breakdown for spot payments';

-- Trigger to auto-calculate tax breakdown when payment_amount changes
CREATE OR REPLACE FUNCTION public.update_spot_payment_breakdown()
RETURNS TRIGGER AS $$
DECLARE
  v_breakdown RECORD;
BEGIN
  -- Only recalculate if payment_amount, tax_included, or tax_rate changed
  IF (
    NEW.payment_amount IS DISTINCT FROM OLD.payment_amount OR
    NEW.tax_included IS DISTINCT FROM OLD.tax_included OR
    NEW.tax_rate IS DISTINCT FROM OLD.tax_rate
  ) THEN
    -- Calculate breakdown
    SELECT * INTO v_breakdown
    FROM public.calculate_spot_payment_breakdown(
      NEW.payment_amount,
      NEW.tax_included,
      NEW.tax_rate
    );

    -- Update calculated fields
    NEW.payment_gross = v_breakdown.gross;
    NEW.payment_net = v_breakdown.net;
    NEW.payment_tax = v_breakdown.tax;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS event_spots_payment_breakdown ON public.event_spots;
CREATE TRIGGER event_spots_payment_breakdown
BEFORE INSERT OR UPDATE ON public.event_spots
FOR EACH ROW
WHEN (NEW.payment_amount IS NOT NULL)
EXECUTE FUNCTION public.update_spot_payment_breakdown();

-- ============================================================================
-- 5. HELPER FUNCTIONS FOR MANAGER COMMISSION
-- ============================================================================

-- Get active manager commission rate for a comedian
CREATE OR REPLACE FUNCTION public.get_comedian_manager_commission(p_comedian_id UUID)
RETURNS TABLE (
  manager_id UUID,
  manager_name TEXT,
  commission_percentage NUMERIC,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.manager_id,
    p.name AS manager_name,
    COALESCE(cm.commission_percentage, 15.00) AS commission_percentage,
    cm.is_primary
  FROM public.comedian_managers cm
  JOIN public.profiles p ON p.id = cm.manager_id
  WHERE cm.comedian_id = p_comedian_id
    AND cm.status = 'active'
  ORDER BY cm.is_primary DESC, cm.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_comedian_manager_commission IS 'Get active manager and commission rate for a comedian';

-- ============================================================================
-- 6. DATA MIGRATION (Backfill)
-- ============================================================================

-- Backfill existing event_spots with calculated tax breakdown
DO $$
DECLARE
  v_spot RECORD;
  v_breakdown RECORD;
BEGIN
  FOR v_spot IN
    SELECT id, payment_amount, tax_included, tax_rate
    FROM public.event_spots
    WHERE payment_amount IS NOT NULL
      AND payment_gross IS NULL
  LOOP
    -- Calculate breakdown
    SELECT * INTO v_breakdown
    FROM public.calculate_spot_payment_breakdown(
      v_spot.payment_amount,
      COALESCE(v_spot.tax_included, true),
      COALESCE(v_spot.tax_rate, 10.00)
    );

    -- Update spot
    UPDATE public.event_spots
    SET
      payment_gross = v_breakdown.gross,
      payment_net = v_breakdown.net,
      payment_tax = v_breakdown.tax
    WHERE id = v_spot.id;
  END LOOP;

  RAISE NOTICE 'Backfilled tax breakdown for existing spots';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
