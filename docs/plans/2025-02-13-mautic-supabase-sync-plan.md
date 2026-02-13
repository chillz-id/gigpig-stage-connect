# Mautic-Supabase Bidirectional Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build bidirectional sync between Supabase customer data and Mautic marketing automation platform, replacing the incomplete Brevo integration.

**Architecture:** Two Supabase Edge Functions (`mautic-sync` for outbound contact/segment push, `mautic-webhook` for inbound engagement events) connected to Mautic's REST API via OAuth2. A database migration creates tracking tables. pg_cron schedules the sync every 15 minutes.

**Tech Stack:** Supabase Edge Functions (Deno), Mautic REST API (OAuth2), PostgreSQL (pg_cron, pg_net), TypeScript.

**Design doc:** `docs/plans/2025-02-13-mautic-supabase-sync-design.md`

---

### Task 1: Database Migration - Sync Tracking Tables

**Files:**
- Create: `supabase/migrations/20260213000001_mautic_sync_tables.sql`

**Step 1: Write the migration SQL**

Create the file with this exact content:

```sql
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
```

**Step 2: Test the migration with dry-run**

Run: `cd /root/agents && npm run migrate:dry-run`
Expected: Migration parses without SQL errors.

**Step 3: Apply the migration**

Run: `cd /root/agents && npm run migrate:safe`
Expected: Tables created successfully.

**Step 4: Verify tables exist**

Use Supabase MCP to run:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('mautic_sync_status', 'customer_email_engagement', 'mautic_sync_logs');
```
Expected: All 3 tables returned.

**Step 5: Commit**

```bash
cd /root/agents
git add supabase/migrations/20260213000001_mautic_sync_tables.sql
git commit -m "feat(mautic): add sync tracking and engagement tables"
```

---

### Task 2: Update CRM View - Replace Brevo Fields with Mautic

**Files:**
- Create: `supabase/migrations/20260213000002_update_crm_view_mautic_fields.sql`
- Reference: `supabase/migrations/20251121000005_customers_crm_v_fast_without_orders.sql` (existing view definition)

**Step 1: Write the migration**

This replaces the Brevo placeholder fields in `customers_crm_v` with Mautic sync data. Create the file with the full view redefinition (views must be replaced entirely):

```sql
-- Replace Brevo placeholder fields with Mautic sync data in CRM view
DROP VIEW IF EXISTS customers_crm_v CASCADE;

CREATE VIEW customers_crm_v AS
SELECT
  cp.id,

  -- Primary email
  email_data.email,

  -- Name fields
  cp.first_name,
  cp.last_name,
  cp.canonical_full_name,

  -- Contact info (optimized with LATERAL)
  phone_data.mobile,
  phone_data.landline,
  phone_data.phone,

  -- Address fields (optimized with LATERAL)
  addr_data.address_line1,
  addr_data.address_line2,
  addr_data.address,
  addr_data.suburb,
  addr_data.city,
  addr_data.state,
  addr_data.postcode,
  addr_data.country,
  addr_data.location,

  -- Company and age band
  NULL as company,
  NULL as age_band,

  -- Personal info
  cp.date_of_birth,
  cp.marketing_opt_in,

  -- Engagement metrics
  cem.lifetime_orders as total_orders,
  cem.lifetime_net as total_spent,
  cem.last_order_at as last_order_date,
  cem.most_recent_event_id as last_event_id,
  cem.most_recent_event_name as last_event_name,

  -- Customer segment
  CASE
    WHEN cp.lead_score >= 20 THEN 'vip'
    WHEN cp.lead_score >= 15 THEN 'regular'
    WHEN cem.lifetime_orders = 1 THEN 'new'
    WHEN cem.last_order_at < NOW() - INTERVAL '180 days' THEN 'inactive'
    ELSE 'regular'
  END as customer_segment,

  -- Preferred venue
  cem.preferred_venue,

  -- Source
  NULL::text as source,

  -- Mautic sync fields (replaces Brevo)
  mss.mautic_contact_id,
  CASE
    WHEN mss.sync_error IS NOT NULL THEN 'error'
    WHEN mss.last_synced_at IS NOT NULL THEN 'synced'
    ELSE 'pending'
  END as mautic_sync_status,
  mss.last_synced_at as mautic_last_sync,

  -- Lead scoring fields
  cp.lead_score,
  cp.rfm_recency,
  cp.rfm_frequency,
  cp.rfm_monetary,
  cp.last_scored_at,

  -- Timestamps
  cp.created_at,
  cp.updated_at,

  -- Customer since
  COALESCE(cem.first_seen_at, cp.created_at) as customer_since,

  -- Customer segments array
  seg_data.customer_segments

FROM customer_profiles cp

-- LATERAL: Primary email lookup
LEFT JOIN LATERAL (
  SELECT COALESCE(
    (SELECT email FROM customer_emails WHERE customer_id = cp.id AND is_primary = true LIMIT 1),
    (SELECT email FROM customer_emails WHERE customer_id = cp.id ORDER BY first_seen_at LIMIT 1)
  ) AS email
) email_data ON TRUE

-- LATERAL: Phone numbers
LEFT JOIN LATERAL (
  SELECT
    MAX(CASE WHEN is_primary = true THEN phone_e164 END) as mobile,
    MAX(CASE WHEN is_primary = false THEN phone_e164 END) as landline,
    (SELECT phone_e164 FROM customer_phones WHERE customer_id = cp.id ORDER BY is_primary DESC, first_seen_at ASC LIMIT 1) as phone
  FROM customer_phones
  WHERE customer_id = cp.id
) phone_data ON TRUE

-- LATERAL: Address fields
LEFT JOIN LATERAL (
  SELECT
    line_1 as address_line1,
    line_2 as address_line2,
    CONCAT_WS(' ', line_1, line_2) as address,
    suburb,
    city,
    state,
    postcode,
    country,
    CONCAT_WS(', ',
      NULLIF(suburb, ''),
      NULLIF(state, ''),
      NULLIF(country, '')
    ) as location
  FROM customer_addresses
  WHERE customer_id = cp.id AND is_primary = true
  LIMIT 1
) addr_data ON TRUE

LEFT JOIN customer_engagement_metrics cem ON cem.customer_id = cp.id

-- Mautic sync status
LEFT JOIN mautic_sync_status mss ON mss.customer_id = cp.id

-- LATERAL: Customer segments
LEFT JOIN LATERAL (
  SELECT
    COALESCE(
      array_agg(DISTINCT s.slug ORDER BY s.slug),
      ARRAY[]::text[]
    ) AS customer_segments
  FROM customer_segment_links l
  JOIN segments s ON s.id = l.segment_id
  WHERE l.customer_id = cp.id
) seg_data ON TRUE

WHERE cp.do_not_contact = false OR cp.do_not_contact IS NULL;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_customer_segment_links_customer_segment ON customer_segment_links(customer_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_emails_customer_id ON customer_emails(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_phones_customer_id ON customer_phones(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_engagement_metrics_customer_id ON customer_engagement_metrics(customer_id);

-- Grant permissions
GRANT SELECT ON customers_crm_v TO authenticated;
GRANT SELECT ON customers_crm_v TO service_role;

COMMENT ON VIEW customers_crm_v IS 'CRM view with Mautic sync status. Replaces Brevo fields. Optimized with LATERAL joins.';
```

**Step 2: Test the migration**

Run: `cd /root/agents && npm run migrate:dry-run`
Expected: No SQL errors.

**Step 3: Apply the migration**

Run: `cd /root/agents && npm run migrate:safe`
Expected: View recreated with Mautic fields.

**Step 4: Verify the view has Mautic fields**

Use Supabase MCP:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'customers_crm_v'
AND column_name LIKE 'mautic%'
ORDER BY ordinal_position;
```
Expected: `mautic_contact_id`, `mautic_sync_status`, `mautic_last_sync`.

**Step 5: Verify no frontend breakage**

Run: `cd /root/agents && npm run build`
Expected: Build succeeds. The frontend may reference `brevo_contact_id` etc. If it does, search for it:
```bash
grep -r 'brevo' src/
```
If any hits found, update those references to use the new `mautic_*` field names. If no hits, the frontend doesn't use these fields yet.

**Step 6: Commit**

```bash
cd /root/agents
git add supabase/migrations/20260213000002_update_crm_view_mautic_fields.sql
git commit -m "feat(mautic): replace brevo fields with mautic sync status in CRM view"
```

---

### Task 3: Edge Function - `mautic-sync` (OAuth2 + Contact Push)

**Files:**
- Create: `supabase/functions/mautic-sync/index.ts`

This is the largest task. The function authenticates via OAuth2, reads customers from Supabase, computes change hashes, and pushes new/updated contacts to Mautic in batches.

**Step 1: Create the edge function file**

Create `supabase/functions/mautic-sync/index.ts` with this content:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAUTIC_URL = Deno.env.get('MAUTIC_URL') ?? 'https://mautic.gigpigs.app';
const MAUTIC_CLIENT_ID = Deno.env.get('MAUTIC_CLIENT_ID') ?? '';
const MAUTIC_CLIENT_SECRET = Deno.env.get('MAUTIC_CLIENT_SECRET') ?? '';
const BATCH_SIZE = 200;
const BATCH_DELAY_MS = 1000;

// --- OAuth2 Token Management ---

interface OAuthToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: OAuthToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }

  const response = await fetch(`${MAUTIC_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: MAUTIC_CLIENT_ID,
      client_secret: MAUTIC_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth2 token request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken.access_token;
}

async function mauticFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const response = await fetch(`${MAUTIC_URL}/api${path}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // If 401, refresh token and retry once
  if (response.status === 401) {
    cachedToken = null;
    const newToken = await getAccessToken();
    return fetch(`${MAUTIC_URL}/api${path}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  return response;
}

// --- Field Mapping ---

interface CrmContact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  mobile: string | null;
  landline: string | null;
  address_line1: string | null;
  address_line2: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  customer_segment: string | null;
  lead_score: number | null;
  total_orders: number | null;
  total_spent: number | null;
  last_order_date: string | null;
  last_event_name: string | null;
  preferred_venue: string | null;
  marketing_opt_in: boolean | null;
  customer_since: string | null;
  customer_segments: string[];
}

function mapToMauticFields(contact: CrmContact): Record<string, unknown> {
  return {
    email: contact.email,
    firstname: contact.first_name,
    lastname: contact.last_name,
    mobile: contact.mobile,
    phone: contact.landline,
    address1: contact.address_line1,
    address2: contact.address_line2,
    city: contact.suburb,
    state: contact.state,
    zipcode: contact.postcode,
    country: contact.country,
    supabase_id: contact.id,
    customer_segment: contact.customer_segment,
    lead_score: contact.lead_score,
    total_orders: contact.total_orders,
    total_spent: contact.total_spent,
    last_order_date: contact.last_order_date,
    last_event_name: contact.last_event_name,
    preferred_venue: contact.preferred_venue,
    marketing_opt_in: contact.marketing_opt_in ? 1 : 0,
    customer_since: contact.customer_since,
  };
}

// --- Change Detection ---

async function computeHash(fields: Record<string, unknown>): Promise<string> {
  const json = JSON.stringify(fields, Object.keys(fields).sort());
  const data = new TextEncoder().encode(json);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Segment Sync ---

const SEGMENT_MAP: Record<string, string> = {
  vip: 'VIP Customers',
  regular: 'Regular Customers',
  new: 'New Customers',
  inactive: 'Inactive Customers',
};

async function ensureMauticSegments(): Promise<Record<string, number>> {
  const response = await mauticFetch('/segments?limit=100');
  if (!response.ok) throw new Error(`Failed to fetch segments: ${response.status}`);

  const data = await response.json();
  const existing: Record<string, number> = {};

  for (const seg of Object.values(data.lists || {}) as Array<{ name: string; id: number }>) {
    existing[seg.name] = seg.id;
  }

  // Create missing segments
  for (const [slug, name] of Object.entries(SEGMENT_MAP)) {
    if (!existing[name]) {
      const createRes = await mauticFetch('/segments/new', {
        method: 'POST',
        body: JSON.stringify({ name, alias: slug, isPublished: true }),
      });
      if (createRes.ok) {
        const created = await createRes.json();
        existing[name] = created.list.id;
        console.log(`Created Mautic segment: ${name} (ID: ${created.list.id})`);
      } else {
        console.error(`Failed to create segment ${name}: ${createRes.status}`);
      }
    }
  }

  return existing;
}

async function syncContactSegments(
  mauticContactId: number,
  customerSegments: string[],
  segmentNameToId: Record<string, number>
): Promise<void> {
  for (const [slug, name] of Object.entries(SEGMENT_MAP)) {
    const segmentId = segmentNameToId[name];
    if (!segmentId) continue;

    const shouldBeMember = customerSegments.includes(slug);

    if (shouldBeMember) {
      await mauticFetch(`/segments/${segmentId}/contact/${mauticContactId}/add`, {
        method: 'POST',
      });
    } else {
      await mauticFetch(`/segments/${segmentId}/contact/${mauticContactId}/remove`, {
        method: 'POST',
      });
    }
  }
}

// --- Main Sync Logic ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const runStarted = new Date().toISOString();
  let contactsSynced = 0;
  let contactsCreated = 0;
  let contactsUpdated = 0;
  let contactsFailed = 0;
  let segmentsSynced = 0;
  const errors: Array<{ email: string; error: string }> = [];

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Ensure Mautic segments exist
    const segmentNameToId = await ensureMauticSegments();
    segmentsSynced = Object.keys(segmentNameToId).length;

    // 2. Fetch all contacts from CRM view
    const { data: contacts, error: fetchError } = await supabase
      .from('customers_crm_v')
      .select('id, email, first_name, last_name, mobile, landline, address_line1, address_line2, suburb, state, postcode, country, customer_segment, lead_score, total_orders, total_spent, last_order_date, last_event_name, preferred_venue, marketing_opt_in, customer_since, customer_segments')
      .not('email', 'is', null);

    if (fetchError) throw new Error(`Failed to fetch contacts: ${fetchError.message}`);
    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No contacts to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch existing sync status
    const { data: syncStatuses } = await supabase
      .from('mautic_sync_status')
      .select('customer_id, mautic_contact_id, sync_hash');

    const syncMap = new Map(
      (syncStatuses || []).map(s => [s.customer_id, s])
    );

    // 4. Determine which contacts need syncing
    const toSync: Array<{ contact: CrmContact; mauticFields: Record<string, unknown>; hash: string; existing: { mautic_contact_id: number | null; sync_hash: string | null } | null }> = [];

    for (const contact of contacts) {
      const mauticFields = mapToMauticFields(contact as CrmContact);
      const hash = await computeHash(mauticFields);
      const existing = syncMap.get(contact.id) || null;

      if (!existing || existing.sync_hash !== hash) {
        toSync.push({ contact: contact as CrmContact, mauticFields, hash, existing });
      }
    }

    console.log(`Mautic sync: ${toSync.length} contacts to sync out of ${contacts.length} total`);

    // 5. Process in batches
    for (let i = 0; i < toSync.length; i += BATCH_SIZE) {
      const batch = toSync.slice(i, i + BATCH_SIZE);

      for (const { contact, mauticFields, hash, existing } of batch) {
        try {
          let mauticContactId: number;

          if (existing?.mautic_contact_id) {
            // Update existing contact
            const res = await mauticFetch(`/contacts/${existing.mautic_contact_id}/edit`, {
              method: 'PATCH',
              body: JSON.stringify(mauticFields),
            });
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`Update failed (${res.status}): ${errText}`);
            }
            mauticContactId = existing.mautic_contact_id;
            contactsUpdated++;
          } else {
            // Create new contact
            const res = await mauticFetch('/contacts/new', {
              method: 'POST',
              body: JSON.stringify(mauticFields),
            });
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`Create failed (${res.status}): ${errText}`);
            }
            const created = await res.json();
            mauticContactId = created.contact.id;
            contactsCreated++;
          }

          // Sync segment membership
          await syncContactSegments(
            mauticContactId,
            contact.customer_segments || [],
            segmentNameToId
          );

          // Update sync status
          await supabase.from('mautic_sync_status').upsert({
            customer_id: contact.id,
            mautic_contact_id: mauticContactId,
            sync_hash: hash,
            last_synced_at: new Date().toISOString(),
            sync_error: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'customer_id' });

          contactsSynced++;
        } catch (err) {
          contactsFailed++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          errors.push({ email: contact.email, error: errorMsg });

          // Record error in sync status
          await supabase.from('mautic_sync_status').upsert({
            customer_id: contact.id,
            sync_error: errorMsg,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'customer_id' });
        }
      }

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < toSync.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // 6. Log the sync run
    await supabase.from('mautic_sync_logs').insert({
      run_started_at: runStarted,
      run_finished_at: new Date().toISOString(),
      contacts_synced: contactsSynced,
      contacts_created: contactsCreated,
      contacts_updated: contactsUpdated,
      contacts_failed: contactsFailed,
      segments_synced: segmentsSynced,
      error_details: errors.length > 0 ? errors : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        contacts_synced: contactsSynced,
        contacts_created: contactsCreated,
        contacts_updated: contactsUpdated,
        contacts_failed: contactsFailed,
        segments_synced: segmentsSynced,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mautic sync fatal error:', error);

    // Try to log the failed run
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabase.from('mautic_sync_logs').insert({
        run_started_at: runStarted,
        run_finished_at: new Date().toISOString(),
        contacts_synced: contactsSynced,
        contacts_failed: contactsFailed,
        error_details: [{ error: error instanceof Error ? error.message : String(error) }],
      });
    } catch (logErr) {
      console.error('Failed to log sync error:', logErr);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Step 2: Verify the function has no syntax errors**

Run: `cd /root/agents && npx deno check supabase/functions/mautic-sync/index.ts 2>&1 || echo "Deno not installed locally - will be checked on deploy"`

Note: If Deno isn't installed locally, syntax will be validated on deployment. Review the code manually for any typos.

**Step 3: Commit**

```bash
cd /root/agents
git add supabase/functions/mautic-sync/index.ts
git commit -m "feat(mautic): add mautic-sync edge function with OAuth2 and batch contact push"
```

---

### Task 4: Edge Function - `mautic-webhook` (Engagement Events)

**Files:**
- Create: `supabase/functions/mautic-webhook/index.ts`

**Step 1: Create the webhook handler**

Create `supabase/functions/mautic-webhook/index.ts` with this content:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mautic-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const WEBHOOK_SECRET = Deno.env.get('MAUTIC_WEBHOOK_SECRET') ?? '';
const MAX_BOUNCES = 3;

interface MauticWebhookPayload {
  'mautic.email_on_open'?: MauticEmailEvent[];
  'mautic.email_on_click'?: MauticEmailClickEvent[];
  'mautic.email_on_unsubscribe'?: MauticEmailEvent[];
  'mautic.email_on_bounce'?: MauticEmailEvent[];
  timestamp: string;
}

interface MauticEmailEvent {
  id: number;
  lead: {
    id: number;
    email: string;
    fields?: Record<string, unknown>;
  };
  email: {
    id: number;
    name: string;
    subject: string;
  };
  dateSent?: string;
  dateRead?: string;
}

interface MauticEmailClickEvent extends MauticEmailEvent {
  url: string;
}

function validateSignature(body: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return !WEBHOOK_SECRET;

  try {
    const hmac = createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(body);
    const expected = hmac.digest('hex');
    return signature === expected;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    const signature = req.headers.get('x-mautic-signature');

    if (!validateSignature(body, signature)) {
      console.error('Invalid Mautic webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: MauticWebhookPayload = JSON.parse(body);
    let eventsProcessed = 0;

    // Process each event type
    for (const [eventKey, events] of Object.entries(payload)) {
      if (eventKey === 'timestamp' || !Array.isArray(events)) continue;

      const eventType = eventKey
        .replace('mautic.email_on_', '')
        .replace('mautic.email_on', '');

      for (const event of events) {
        const mauticEmail = event.lead?.email;
        if (!mauticEmail) continue;

        // Find the customer by their Mautic contact ID
        const mauticContactId = event.lead?.id;
        let customerId: string | null = null;

        if (mauticContactId) {
          const { data: syncRecord } = await supabase
            .from('mautic_sync_status')
            .select('customer_id')
            .eq('mautic_contact_id', mauticContactId)
            .single();

          customerId = syncRecord?.customer_id ?? null;
        }

        // Fallback: look up by email
        if (!customerId) {
          const { data: emailRecord } = await supabase
            .from('customer_emails')
            .select('customer_id')
            .eq('email', mauticEmail)
            .limit(1)
            .single();

          customerId = emailRecord?.customer_id ?? null;
        }

        if (!customerId) {
          console.warn(`No customer found for Mautic contact ${mauticContactId} (${mauticEmail})`);
          continue;
        }

        // Insert engagement event
        await supabase.from('customer_email_engagement').insert({
          customer_id: customerId,
          event_type: eventType,
          campaign_name: event.email?.name ?? null,
          email_subject: event.email?.subject ?? null,
          link_url: (event as MauticEmailClickEvent).url ?? null,
          occurred_at: event.dateRead || event.dateSent || new Date().toISOString(),
          mautic_email_id: String(event.email?.id),
          raw_payload: event,
        });

        // Side effects
        if (eventType === 'unsubscribe') {
          await supabase
            .from('customer_profiles')
            .update({ marketing_opt_in: false, updated_at: new Date().toISOString() })
            .eq('id', customerId);

          console.log(`Unsubscribed customer ${customerId} (${mauticEmail})`);
        }

        if (eventType === 'bounce') {
          // Count bounces for this customer
          const { count } = await supabase
            .from('customer_email_engagement')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .eq('event_type', 'bounce');

          if (count && count >= MAX_BOUNCES) {
            await supabase
              .from('customer_emails')
              .update({ is_valid: false })
              .eq('customer_id', customerId)
              .eq('email', mauticEmail);

            console.log(`Flagged email as invalid for customer ${customerId} after ${count} bounces`);
          }
        }

        eventsProcessed++;
      }
    }

    console.log(`Mautic webhook processed: ${eventsProcessed} events`);

    return new Response(
      JSON.stringify({ success: true, events_processed: eventsProcessed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mautic webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Step 2: Commit**

```bash
cd /root/agents
git add supabase/functions/mautic-webhook/index.ts
git commit -m "feat(mautic): add mautic-webhook edge function for engagement events"
```

---

### Task 5: Add `is_valid` Column to `customer_emails` (if missing)

The bounce handler sets `is_valid = false` after 3 bounces. This column may not exist.

**Files:**
- Create: `supabase/migrations/20260213000003_add_is_valid_to_customer_emails.sql`

**Step 1: Check if the column exists**

Use Supabase MCP:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'customer_emails' AND column_name = 'is_valid';
```

If it returns a row, skip this entire task.

**Step 2: Write the migration (only if column missing)**

```sql
-- Add is_valid flag to customer_emails for bounce tracking
ALTER TABLE customer_emails ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_customer_emails_is_valid ON customer_emails(is_valid) WHERE is_valid = false;

COMMENT ON COLUMN customer_emails.is_valid IS 'Set to false after 3+ bounces from Mautic. Used to suppress sends to invalid addresses.';
```

**Step 3: Apply and verify**

Run: `cd /root/agents && npm run migrate:safe`

Verify:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customer_emails' AND column_name = 'is_valid';
```
Expected: `is_valid | boolean | true`

**Step 4: Commit**

```bash
cd /root/agents
git add supabase/migrations/20260213000003_add_is_valid_to_customer_emails.sql
git commit -m "feat(mautic): add is_valid column to customer_emails for bounce tracking"
```

---

### Task 6: Deploy Edge Functions and Set Secrets

This task requires the Mautic admin setup to be complete (OAuth2 credentials created).

**Step 1: Set edge function secrets**

```bash
cd /root/agents
npx supabase secrets set MAUTIC_URL=https://mautic.gigpigs.app
npx supabase secrets set MAUTIC_CLIENT_ID=<your-client-id>
npx supabase secrets set MAUTIC_CLIENT_SECRET=<your-client-secret>
npx supabase secrets set MAUTIC_WEBHOOK_SECRET=<your-webhook-secret>
```

Replace `<your-client-id>`, `<your-client-secret>`, and `<your-webhook-secret>` with actual values from Mautic admin.

**Step 2: Deploy the sync function**

```bash
cd /root/agents
npx supabase functions deploy mautic-sync --no-verify-jwt
```

The `--no-verify-jwt` flag allows the function to be called by pg_cron (which doesn't send a JWT).

**Step 3: Deploy the webhook function**

```bash
cd /root/agents
npx supabase functions deploy mautic-webhook --no-verify-jwt
```

The `--no-verify-jwt` flag allows Mautic to call the webhook without a Supabase JWT (it uses its own secret-based auth).

**Step 4: Verify functions are deployed**

```bash
npx supabase functions list
```
Expected: Both `mautic-sync` and `mautic-webhook` appear in the list.

---

### Task 7: Schedule Sync with pg_cron

**Files:**
- Create: `supabase/migrations/20260213000004_schedule_mautic_sync.sql`

**Step 1: Write the scheduling migration**

```sql
-- Schedule mautic-sync to run every 15 minutes via pg_net
-- Requires pg_cron and pg_net extensions (already enabled on Supabase)

-- Get the project URL and service role key from vault or use direct reference
-- Note: Replace <supabase-project-ref> with your actual project ref

SELECT cron.schedule(
  'mautic-contact-sync',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/mautic-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

COMMENT ON COLUMN cron.job.jobname IS 'mautic-contact-sync: Pushes customer data to Mautic every 15 minutes';
```

Note: If `current_setting('app.settings.supabase_url')` is not configured, you may need to hardcode the URL. Check first:
```sql
SELECT current_setting('app.settings.supabase_url', true);
```
If NULL, use the direct project URL instead.

**Step 2: Apply and verify**

Run: `cd /root/agents && npm run migrate:safe`

Verify the cron job exists:
```sql
SELECT jobid, schedule, command FROM cron.job WHERE jobname = 'mautic-contact-sync';
```
Expected: One row with `*/15 * * * *` schedule.

**Step 3: Commit**

```bash
cd /root/agents
git add supabase/migrations/20260213000004_schedule_mautic_sync.sql
git commit -m "feat(mautic): schedule mautic-sync via pg_cron every 15 minutes"
```

---

### Task 8: Manual Test - End to End

**Step 1: Trigger a manual sync**

Call the edge function directly:
```bash
curl -X POST https://<supabase-project>.supabase.co/functions/v1/mautic-sync \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: JSON response with `contacts_synced`, `contacts_created`, etc.

**Step 2: Check sync logs**

```sql
SELECT * FROM mautic_sync_logs ORDER BY run_started_at DESC LIMIT 5;
```

Expected: At least one row showing the run results.

**Step 3: Verify contacts in Mautic**

Log into `https://mautic.gigpigs.app` and check:
- Contacts list shows imported customers
- Custom fields (`supabase_id`, `lead_score`, etc.) are populated
- Segments have members

**Step 4: Test the webhook**

Send a test webhook to the edge function:
```bash
curl -X POST https://<supabase-project>.supabase.co/functions/v1/mautic-webhook \
  -H "Content-Type: application/json" \
  -d '{"mautic.email_on_open": [{"id": 1, "lead": {"id": 1, "email": "test@example.com"}, "email": {"id": 1, "name": "Test Campaign", "subject": "Test Subject"}, "dateRead": "2026-02-13T12:00:00Z"}], "timestamp": "2026-02-13T12:00:00Z"}'
```

Expected: `{"success": true, "events_processed": 0}` (0 because test@example.com won't match a real customer).

**Step 5: Verify CRM view shows Mautic status**

```sql
SELECT id, email, mautic_contact_id, mautic_sync_status, mautic_last_sync
FROM customers_crm_v
WHERE mautic_sync_status = 'synced'
LIMIT 5;
```

Expected: Rows with populated Mautic fields after sync has run.

---

## Mautic Admin Checklist (Manual Steps)

These must be done in the Mautic web UI before Tasks 6-8:

- [ ] Enable API: Settings > Configuration > API Settings > Enable API: Yes
- [ ] Create OAuth2 Credentials: Settings > API Credentials > New (save Client ID + Secret)
- [ ] Verify custom fields exist: `supabase_id`, `customer_segment`, `lead_score`, `total_orders`, `total_spent`, `last_order_date`, `last_event_name`, `preferred_venue`, `marketing_opt_in`, `customer_since`
- [ ] Create webhook: Settings > Webhooks > New, pointing to edge function URL
- [ ] Enable webhook events: `email_on_open`, `email_on_click`, `email_on_unsubscribe`, `email_on_bounce`
