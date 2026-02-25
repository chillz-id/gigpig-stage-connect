/**
 * Social Publisher Edge Function
 *
 * Pushes content to Metricool for scheduling/publishing on social platforms.
 * Bridges the gap between social_content_drafts → actual social media posts.
 *
 * IMPORTANT: All posts go to Metricool as DRAFTS by default.
 * The user must explicitly pass autoPublish:true to schedule auto-publishing.
 *
 * Actions:
 *   publish-draft     – Push a specific draft to Metricool by draft ID
 *   publish-approved  – Push all approved drafts in a time window (for cron)
 *   publish-file      – Push a Drive file directly to Metricool (manual/general content)
 *   list-brands       – List all Metricool brands/blogs on the account
 *   get-post          – Get a Metricool post by ID
 *   delete-post       – Delete a Metricool post by ID
 *   list-posts        – List scheduled posts from Metricool
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const METRICOOL_BASE_URL = 'https://app.metricool.com/api';

interface MetricoolCreds {
  token: string;
  userId: string;
  blogId: string;
}

// ─── Brand → Metricool Blog ID Mapping ──────────────────────────────────────
// Must stay in sync with social-schedule-generator/brand-config.ts

const BRAND_BLOG_IDS: Record<string, string> = {
  'iD Comedy Club': '4442774',
  'Rory Lowe': '4827835',
  'Magic Mic Comedy': '4442774', // Posts via iD Comedy Club accounts
};

/** Resolve a brand name to its Metricool blog ID */
function resolveBlogId(brand?: string, explicitBlogId?: string): string | null {
  if (explicitBlogId) return explicitBlogId;
  if (!brand) return null;
  // Case-insensitive lookup
  const lower = brand.toLowerCase();
  for (const [key, id] of Object.entries(BRAND_BLOG_IDS)) {
    if (key.toLowerCase() === lower) return id;
  }
  return null;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) return jsonResp({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, 500);

    // Auth: validate user JWT if present, allow through for service_role / cron
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      try {
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) console.log(`Publisher invoked by user: ${user.id}`);
      } catch { /* service_role / cron — fine */ }
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Metricool credentials (token + userId are account-level, blogId is per-brand)
    const token = Deno.env.get('METRICOOL_USER_TOKEN');
    const mcUserId = Deno.env.get('METRICOOL_USER_ID');
    const defaultBlogId = Deno.env.get('METRICOOL_BLOG_ID');
    if (!token || !mcUserId) {
      return jsonResp({ error: 'Metricool not configured. Set METRICOOL_USER_TOKEN and METRICOOL_USER_ID.' }, 500);
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      // ── Publish a specific draft by ID ───────────────────────────────
      case 'publish-draft': {
        const { draftId, force, brand, blogId: reqBlogId, autoPublish } = body;
        if (!draftId) return jsonResp({ error: 'draftId required' }, 400);

        const { data: draft, error: draftErr } = await supabase
          .from('social_content_drafts')
          .select('*')
          .eq('id', draftId)
          .single();

        if (draftErr || !draft) {
          return jsonResp({ error: `Draft not found: ${draftId}` }, 404);
        }
        if (!force && draft.status !== 'approved') {
          return jsonResp({
            error: `Draft status is '${draft.status}', expected 'approved'. Pass force:true to override.`,
          }, 400);
        }
        if (draft.metricool_post_id) {
          return jsonResp({
            error: `Draft already published to Metricool (post ID: ${draft.metricool_post_id})`,
          }, 400);
        }

        // Resolve blog ID: explicit > brand param > default env
        const blogId = resolveBlogId(brand, reqBlogId) ?? defaultBlogId;
        if (!blogId) {
          return jsonResp({ error: 'Could not resolve Metricool blogId. Pass brand or blogId.' }, 400);
        }
        const creds: MetricoolCreds = { token, userId: mcUserId, blogId };

        const result = await publishDraftToMetricool(
          supabase, supabaseUrl, serviceKey, draft, creds, autoPublish === true,
        );
        return jsonResp(result);
      }

      // ── Publish all approved drafts in upcoming window (cron) ────────
      case 'publish-approved': {
        const windowMinutes = body.windowMinutes ?? 120;
        const now = new Date();
        const windowEnd = new Date(now.getTime() + windowMinutes * 60_000);

        const { data: drafts, error: queryErr } = await supabase
          .from('social_content_drafts')
          .select('*')
          .eq('status', 'approved')
          .not('scheduled_for', 'is', null)
          .gte('scheduled_for', now.toISOString())
          .lte('scheduled_for', windowEnd.toISOString())
          .order('scheduled_for', { ascending: true });

        if (queryErr) {
          return jsonResp({ error: `Query failed: ${queryErr.message}` }, 500);
        }

        if (!drafts || drafts.length === 0) {
          return jsonResp({ ok: true, message: 'No approved drafts in window', published: 0 });
        }

        const results = { published: 0, failed: 0, errors: [] as string[] };

        for (const draft of drafts) {
          try {
            // For cron, we auto-publish approved drafts (they were already reviewed)
            const blogId = defaultBlogId ?? Object.values(BRAND_BLOG_IDS)[0];
            if (!blogId) {
              results.failed++;
              results.errors.push(`${draft.id}: No blogId configured`);
              continue;
            }
            const creds: MetricoolCreds = { token, userId: mcUserId, blogId };
            const res = await publishDraftToMetricool(
              supabase, supabaseUrl, serviceKey, draft, creds, true,
            );
            if (res.ok) {
              results.published++;
            } else {
              results.failed++;
              results.errors.push(`${draft.id}: ${res.error}`);
            }
          } catch (e) {
            results.failed++;
            results.errors.push(`${draft.id}: ${e instanceof Error ? e.message : 'unknown'}`);
          }
        }

        return jsonResp({ ok: true, ...results });
      }

      // ── Publish a Drive file directly (manual / general content) ─────
      case 'publish-file': {
        const {
          fileId, platform, caption, scheduledFor, postType,
          brand, blogId: reqBlogId, autoPublish,
        } = body;

        if (!fileId || !platform || !caption) {
          return jsonResp({ error: 'fileId, platform, and caption required' }, 400);
        }

        // Resolve blog ID — brand is required for file publishing
        const blogId = resolveBlogId(brand, reqBlogId) ?? defaultBlogId;
        if (!blogId) {
          return jsonResp({
            error: `Could not resolve Metricool blogId. Pass brand (${Object.keys(BRAND_BLOG_IDS).join(', ')}) or explicit blogId.`,
          }, 400);
        }
        const creds: MetricoolCreds = { token, userId: mcUserId, blogId };

        const result = await publishFileToMetricool(supabaseUrl, serviceKey, {
          fileId,
          platform,
          caption,
          scheduledFor,
          postType: postType ?? 'reel',
          asDraft: autoPublish !== true, // Default: Metricool draft unless autoPublish=true
        }, creds);
        return jsonResp(result);
      }

      // ── List all Metricool brands/blogs on the account ─────────────
      case 'list-brands': {
        const blogId = defaultBlogId ?? Object.values(BRAND_BLOG_IDS)[0] ?? '';
        const creds: MetricoolCreds = { token, userId: mcUserId, blogId };
        return jsonResp(await metricoolGet('/v2/settings/brands', creds));
      }

      // ── Get a Metricool post by ID ──────────────────────────────────
      case 'get-post': {
        const { postId, brand, blogId: reqBlogId } = body;
        if (!postId) return jsonResp({ error: 'postId required' }, 400);
        const blogId = resolveBlogId(brand, reqBlogId) ?? defaultBlogId ?? '';
        const creds: MetricoolCreds = { token, userId: mcUserId, blogId };
        return jsonResp(await metricoolGet(`/v2/scheduler/posts/${postId}`, creds));
      }

      // ── Delete a Metricool post by ID ─────────────────────────────────
      case 'delete-post': {
        const { postId, brand, blogId: reqBlogId } = body;
        if (!postId) return jsonResp({ error: 'postId required' }, 400);
        const blogId = resolveBlogId(brand, reqBlogId) ?? defaultBlogId ?? '';
        const creds: MetricoolCreds = { token, userId: mcUserId, blogId };
        return jsonResp(await metricoolDelete(`/v2/scheduler/posts/${postId}`, creds));
      }

      // ── List scheduled posts from Metricool ───────────────────────────
      case 'list-posts': {
        const { brand, blogId: reqBlogId } = body;
        const blogId = resolveBlogId(brand, reqBlogId) ?? defaultBlogId ?? '';
        const creds: MetricoolCreds = { token, userId: mcUserId, blogId };
        return jsonResp(await metricoolGet('/v2/scheduler/posts', creds));
      }

      // ── Generic Metricool API proxy (for analytics, etc.) ──────────
      case 'metricool-get': {
        const { endpoint, brand, blogId: reqBlogId, queryParams } = body;
        if (!endpoint) return jsonResp({ error: 'endpoint required' }, 400);
        const blogId = resolveBlogId(brand, reqBlogId) ?? defaultBlogId ?? '';
        const creds: MetricoolCreds = { token, userId: mcUserId, blogId };
        const url = new URL(`${METRICOOL_BASE_URL}${endpoint}`);
        url.searchParams.set('userToken', creds.token);
        url.searchParams.set('userId', creds.userId);
        url.searchParams.set('blogId', creds.blogId);
        if (queryParams && typeof queryParams === 'object') {
          for (const [k, v] of Object.entries(queryParams as Record<string, string>)) {
            url.searchParams.set(k, v);
          }
        }
        const resp = await fetch(url.toString(), {
          headers: { 'X-Mc-Auth': creds.token },
        });
        const text = await resp.text();
        try {
          return jsonResp({ ok: resp.ok, data: JSON.parse(text) });
        } catch {
          return jsonResp({ ok: resp.ok, data: { raw: text } });
        }
      }

      default:
        return jsonResp({
          error: `Unknown action: ${action}`,
          availableActions: [
            'publish-draft', 'publish-approved', 'publish-file',
            'list-brands', 'get-post', 'delete-post', 'list-posts',
            'metricool-get',
          ],
        }, 400);
    }
  } catch (error) {
    console.error('Publisher error:', error);
    return jsonResp({
      error: 'Internal error',
      details: error instanceof Error ? error.message : 'Unknown',
    }, 500);
  }
});

// ─── Core Publish Logic ──────────────────────────────────────────────────────

/**
 * Push a draft from social_content_drafts to Metricool.
 * Updates the draft status on success.
 */
async function publishDraftToMetricool(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceKey: string,
  draft: Record<string, unknown>,
  creds: MetricoolCreds,
  autoPublish: boolean,
): Promise<Record<string, unknown>> {
  // Collect media URLs — event banners are already public HTTP URLs
  const mediaUrls: string[] = [];

  if (Array.isArray(draft.media_urls)) {
    for (const url of draft.media_urls) {
      if (typeof url === 'string') mediaUrls.push(url);
    }
  }

  // Share Drive files if media_file_ids are present
  if (Array.isArray(draft.media_file_ids)) {
    for (const fileId of draft.media_file_ids) {
      try {
        const url = await shareDriveFile(supabaseUrl, serviceKey, String(fileId));
        mediaUrls.push(url);
      } catch (e) {
        console.error(`Failed to share Drive file ${fileId}:`, e);
      }
    }
  }

  const scheduledFor = (draft.scheduled_for as string)
    ?? new Date(Date.now() + 60 * 60_000).toISOString(); // default 1h from now

  const mcPost = buildMetricoolPost({
    caption: draft.caption as string,
    platform: draft.platform as string,
    postType: (draft.post_type as string) ?? 'post',
    scheduledFor,
    mediaUrls,
    asDraft: !autoPublish,
  });

  const mcResult = await callMetricoolCreate(mcPost, creds);
  const mcPostId = extractPostId(mcResult);

  // Update draft status
  const newStatus = autoPublish ? 'scheduled' : 'draft'; // keep 'draft' if it's a Metricool draft
  await supabase
    .from('social_content_drafts')
    .update({
      status: newStatus,
      metricool_post_id: mcPostId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', draft.id);

  return {
    ok: true,
    draftId: draft.id,
    metricoolPostId: mcPostId,
    metricoolDraft: !autoPublish,
    platform: draft.platform,
    scheduledFor,
    metricoolResponse: mcResult,
  };
}

/**
 * Publish a Drive file directly to Metricool.
 * For general content like reels in the General/ folder.
 */
async function publishFileToMetricool(
  supabaseUrl: string,
  serviceKey: string,
  params: {
    fileId: string;
    platform: string;
    caption: string;
    scheduledFor?: string;
    postType: string;
    asDraft: boolean;
  },
  creds: MetricoolCreds,
): Promise<Record<string, unknown>> {
  // Share the Drive file to get a public download URL
  const downloadUrl = await shareDriveFile(supabaseUrl, serviceKey, params.fileId);

  // Default: schedule 1 hour from now
  const scheduledFor = params.scheduledFor
    ?? new Date(Date.now() + 60 * 60_000).toISOString();

  const mcPost = buildMetricoolPost({
    caption: params.caption,
    platform: params.platform,
    postType: params.postType,
    scheduledFor,
    mediaUrls: [downloadUrl],
    asDraft: params.asDraft,
  });

  const mcResult = await callMetricoolCreate(mcPost, creds);
  const mcPostId = extractPostId(mcResult);

  return {
    ok: true,
    metricoolPostId: mcPostId,
    metricoolDraft: params.asDraft,
    platform: params.platform,
    scheduledFor,
    mediaUrl: downloadUrl,
    metricoolResponse: mcResult,
  };
}

// ─── Drive Integration ───────────────────────────────────────────────────────

async function shareDriveFile(
  supabaseUrl: string,
  serviceKey: string,
  fileId: string,
): Promise<string> {
  const resp = await fetch(`${supabaseUrl}/functions/v1/social-drive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ action: 'share', fileId }),
  });

  const data = await resp.json();
  if (!data.ok) {
    throw new Error(`Drive share failed: ${data.error ?? JSON.stringify(data)}`);
  }

  // Prefer webContentLink (direct download), fall back to constructed URL
  return data.data?.url ?? `https://drive.google.com/uc?id=${fileId}&export=download`;
}

// ─── Metricool API ───────────────────────────────────────────────────────────

function buildMetricoolPost(params: {
  caption: string;
  platform: string;
  postType: string;
  scheduledFor: string;
  mediaUrls: string[];
  asDraft: boolean;
}): Record<string, unknown> {
  const { caption, platform, postType, scheduledFor, mediaUrls, asDraft } = params;

  const post: Record<string, unknown> = {
    text: caption,
    publicationDate: {
      dateTime: toSydneyLocal(scheduledFor),
      timezone: 'Australia/Sydney',
    },
    providers: [{ network: platform }],
    autoPublish: !asDraft,
    draft: asDraft,
  };

  if (mediaUrls.length > 0) {
    post.media = mediaUrls;
    post.saveExternalMediaFiles = true;
  }

  // Platform-specific settings
  if (platform === 'tiktok') {
    post.tiktokData = {
      privacyOption: 'PUBLIC_TO_EVERYONE',
      disableComment: false,
      disableDuet: false,
      disableStitch: false,
      autoAddMusic: false,
    };
  }

  if (platform === 'instagram') {
    if (postType === 'reel') {
      post.instagramData = { type: 'REEL', showReelOnFeed: true };
    } else if (postType === 'story') {
      post.instagramData = { type: 'STORY' };
    }
  }

  return post;
}

async function callMetricoolCreate(
  postData: Record<string, unknown>,
  creds: MetricoolCreds,
): Promise<unknown> {
  const url = new URL(`${METRICOOL_BASE_URL}/v2/scheduler/posts`);
  url.searchParams.set('userToken', creds.token);
  url.searchParams.set('userId', creds.userId);
  url.searchParams.set('blogId', creds.blogId);

  console.log('Metricool POST payload:', JSON.stringify(postData, null, 2));

  const resp = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Mc-Auth': creds.token,
    },
    body: JSON.stringify(postData),
  });

  const text = await resp.text();
  console.log(`Metricool response (${resp.status}):`, text);

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!resp.ok) {
    throw new Error(`Metricool API error (${resp.status}): ${text}`);
  }

  return data;
}

/** Generic Metricool GET helper */
async function metricoolGet(
  endpoint: string,
  creds: MetricoolCreds,
): Promise<Record<string, unknown>> {
  const url = new URL(`${METRICOOL_BASE_URL}${endpoint}`);
  url.searchParams.set('userToken', creds.token);
  url.searchParams.set('userId', creds.userId);
  url.searchParams.set('blogId', creds.blogId);
  const resp = await fetch(url.toString(), {
    headers: { 'X-Mc-Auth': creds.token },
  });
  const text = await resp.text();
  try {
    return { ok: resp.ok, data: JSON.parse(text) };
  } catch {
    return { ok: resp.ok, data: { raw: text } };
  }
}

/** Generic Metricool DELETE helper */
async function metricoolDelete(
  endpoint: string,
  creds: MetricoolCreds,
): Promise<Record<string, unknown>> {
  const url = new URL(`${METRICOOL_BASE_URL}${endpoint}`);
  url.searchParams.set('userToken', creds.token);
  url.searchParams.set('userId', creds.userId);
  url.searchParams.set('blogId', creds.blogId);
  const resp = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { 'X-Mc-Auth': creds.token },
  });
  const text = await resp.text();
  try {
    return { ok: resp.ok, data: JSON.parse(text) };
  } catch {
    return { ok: resp.ok, data: { raw: text } };
  }
}

function extractPostId(mcResult: unknown): number | null {
  if (!mcResult || typeof mcResult !== 'object') return null;
  const obj = mcResult as Record<string, unknown>;
  if (typeof obj.id === 'number') return obj.id;
  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (typeof data.id === 'number') return data.id;
  }
  return null;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function toSydneyLocal(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('sv-SE', { timeZone: 'Australia/Sydney' }).replace(' ', 'T');
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
