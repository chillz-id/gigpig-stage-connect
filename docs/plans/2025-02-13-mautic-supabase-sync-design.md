# Mautic-Supabase Bidirectional Sync Design

## Overview

Sync customer data bidirectionally between Supabase and Mautic (self-hosted at `mautic.gigpigs.app`) using Supabase Edge Functions. Mautic replaces Brevo as the marketing automation platform for campaigns and automated journeys. Emails are sent via AWS SES.

## Architecture

### Components

1. **`mautic-sync` Edge Function** - Scheduled every 15 minutes via pg_cron. Pushes new/updated contacts from `customers_crm_v` to Mautic REST API. Manages segment membership. Uses OAuth2 client credentials.

2. **`mautic-webhook` Edge Function** - Receives webhook POSTs from Mautic for engagement events (opens, clicks, unsubscribes, bounces). Writes to `customer_email_engagement` table.

3. **Database Migration** - Adds `mautic_sync_status`, `customer_email_engagement`, and `mautic_sync_logs` tables.

### Data Flow

```
Supabase (customers_crm_v) --> mautic-sync --> Mautic API (OAuth2) --> Contacts + Segments
Mautic (email via SES) --> tracks engagement --> webhooks --> mautic-webhook --> Supabase
```

### OAuth2 Flow

```
mautic-sync --> POST /oauth/v2/token (client_id + secret) --> access_token
            --> cache token in memory (~60min expiry)
            --> use token for all API calls in that run
            --> re-request on 401
```

## Data Mapping (Supabase --> Mautic)

### Standard Mautic Fields

| Supabase (`customers_crm_v`) | Mautic field | Notes |
|---|---|---|
| `email` | `email` | Primary identifier |
| `first_name` | `firstname` | |
| `last_name` | `lastname` | |
| `mobile` | `mobile` | |
| `landline` | `phone` | |
| `address_line1` | `address1` | |
| `address_line2` | `address2` | |
| `suburb` | `city` | Mautic's "city" = suburb |
| `state` | `state` | |
| `postcode` | `zipcode` | |
| `country` | `country` | |

### Custom Fields (must exist in Mautic)

| Supabase | Mautic custom field | Type |
|---|---|---|
| `id` | `supabase_id` | Text |
| `customer_segment` | `customer_segment` | Select (vip/regular/new/inactive) |
| `lead_score` | `lead_score` | Number |
| `total_orders` | `total_orders` | Number |
| `total_spent` | `total_spent` | Number |
| `last_order_date` | `last_order_date` | DateTime |
| `last_event_name` | `last_event_name` | Text |
| `preferred_venue` | `preferred_venue` | Text |
| `marketing_opt_in` | `marketing_opt_in` | Boolean |
| `customer_since` | `customer_since` | DateTime |

### Change Detection

Fields are hashed per contact. Only contacts whose hash differs from `mautic_sync_status.sync_hash` are pushed, keeping API calls minimal.

## Engagement Data (Mautic --> Supabase)

### Webhook Events

| Mautic event | Meaning | CRM use |
|---|---|---|
| `mautic.email_on_open` | Contact opened email | Track engagement level |
| `mautic.email_on_click` | Contact clicked link | Track interest/intent |
| `mautic.email_on_unsubscribe` | Contact unsubscribed | Update marketing_opt_in |
| `mautic.email_on_bounce` | Email bounced | Flag bad email addresses |

### Side Effects

- **Unsubscribe** --> sets `marketing_opt_in = false` on `customer_profiles`
- **Bounce** --> increments bounce counter; after 3 bounces, flags email as invalid in `customer_emails`

### Webhook Security

Mautic sends a webhook secret in headers. The edge function validates this before processing.

## Database Schema

### `mautic_sync_status`

```sql
customer_id       UUID PRIMARY KEY REFERENCES customer_profiles(id)
mautic_contact_id INTEGER          -- Mautic's internal contact ID
sync_hash         TEXT             -- Hash of last synced field values
last_synced_at    TIMESTAMPTZ
sync_error        TEXT             -- Last error message if any
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
```

### `customer_email_engagement`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
customer_id     UUID REFERENCES customer_profiles(id)
event_type      TEXT             -- 'open', 'click', 'unsubscribe', 'bounce'
campaign_name   TEXT             -- Which campaign/email triggered it
email_subject   TEXT             -- The email subject line
link_url        TEXT             -- Clicked URL (for click events)
occurred_at     TIMESTAMPTZ
mautic_email_id TEXT             -- Mautic's internal email ID
raw_payload     JSONB            -- Full webhook payload for debugging
created_at      TIMESTAMPTZ DEFAULT now()
```

### `mautic_sync_logs`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
run_started_at  TIMESTAMPTZ
run_finished_at TIMESTAMPTZ
contacts_synced INTEGER DEFAULT 0
contacts_failed INTEGER DEFAULT 0
segments_synced INTEGER DEFAULT 0
error_details   JSONB
created_at      TIMESTAMPTZ DEFAULT now()
```

## Sync Logic

### `mautic-sync` Execution Flow

1. Authenticate (OAuth2 token, cached if still valid)
2. Query `customers_crm_v` for all contacts
3. For each contact:
   a. Hash the mapped fields
   b. Compare to `mautic_sync_status.sync_hash`
   c. Skip if unchanged
4. Batch changed contacts (200 per batch):
   - New (no `mautic_contact_id`) --> `POST /api/contacts/new`
   - Updated (hash differs) --> `PATCH /api/contacts/{id}/edit`
5. Sync segment membership:
   - GET current Mautic segments
   - Add/remove contacts from segments based on `customer_segments` array
6. Update `mautic_sync_status` with new hash, timestamp, `mautic_contact_id`
7. Log run to `mautic_sync_logs`

### Scheduling

- pg_cron every 15 minutes, aligned with existing `refresh_customer_data()` cadence
- Runs after customer data refresh completes

### Error Handling

- Failed individual contacts logged but don't block the batch
- OAuth2 token expiry mid-run --> automatic re-authentication
- Mautic API down --> sync skipped, retried next cycle
- All errors logged to `mautic_sync_logs`

### Initial Bulk Import

First run pushes all ~18,000 contacts. Chunked into batches of 200 with delay between batches to avoid overwhelming Mautic. Subsequent runs only sync changed contacts.

## Mautic Admin Setup (Prerequisites)

Before deploying code:

1. **Enable API**: Settings > Configuration > API Settings > Enable API: Yes
2. **Create OAuth2 Credentials**: Settings > API Credentials > New
   - Name: Supabase Sync
   - Redirect URI: `https://gigpigs.app`
   - Grant Type: Client Credentials
   - Save Client ID + Client Secret
3. **Add missing custom fields**: Settings > Custom Fields > Contact
   - Verify all fields from the Custom Fields table above exist
4. **Create webhook**: Settings > Webhooks > New
   - URL: `https://<supabase-project>.supabase.co/functions/v1/mautic-webhook`
   - Secret: generate secure random string
   - Events: `email_on_open`, `email_on_click`, `email_on_unsubscribe`, `email_on_bounce`
5. **Store secrets** in Supabase Edge Function config:
   - `MAUTIC_URL` = `https://mautic.gigpigs.app`
   - `MAUTIC_CLIENT_ID` = from step 2
   - `MAUTIC_CLIENT_SECRET` = from step 2
   - `MAUTIC_WEBHOOK_SECRET` = from step 4

## Segment Mapping

Supabase segments are synced as Mautic segments. The sync function manages membership via API rather than Mautic's filter-based segments:

| Supabase segment | Mautic segment |
|---|---|
| `vip` | VIP Customers |
| `regular` | Regular Customers |
| `new` | New Customers |
| `inactive` | Inactive Customers |

Segments are created in Mautic on first sync if they don't exist.
