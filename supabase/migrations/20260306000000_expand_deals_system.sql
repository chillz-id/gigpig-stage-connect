-- ============================================================================
-- Deals System Expansion Migration
-- ============================================================================

-- 1a. Expand series_deals with financial columns
ALTER TABLE series_deals
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS fixed_fee_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS guaranteed_minimum NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS gst_mode TEXT DEFAULT 'none' CHECK (gst_mode IN ('inclusive', 'exclusive', 'none')),
  ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN ('per_event', 'weekly', 'fortnightly', 'monthly')),
  ADD COLUMN IF NOT EXISTS day_of_week INTEGER CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  ADD COLUMN IF NOT EXISTS recurring_invoice_id UUID REFERENCES recurring_invoices(id),
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN series_deals.fixed_fee_amount IS 'Fixed fee per occurrence for fixed_split deals';
COMMENT ON COLUMN series_deals.guaranteed_minimum IS 'Minimum guaranteed amount for revenue_share deals';
COMMENT ON COLUMN series_deals.gst_mode IS 'GST treatment: inclusive, exclusive, or none';
COMMENT ON COLUMN series_deals.frequency IS 'Billing frequency: per_event, weekly, fortnightly, monthly';
COMMENT ON COLUMN series_deals.day_of_week IS 'Day of week for recurring deals (0=Sun, 6=Sat)';
COMMENT ON COLUMN series_deals.recurring_invoice_id IS 'Linked recurring invoice for auto-billing';

-- 1b. Add series_deal_id to deal_participants
ALTER TABLE deal_participants
  ADD COLUMN IF NOT EXISTS series_deal_id UUID REFERENCES series_deals(id) ON DELETE CASCADE;

ALTER TABLE deal_participants ALTER COLUMN deal_id DROP NOT NULL;

ALTER TABLE deal_participants ADD CONSTRAINT chk_deal_or_series CHECK (
  (deal_id IS NOT NULL AND series_deal_id IS NULL) OR
  (deal_id IS NULL AND series_deal_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_deal_participants_series
  ON deal_participants(series_deal_id) WHERE series_deal_id IS NOT NULL;

-- 1c. Add series_deal_id to event_deals
ALTER TABLE event_deals
  ADD COLUMN IF NOT EXISTS series_deal_id UUID REFERENCES series_deals(id),
  ADD COLUMN IF NOT EXISTS is_synced_from_series BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_event_deals_series
  ON event_deals(series_deal_id) WHERE series_deal_id IS NOT NULL;

COMMENT ON COLUMN event_deals.series_deal_id IS 'Source series deal this was synced from';
COMMENT ON COLUMN event_deals.is_synced_from_series IS 'True if auto-created from a series deal template';

-- 1d. Add series_deal_id to recurring_invoices
ALTER TABLE recurring_invoices
  ADD COLUMN IF NOT EXISTS series_deal_id UUID REFERENCES series_deals(id);

COMMENT ON COLUMN recurring_invoices.series_deal_id IS 'Linked series deal for auto-generated recurring invoices';

-- 1e. RLS policies for series deal participants
CREATE POLICY "Series deal creators can view participants"
  ON deal_participants FOR SELECT USING (
    series_deal_id IS NOT NULL AND (
      auth.uid() = participant_id OR
      auth.uid() IN (
        SELECT created_by FROM series_deals WHERE id = deal_participants.series_deal_id
      ) OR
      auth.uid() IN (
        SELECT rs.created_by FROM recurring_series rs
        JOIN series_deals sd ON sd.series_id = rs.id
        WHERE sd.id = deal_participants.series_deal_id
      )
    )
  );

CREATE POLICY "Series deal creators can insert participants"
  ON deal_participants FOR INSERT WITH CHECK (
    series_deal_id IS NOT NULL AND
    auth.uid() IN (
      SELECT created_by FROM series_deals WHERE id = deal_participants.series_deal_id
    )
  );

CREATE POLICY "Series deal creators can update their participants"
  ON deal_participants FOR UPDATE USING (
    series_deal_id IS NOT NULL AND (
      auth.uid() = participant_id OR
      auth.uid() IN (
        SELECT created_by FROM series_deals WHERE id = deal_participants.series_deal_id
      )
    )
  );

CREATE POLICY "Series deal creators can delete their participants"
  ON deal_participants FOR DELETE USING (
    series_deal_id IS NOT NULL AND
    auth.uid() IN (
      SELECT created_by FROM series_deals WHERE id = deal_participants.series_deal_id
    )
  );
