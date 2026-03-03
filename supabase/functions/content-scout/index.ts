/**
 * Content Scout Edge Function
 *
 * Checks which comedians need content (reels/images), registers discovered
 * content URLs, and triggers downloads to Google Drive.
 *
 * Actions:
 *   check-needs    — Who needs content? (single comedian or full event lineup)
 *   register-urls  — Save discovered content URLs (dedup via UNIQUE source_url)
 *   download-to-drive — Download a registered item to Drive and link as asset
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── check-needs ────────────────────────────────────────────────────────────

interface ContentNeed {
  comedianId: string;
  name: string;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  needsReels: boolean;
  needsImages: boolean;
  currentReels: number;
  currentImages: number;
}

async function handleCheckNeeds(
  supabase: ReturnType<typeof createClient>,
  body: { comedianId?: string; eventId?: string },
): Promise<ContentNeed[]> {
  let comedianIds: string[] = [];

  if (body.eventId) {
    // Get all comedians in the event lineup
    const { data: spots, error: spotsErr } = await supabase
      .from('event_spots')
      .select('comedian_id')
      .eq('event_id', body.eventId)
      .not('comedian_id', 'is', null);

    if (spotsErr) throw new Error(`Failed to fetch event spots: ${spotsErr.message}`);
    comedianIds = (spots ?? [])
      .map((s) => s.comedian_id as string)
      .filter(Boolean);
  } else if (body.comedianId) {
    comedianIds = [body.comedianId];
  } else {
    throw new Error('Either comedianId or eventId is required');
  }

  if (comedianIds.length === 0) {
    return [];
  }

  const results: ContentNeed[] = [];

  for (const comedianId of comedianIds) {
    // Get comedian profile info (name, social URLs)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, instagram_url, tiktok_url')
      .eq('id', comedianId)
      .single();

    if (!profile) continue;

    // Check content threshold via RPC
    const { data: needs, error: needsErr } = await supabase.rpc(
      'check_comedian_content_needs',
      { p_comedian_id: comedianId },
    );

    if (needsErr) {
      console.warn(`RPC failed for ${comedianId}: ${needsErr.message}`);
      continue;
    }

    const n = needs as {
      reels: number;
      images: number;
      needs_reels: boolean;
      needs_images: boolean;
    };

    results.push({
      comedianId,
      name: profile.display_name ?? 'Unknown',
      instagramUrl: profile.instagram_url ?? null,
      tiktokUrl: profile.tiktok_url ?? null,
      needsReels: n.needs_reels,
      needsImages: n.needs_images,
      currentReels: n.reels,
      currentImages: n.images,
    });
  }

  return results;
}

// ─── register-urls ──────────────────────────────────────────────────────────

interface RegisterItem {
  sourceUrl: string;
  sourcePlatform: string;
  contentType: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  thumbnailUrl?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
}

async function handleRegisterUrls(
  supabase: ReturnType<typeof createClient>,
  body: { comedianId: string; items: RegisterItem[] },
): Promise<{ registered: number; duplicatesSkipped: number }> {
  if (!body.comedianId) throw new Error('comedianId is required');
  if (!body.items?.length) throw new Error('items array is required');

  let registered = 0;
  let duplicatesSkipped = 0;

  for (const item of body.items) {
    // Check if URL already exists (dedup)
    const { data: existing } = await supabase
      .from('comedian_content_library')
      .select('id')
      .eq('source_url', item.sourceUrl)
      .maybeSingle();

    if (existing) {
      duplicatesSkipped++;
      continue;
    }

    const { error } = await supabase
      .from('comedian_content_library')
      .insert({
        comedian_id: body.comedianId,
        source_platform: item.sourcePlatform,
        source_url: item.sourceUrl,
        content_type: item.contentType,
        published_at: item.publishedAt ?? null,
        view_count: item.viewCount ?? null,
        like_count: item.likeCount ?? null,
        thumbnail_url: item.thumbnailUrl ?? null,
        duration_seconds: item.durationSeconds ?? null,
        width: item.width ?? null,
        height: item.height ?? null,
        status: 'discovered',
      });

    if (error) {
      console.warn(`Failed to register ${item.sourceUrl}: ${error.message}`);
    } else {
      registered++;
    }
  }

  return { registered, duplicatesSkipped };
}

// ─── download-to-drive ──────────────────────────────────────────────────────

async function handleDownloadToDrive(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceKey: string,
  body: { contentId: string; eventId?: string; brand?: string },
): Promise<{ success: boolean; driveFileId?: string; assetId?: string; error?: string }> {
  if (!body.contentId) throw new Error('contentId is required');

  // 1. Look up the content item
  const { data: item, error: itemErr } = await supabase
    .from('comedian_content_library')
    .select('*, profiles!comedian_id(display_name)')
    .eq('id', body.contentId)
    .single();

  if (itemErr || !item) {
    throw new Error(`Content item not found: ${body.contentId}`);
  }

  // 2. Mark as downloading
  await supabase
    .from('comedian_content_library')
    .update({ status: 'downloading' })
    .eq('id', body.contentId);

  try {
    // 3. Determine target Drive folder
    let folderPath: string;
    if (body.eventId) {
      // Try to find the event folder
      const { data: event } = await supabase
        .from('events')
        .select('title, name, event_date')
        .eq('id', body.eventId)
        .single();

      if (event) {
        const eventName = event.title ?? event.name ?? 'Event';
        const eventDate = event.event_date ?? new Date().toISOString().split('T')[0];
        const brandName = body.brand ?? 'iD Comedy Club';
        folderPath = `${brandName}/${eventDate} - ${eventName}/Ready to Post`;
      } else {
        folderPath = `${body.brand ?? 'iD Comedy Club'}/General/Reels`;
      }
    } else {
      folderPath = `${body.brand ?? 'iD Comedy Club'}/General/Reels`;
    }

    // 4. Ensure folder exists (create-folder handles idempotent creation)
    const parts = folderPath.split('/');
    const folderName = parts.pop()!;
    const parentPath = parts.join('/');

    const folderResp = await fetch(`${supabaseUrl}/functions/v1/social-drive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        action: 'create-folder',
        folderName,
        folderPath: parentPath || undefined,
      }),
    });

    if (!folderResp.ok) {
      throw new Error(`Failed to create/resolve Drive folder: ${await folderResp.text()}`);
    }

    const folderData = await folderResp.json();
    const targetFolderId = folderData.data?.folderId;

    if (!targetFolderId) {
      throw new Error('Could not resolve target Drive folder ID');
    }

    // 5. Note: Actual file download + upload to Drive is handled by the
    //    /content-scout skill (yt-dlp local download → Drive upload).
    //    This Edge Function prepares the metadata and folder structure.
    //    The skill will call back with the drive_file_id once uploaded.

    // 6. Update status — the skill will finalize with drive_file_id
    await supabase
      .from('comedian_content_library')
      .update({
        status: 'downloading',
        event_id: body.eventId ?? null,
      })
      .eq('id', body.contentId);

    return {
      success: true,
      driveFileId: undefined, // Set by skill after yt-dlp + upload
    };
  } catch (err) {
    // Mark as failed
    await supabase
      .from('comedian_content_library')
      .update({
        status: 'failed',
        notes: err instanceof Error ? err.message : 'Unknown error',
      })
      .eq('id', body.contentId);

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── check-already-posted ────────────────────────────────────────────────────

async function handleCheckAlreadyPosted(
  supabase: ReturnType<typeof createClient>,
  body: { sourceUrls: string[]; lookbackDays?: number },
): Promise<{ sourceUrl: string; recentlyPosted: boolean }[]> {
  if (!body.sourceUrls?.length) throw new Error('sourceUrls array is required');

  const lookback = body.lookbackDays ?? 90;
  const results: { sourceUrl: string; recentlyPosted: boolean }[] = [];

  for (const url of body.sourceUrls) {
    const { data, error } = await supabase.rpc('check_content_recently_posted', {
      p_source_url: url,
      p_lookback_days: lookback,
    });

    if (error) {
      console.warn(`RPC failed for ${url}: ${error.message}`);
      // Assume not posted if check fails
      results.push({ sourceUrl: url, recentlyPosted: false });
    } else {
      results.push({ sourceUrl: url, recentlyPosted: data as boolean });
    }
  }

  return results;
}

// ─── create-spotlight-drafts ─────────────────────────────────────────────────

interface SpotlightItem {
  comedianId: string;
  comedianName: string;
  comedianHandle?: string;
  contentId?: string;
  assetId?: string;
}

async function handleCreateSpotlightDrafts(
  supabase: ReturnType<typeof createClient>,
  body: {
    eventId: string;
    brand: string;
    platforms?: string[];
    items: SpotlightItem[];
  },
): Promise<{ createdDraftIds: string[]; skippedDuplicates: number }> {
  if (!body.eventId) throw new Error('eventId is required');
  if (!body.items?.length) throw new Error('items array is required');

  // Fetch event details for template rendering
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('id, title, name, event_date, start_time, venue, ticket_url, hero_image_url, organization_id')
    .eq('id', body.eventId)
    .single();

  if (eventErr || !event) throw new Error(`Event not found: ${body.eventId}`);

  const eventName = event.title ?? event.name ?? 'Show';
  const platforms = body.platforms ?? ['instagram', 'facebook', 'tiktok'];
  const eventDate = new Date(event.event_date);

  // Spread target dates across the lead-up to the event
  // Each comedian gets a different day, starting from 10 days before the event
  const createdDraftIds: string[] = [];
  let skippedDuplicates = 0;

  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i]!;
    // Spread: comedian 0 = 10 days before, comedian 1 = 9 days before, etc.
    // Minimum 1 day before the event
    const daysBeforeEvent = Math.max(1, 10 - i);
    const targetDate = new Date(eventDate);
    targetDate.setDate(targetDate.getDate() - daysBeforeEvent);

    // Skip if target date is in the past
    if (targetDate <= new Date()) {
      targetDate.setTime(new Date().getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    }

    for (const platform of platforms) {
      const windowLabel = `Comedian Spotlight: ${item.comedianName}`;

      // Check for existing draft with same window label + event + platform (dedup)
      const { data: existing } = await supabase
        .from('social_content_drafts')
        .select('id')
        .eq('platform', platform)
        .eq('comedian_id', item.comedianId)
        .eq('organization_id', event.organization_id)
        .ilike('caption', `%${item.comedianName}%`)
        .in('status', ['draft', 'pending', 'scheduled'])
        .limit(1);

      if (existing && existing.length > 0) {
        skippedDuplicates++;
        continue;
      }

      // Look up media from comedian_content_library if contentId provided
      const mediaUrls: string[] = [];
      let mediaFileIds: string[] = [];
      let mediaType: string | null = null;

      if (item.assetId) {
        const { data: asset } = await supabase
          .from('social_media_assets')
          .select('drive_file_id, file_type, mime_type')
          .eq('id', item.assetId)
          .single();

        if (asset) {
          mediaFileIds = [asset.drive_file_id];
          mediaType = asset.file_type === 'video' ? 'video' : 'image';
        }
      }

      // Build a simple caption (template rendering happens in the skill for voice refinement)
      const caption = `🔥 Check out ${item.comedianName}${item.comedianHandle ? ` (${item.comedianHandle})` : ''} — performing at ${eventName}!\n\n📅 ${eventDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}\n📍 ${event.venue ?? 'Venue TBA'}\n\nGrab your tickets and see them live 👇\n🎟️ ${event.ticket_url ?? ''}\n\n#StandUpSydney #SydneyComedy`;

      const { data: draft, error: insertErr } = await supabase
        .from('social_content_drafts')
        .insert({
          platform,
          post_type: mediaType === 'video' ? 'reel' : 'post',
          caption,
          hashtags: ['#StandUpSydney', '#SydneyComedy'],
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          media_file_ids: mediaFileIds.length > 0 ? mediaFileIds : null,
          media_type: mediaType,
          organization_id: event.organization_id,
          comedian_id: item.comedianId,
          scheduled_for: targetDate.toISOString(),
          status: 'draft',
        })
        .select('id')
        .single();

      if (insertErr) {
        console.warn(`Failed to create spotlight draft for ${item.comedianName} on ${platform}: ${insertErr.message}`);
      } else if (draft) {
        createdDraftIds.push(draft.id);
      }
    }
  }

  return { createdDraftIds, skippedDuplicates };
}

// ─── Main Handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service_role client for DB operations
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case 'check-needs': {
        const needs = await handleCheckNeeds(supabase, params);
        return jsonResponse({ ok: true, data: needs });
      }

      case 'register-urls': {
        const result = await handleRegisterUrls(supabase, params);
        return jsonResponse({ ok: true, data: result });
      }

      case 'download-to-drive': {
        const result = await handleDownloadToDrive(supabase, supabaseUrl, serviceKey, params);
        return jsonResponse({ ok: true, data: result });
      }

      case 'check-already-posted': {
        const result = await handleCheckAlreadyPosted(supabase, params);
        return jsonResponse({ ok: true, data: result });
      }

      case 'create-spotlight-drafts': {
        const result = await handleCreateSpotlightDrafts(supabase, params);
        return jsonResponse({ ok: true, data: result });
      }

      default:
        return jsonResponse(
          { error: `Unknown action: ${action}. Valid: check-needs, register-urls, download-to-drive, check-already-posted, create-spotlight-drafts` },
          400,
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('Content Scout error:', message);
    return jsonResponse({ ok: false, error: message });
  }
});
