-- Social Schedule Generator — pg_cron Job
-- Runs every 6 hours to auto-generate social media posting schedules.
-- Requires pg_cron and pg_net extensions (enabled by default on Supabase).

-- Schedule the cron job
SELECT cron.schedule(
  'social-schedule-generator',
  '0 */6 * * *',  -- Every 6 hours: midnight, 6am, noon, 6pm
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/social-schedule-generator',
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
