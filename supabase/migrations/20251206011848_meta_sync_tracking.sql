-- Meta Marketing API Sync Tracking
-- Tracks Custom Audience uploads and Conversions API events

-- Create meta_sync_log table for tracking all sync operations
CREATE TABLE IF NOT EXISTS meta_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('audience', 'conversion')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  event_name TEXT, -- For conversion events (e.g., 'Purchase', 'Lead')
  event_value DECIMAL(12,2), -- Value of the conversion
  meta_response JSONB, -- Raw API response for debugging
  error_message TEXT, -- Error message if failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by customer
CREATE INDEX IF NOT EXISTS idx_meta_sync_log_customer ON meta_sync_log(customer_id);

-- Index for querying by sync type and status
CREATE INDEX IF NOT EXISTS idx_meta_sync_log_type_status ON meta_sync_log(sync_type, status);

-- Index for recent syncs
CREATE INDEX IF NOT EXISTS idx_meta_sync_log_created ON meta_sync_log(created_at DESC);

-- Add Meta sync tracking columns to customer_profiles
ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS meta_audience_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS meta_last_conversion_at TIMESTAMPTZ;

-- Create index for finding customers not synced to Meta
CREATE INDEX IF NOT EXISTS idx_customer_meta_sync ON customer_profiles(meta_audience_synced_at)
WHERE meta_audience_synced_at IS NULL;

-- RLS policies for meta_sync_log
ALTER TABLE meta_sync_log ENABLE ROW LEVEL SECURITY;

-- Service role can manage all sync logs
CREATE POLICY "Service role can manage meta_sync_log"
  ON meta_sync_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view sync logs (for admin dashboard)
CREATE POLICY "Authenticated users can view meta_sync_log"
  ON meta_sync_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a view for Meta sync statistics
CREATE OR REPLACE VIEW meta_sync_stats AS
SELECT
  sync_type,
  status,
  COUNT(*) as count,
  MAX(created_at) as last_sync,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d
FROM meta_sync_log
GROUP BY sync_type, status;

-- Grant access to the view
GRANT SELECT ON meta_sync_stats TO authenticated;
GRANT SELECT ON meta_sync_stats TO service_role;

COMMENT ON TABLE meta_sync_log IS 'Tracks Meta/Facebook Custom Audience and Conversions API sync operations';
COMMENT ON COLUMN meta_sync_log.sync_type IS 'Type of sync: audience (Custom Audiences) or conversion (Conversions API)';
COMMENT ON COLUMN meta_sync_log.event_name IS 'Name of the conversion event (e.g., Purchase, Lead, ViewContent)';
COMMENT ON COLUMN meta_sync_log.meta_response IS 'Raw JSON response from Meta API for debugging';
