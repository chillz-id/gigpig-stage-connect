/**
 * Social Analytics Sync Edge Function
 *
 * Cron job that pulls post performance from Metricool analytics
 * and stores it in social_content_performance for the optimization loop.
 *
 * Run daily via Supabase cron or external scheduler:
 *   POST /functions/v1/social-analytics-sync
 *
 * Requires service role key (no user auth needed for cron).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const METRICOOL_BASE_URL = 'https://app.metricool.com/api';

const ANALYTICS_ENDPOINTS: Record<string, string> = {
  instagram: '/v2/analytics/instagram/posts',
  facebook: '/v2/analytics/facebook/posts',
  tiktok: '/v2/analytics/tiktok/posts',
  twitter: '/v2/analytics/twitter/posts',
  linkedin: '/v2/analytics/linkedin/posts',
  bluesky: '/v2/analytics/bluesky/posts',
  threads: '/v2/analytics/threads/posts',
};

interface MetricoolAnalyticsPost {
  id?: number;
  text?: string;
  date?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  saves?: number;
  engagementRate?: number;
  [key: string]: unknown;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Metricool credentials
    const userToken = Deno.env.get('METRICOOL_USER_TOKEN');
    const userId = Deno.env.get('METRICOOL_USER_ID');
    const blogId = Deno.env.get('METRICOOL_BLOG_ID');

    if (!userToken || !userId || !blogId) {
      return new Response(
        JSON.stringify({ error: 'Metricool credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Date range: last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = thirtyDaysAgo.toISOString().slice(0, 19);
    const end = now.toISOString().slice(0, 19);

    // Fetch all drafts that have been published (have metricool_post_id)
    const { data: publishedDrafts, error: draftsError } = await supabase
      .from('social_content_drafts')
      .select('id, platform, metricool_post_id')
      .not('metricool_post_id', 'is', null)
      .in('status', ['scheduled', 'published']);

    if (draftsError) {
      console.error('Error fetching published drafts:', draftsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch published drafts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!publishedDrafts || publishedDrafts.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: 'No published drafts to sync', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build a lookup: metricool_post_id → draft_id, platform
    const draftLookup = new Map<number, { draftId: string; platform: string }>();
    for (const draft of publishedDrafts) {
      if (draft.metricool_post_id) {
        draftLookup.set(draft.metricool_post_id as number, {
          draftId: draft.id as string,
          platform: draft.platform as string,
        });
      }
    }

    // Get unique platforms that have published drafts
    const platforms = [...new Set(publishedDrafts.map((d) => d.platform as string))];

    let totalSynced = 0;
    const errors: string[] = [];

    // Fetch analytics per platform
    for (const platform of platforms) {
      const endpoint = ANALYTICS_ENDPOINTS[platform];
      if (!endpoint) continue;

      try {
        const url = new URL(`${METRICOOL_BASE_URL}${endpoint}`);
        url.searchParams.set('userToken', userToken);
        url.searchParams.set('userId', userId);
        url.searchParams.set('blogId', blogId);
        url.searchParams.set('start', start);
        url.searchParams.set('end', end);
        url.searchParams.set('timezone', 'Australia/Sydney');

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Mc-Auth': userToken,
          },
        });

        if (!response.ok) {
          errors.push(`${platform}: HTTP ${response.status}`);
          continue;
        }

        const analyticsData = await response.json() as MetricoolAnalyticsPost[];
        if (!Array.isArray(analyticsData)) continue;

        // Match analytics to our drafts and upsert performance data
        for (const post of analyticsData) {
          if (!post.id) continue;

          const draftInfo = draftLookup.get(post.id);
          if (!draftInfo) continue; // Not one of our tracked posts

          const likes = post.likes ?? 0;
          const comments = post.comments ?? 0;
          const shares = post.shares ?? 0;
          const engagement = likes + comments + shares;
          const impressions = post.impressions ?? 0;
          const engagementRate = impressions > 0
            ? parseFloat(((engagement / impressions) * 100).toFixed(4))
            : 0;

          // Upsert performance record
          const { error: upsertError } = await supabase
            .from('social_content_performance')
            .upsert(
              {
                draft_id: draftInfo.draftId,
                platform: draftInfo.platform,
                impressions,
                reach: post.reach ?? 0,
                engagement,
                likes,
                comments,
                shares,
                clicks: post.clicks ?? 0,
                saves: post.saves ?? 0,
                engagement_rate: engagementRate,
                collected_at: new Date().toISOString(),
                raw_data: post,
              },
              { onConflict: 'draft_id' },
            );

          if (upsertError) {
            // draft_id might not have unique constraint — insert instead
            const { error: insertError } = await supabase
              .from('social_content_performance')
              .insert({
                draft_id: draftInfo.draftId,
                platform: draftInfo.platform,
                impressions,
                reach: post.reach ?? 0,
                engagement,
                likes,
                comments,
                shares,
                clicks: post.clicks ?? 0,
                saves: post.saves ?? 0,
                engagement_rate: engagementRate,
                collected_at: new Date().toISOString(),
                raw_data: post,
              });

            if (insertError) {
              errors.push(`Insert error for draft ${draftInfo.draftId}: ${insertError.message}`);
              continue;
            }
          }

          // Update draft status to published if still scheduled
          await supabase
            .from('social_content_drafts')
            .update({ status: 'published' })
            .eq('id', draftInfo.draftId)
            .eq('status', 'scheduled');

          totalSynced++;
        }
      } catch (err) {
        errors.push(`${platform}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        synced: totalSynced,
        platforms: platforms.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Analytics sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
