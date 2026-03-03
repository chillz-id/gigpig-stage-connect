/**
 * Content Scout Edge Function
 *
 * Checks which comedians need content (reels/images), registers discovered
 * content URLs, and triggers downloads to Google Drive.
 *
 * Actions:
 *   check-needs            — Who needs content? (single comedian or full event lineup)
 *   register-urls          — Save discovered content URLs (dedup via UNIQUE source_url)
 *   download-to-drive      — Download a registered item to Drive and link as asset
 *   check-already-posted   — Check if content was posted in lookback period
 *   create-spotlight-drafts — Create social drafts for comedian spotlights
 *   auto-spotlight          — Auto-create or cancel spotlight drafts on lineup change
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
  comedianId?: string;
  directoryProfileId?: string;
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

      // Check for existing draft with same comedian/directory profile + event + platform (dedup)
      let dedupQuery = supabase
        .from('social_content_drafts')
        .select('id')
        .eq('platform', platform)
        .eq('organization_id', event.organization_id)
        .ilike('caption', `%${item.comedianName}%`)
        .in('status', ['draft', 'pending', 'scheduled'])
        .limit(1);

      if (item.directoryProfileId) {
        dedupQuery = dedupQuery.eq('directory_profile_id', item.directoryProfileId);
      } else if (item.comedianId) {
        dedupQuery = dedupQuery.eq('comedian_id', item.comedianId);
      }

      const { data: existing } = await dedupQuery;

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
          event_id: body.eventId,
          organization_id: event.organization_id,
          comedian_id: item.comedianId ?? null,
          directory_profile_id: item.directoryProfileId ?? null,
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

// ─── auto-spotlight ──────────────────────────────────────────────────────────

interface AutoSpotlightResult {
  changeType: 'added' | 'removed';
  comedianId?: string;
  directoryProfileId?: string;
  eventId: string;
  draftsCreated?: number;
  draftsCreatedIds?: string[];
  cancelled?: number;
  needsDiscovery?: boolean;
  missingSocials?: boolean;
  skippedDuplicates?: number;
}

// Helper: extract Instagram handle from a URL
function extractInstagramHandle(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const match = url.match(/instagram\.com\/([^/?]+)/i);
  return match?.[1] ? `@${match[1]}` : undefined;
}

async function handleAutoSpotlight(
  supabase: ReturnType<typeof createClient>,
  body: { eventId: string; comedianId?: string; directoryProfileId?: string; changeType: 'added' | 'removed' },
): Promise<AutoSpotlightResult> {
  if (!body.eventId) throw new Error('eventId is required');
  if (!body.comedianId && !body.directoryProfileId) throw new Error('comedianId or directoryProfileId is required');
  if (!body.changeType) throw new Error('changeType is required');

  const result: AutoSpotlightResult = {
    changeType: body.changeType,
    comedianId: body.comedianId,
    directoryProfileId: body.directoryProfileId,
    eventId: body.eventId,
  };

  // ── Directory profile path ──────────────────────────────────────────────
  if (body.directoryProfileId) {
    if (body.changeType === 'removed') {
      const { data: cancelled, error: cancelErr } = await supabase
        .from('social_content_drafts')
        .update({ status: 'cancelled' })
        .eq('directory_profile_id', body.directoryProfileId)
        .eq('event_id', body.eventId)
        .in('status', ['draft', 'pending', 'scheduled'])
        .select('id');

      if (cancelErr) {
        console.warn(`Failed to cancel drafts for directory profile ${body.directoryProfileId}: ${cancelErr.message}`);
      }
      result.cancelled = cancelled?.length ?? 0;
      return result;
    }

    // changeType === 'added' — look up directory profile info
    const { data: dirProfile } = await supabase
      .from('directory_profiles')
      .select('id, stage_name, instagram_url')
      .eq('id', body.directoryProfileId)
      .single();

    if (!dirProfile) {
      throw new Error(`Directory profile not found: ${body.directoryProfileId}`);
    }

    const comedianHandle = extractInstagramHandle(dirProfile.instagram_url);
    if (!dirProfile.instagram_url) {
      result.missingSocials = true;
      return result;
    }

    // Directory profiles won't have content in comedian_content_library — skip that check
    // Create spotlight drafts directly
    const spotlightResult = await handleCreateSpotlightDrafts(supabase, {
      eventId: body.eventId,
      brand: 'iD Comedy Club',
      platforms: ['instagram', 'facebook', 'tiktok'],
      items: [
        {
          directoryProfileId: body.directoryProfileId,
          comedianName: dirProfile.stage_name ?? 'Unknown',
          comedianHandle,
        },
      ],
    });

    result.draftsCreated = spotlightResult.createdDraftIds.length;
    result.draftsCreatedIds = spotlightResult.createdDraftIds;
    result.skippedDuplicates = spotlightResult.skippedDuplicates;
    return result;
  }

  // ── Regular comedian (profiles) path ────────────────────────────────────
  if (body.changeType === 'removed') {
    // Cancel pending/draft spotlight posts for this comedian + event
    const { data: cancelled, error: cancelErr } = await supabase
      .from('social_content_drafts')
      .update({ status: 'cancelled' })
      .eq('comedian_id', body.comedianId!)
      .eq('event_id', body.eventId)
      .in('status', ['draft', 'pending', 'scheduled'])
      .select('id');

    if (cancelErr) {
      console.warn(`Failed to cancel drafts for comedian ${body.comedianId}: ${cancelErr.message}`);
    }

    result.cancelled = cancelled?.length ?? 0;
    return result;
  }

  // changeType === 'added' — check content library, then create drafts or flag for discovery
  const { data: contentItems, error: contentErr } = await supabase
    .from('comedian_content_library')
    .select('id, content_type, source_url, asset_id, status')
    .eq('comedian_id', body.comedianId!)
    .eq('status', 'available')
    .order('view_count', { ascending: false })
    .limit(5);

  if (contentErr) {
    console.warn(`Failed to check content library: ${contentErr.message}`);
  }

  if (!contentItems || contentItems.length === 0) {
    // No content available — check if they even have social URLs for discovery
    const { data: socialCheck } = await supabase
      .from('profiles')
      .select('instagram_url, tiktok_url')
      .eq('id', body.comedianId!)
      .single();

    const hasInstagram = !!socialCheck?.instagram_url;
    const hasTiktok = !!socialCheck?.tiktok_url;

    if (!hasInstagram && !hasTiktok) {
      // No social URLs — can't auto-discover, needs manual content addition
      result.missingSocials = true;
      return result;
    }

    // Has socials but no content yet — flag for discovery pipeline
    result.needsDiscovery = true;
    return result;
  }

  // Content exists — get comedian profile and create spotlight drafts
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, instagram_url')
    .eq('id', body.comedianId!)
    .single();

  if (!profile) {
    throw new Error(`Comedian profile not found: ${body.comedianId}`);
  }

  const comedianHandle = extractInstagramHandle(profile.instagram_url);

  // Pick the best content item (first available with asset_id, or just first)
  const bestContent = contentItems.find((c) => c.asset_id) ?? contentItems[0]!;

  // Delegate to create-spotlight-drafts for this single comedian
  const spotlightResult = await handleCreateSpotlightDrafts(supabase, {
    eventId: body.eventId,
    brand: 'iD Comedy Club', // Default brand
    platforms: ['instagram', 'facebook', 'tiktok'],
    items: [
      {
        comedianId: body.comedianId,
        comedianName: profile.display_name ?? 'Unknown',
        comedianHandle,
        contentId: bestContent.id,
        assetId: bestContent.asset_id ?? undefined,
      },
    ],
  });

  result.draftsCreated = spotlightResult.createdDraftIds.length;
  result.draftsCreatedIds = spotlightResult.createdDraftIds;
  result.skippedDuplicates = spotlightResult.skippedDuplicates;

  return result;
}

// ─── auto-spotlight-lineup ────────────────────────────────────────────────────

interface LineupSpotlightResult {
  eventId: string;
  totalPerformers: number;
  draftsCreated: number;
  needsDiscovery: { comedianId?: string; directoryProfileId?: string; name: string }[];
  missingSocials: { comedianId?: string; directoryProfileId?: string; name: string }[];
  results: AutoSpotlightResult[];
}

async function handleAutoSpotlightLineup(
  supabase: ReturnType<typeof createClient>,
  body: { eventId: string; brand?: string },
): Promise<LineupSpotlightResult> {
  if (!body.eventId) throw new Error('eventId is required');

  // Get all spots in the lineup — both comedian_id and directory_profile_id
  const { data: spots, error: spotsErr } = await supabase
    .from('event_spots')
    .select('comedian_id, directory_profile_id')
    .eq('event_id', body.eventId);

  if (spotsErr) throw new Error(`Failed to fetch lineup: ${spotsErr.message}`);

  // Deduplicate comedian IDs
  const comedianIds = [...new Set(
    (spots ?? []).map((s) => s.comedian_id as string).filter(Boolean),
  )];

  // Deduplicate directory profile IDs (exclude spots that already have a comedian_id)
  const directoryProfileIds = [...new Set(
    (spots ?? [])
      .filter((s) => s.directory_profile_id && !s.comedian_id)
      .map((s) => s.directory_profile_id as string),
  )];

  const result: LineupSpotlightResult = {
    eventId: body.eventId,
    totalPerformers: comedianIds.length + directoryProfileIds.length,
    draftsCreated: 0,
    needsDiscovery: [],
    missingSocials: [],
    results: [],
  };

  if (result.totalPerformers === 0) return result;

  // Process regular comedians (profiles)
  for (const comedianId of comedianIds) {
    try {
      const spotlight = await handleAutoSpotlight(supabase, {
        eventId: body.eventId,
        comedianId,
        changeType: 'added',
      });

      result.results.push(spotlight);
      result.draftsCreated += spotlight.draftsCreated ?? 0;

      if (spotlight.needsDiscovery || spotlight.missingSocials) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', comedianId)
          .single();

        const entry = {
          comedianId,
          name: profile?.display_name ?? 'Unknown',
        };

        if (spotlight.missingSocials) {
          result.missingSocials.push(entry);
        } else {
          result.needsDiscovery.push(entry);
        }
      }
    } catch (err) {
      console.warn(`auto-spotlight failed for comedian ${comedianId}:`, err);
    }
  }

  // Process directory profiles
  for (const directoryProfileId of directoryProfileIds) {
    try {
      const spotlight = await handleAutoSpotlight(supabase, {
        eventId: body.eventId,
        directoryProfileId,
        changeType: 'added',
      });

      result.results.push(spotlight);
      result.draftsCreated += spotlight.draftsCreated ?? 0;

      if (spotlight.missingSocials) {
        // Look up name for the notification
        const { data: dirProfile } = await supabase
          .from('directory_profiles')
          .select('stage_name')
          .eq('id', directoryProfileId)
          .single();

        result.missingSocials.push({
          directoryProfileId,
          name: dirProfile?.stage_name ?? 'Unknown',
        });
      }
    } catch (err) {
      console.warn(`auto-spotlight failed for directory profile ${directoryProfileId}:`, err);
    }
  }

  return result;
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

      case 'auto-spotlight': {
        const result = await handleAutoSpotlight(supabase, params);
        return jsonResponse({ ok: true, data: result });
      }

      case 'auto-spotlight-lineup': {
        const result = await handleAutoSpotlightLineup(supabase, params);
        return jsonResponse({ ok: true, data: result });
      }

      default:
        return jsonResponse(
          { error: `Unknown action: ${action}. Valid: check-needs, register-urls, download-to-drive, check-already-posted, create-spotlight-drafts, auto-spotlight, auto-spotlight-lineup` },
          400,
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('Content Scout error:', message);
    return jsonResponse({ ok: false, error: message });
  }
});
