-- Event Deals System Migration
-- Created: 2025-10-28
-- Purpose: Add event_deals, deal_participants tables and missing columns for event management system

-- ============================================================================
-- 1. event_deals table
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('revenue_share', 'fixed_split', 'tiered', 'custom')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'fully_approved', 'settled', 'cancelled')),
  total_amount NUMERIC(12,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_event_deals_event_id ON event_deals(event_id);
CREATE INDEX idx_event_deals_status ON event_deals(status);
CREATE INDEX idx_event_deals_created_by ON event_deals(created_by);

-- RLS Policies
ALTER TABLE event_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event owners can view deals for their events"
  ON event_deals FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can create deals for their events"
  ON event_deals FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can update deals for their events"
  ON event_deals FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. deal_participants table
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES event_deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  participant_type TEXT NOT NULL CHECK (participant_type IN ('comedian', 'manager', 'venue', 'promoter', 'other')),
  split_percentage NUMERIC(5,2) NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'changes_requested')),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique participant per deal
  UNIQUE(deal_id, user_id)
);

-- Indexes
CREATE INDEX idx_deal_participants_deal_id ON deal_participants(deal_id);
CREATE INDEX idx_deal_participants_user_id ON deal_participants(user_id);
CREATE INDEX idx_deal_participants_status ON deal_participants(status);

-- RLS Policies
ALTER TABLE deal_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their own deal participations"
  ON deal_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    deal_id IN (
      SELECT deal_id FROM deal_participants WHERE user_id = auth.uid()
    ) OR
    deal_id IN (
      SELECT id FROM event_deals WHERE event_id IN (
        SELECT id FROM events WHERE organizer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Event owners can manage deal participants"
  ON deal_participants FOR ALL
  USING (
    deal_id IN (
      SELECT id FROM event_deals WHERE event_id IN (
        SELECT id FROM events WHERE organizer_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 3. Add payment breakdown columns to event_spots
-- ============================================================================

-- Add columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_spots' AND column_name='payment_gross') THEN
    ALTER TABLE event_spots ADD COLUMN payment_gross NUMERIC(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_spots' AND column_name='payment_tax') THEN
    ALTER TABLE event_spots ADD COLUMN payment_tax NUMERIC(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_spots' AND column_name='payment_net') THEN
    ALTER TABLE event_spots ADD COLUMN payment_net NUMERIC(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_spots' AND column_name='payment_status') THEN
    ALTER TABLE event_spots ADD COLUMN payment_status TEXT CHECK (payment_status IN ('unpaid', 'pending', 'paid')) DEFAULT 'unpaid';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_spots' AND column_name='tax_included') THEN
    ALTER TABLE event_spots ADD COLUMN tax_included BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_spots' AND column_name='tax_rate') THEN
    ALTER TABLE event_spots ADD COLUMN tax_rate NUMERIC(5,2) DEFAULT 10.00;
  END IF;
END $$;

-- ============================================================================
-- 4. Add shortlist tracking to applications table
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='is_shortlisted') THEN
    ALTER TABLE applications ADD COLUMN is_shortlisted BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='shortlisted_at') THEN
    ALTER TABLE applications ADD COLUMN shortlisted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Index for shortlist queries
CREATE INDEX IF NOT EXISTS idx_applications_shortlisted ON applications(event_id, is_shortlisted) WHERE is_shortlisted = true;

-- ============================================================================
-- 5. Updated_at trigger for event_deals
-- ============================================================================

CREATE OR REPLACE FUNCTION update_event_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_deals_updated_at
  BEFORE UPDATE ON event_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_event_deals_updated_at();

-- ============================================================================
-- 6. Updated_at trigger for deal_participants
-- ============================================================================

CREATE OR REPLACE FUNCTION update_deal_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deal_participants_updated_at
  BEFORE UPDATE ON deal_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_participants_updated_at();

-- ============================================================================
-- 7. Comments for documentation
-- ============================================================================

COMMENT ON TABLE event_deals IS 'Multi-party financial deals for events (revenue shares, split payments, etc.)';
COMMENT ON TABLE deal_participants IS 'Participants in event deals with their split percentages and approval status';
COMMENT ON COLUMN event_spots.payment_gross IS 'Total payment amount including tax';
COMMENT ON COLUMN event_spots.payment_tax IS 'Tax amount portion of payment';
COMMENT ON COLUMN event_spots.payment_net IS 'Net payment amount excluding tax';
COMMENT ON COLUMN event_spots.payment_status IS 'Payment status: unpaid, pending, or paid';
COMMENT ON COLUMN event_spots.tax_included IS 'Whether payment_amount represents gross (tax included) or net amount';
COMMENT ON COLUMN event_spots.tax_rate IS 'Tax rate percentage (e.g., 10.00 for 10% GST)';
COMMENT ON COLUMN applications.is_shortlisted IS 'Whether comedian has been added to shortlist for this event';
COMMENT ON COLUMN applications.shortlisted_at IS 'Timestamp when comedian was added to shortlist';
