-- Replace per-row HTTP trigger calls with a lightweight queue system.
-- The old triggers called net.http_post() for EVERY row change, causing
-- flooding during bulk operations (e.g., 1500 address updates = 7500 HTTP requests).
-- New approach: triggers insert into a queue table, a 2-minute cron drains the queue.

-- 1. Drop the old per-row HTTP triggers
DROP TRIGGER IF EXISTS trg_mautic_sync_customer_addresses ON customer_addresses;
DROP TRIGGER IF EXISTS trg_mautic_sync_customer_profiles ON customer_profiles;
DROP TRIGGER IF EXISTS trg_mautic_sync_engagement ON customer_engagement_metrics;
DROP FUNCTION IF EXISTS trigger_mautic_sync();

-- 2. Create queue table (deduplicates by customer_id via PK)
CREATE TABLE IF NOT EXISTS mautic_sync_queue (
  customer_id UUID PRIMARY KEY REFERENCES customer_profiles(id) ON DELETE CASCADE,
  queued_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mautic_sync_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON mautic_sync_queue FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON mautic_sync_queue TO service_role;

COMMENT ON TABLE mautic_sync_queue IS 'Lightweight queue for Mautic sync. Triggers insert here; a 2-min cron drains it via the edge function.';

-- 3. Create lightweight trigger function (no HTTP calls, just queue insert)
-- Uses IF/THEN/ELSE instead of CASE because PL/pgSQL evaluates all CASE branches
-- at parse time, and NEW.customer_id doesn't exist on customer_profiles.
CREATE OR REPLACE FUNCTION queue_mautic_sync() RETURNS TRIGGER AS $$
DECLARE
  cid UUID;
BEGIN
  IF TG_TABLE_NAME = 'customer_profiles' THEN
    cid := NEW.id;
  ELSE
    cid := NEW.customer_id;
  END IF;

  INSERT INTO mautic_sync_queue (customer_id)
  VALUES (cid)
  ON CONFLICT (customer_id) DO UPDATE SET queued_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create new queue-based triggers
CREATE TRIGGER trg_mautic_queue_addresses
  AFTER INSERT OR UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION queue_mautic_sync();

CREATE TRIGGER trg_mautic_queue_profiles
  AFTER INSERT OR UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION queue_mautic_sync();

CREATE TRIGGER trg_mautic_queue_engagement
  AFTER INSERT OR UPDATE ON customer_engagement_metrics
  FOR EACH ROW EXECUTE FUNCTION queue_mautic_sync();

-- 5. Schedule queue processing cron (every 2 minutes)
SELECT cron.schedule(
  'mautic-process-queue',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pdikjpfulhhpqpxzpgtu.supabase.co/functions/v1/mautic-sync?action=process-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
