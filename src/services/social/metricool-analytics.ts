/**
 * Metricool Analytics Service
 *
 * Fetch post analytics and performance metrics per platform.
 */

import { metricoolClient } from './metricool-client';
import type { SocialPlatform } from '@/types/social';

// ─── Platform Analytics Endpoints ────────────────────────────────────────────

const ANALYTICS_ENDPOINTS: Partial<Record<SocialPlatform, string>> = {
  instagram: '/v2/analytics/instagram/posts',
  facebook: '/v2/analytics/facebook/posts',
  tiktok: '/v2/analytics/tiktok/posts',
  twitter: '/v2/analytics/twitter/posts',
  linkedin: '/v2/analytics/linkedin/posts',
  bluesky: '/v2/analytics/bluesky/posts',
  threads: '/v2/analytics/threads/posts',
};

const REELS_ENDPOINTS: Partial<Record<SocialPlatform, string>> = {
  instagram: '/v2/analytics/instagram/reels',
  facebook: '/v2/analytics/facebook/reels',
};

const STORIES_ENDPOINTS: Partial<Record<SocialPlatform, string>> = {
  instagram: '/v2/analytics/instagram/stories',
  facebook: '/v2/analytics/facebook/stories',
};

interface AnalyticsQueryParams {
  start: string; // ISO datetime
  end: string;   // ISO datetime
  timezone?: string;
}

/**
 * Get posts analytics for a platform during a date range.
 */
export async function getPostsAnalytics(
  platform: SocialPlatform,
  params: AnalyticsQueryParams,
): Promise<unknown[]> {
  const endpoint = ANALYTICS_ENDPOINTS[platform];
  if (!endpoint) {
    throw new Error(`Analytics not available for platform: ${platform}`);
  }

  const queryParams: Record<string, string> = {
    start: params.start,
    end: params.end,
    timezone: params.timezone ?? 'Australia/Sydney',
  };

  return metricoolClient.get(endpoint, queryParams);
}

/**
 * Get reels analytics for a platform (Instagram, Facebook only).
 */
export async function getReelsAnalytics(
  platform: 'instagram' | 'facebook',
  params: AnalyticsQueryParams,
): Promise<unknown[]> {
  const endpoint = REELS_ENDPOINTS[platform];
  if (!endpoint) {
    throw new Error(`Reels analytics not available for platform: ${platform}`);
  }

  return metricoolClient.get(endpoint, {
    start: params.start,
    end: params.end,
    timezone: params.timezone ?? 'Australia/Sydney',
  });
}

/**
 * Get stories analytics for a platform (Instagram, Facebook only).
 */
export async function getStoriesAnalytics(
  platform: 'instagram' | 'facebook',
  params: AnalyticsQueryParams,
): Promise<unknown[]> {
  const endpoint = STORIES_ENDPOINTS[platform];
  if (!endpoint) {
    throw new Error(`Stories analytics not available for platform: ${platform}`);
  }

  return metricoolClient.get(endpoint, {
    start: params.start,
    end: params.end,
    timezone: params.timezone ?? 'Australia/Sydney',
  });
}

/**
 * Get analytics time series for a specific metric.
 */
export async function getTimeSeries(
  metric: string,
  params: AnalyticsQueryParams & { category?: string },
): Promise<unknown> {
  return metricoolClient.get('/v2/stats/timeseries', {
    metric,
    start: params.start,
    end: params.end,
    timezone: params.timezone ?? 'Australia/Sydney',
    ...(params.category ? { category: params.category } : {}),
  });
}

/**
 * Get aggregated engagement metrics for a period.
 */
export async function getEngagement(
  params: AnalyticsQueryParams & { category?: string },
): Promise<unknown> {
  return metricoolClient.get('/v2/stats/engagement', {
    start: params.start,
    end: params.end,
    timezone: params.timezone ?? 'Australia/Sydney',
    ...(params.category ? { category: params.category } : {}),
  });
}

/**
 * Get follower demographics (gender distribution).
 */
export async function getFollowersByGender(
  platform: 'instagram' | 'facebook',
): Promise<unknown> {
  return metricoolClient.get(`/v2/stats/${platform}/followers/gender`);
}

/**
 * Get follower demographics by country.
 */
export async function getFollowersByCountry(
  platform: 'instagram' | 'facebook',
): Promise<unknown> {
  return metricoolClient.get(`/v2/stats/${platform}/followers/country`);
}

/**
 * Get follower demographics by city.
 */
export async function getFollowersByCity(
  platform: 'instagram' | 'facebook',
): Promise<unknown> {
  return metricoolClient.get(`/v2/stats/${platform}/followers/city`);
}
