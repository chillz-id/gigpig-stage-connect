# Customer Tracking Export Guide

This repository no longer stores production exports. Use the sanitized sample at [`docs/customer-tracking-sample.json`](./customer-tracking-sample.json) when you need to understand the JSON schema locally.

## Secure export workflow

Run exports directly from Supabase so the data remains inside approved infrastructure:

1. **Authenticate** with the Supabase CLI using an access token that has been scoped for data exports only:

   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   ```

2. **Execute the export script** from a secure workstation. Supply the managed connection string (stored in 1Password as `Supabase reporting connection`) via the `SUPABASE_DB_URL` environment variable before running the command:

   ```bash
   export SUPABASE_DB_URL="postgres://..."  # fetched from 1Password
   psql "$SUPABASE_DB_URL" \
     --file supabase/scripts/export-customer-tracking.sql \
     --no-align --field-separator="," \
     --pset footer=off \
     --output ./secure-exports/customer-tracking-$(date +%Y%m%d).csv
   ```

   - `export-customer-tracking.sql` is stored in the `supabase/scripts/` directory of this repo; it selects the non-PII fields required for analytics.
   - The output directory (`./secure-exports/`) must be encrypted or synced to managed storage such as the `gcs://gigpig-secure-exports` bucket.

3. **Upload** the resulting file to the `gigpig-secure-exports` bucket (or the vault requested by compliance) using the service account credentials stored in 1Password:

   ```bash
   gcloud storage cp ./secure-exports/customer-tracking-*.csv gcs://gigpig-secure-exports/customer-tracking/
   ```

4. **Clean up local artifacts** once the upload succeeds:

   ```bash
   srm ./secure-exports/customer-tracking-*.csv
   ```

## Requesting access

- Developers needing full exports must request temporary access in the `#data-requests` Slack channel. Provide the Linear ticket ID and intended usage.
- Data team members grant access by sharing a time-bound download link from the secure bucket.
- Logs of all exports and downloads are reviewed weekly by the security team.

Keeping the raw exports outside Git ensures the repository remains free of PII while still giving the team a reproducible workflow.
