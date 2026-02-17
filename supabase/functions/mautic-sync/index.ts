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
const CONCURRENCY = 10;
const BATCH_DELAY_MS = 500;

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

  // Issue 4: OAuth response validation
  if (!data.access_token || !data.expires_in) {
    throw new Error('Invalid OAuth2 response: missing access_token or expires_in');
  }

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

// --- Country Code Mapping ---

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  AU: 'Australia', NZ: 'New Zealand', GB: 'United Kingdom', US: 'United States',
  CA: 'Canada', IE: 'Ireland', DE: 'Germany', FR: 'France', NL: 'Netherlands',
  SG: 'Singapore', NO: 'Norway', ES: 'Spain', AT: 'Austria', BE: 'Belgium',
  IT: 'Italy', SE: 'Sweden', DK: 'Denmark', CH: 'Switzerland', JP: 'Japan',
  IN: 'India', ZA: 'South Africa', BR: 'Brazil', MX: 'Mexico', PT: 'Portugal',
  FI: 'Finland', PL: 'Poland', CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania',
  GR: 'Greece', TH: 'Thailand', MY: 'Malaysia', PH: 'Philippines', ID: 'Indonesia',
  HK: 'Hong Kong', TW: 'Taiwan', KR: 'South Korea', CN: 'China', AE: 'United Arab Emirates',
};

function normalizeCountry(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // If it's a 2-letter code, look up the full name
  if (trimmed.length === 2) {
    return COUNTRY_CODE_TO_NAME[trimmed.toUpperCase()] || null;
  }
  // If it's already a full name, pass through
  return trimmed;
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
    state_location: contact.state,
    zipcode: contact.postcode,
    country: normalizeCountry(contact.country),
    supabase_id: contact.id,
    customer_segment: contact.customer_segment,
    lead_score: contact.lead_score,
    total_orders: contact.total_orders,
    total_spent: contact.total_spent,
    last_order_date: contact.last_order_date,
    last_event_name: contact.last_event_name,
    preferred_venue: contact.preferred_venue,
    // Issue 5: Fix null handling for marketing_opt_in
    marketing_opt_in: contact.marketing_opt_in === null ? null : (contact.marketing_opt_in ? 1 : 0),
    customer_since: contact.customer_since,
  };
}

// --- Change Detection ---

async function computeHash(fields: Record<string, unknown>, segments: string[]): Promise<string> {
  // Issue 2: Include sorted segments in hash to detect segment changes
  const fieldsWithSegments = {
    ...fields,
    _segments: segments.slice().sort().join(','),
  };
  const json = JSON.stringify(fieldsWithSegments, Object.keys(fieldsWithSegments).sort());
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

// Issue 1: Optimized segment sync - only sync segments that changed
async function syncContactSegments(
  mauticContactId: number,
  currentSegments: string[],
  previousSegments: string[],
  segmentNameToId: Record<string, number>
): Promise<void> {
  const toAdd = currentSegments.filter(s => !previousSegments.includes(s));
  const toRemove = previousSegments.filter(s => !currentSegments.includes(s));

  // Only make API calls for segments that actually changed
  for (const slug of toAdd) {
    const name = SEGMENT_MAP[slug];
    if (!name) continue;
    const segmentId = segmentNameToId[name];
    if (!segmentId) continue;
    await mauticFetch(`/segments/${segmentId}/contact/${mauticContactId}/add`, {
      method: 'POST',
    });
  }

  for (const slug of toRemove) {
    const name = SEGMENT_MAP[slug];
    if (!name) continue;
    const segmentId = segmentNameToId[name];
    if (!segmentId) continue;
    await mauticFetch(`/segments/${segmentId}/contact/${mauticContactId}/remove`, {
      method: 'POST',
    });
  }
}

// --- Shared Single-Contact Sync ---

type SupabaseClient = ReturnType<typeof createClient>;

interface SyncOneResult {
  action: 'created' | 'updated';
  mauticContactId: number;
}

async function syncOneContact(
  contact: CrmContact,
  mauticFields: Record<string, unknown>,
  hash: string,
  existing: { mautic_contact_id: number | null; sync_hash: string | null; previous_segments?: string[] | null } | null,
  supabase: SupabaseClient,
  segmentNameToId: Record<string, number>,
): Promise<SyncOneResult> {
  let mauticContactId: number;
  let action: 'created' | 'updated';

  if (existing?.mautic_contact_id) {
    const res = await mauticFetch(`/contacts/${existing.mautic_contact_id}/edit`, {
      method: 'PATCH',
      body: JSON.stringify(mauticFields),
    });
    if (!res.ok) {
      const errText = await res.text();
      // If 422 "email must be unique", look up existing contact by email
      if (res.status === 422 && errText.includes('unique')) {
        const searchRes = await mauticFetch(`/contacts?search=email:${contact.email}&minimal=true`);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const contactIds = Object.keys(searchData.contacts || {}).map(Number).sort((a, b) => a - b);
          if (contactIds.length > 0) {
            mauticContactId = contactIds[0]!;
            await mauticFetch(`/contacts/${mauticContactId}/edit`, {
              method: 'PATCH',
              body: JSON.stringify(mauticFields),
            });
            action = 'updated';
          } else {
            throw new Error(`Update failed (${res.status}): ${errText}`);
          }
        } else {
          throw new Error(`Update failed (${res.status}): ${errText}`);
        }
      } else {
        throw new Error(`Update failed (${res.status}): ${errText}`);
      }
    } else {
      mauticContactId = existing.mautic_contact_id;
      action = 'updated';
    }
  } else {
    // Before creating, check if contact already exists in Mautic by email
    const searchRes = await mauticFetch(`/contacts?search=email:${contact.email}&minimal=true`);
    let existingMauticId: number | null = null;
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const contactIds = Object.keys(searchData.contacts || {}).map(Number).sort((a, b) => a - b);
      if (contactIds.length > 0) {
        existingMauticId = contactIds[0]!;
      }
    }

    if (existingMauticId) {
      await mauticFetch(`/contacts/${existingMauticId}/edit`, {
        method: 'PATCH',
        body: JSON.stringify(mauticFields),
      });
      mauticContactId = existingMauticId;
      action = 'updated';
    } else {
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
      action = 'created';
    }
  }

  try {
    const currentSegments = contact.customer_segments || [];
    const previousSegments = existing?.previous_segments || [];
    await syncContactSegments(mauticContactId, currentSegments, previousSegments, segmentNameToId);
  } catch (segmentErr) {
    console.error(`Segment sync failed for contact ${contact.id}:`, segmentErr);
  }

  await supabase.from('mautic_sync_status').upsert({
    customer_id: contact.id,
    mautic_contact_id: mauticContactId,
    sync_hash: hash,
    previous_segments: contact.customer_segments || [],
    last_synced_at: new Date().toISOString(),
    sync_error: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'customer_id' });

  return { action, mauticContactId };
}

// --- CRM View Select Columns ---

const CRM_VIEW_SELECT = 'id, email, first_name, last_name, mobile, landline, address_line1, address_line2, suburb, state, postcode, country, customer_segment, lead_score, total_orders, total_spent, last_order_date, last_event_name, preferred_venue, marketing_opt_in, customer_since, customer_segments';

// --- Single Customer Sync Handler ---

async function handleSingleCustomerSync(
  req: Request,
  supabase: SupabaseClient,
  segmentNameToId: Record<string, number>,
): Promise<Response> {
  const body = await req.json();
  const customerId = body?.id;

  if (!customerId) {
    return new Response(
      JSON.stringify({ error: 'Missing customer id in request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Fetch fresh data from the CRM view (not from trigger body, which may be stale)
  const { data: contact, error: fetchError } = await supabase
    .from('customers_crm_v')
    .select(CRM_VIEW_SELECT)
    .eq('id', customerId)
    .single();

  if (fetchError || !contact) {
    return new Response(
      JSON.stringify({ error: `Customer not found: ${fetchError?.message ?? 'no data'}` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const crmContact = contact as unknown as CrmContact;
  if (!crmContact.email || crmContact.email.startsWith('[gdpr-deleted')) {
    return new Response(
      JSON.stringify({ success: true, message: 'Skipped: no valid email' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const mauticFields = mapToMauticFields(crmContact);
  const segments = crmContact.customer_segments || [];
  const hash = await computeHash(mauticFields, segments);

  // Check existing sync status
  const { data: existingStatus } = await supabase
    .from('mautic_sync_status')
    .select('customer_id, mautic_contact_id, sync_hash, previous_segments')
    .eq('customer_id', customerId)
    .single();

  const existing = existingStatus as { mautic_contact_id: number | null; sync_hash: string | null; previous_segments: string[] | null } | null;

  // Skip if hash unchanged
  if (existing?.sync_hash === hash) {
    return new Response(
      JSON.stringify({ success: true, message: 'No changes detected', customer_id: customerId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await syncOneContact(crmContact, mauticFields, hash, existing, supabase, segmentNameToId);
    return new Response(
      JSON.stringify({ success: true, action: result.action, mautic_contact_id: result.mauticContactId, customer_id: customerId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await supabase.from('mautic_sync_status').upsert({
      customer_id: customerId,
      sync_error: errorMsg,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'customer_id' });

    return new Response(
      JSON.stringify({ error: errorMsg, customer_id: customerId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// --- Queue Processing Handler ---

async function handleProcessQueue(
  supabase: SupabaseClient,
  segmentNameToId: Record<string, number>,
): Promise<Response> {
  // Fetch up to BATCH_SIZE customer_ids from queue
  const { data: queueItems, error: queueError } = await supabase
    .from('mautic_sync_queue')
    .select('customer_id')
    .order('queued_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (queueError) {
    return new Response(
      JSON.stringify({ error: `Failed to read queue: ${queueError.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!queueItems || queueItems.length === 0) {
    return new Response(
      JSON.stringify({ success: true, processed: 0, message: 'Queue empty' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const customerIds = queueItems.map(q => q.customer_id);

  // Fetch full contact data from CRM view
  const { data: contacts, error: fetchError } = await supabase
    .from('customers_crm_v')
    .select(CRM_VIEW_SELECT)
    .in('id', customerIds)
    .not('email', 'is', null)
    .not('email', 'like', '[gdpr-deleted%');

  if (fetchError) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch contacts: ${fetchError.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Fetch existing sync statuses for these contacts
  const { data: syncStatuses } = await supabase
    .from('mautic_sync_status')
    .select('customer_id, mautic_contact_id, sync_hash, previous_segments')
    .in('customer_id', customerIds);

  const syncMap = new Map(
    (syncStatuses || []).map(s => [s.customer_id, s])
  );

  let processed = 0;
  let created = 0;
  let updated = 0;
  let failed = 0;
  let skipped = 0;
  const errors: Array<{ customer_id: string; error: string }> = [];

  // Process contacts with concurrency control
  const crmContacts = (contacts || []) as unknown as CrmContact[];

  for (let i = 0; i < crmContacts.length; i += CONCURRENCY) {
    const chunk = crmContacts.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(chunk.map(async (contact) => {
      const mauticFields = mapToMauticFields(contact);
      const segments = contact.customer_segments || [];
      const hash = await computeHash(mauticFields, segments);
      const existing = syncMap.get(contact.id) || null;

      if (existing?.sync_hash === hash) {
        skipped++;
        return;
      }

      const result = await syncOneContact(contact, mauticFields, hash, existing, supabase, segmentNameToId);
      if (result.action === 'created') created++;
      else updated++;
      processed++;
    }));

    for (let j = 0; j < results.length; j++) {
      const result = results[j]!;
      if (result.status === 'rejected') {
        failed++;
        const contact = chunk[j]!;
        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        errors.push({ customer_id: contact.id, error: errorMsg });
      }
    }
  }

  // Delete processed rows from queue (all fetched IDs, including skipped)
  const { error: deleteError } = await supabase
    .from('mautic_sync_queue')
    .delete()
    .in('customer_id', customerIds);

  if (deleteError) {
    console.error('Failed to clear queue:', deleteError.message);
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed,
      created,
      updated,
      skipped,
      failed,
      queue_cleared: customerIds.length,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// --- Main Serve Handler ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Route based on action query param
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // Ensure Mautic segments exist (needed by all paths)
  const segmentNameToId = await ensureMauticSegments();

  if (action === 'sync-customer') {
    return await handleSingleCustomerSync(req, supabase, segmentNameToId);
  }

  if (action === 'process-queue') {
    return await handleProcessQueue(supabase, segmentNameToId);
  }

  // --- Full Sync (default, runs on 15-min cron) ---

  const runStarted = new Date().toISOString();
  let contactsSynced = 0;
  let contactsCreated = 0;
  let contactsUpdated = 0;
  let contactsFailed = 0;
  const segmentsSynced = Object.keys(segmentNameToId).length;
  const errors: Array<{ email: string; error: string }> = [];

  try {
    // Fetch all contacts from CRM view (paginated - Supabase returns max 1000 per request)
    const PAGE_SIZE = 1000;
    const contacts: CrmContact[] = [];
    let page = 0;
    while (true) {
      const { data: batch, error: fetchError } = await supabase
        .from('customers_crm_v')
        .select(CRM_VIEW_SELECT)
        .not('email', 'is', null)
        .not('email', 'like', '[gdpr-deleted%')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) throw new Error(`Failed to fetch contacts (page ${page}): ${fetchError.message}`);
      if (!batch || batch.length === 0) break;

      contacts.push(...(batch as unknown as CrmContact[]));
      if (batch.length < PAGE_SIZE) break;
      page++;
    }

    console.log(`Fetched ${contacts.length} total contacts across ${page + 1} pages`);

    if (contacts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No contacts to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing sync status (also paginated)
    const syncStatuses: Array<{ customer_id: string; mautic_contact_id: number | null; sync_hash: string | null; previous_segments: string[] | null }> = [];
    page = 0;
    while (true) {
      const { data: batch } = await supabase
        .from('mautic_sync_status')
        .select('customer_id, mautic_contact_id, sync_hash, previous_segments')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (!batch || batch.length === 0) break;
      syncStatuses.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      page++;
    }

    const syncMap = new Map(
      (syncStatuses || []).map(s => [s.customer_id, s])
    );

    // Determine which contacts need syncing
    const toSync: Array<{
      contact: CrmContact;
      mauticFields: Record<string, unknown>;
      hash: string;
      existing: {
        mautic_contact_id: number | null;
        sync_hash: string | null;
        previous_segments?: string[] | null;
      } | null
    }> = [];

    for (const contact of contacts) {
      const mauticFields = mapToMauticFields(contact);
      const segments = contact.customer_segments || [];
      const hash = await computeHash(mauticFields, segments);
      const existing = syncMap.get(contact.id) || null;

      if (!existing || existing.sync_hash !== hash) {
        toSync.push({ contact, mauticFields, hash, existing });
      }
    }

    console.log(`Mautic sync: ${toSync.length} contacts to sync out of ${contacts.length} total`);

    // Process concurrently in batches
    for (let i = 0; i < toSync.length; i += CONCURRENCY) {
      const chunk = toSync.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(chunk.map(item =>
        syncOneContact(item.contact, item.mauticFields, item.hash, item.existing, supabase, segmentNameToId)
      ));

      for (let j = 0; j < results.length; j++) {
        const result = results[j]!;
        if (result.status === 'fulfilled') {
          contactsSynced++;
          if (result.value.action === 'created') contactsCreated++;
          else contactsUpdated++;
        } else {
          contactsFailed++;
          const item = chunk[j]!;
          const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
          errors.push({ email: item.contact.email, error: errorMsg });

          await supabase.from('mautic_sync_status').upsert({
            customer_id: item.contact.id,
            sync_error: errorMsg,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'customer_id' });
        }
      }

      if (i + CONCURRENCY < toSync.length && (i / CONCURRENCY) % 20 === 19) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Log the sync run
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
