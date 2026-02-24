/**
 * Social Schedule Generator Edge Function
 *
 * Automatically generates a full social media posting schedule for upcoming events.
 * Called via pg_cron (every 6 hours) or manually from the UI.
 *
 * Flow:
 * 1. Query upcoming events (next 4 weeks)
 * 2. Match events to brands
 * 3. Auto-create Drive event folders
 * 4. Generate posting windows per event
 * 5. Deduplicate against existing drafts
 * 6. Fetch Metricool best times per platform
 * 7. Optimize schedule (time slots, caps, gaps)
 * 8. Render captions from templates
 * 9. Select media (event banner / Drive assets)
 * 10. Insert drafts into social_content_drafts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { matchEventToBrand } from './brand-config.ts';
import { getPostingWindows } from './strategy.ts';
import type { EventData } from './strategy.ts';
import { renderCaption } from './templates.ts';
import { optimizeSchedule, parseBestTimesResponse } from './optimizer.ts';
import type { DraftSlot, BestTimeSlot } from './optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOOKAHEAD_DAYS = 56;
const METRICOOL_BASE_URL = 'https://app.metricool.com/api';
const BEST_TIMES_PLATFORMS = ['instagram', 'facebook', 'tiktok', 'twitter'] as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found in env');
      return jsonResponse({ error: 'Server configuration error: missing service key' }, 500);
    }

    // Auth: Deployed with --no-verify-jwt for cron/service_role compatibility.
    // If a user JWT is present, validate it. Cron calls use service_role key
    // which is handled by Supabase's relay layer.
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // Try user auth — if it fails, still allow (could be service_role)
      try {
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          console.log(`Schedule generator invoked by user: ${user.id}`);
        }
      } catch {
        // Not a user JWT — likely service_role or cron, which is fine
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse optional body params
    let eventIds: string[] | undefined;
    try {
      const body = await req.json();
      eventIds = body?.eventIds;
    } catch {
      // No body is fine for cron calls
    }

    const results = {
      eventsProcessed: 0,
      draftsCreated: 0,
      draftsSkipped: 0,
      foldersCreated: 0,
      errors: [] as string[],
    };

    // ─── Step 1a: Query ALL future events (for Drive folder creation) ──────

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const { data: allFutureEvents } = await supabase
      .from('events')
      .select('id, name, title, event_date, organization_id')
      .gte('event_date', todayStr)
      .order('event_date', { ascending: true });

    // ─── Step 1b: Query events in draft window (next 4 weeks for scheduling) ─

    const lookahead = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

    let eventsQuery = supabase
      .from('events')
      .select(`
        id, name, title, event_date, start_time, venue, ticket_url,
        hero_image_url, banner_url, description, organization_id,
        tickets_sold, capacity, status
      `)
      .gte('event_date', todayStr)
      .lte('event_date', lookahead.toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    if (eventIds && eventIds.length > 0) {
      eventsQuery = eventsQuery.in('id', eventIds);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      return jsonResponse({ error: 'Failed to query events', details: eventsError.message }, 500);
    }

    // ─── Step 2: Fetch org names for brand matching (all future events) ─────

    const allEventOrgs = [...new Set(
      [...(allFutureEvents ?? []), ...(events ?? [])].map((e) => e.organization_id).filter(Boolean),
    )];
    const orgNameMap = new Map<string, string>();
    if (allEventOrgs.length > 0) {
      const { data: orgs } = await supabase
        .from('organization_profiles')
        .select('id, name')
        .in('id', allEventOrgs);
      for (const org of orgs ?? []) {
        if (org.name) orgNameMap.set(org.id, org.name);
      }
    }

    // ─── Step 3: Create Drive folders for ALL future events (parallel) ─────

    const folderTasks = (allFutureEvents ?? [])
      .map((event) => {
        const eventName = event.name ?? event.title ?? 'Unnamed Event';
        const orgName = event.organization_id ? orgNameMap.get(event.organization_id) : undefined;
        const brand = matchEventToBrand(eventName, orgName);
        if (!brand) return null;
        return { eventName, event, brand };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    // Create brand folders under root first (must exist before event folders)
    const uniqueBrandsForFolders = [...new Set(folderTasks.map((t) => t.brand.driveBrand))];
    for (const brandName of uniqueBrandsForFolders) {
      await callDriveCreateFolder(supabaseUrl, supabaseServiceKey, brandName);
    }

    // Process in parallel batches of 10 to stay within rate limits
    const FOLDER_BATCH_SIZE = 10;
    for (let i = 0; i < folderTasks.length; i += FOLDER_BATCH_SIZE) {
      const batch = folderTasks.slice(i, i + FOLDER_BATCH_SIZE);
      const settled = await Promise.allSettled(
        batch.map((t) =>
          createEventFolder(supabaseUrl, supabaseServiceKey, {
            id: t.event.id,
            name: t.eventName,
            event_date: t.event.event_date,
          } as EventData, t.brand.driveBrand),
        ),
      );
      for (const result of settled) {
        if (result.status === 'fulfilled') {
          results.foldersCreated++;
        } else {
          console.error('Folder creation failed:', result.reason);
        }
      }
    }

    // ─── Step 3b: Create General folders for each brand ────────────────────

    await Promise.allSettled(
      uniqueBrandsForFolders.map((brandName) =>
        createGeneralFolders(supabaseUrl, supabaseServiceKey, brandName),
      ),
    );

    // ─── Step 4: Continue with draft generation for 8-week window ───────────

    if (!events || events.length === 0) {
      return jsonResponse({ ok: true, message: 'No upcoming events in draft window', ...results });
    }

    // Fetch existing drafts for dedup
    const eventIdList = events.map((e) => e.id);
    const { data: existingDrafts } = await supabase
      .from('social_content_drafts')
      .select('event_id, window_label, platform, post_type')
      .in('event_id', eventIdList)
      .in('status', ['draft', 'approved', 'scheduled', 'published']);

    const existingDraftSet = new Set(
      (existingDrafts ?? []).map((d) =>
        `${d.event_id}|${d.window_label}|${d.platform}|${d.post_type}`,
      ),
    );

    // ─── Step 5: Fetch Metricool best times (cached per run) ────────────────

    const bestTimesCache = new Map<string, BestTimeSlot[]>();
    const metricoolToken = Deno.env.get('METRICOOL_USER_TOKEN');
    const metricoolUserId = Deno.env.get('METRICOOL_USER_ID');
    const metricoolBlogId = Deno.env.get('METRICOOL_BLOG_ID');

    if (metricoolToken && metricoolUserId && metricoolBlogId) {
      for (const platform of BEST_TIMES_PLATFORMS) {
        try {
          const btUrl = new URL(`${METRICOOL_BASE_URL}/v2/scheduler/besttimes/${platform}`);
          btUrl.searchParams.set('userToken', metricoolToken);
          btUrl.searchParams.set('userId', metricoolUserId);
          btUrl.searchParams.set('blogId', metricoolBlogId);
          btUrl.searchParams.set('timezone', 'Australia/Sydney');

          const btResp = await fetch(btUrl.toString(), {
            headers: { 'X-Mc-Auth': metricoolToken },
          });
          if (btResp.ok) {
            const btData = await btResp.json();
            const slots = parseBestTimesResponse(btData);
            if (slots.length > 0) {
              bestTimesCache.set(platform, slots);
            }
          }
        } catch (e) {
          console.error(`Failed to fetch best times for ${platform}:`, e);
        }
      }
    }

    // ─── Step 6: Process each event (draft generation) ──────────────────────

    const allDraftSlots: DraftSlot[] = [];

    for (const event of events) {
      const eventName = event.name ?? event.title ?? 'Unnamed Event';
      const orgName = event.organization_id ? orgNameMap.get(event.organization_id) : undefined;

      // Match to brand
      const brand = matchEventToBrand(eventName, orgName);
      if (!brand) {
        results.errors.push(`No brand match for event: ${eventName}`);
        continue;
      }

      results.eventsProcessed++;

      // Build event data for strategy/templates
      const eventData: EventData = {
        id: event.id,
        name: eventName,
        event_date: event.event_date,
        start_time: event.start_time,
        venue: event.venue,
        ticket_url: event.ticket_url,
        hero_image_url: event.hero_image_url,
        banner_url: event.banner_url,
        description: event.description,
        organization_id: event.organization_id,
        organization_name: orgName,
        tickets_sold: event.tickets_sold,
        capacity: event.capacity,
      };

      // Generate posting windows
      const windows = getPostingWindows(eventData);

      // Resolve organization_id for drafts
      const draftOrgId = event.organization_id ?? '';

      for (const window of windows) {
        // For each platform and post type in this window
        for (const platform of window.platforms) {
          if (!brand.platforms.includes(platform)) continue;

          for (const postType of window.postTypes) {
            // Dedup check
            const dedupKey = `${event.id}|${window.label}|${platform}|${postType}`;
            if (existingDraftSet.has(dedupKey)) {
              results.draftsSkipped++;
              continue;
            }

            // Render caption
            const caption = renderCaption(window.label, eventData, brand, platform);

            // Select media (event banner as default)
            const mediaUrls: string[] = [];
            if (event.hero_image_url) mediaUrls.push(event.hero_image_url);
            else if (event.banner_url) mediaUrls.push(event.banner_url);

            allDraftSlots.push({
              eventId: event.id,
              eventName,
              windowLabel: window.label,
              platform,
              postType,
              priority: window.priority,
              targetDate: window.targetDate,
              caption,
              hashtags: brand.defaultHashtags.map((h) => h.replace('#', '')),
              mediaUrls,
              organizationId: draftOrgId,
            });
          }
        }
      }
    }

    // ─── Step 7: Optimize schedule ──────────────────────────────────────────

    // Fetch already-scheduled times for gap enforcement
    const { data: scheduledDrafts } = await supabase
      .from('social_content_drafts')
      .select('scheduled_for')
      .not('scheduled_for', 'is', null)
      .in('status', ['draft', 'approved', 'scheduled']);

    const existingTimes = (scheduledDrafts ?? [])
      .map((d) => d.scheduled_for ? new Date(d.scheduled_for) : null)
      .filter((d): d is Date => d !== null);

    const optimized = optimizeSchedule(allDraftSlots, bestTimesCache, existingTimes);

    // ─── Step 8: Bulk insert drafts ─────────────────────────────────────────

    if (optimized.length > 0) {
      const draftRows = optimized.map((slot) => ({
        organization_id: slot.organizationId || null,
        event_id: slot.eventId,
        window_label: slot.windowLabel,
        platform: slot.platform,
        post_type: slot.postType,
        caption: slot.caption,
        hashtags: slot.hashtags,
        media_urls: slot.mediaUrls.length > 0 ? slot.mediaUrls : null,
        scheduled_for: slot.scheduledFor.toISOString(),
        status: 'draft',
        ai_model: 'schedule-generator',
        ai_prompt_used: `Auto-generated: ${slot.windowLabel} for ${slot.eventName}`,
      }));

      // Insert in batches of 50
      const batchSize = 50;
      for (let i = 0; i < draftRows.length; i += batchSize) {
        const batch = draftRows.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('social_content_drafts')
          .insert(batch);

        if (insertError) {
          results.errors.push(`Batch insert failed at offset ${i}: ${insertError.message}`);
        } else {
          results.draftsCreated += batch.length;
        }
      }
    }

    return jsonResponse({
      ok: true,
      ...results,
      summary: `Processed ${results.eventsProcessed} events, created ${results.draftsCreated} drafts, skipped ${results.draftsSkipped} (already exist)`,
    });
  } catch (error) {
    console.error('Schedule generator error:', error);
    return jsonResponse({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Simple wrapper to call social-drive create-folder action.
 * Creates folder directly under root (no parent path resolution needed).
 */
async function callDriveCreateFolder(
  supabaseUrl: string,
  serviceRoleKey: string,
  folderName: string,
  folderPath?: string,
): Promise<void> {
  const body: Record<string, string> = { action: 'create-folder', folderName };
  if (folderPath) body.folderPath = folderPath;
  const resp = await fetch(`${supabaseUrl}/functions/v1/social-drive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive create-folder failed (${folderName}): ${text}`);
  }
}

/** Subfolders created inside each event folder */
const EVENT_SUBFOLDERS = ['Raw Content', 'Ready to Post', 'Posted', 'Show Footage', 'Lineup'];

/**
 * Create an event-specific folder under the brand with standard subfolders.
 * Structure: Brand / YYYY-MM-DD - Event Short Name / {Raw Content, Ready to Post, Posted, Show Footage, Lineup}
 */
async function createEventFolder(
  supabaseUrl: string,
  serviceRoleKey: string,
  event: EventData,
  driveBrand: string,
): Promise<void> {
  const eventDate = event.event_date.split('T')[0]; // YYYY-MM-DD
  const shortName = getEventShortName(event.name, event.event_date);
  const folderName = `${eventDate} - ${shortName}`;

  // Create the event folder directly under the brand
  await callDriveCreateFolder(supabaseUrl, serviceRoleKey, folderName, driveBrand);

  // Create subfolders inside the event folder (parallel — all independent)
  const eventFolderPath = `${driveBrand}/${folderName}`;
  await Promise.allSettled(
    EVENT_SUBFOLDERS.map((subfolder) =>
      callDriveCreateFolder(supabaseUrl, serviceRoleKey, subfolder, eventFolderPath)
        .catch((e) => console.error(`Failed to create subfolder ${subfolder} in ${eventFolderPath}:`, e)),
    ),
  );
}

/**
 * Create brand-level General folder with Reels and Feed Posts subfolders.
 * Idempotent — skips if already exists.
 */
async function createGeneralFolders(
  supabaseUrl: string,
  serviceRoleKey: string,
  driveBrand: string,
): Promise<void> {
  await callDriveCreateFolder(supabaseUrl, serviceRoleKey, 'General', driveBrand);
  for (const subfolder of ['Reels', 'Feed Posts']) {
    await callDriveCreateFolder(supabaseUrl, serviceRoleKey, subfolder, `${driveBrand}/General`);
  }
}

/**
 * Build a clean folder name from the event name, resolving day abbreviations
 * to the actual day of the week based on the event date.
 *
 * "ID Comedy Club - Fri/Sat"  (on 2026-02-27) → "ID Comedy Club - Friday"
 * "Magic Mic Comedy - Wednesdays" (on 2026-02-25) → "Magic Mic Comedy - Wednesday"
 * "Rory Lowe - Lowe Key Funny MICF26" → "Rory Lowe - Lowe Key Funny MICF26"
 */
function getEventShortName(name: string, eventDate: string): string {
  // Determine actual day of week from event date (dates are stored as local date)
  const datePart = eventDate.split('T')[0]!;
  const date = new Date(datePart + 'T12:00:00Z'); // noon UTC avoids timezone edge cases
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const actualDay = dayNames[date.getUTCDay()]!;

  let result = name;

  // Replace combined day abbreviation patterns (e.g. "Fri/Sat") with actual day name
  const dayAbbr = '(?:Mon(?:day)?|Tue(?:sday)?|Tues|Wed(?:nesday)?|Weds|Thu(?:rsday)?|Thurs?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)';
  const combinedDayRe = new RegExp(`\\b${dayAbbr}\\s*[/&-]\\s*${dayAbbr}\\b`, 'gi');
  result = result.replace(combinedDayRe, actualDay);

  // Expand remaining standalone day abbreviations/plurals to full day names
  result = result
    .replace(/\bFridays?\b|\bFri\b/gi, 'Friday')
    .replace(/\bSaturdays?\b|\bSat\b/gi, 'Saturday')
    .replace(/\bSundays?\b|\bSun\b/gi, 'Sunday')
    .replace(/\bMondays?\b|\bMon\b/gi, 'Monday')
    .replace(/\bTuesdays?\b|\bTues?\b/gi, 'Tuesday')
    .replace(/\bWednesdays?\b|\bWeds?\b/gi, 'Wednesday')
    .replace(/\bThursdays?\b|\bThurs?\b|\bThu\b/gi, 'Thursday');

  // Sanitize "/" to avoid path conflicts in Drive folder resolution
  result = result.replace(/\//g, '-');

  return result.trim();
}
