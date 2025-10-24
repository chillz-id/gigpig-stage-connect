## Eventbrite CSV Import

Use `agents/scripts/import_eventbrite_csv.py` when you need to backfill Eventbrite data without hammering the API.

```bash
python agents/scripts/import_eventbrite_csv.py \
  --orders "/root/EVENTBRITE - ORDERS.csv" \
  --attendees "/root/EVENTBRITE - ATTENDEES.csv" \
  --sales "/root/EVENTBRITE - SALES.csv" \
  --supabase-url https://YOUR_PROJECT.supabase.co \
  --supabase-key $SUPABASE_SERVICE_ROLE_KEY
```

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables are honoured when flags are omitted.
- Pass `--dry-run` to validate parsing before writing to Supabase.
- The script upserts into `events_htx`, `sessions_htx`, `session_sources`, `orders_eventbrite`, and `tickets_eventbrite`, then refreshes `sync_state` (`eventbrite:lastSync`) using the latest order timestamp. Once it finishes, the n8n workflow only needs to process incremental changes.

> Note: The Sales CSV is optional; it is parsed only to verify coverage. Orders and Attendees exports provide all the fields required by the downstream tables.
