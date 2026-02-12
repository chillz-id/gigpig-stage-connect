-- Mautic sync tracking tables
-- Supports bidirectional sync: Supabase --> Mautic (contacts/segments) and Mautic --> Supabase (engagement)

-- Track sync state per customer
CREATE TABLE IF NOT EXISTS mautic_sync_status (
  customer_id       UUID PRIMARY KEY REFERENCES customer_profiles(id) ON DELETE CASCADE,
  mautic_contact_id INTEGER,
  sync_hash         TEXT,
  last_synced_at    TIMESTAMPTZ,
  sync_error        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Track email engagement events from Mautic webhooks
CREATE TABLE IF NOT EXISTS customer_email_engagement (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN ('open', 'click', 'unsubscribe', 'bounce')),
  campaign_name   TEXT,
  email_subject   TEXT,
  link_url        TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL,
  mautic_email_id TEXT,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Track sync run history for debugging
CREATE TABLE IF NOT EXISTS mautic_sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_started_at  TIMESTAMPTZ NOT NULL,
  run_finished_at TIMESTAMPTZ,
  contacts_synced INTEGER DEFAULT 0,
  contacts_created INTEGER DEFAULT 0,
  contacts_updated INTEGER DEFAULT 0,
  contacts_failed INTEGER DEFAULT 0,
  segments_synced INTEGER DEFAULT 0,
  error_details   JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mautic_sync_status_mautic_id ON mautic_sync_status(mautic_contact_id);
CREATE INDEX IF NOT EXISTS idx_mautic_sync_status_last_synced ON mautic_sync_status(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_customer_email_engagement_customer ON customer_email_engagement(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_email_engagement_type ON customer_email_engagement(event_type);
CREATE INDEX IF NOT EXISTS idx_customer_email_engagement_occurred ON customer_email_engagement(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mautic_sync_logs_started ON mautic_sync_logs(run_started_at DESC);

-- RLS policies
ALTER TABLE mautic_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_email_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE mautic_sync_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (edge functions use service role)
CREATE POLICY "service_role_all" ON mautic_sync_status FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON customer_email_engagement FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON mautic_sync_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read engagement data (for CRM UI)
CREATE POLICY "authenticated_read" ON customer_email_engagement FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON mautic_sync_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON mautic_sync_status FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT ALL ON mautic_sync_status TO service_role;
GRANT ALL ON customer_email_engagement TO service_role;
GRANT ALL ON mautic_sync_logs TO service_role;
GRANT SELECT ON mautic_sync_status TO authenticated;
GRANT SELECT ON customer_email_engagement TO authenticated;
GRANT SELECT ON mautic_sync_logs TO authenticated;

COMMENT ON TABLE mautic_sync_status IS 'Tracks per-customer sync state with Mautic. sync_hash detects changes, mautic_contact_id links to Mautic.';
COMMENT ON TABLE customer_email_engagement IS 'Email engagement events received from Mautic webhooks (opens, clicks, unsubscribes, bounces).';
COMMENT ON TABLE mautic_sync_logs IS 'Audit log of mautic-sync edge function runs for debugging.';
