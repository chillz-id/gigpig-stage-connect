-- GYG Reservation Cleanup Cron Job
-- Cancels expired reservations every 5 minutes

-- Ensure pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule(
  'gyg-cleanup-expired-reservations',
  '*/5 * * * *',
  $$UPDATE public.gyg_reservations SET status = 'cancelled' WHERE status = 'active' AND expires_at < now();$$
);
