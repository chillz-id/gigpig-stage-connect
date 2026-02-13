-- Schedule mautic-sync edge function via pg_cron + pg_net
-- Runs every 15 minutes at offset :07 (7 minutes after refresh_customer_data at :00)
-- Service role key stored in vault for security

SELECT cron.schedule(
  'mautic-sync',
  '7,22,37,52 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pdikjpfulhhpqpxzpgtu.supabase.co/functions/v1/mautic-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
