import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Framer CMS Sync Edge Function
 *
 * Syncs events from Supabase session_complete view to Framer CMS.
 * Returns prepared items with proper field format for MCP or external sync.
 *
 * Environment variables required:
 * - FRAMER_API_KEY: Your Framer Server API key
 * - FRAMER_PROJECT_URL: Your Framer project URL
 * - FRAMER_EVENTS_COLLECTION_ID: The Events CMS collection ID (default: vskEl8KrG)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Framer Events CMS field IDs
const FRAMER_FIELDS = {
  bannerImage: 'Oak7VV4uq',
  title: 'ALBTDQP8K',
  description: 'eFt_IqEQL',
  tags: 'c3gfTQjYw',
  nextShowDate: 'bqlUUsfQb',
  venueName: 'CTS8l19Wu',
  venueAddress: 'L75TkSp83',
  ticketUrl: 'LstqUouVh',
  calendarGroup: 'uoZeQbqvv',
  festival: 'oj243Jzgm',
  disablePopup: 'YaDdXhFJZ',
  mobileBannerImage: 'kTG4FHaLG',
} as const;

const FESTIVAL_ENUM = {
  monthly: 'nghRbXghl',
  festival: 'cKLZ2SZYl',
} as const;

interface SessionEvent {
  canonical_session_source_id: string;
  event_name: string;
  session_name: string;
  description: string | null;
  banner_image_url: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  url: string | null;
  session_start_local: string | null;
  timezone: string | null;
  is_past: boolean;
}

/**
 * Generate a URL-friendly slug from event name + date for uniqueness
 */
function generateSlug(eventName: string, dateStr: string | null): string {
  const baseName = eventName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  // Add date suffix for uniqueness (e.g., "magic-mic-comedy-18-feb-2026")
  if (dateStr) {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
      const year = date.getFullYear();
      return `${baseName}-${day}-${month}-${year}`;
    } catch {
      return baseName;
    }
  }
  return baseName;
}

/**
 * Format date for display (e.g., "9 MAY 2026")
 */
function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return '';
  }
}

/**
 * Determine tags based on venue city and day of week
 */
function generateTags(event: SessionEvent): string {
  const tags: string[] = [];

  const city = event.venue_city?.toLowerCase() || '';
  if (city.includes('sydney') || city.includes('darlinghurst') || city.includes('potts point') || city.includes('surry hills') || city.includes('newtown')) {
    tags.push('sydney');
  } else if (city.includes('melbourne')) {
    tags.push('melbourne');
  }

  if (event.session_start_local) {
    try {
      const date = new Date(event.session_start_local);
      const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      tags.push(dayOfWeek);
    } catch {
      // ignore
    }
  }

  return tags.join(', ');
}

/**
 * Get calendar group from event name (without date)
 */
function getCalendarGroup(eventName: string): string {
  return eventName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
}

/**
 * Transform Supabase event to Framer CMS item format
 * Uses {type, value} format required by Framer MCP
 */
function transformToFramerItem(event: SessionEvent) {
  const eventName = event.event_name || event.session_name;
  const slug = generateSlug(eventName, event.session_start_local);
  const ticketUrl = event.url || null;
  const description = event.description || '<p></p>';

  return {
    slug: slug,
    fieldData: {
      [FRAMER_FIELDS.title]: { type: 'string', value: eventName },
      [FRAMER_FIELDS.description]: { type: 'formattedText', value: description },
      [FRAMER_FIELDS.bannerImage]: { type: 'image', value: event.banner_image_url || '' },
      [FRAMER_FIELDS.mobileBannerImage]: { type: 'image', value: event.banner_image_url || '' },
      [FRAMER_FIELDS.venueName]: { type: 'string', value: event.venue_name || '' },
      [FRAMER_FIELDS.venueAddress]: { type: 'string', value: event.venue_address || '' },
      [FRAMER_FIELDS.ticketUrl]: { type: 'link', value: ticketUrl || '' },
      [FRAMER_FIELDS.nextShowDate]: { type: 'string', value: formatDisplayDate(event.session_start_local) },
      [FRAMER_FIELDS.tags]: { type: 'string', value: generateTags(event) },
      [FRAMER_FIELDS.calendarGroup]: { type: 'string', value: getCalendarGroup(eventName) },
      [FRAMER_FIELDS.festival]: { type: 'enum', value: FESTIVAL_ENUM.monthly },
      [FRAMER_FIELDS.disablePopup]: { type: 'boolean', value: false },
    },
  };
}

/**
 * Get events that haven't been synced to Framer yet
 */
async function getUnsyncedEvents(supabase: any, limit: number = 10): Promise<SessionEvent[]> {
  // Get already synced IDs
  const { data: synced } = await supabase
    .from('framer_cms_sync')
    .select('canonical_session_source_id');

  const syncedIds = new Set((synced || []).map((s: any) => s.canonical_session_source_id));

  // Get upcoming events from session_complete
  const { data: allEvents, error } = await supabase
    .from('session_complete')
    .select(`
      canonical_session_source_id,
      event_name,
      session_name,
      description,
      banner_image_url,
      venue_name,
      venue_address,
      venue_city,
      url,
      session_start_local,
      timezone,
      is_past
    `)
    .eq('is_past', false)
    .order('session_start_local', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return (allEvents || [])
    .filter((e: SessionEvent) => !syncedIds.has(e.canonical_session_source_id))
    .slice(0, limit);
}

/**
 * Track synced items in database
 */
async function markAsSynced(
  supabase: any,
  canonicalSessionSourceId: string,
  framerSlug: string
): Promise<void> {
  const { error } = await supabase
    .from('framer_cms_sync')
    .upsert({
      canonical_session_source_id: canonicalSessionSourceId,
      framer_slug: framerSlug,
      synced_at: new Date().toISOString(),
    }, {
      onConflict: 'canonical_session_source_id',
    });

  if (error) {
    console.error('Error marking as synced:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse options from request body
    let syncAll = false;
    let limit = 10;
    let markSynced = false;
    try {
      const body = await req.json();
      syncAll = body?.syncAll || false;
      limit = body?.limit || 10;
      markSynced = body?.markSynced || false;
    } catch {
      // Empty body is fine
    }

    console.log(`[Framer CMS Sync] Starting sync (limit: ${limit}, syncAll: ${syncAll})`);

    // Get unsynced events
    const events = await getUnsyncedEvents(supabase, syncAll ? 100 : limit);
    console.log(`[Framer CMS Sync] Found ${events.length} events to sync`);

    if (events.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No new events to sync', synced: 0, items: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare items for sync
    const results = { synced: 0, failed: 0, errors: [] as string[], items: [] as any[] };

    for (const event of events) {
      try {
        const framerItem = transformToFramerItem(event);
        console.log(`[Framer CMS Sync] Preparing: ${framerItem.slug}`);

        // Store the transformed item for external sync via MCP
        results.items.push({
          canonical_session_source_id: event.canonical_session_source_id,
          collectionId: 'vskEl8KrG',
          ...framerItem
        });

        // Optionally mark as synced (when called after MCP sync)
        if (markSynced) {
          await markAsSynced(supabase, event.canonical_session_source_id, framerItem.slug);
        }

        results.synced++;
        console.log(`[Framer CMS Sync] Prepared: ${framerItem.slug}`);
      } catch (error: any) {
        results.failed++;
        const errorMsg = `Failed to prepare ${event.event_name}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[Framer CMS Sync] ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: results.failed === 0,
        message: `Prepared ${results.synced} events for sync, ${results.failed} failed`,
        ...results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Framer CMS Sync] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
