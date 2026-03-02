-- Social Analytics Sync — pg_cron Job
-- Runs daily at 1:00 UTC (11:00 AM AEST) to sync social media analytics from Metricool.
-- Requires pg_cron and pg_net extensions (enabled by default on Supabase).

-- Schedule the cron job
SELECT cron.schedule(
  'social-analytics-sync',
  '0 1 * * *',  -- Daily at 1:00 UTC (11:00 AM AEST)
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/social-analytics-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'supabase_service_role_key' LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
