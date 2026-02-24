/**
 * Optimization Engine
 *
 * Analyzes performance data from social_content_performance to identify
 * what works best: captions styles, hashtags, media types, posting times,
 * and platforms. Generates insights that feed back into content generation.
 */

import { supabase } from '@/integrations/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PerformanceRecord {
  id: string;
  draft_id: string;
  platform: string;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  engagement_rate: number;
  collected_at: string;
}

export interface DraftWithPerformance {
  draft_id: string;
  platform: string;
  post_type: string;
  caption: string;
  hashtags: string[] | null;
  media_type: string | null;
  scheduled_for: string | null;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
}

export interface PlatformInsight {
  platform: string;
  totalPosts: number;
  avgEngagementRate: number;
  avgImpressions: number;
  avgReach: number;
  bestPostType: string | null;
  bestTimeSlot: string | null;
}

export interface HashtagInsight {
  hashtag: string;
  usageCount: number;
  avgEngagementRate: number;
  avgImpressions: number;
}

export interface OptimizationInsights {
  platformInsights: PlatformInsight[];
  topHashtags: HashtagInsight[];
  bestPostingHours: { hour: number; avgEngagement: number; count: number }[];
  bestMediaTypes: { type: string; avgEngagement: number; count: number }[];
  topPosts: DraftWithPerformance[];
  promptSuggestions: string[];
}

// ─── Data Fetching ──────────────────────────────────────────────────────────────

/**
 * Fetch all performance data joined with draft details for an organization.
 */
export async function getPerformanceData(
  organizationId: string,
  daysBack = 90,
): Promise<DraftWithPerformance[]> {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('social_content_performance')
    .select(`
      draft_id,
      platform,
      impressions,
      reach,
      engagement,
      likes,
      comments,
      shares,
      engagement_rate,
      social_content_drafts!inner (
        platform,
        post_type,
        caption,
        hashtags,
        media_type,
        scheduled_for,
        organization_id
      )
    `)
    .gte('collected_at', since);

  if (error) throw error;
  if (!data) return [];

  // Flatten the joined data and filter by org
  return (data as unknown[])
    .filter((row: unknown) => {
      const r = row as { social_content_drafts: { organization_id: string } };
      return r.social_content_drafts?.organization_id === organizationId;
    })
    .map((row: unknown) => {
      const r = row as {
        draft_id: string;
        platform: string;
        impressions: number;
        reach: number;
        engagement: number;
        likes: number;
        comments: number;
        shares: number;
        engagement_rate: number;
        social_content_drafts: {
          platform: string;
          post_type: string;
          caption: string;
          hashtags: string[] | null;
          media_type: string | null;
          scheduled_for: string | null;
        };
      };
      return {
        draft_id: r.draft_id,
        platform: r.platform,
        post_type: r.social_content_drafts.post_type,
        caption: r.social_content_drafts.caption,
        hashtags: r.social_content_drafts.hashtags,
        media_type: r.social_content_drafts.media_type,
        scheduled_for: r.social_content_drafts.scheduled_for,
        impressions: r.impressions,
        reach: r.reach,
        engagement: r.engagement,
        likes: r.likes,
        comments: r.comments,
        shares: r.shares,
        engagement_rate: r.engagement_rate,
      };
    });
}

// ─── Analysis ───────────────────────────────────────────────────────────────────

/**
 * Generate comprehensive optimization insights from performance data.
 */
export function analyzePerformance(data: DraftWithPerformance[]): OptimizationInsights {
  if (data.length === 0) {
    return {
      platformInsights: [],
      topHashtags: [],
      bestPostingHours: [],
      bestMediaTypes: [],
      topPosts: [],
      promptSuggestions: ['Not enough data yet. Keep posting to build optimization insights.'],
    };
  }

  return {
    platformInsights: analyzePlatforms(data),
    topHashtags: analyzeHashtags(data),
    bestPostingHours: analyzePostingTimes(data),
    bestMediaTypes: analyzeMediaTypes(data),
    topPosts: getTopPosts(data, 5),
    promptSuggestions: generatePromptSuggestions(data),
  };
}

/**
 * Full pipeline: fetch data + analyze.
 */
export async function getOptimizationInsights(
  organizationId: string,
  daysBack = 90,
): Promise<OptimizationInsights> {
  const data = await getPerformanceData(organizationId, daysBack);
  return analyzePerformance(data);
}

// ─── Platform Analysis ──────────────────────────────────────────────────────────

function analyzePlatforms(data: DraftWithPerformance[]): PlatformInsight[] {
  const byPlatform = groupBy(data, 'platform');

  return Object.entries(byPlatform).map(([platform, posts]) => {
    const avgEngagementRate = avg(posts, 'engagement_rate');
    const avgImpressions = avg(posts, 'impressions');
    const avgReach = avg(posts, 'reach');

    // Best post type
    const byType = groupBy(posts, 'post_type');
    let bestPostType: string | null = null;
    let bestTypeRate = 0;
    for (const [type, typePosts] of Object.entries(byType)) {
      const rate = avg(typePosts, 'engagement_rate');
      if (rate > bestTypeRate) {
        bestTypeRate = rate;
        bestPostType = type;
      }
    }

    // Best time slot
    const bestTimeSlot = findBestTimeSlot(posts);

    return {
      platform,
      totalPosts: posts.length,
      avgEngagementRate,
      avgImpressions,
      avgReach,
      bestPostType,
      bestTimeSlot,
    };
  }).sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

// ─── Hashtag Analysis ───────────────────────────────────────────────────────────

function analyzeHashtags(data: DraftWithPerformance[]): HashtagInsight[] {
  const hashtagStats = new Map<string, { totalEngRate: number; totalImpressions: number; count: number }>();

  for (const post of data) {
    if (!post.hashtags) continue;
    for (const tag of post.hashtags) {
      const normalized = tag.toLowerCase().replace(/^#/, '');
      const existing = hashtagStats.get(normalized) ?? { totalEngRate: 0, totalImpressions: 0, count: 0 };
      existing.totalEngRate += post.engagement_rate;
      existing.totalImpressions += post.impressions;
      existing.count++;
      hashtagStats.set(normalized, existing);
    }
  }

  return [...hashtagStats.entries()]
    .map(([hashtag, stats]) => ({
      hashtag,
      usageCount: stats.count,
      avgEngagementRate: stats.count > 0 ? stats.totalEngRate / stats.count : 0,
      avgImpressions: stats.count > 0 ? stats.totalImpressions / stats.count : 0,
    }))
    .filter((h) => h.usageCount >= 2) // Only show hashtags used 2+ times
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)
    .slice(0, 20);
}

// ─── Posting Time Analysis ──────────────────────────────────────────────────────

function analyzePostingTimes(
  data: DraftWithPerformance[],
): { hour: number; avgEngagement: number; count: number }[] {
  const byHour = new Map<number, { totalEng: number; count: number }>();

  for (const post of data) {
    if (!post.scheduled_for) continue;
    const hour = new Date(post.scheduled_for).getHours();
    const existing = byHour.get(hour) ?? { totalEng: 0, count: 0 };
    existing.totalEng += post.engagement;
    existing.count++;
    byHour.set(hour, existing);
  }

  return [...byHour.entries()]
    .map(([hour, stats]) => ({
      hour,
      avgEngagement: stats.count > 0 ? stats.totalEng / stats.count : 0,
      count: stats.count,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

// ─── Media Type Analysis ────────────────────────────────────────────────────────

function analyzeMediaTypes(
  data: DraftWithPerformance[],
): { type: string; avgEngagement: number; count: number }[] {
  const byType = new Map<string, { totalEng: number; totalEngRate: number; count: number }>();

  for (const post of data) {
    const type = post.media_type ?? 'text_only';
    const existing = byType.get(type) ?? { totalEng: 0, totalEngRate: 0, count: 0 };
    existing.totalEng += post.engagement;
    existing.totalEngRate += post.engagement_rate;
    existing.count++;
    byType.set(type, existing);
  }

  return [...byType.entries()]
    .map(([type, stats]) => ({
      type,
      avgEngagement: stats.count > 0 ? stats.totalEngRate / stats.count : 0,
      count: stats.count,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

// ─── Top Posts ──────────────────────────────────────────────────────────────────

function getTopPosts(data: DraftWithPerformance[], limit: number): DraftWithPerformance[] {
  return [...data]
    .sort((a, b) => b.engagement_rate - a.engagement_rate)
    .slice(0, limit);
}

// ─── Prompt Suggestions ─────────────────────────────────────────────────────────

function generatePromptSuggestions(data: DraftWithPerformance[]): string[] {
  const suggestions: string[] = [];

  // Platform recommendation
  const platforms = analyzePlatforms(data);
  if (platforms.length > 0 && platforms[0]) {
    suggestions.push(
      `Best performing platform: ${platforms[0].platform} (${platforms[0].avgEngagementRate.toFixed(2)}% avg engagement). Prioritize content here.`,
    );
  }

  // Best posting time
  const times = analyzePostingTimes(data);
  if (times.length > 0 && times[0]) {
    const bestHour = times[0].hour;
    const period = bestHour >= 12 ? 'PM' : 'AM';
    const displayHour = bestHour > 12 ? bestHour - 12 : bestHour === 0 ? 12 : bestHour;
    suggestions.push(
      `Best posting time: ${displayHour}:00 ${period} (avg ${times[0].avgEngagement.toFixed(0)} engagement). Schedule posts around this time.`,
    );
  }

  // Top hashtags
  const hashtags = analyzeHashtags(data);
  if (hashtags.length >= 3) {
    const topTags = hashtags.slice(0, 5).map((h) => `#${h.hashtag}`).join(' ');
    suggestions.push(`Top performing hashtags: ${topTags}. Include these in future posts.`);
  }

  // Media type recommendation
  const mediaTypes = analyzeMediaTypes(data);
  if (mediaTypes.length > 0 && mediaTypes[0]) {
    suggestions.push(
      `Best media type: ${mediaTypes[0].type} (${mediaTypes[0].avgEngagement.toFixed(2)}% avg engagement). Use this format more often.`,
    );
  }

  // Caption length insight
  const topPosts = getTopPosts(data, 10);
  if (topPosts.length >= 5) {
    const avgLength = topPosts.reduce((sum, p) => sum + p.caption.length, 0) / topPosts.length;
    suggestions.push(
      `Top posts average ${Math.round(avgLength)} characters. Aim for this caption length.`,
    );
  }

  if (suggestions.length === 0) {
    suggestions.push('Keep posting regularly to build enough data for optimization insights.');
  }

  return suggestions;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const k = String(item[key]);
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

function avg(arr: DraftWithPerformance[], key: keyof DraftWithPerformance): number {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((s, item) => s + (Number(item[key]) || 0), 0);
  return sum / arr.length;
}

function findBestTimeSlot(posts: DraftWithPerformance[]): string | null {
  const times = analyzePostingTimes(posts);
  if (times.length === 0 || !times[0]) return null;
  const h = times[0].hour;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:00 ${period}`;
}
