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

    // 3. Fetch existing sync status with previous segments
    const { data: syncStatuses } = await supabase
      .from('mautic_sync_status')
      .select('customer_id, mautic_contact_id, sync_hash, previous_segments');

    const syncMap = new Map(
      (syncStatuses || []).map(s => [s.customer_id, s])
    );

    // 4. Determine which contacts need syncing
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
      const mauticFields = mapToMauticFields(contact as CrmContact);
      const segments = contact.customer_segments || [];
      const hash = await computeHash(mauticFields, segments);
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
          // Issue 3: Wrap segment sync in try-catch to avoid failing entire contact
          try {
            const currentSegments = contact.customer_segments || [];
            const previousSegments = existing?.previous_segments || [];
            await syncContactSegments(
              mauticContactId,
              currentSegments,
              previousSegments,
              segmentNameToId
            );
          } catch (segmentErr) {
            console.error(`Segment sync failed for contact ${contact.id}:`, segmentErr);
            // Don't fail the entire contact sync
          }

          // Update sync status with current segments for next run
          await supabase.from('mautic_sync_status').upsert({
            customer_id: contact.id,
            mautic_contact_id: mauticContactId,
            sync_hash: hash,
            previous_segments: contact.customer_segments || [],
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
