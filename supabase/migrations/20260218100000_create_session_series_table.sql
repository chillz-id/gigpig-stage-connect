-- =====================================================
-- Session Series Junction Table
-- =====================================================
-- Simple junction table to track which sessions belong to which series.
-- This avoids duplicating session data into the events table.
-- All session data (dates, financials, is_past) comes from session_complete.

-- Create the junction table
CREATE TABLE IF NOT EXISTS session_series (
  canonical_session_source_id TEXT PRIMARY KEY,
  series_id UUID NOT NULL REFERENCES recurring_series(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups by series
CREATE INDEX idx_session_series_series_id ON session_series(series_id);

-- Enable RLS
ALTER TABLE session_series ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view sessions in series they have access to
CREATE POLICY "Users can view session_series"
  ON session_series FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recurring_series rs
      WHERE rs.id = session_series.series_id
      AND (
        rs.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM series_partners sp
          WHERE sp.series_id = rs.id
          AND sp.partner_profile_id = auth.uid()
          AND sp.status = 'active'
        )
      )
    )
  );

-- Users can add sessions to series they own or are admin on
CREATE POLICY "Users can insert session_series"
  ON session_series FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recurring_series rs
      WHERE rs.id = session_series.series_id
      AND (
        rs.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM series_partners sp
          WHERE sp.series_id = rs.id
          AND sp.partner_profile_id = auth.uid()
          AND sp.is_admin = true
          AND sp.status = 'active'
        )
      )
    )
  );

-- Users can remove sessions from series they own or are admin on
CREATE POLICY "Users can delete session_series"
  ON session_series FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recurring_series rs
      WHERE rs.id = session_series.series_id
      AND (
        rs.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM series_partners sp
          WHERE sp.series_id = rs.id
          AND sp.partner_profile_id = auth.uid()
          AND sp.is_admin = true
          AND sp.status = 'active'
        )
      )
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON session_series TO authenticated;

COMMENT ON TABLE session_series IS 'Junction table linking sessions (from session_complete) to recurring series';
