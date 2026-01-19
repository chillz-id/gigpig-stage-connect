-- Migration: Add event_spot_line_items for flexible payment breakdown
-- This allows tracking multiple payment components per spot (Fee, Travel, Merch, etc.)

-- Create line items table
CREATE TABLE IF NOT EXISTS event_spot_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_spot_id UUID NOT NULL REFERENCES event_spots(id) ON DELETE CASCADE,
  label TEXT NOT NULL,            -- "Fee", "Travel Allowance", "Merch", "Parking"
  amount DECIMAL(10,2) NOT NULL,  -- Positive for income, negative for deductions
  is_taxable BOOLEAN DEFAULT true,-- Does GST apply to this item?
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient lookups by spot
CREATE INDEX IF NOT EXISTS idx_spot_line_items_spot
  ON event_spot_line_items(event_spot_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_spot_line_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_spot_line_items_updated_at ON event_spot_line_items;
CREATE TRIGGER tr_spot_line_items_updated_at
  BEFORE UPDATE ON event_spot_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_spot_line_item_updated_at();

-- Enable RLS
ALTER TABLE event_spot_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view line items for spots they can see (via org membership)
CREATE POLICY "Users can view line items for org spots"
  ON event_spot_line_items FOR SELECT
  USING (
    event_spot_id IN (
      SELECT es.id FROM event_spots es
      JOIN events e ON es.event_id = e.id
      WHERE e.organization_id IN (
        SELECT organization_id FROM organization_team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert line items for their org's spots
CREATE POLICY "Users can insert line items for org spots"
  ON event_spot_line_items FOR INSERT
  WITH CHECK (
    event_spot_id IN (
      SELECT es.id FROM event_spots es
      JOIN events e ON es.event_id = e.id
      WHERE e.organization_id IN (
        SELECT organization_id FROM organization_team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update line items for their org's spots
CREATE POLICY "Users can update line items for org spots"
  ON event_spot_line_items FOR UPDATE
  USING (
    event_spot_id IN (
      SELECT es.id FROM event_spots es
      JOIN events e ON es.event_id = e.id
      WHERE e.organization_id IN (
        SELECT organization_id FROM organization_team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can delete line items for their org's spots
CREATE POLICY "Users can delete line items for org spots"
  ON event_spot_line_items FOR DELETE
  USING (
    event_spot_id IN (
      SELECT es.id FROM event_spots es
      JOIN events e ON es.event_id = e.id
      WHERE e.organization_id IN (
        SELECT organization_id FROM organization_team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Comment on table
COMMENT ON TABLE event_spot_line_items IS 'Line items for flexible payment breakdown per event spot (Fee, Travel, Merch deductions, etc.)';
COMMENT ON COLUMN event_spot_line_items.label IS 'Display label like Fee, Travel Allowance, Merch';
COMMENT ON COLUMN event_spot_line_items.amount IS 'Positive for income, negative for deductions like merch';
COMMENT ON COLUMN event_spot_line_items.is_taxable IS 'Whether GST should be calculated on this item';
