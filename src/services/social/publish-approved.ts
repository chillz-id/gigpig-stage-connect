/**
 * Publish Approved Drafts to Metricool
 *
 * Converts approved ContentDraft → Metricool ScheduledPost
 * and schedules it for auto-publishing.
 */

import { createPost, getBestTimes } from '@/services/social/metricool-posts';
import { markDraftScheduled } from '@/services/social/content-pipeline';
import { snapToOptimalTime } from '@/services/social/content-strategy';
import { METRICOOL_NETWORKS } from '@/types/social';
import type {
  ContentDraft,
  ScheduledPost,
  ProviderStatus,
  SocialPlatform,
  BestTimesProvider,
} from '@/types/social';

// Map platform names to Metricool best-times provider values
const BEST_TIMES_PROVIDERS: Partial<Record<SocialPlatform, BestTimesProvider>> = {
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'tiktok',
  twitter: 'twitter',
  linkedin: 'linkedin',
  youtube: 'youtube',
};

/**
 * Publish a single approved draft to Metricool.
 * Fetches best posting times, creates the Metricool post, and updates the draft status.
 */
export async function publishDraft(draft: ContentDraft): Promise<{ metricoolPostId: number }> {
  if (draft.status !== 'approved') {
    throw new Error(`Draft ${draft.id} is not approved (status: ${draft.status})`);
  }

  const platform = draft.platform as SocialPlatform;
  const network = METRICOOL_NETWORKS[platform];
  if (!network) {
    throw new Error(`Unknown platform: ${draft.platform}`);
  }

  // Determine publish time
  let publishAt: Date;
  if (draft.scheduled_for) {
    publishAt = new Date(draft.scheduled_for);
  } else {
    // Try to use optimal posting times from Metricool
    publishAt = await getOptimalTime(platform);
  }

  // Build the caption with hashtags appended
  let fullCaption = draft.caption;
  if (draft.hashtags && draft.hashtags.length > 0) {
    const hashtagString = draft.hashtags.map((h) => `#${h}`).join(' ');
    fullCaption = `${draft.caption}\n\n${hashtagString}`;
  }

  // Build the providers array
  const providers: ProviderStatus[] = [{
    network,
  }];

  // Build the Metricool scheduled post
  const metricoolPost: ScheduledPost = {
    text: fullCaption,
    publicationDate: {
      dateTime: publishAt.toISOString().slice(0, 19),
      timezone: 'Australia/Sydney',
    },
    providers,
    autoPublish: true,
    draft: false,
  };

  // Add media if present
  if (draft.media_urls && draft.media_urls.length > 0) {
    metricoolPost.media = draft.media_urls;
  }

  // Create the post on Metricool
  const response = await createPost(metricoolPost);

  // Extract the Metricool post ID from the response
  const metricoolPostId = typeof response === 'object' && response !== null && 'id' in response
    ? (response as { id: number }).id
    : 0;

  // Update the draft status in our DB
  await markDraftScheduled(draft.id, metricoolPostId);

  return { metricoolPostId };
}

/**
 * Publish multiple approved drafts (e.g., all drafts from a queue item).
 */
export async function publishDrafts(
  drafts: ContentDraft[],
): Promise<{ succeeded: string[]; failed: { id: string; error: string }[] }> {
  const succeeded: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const draft of drafts) {
    try {
      await publishDraft(draft);
      succeeded.push(draft.id);
    } catch (err) {
      failed.push({
        id: draft.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { succeeded, failed };
}

/**
 * Get the next optimal posting time for a platform.
 * Falls back to 1 hour from now if best times unavailable.
 */
async function getOptimalTime(platform: SocialPlatform): Promise<Date> {
  const fallback = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  const provider = BEST_TIMES_PROVIDERS[platform];
  if (!provider) return fallback;

  try {
    const bestTimesResponse = await getBestTimes(provider);
    if (!bestTimesResponse) return fallback;

    // Parse best times response into a structured format
    // Metricool returns best times as a grid — we extract the highest-scored slots
    const bestTimeSlots = parseBestTimes(bestTimesResponse);
    return snapToOptimalTime(fallback, bestTimeSlots);
  } catch {
    return fallback;
  }
}

/**
 * Parse Metricool best times response into slot objects.
 */
function parseBestTimes(
  response: unknown,
): { day: number; hour: number; score: number }[] {
  if (!response || typeof response !== 'object') return [];

  // Metricool best times format varies — handle the common structures
  const slots: { day: number; hour: number; score: number }[] = [];

  // If it's an array of day objects with hourly scores
  if (Array.isArray(response)) {
    for (const entry of response) {
      if (typeof entry === 'object' && entry !== null && 'day' in entry && 'hours' in entry) {
        const dayEntry = entry as { day: number; hours: Record<string, number> };
        for (const [hourStr, score] of Object.entries(dayEntry.hours)) {
          const hour = parseInt(hourStr, 10);
          if (!isNaN(hour) && typeof score === 'number') {
            slots.push({ day: dayEntry.day, hour, score });
          }
        }
      }
    }
  }

  return slots.sort((a, b) => b.score - a.score);
}
