/**
 * Media Selector Service
 *
 * Scores and ranks available media from the library for social posts.
 * Matches media to post types (portrait for Stories/Reels, landscape for feed).
 */

import { supabase } from '@/integrations/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MediaFile {
  id: string;
  file_name: string;
  file_type: string;
  media_type: string | null;
  public_url: string | null;
  storage_path: string;
  tags: string[] | null;
  title: string | null;
  is_headshot: boolean | null;
  is_primary_headshot: boolean | null;
  aspect_ratio: number | null;
  image_width: number | null;
  image_height: number | null;
  folder_id: string | null;
  created_at: string;
}

interface ScoredMedia {
  file: MediaFile;
  score: number;
  reasons: string[];
}

type PostType = 'post' | 'reel' | 'story' | 'short' | 'thread';

// ─── Aspect Ratio Targets ───────────────────────────────────────────────────────

const ASPECT_RATIO_TARGETS: Record<PostType, { ideal: number; min: number; max: number }> = {
  post: { ideal: 1.0, min: 0.8, max: 1.91 },       // Square to landscape (IG feed)
  reel: { ideal: 0.5625, min: 0.5, max: 0.65 },     // 9:16 portrait
  story: { ideal: 0.5625, min: 0.5, max: 0.65 },    // 9:16 portrait
  short: { ideal: 0.5625, min: 0.5, max: 0.65 },    // 9:16 portrait (YT Shorts)
  thread: { ideal: 1.0, min: 0.8, max: 1.91 },      // Same as post
};

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetch and score media from the library for a given event.
 * Returns media ranked by relevance score (highest first).
 */
export async function selectMediaForEvent(
  eventId: string,
  postType: PostType,
  options?: {
    limit?: number;
    mediaTypeFilter?: 'image' | 'video';
    organizationId?: string;
  },
): Promise<ScoredMedia[]> {
  const limit = options?.limit ?? 10;

  // Fetch event data for context
  const { data: event } = await supabase
    .from('events')
    .select('id, name, title, venue, organization_id, hero_image_url, banner_url')
    .eq('id', eventId)
    .single();

  const orgId = options?.organizationId ?? (event as { organization_id: string } | null)?.organization_id;

  // Fetch media from the library
  let query = supabase
    .from('media_files')
    .select('id, file_name, file_type, media_type, public_url, storage_path, tags, title, is_headshot, is_primary_headshot, aspect_ratio, image_width, image_height, folder_id, created_at')
    .order('created_at', { ascending: false })
    .limit(200); // Fetch a pool to score from

  if (options?.mediaTypeFilter === 'image') {
    query = query.in('media_type', ['image', 'photo']);
  } else if (options?.mediaTypeFilter === 'video') {
    query = query.eq('media_type', 'video');
  }

  const { data: mediaFiles, error } = await query;
  if (error) throw error;
  if (!mediaFiles || mediaFiles.length === 0) return [];

  // Score each media file
  const eventName = ((event as { name: string } | null)?.name ?? (event as { title: string } | null)?.title ?? '').toLowerCase();
  const scored = (mediaFiles as unknown as MediaFile[]).map((file) => {
    const result = scoreMedia(file, postType, { eventName, orgId: orgId ?? undefined });
    return result;
  });

  // Sort by score descending and return top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Fetch media from the library without event context.
 * Useful for general promotional posts.
 */
export async function selectGeneralMedia(
  postType: PostType,
  options?: {
    limit?: number;
    mediaTypeFilter?: 'image' | 'video';
    tags?: string[];
  },
): Promise<ScoredMedia[]> {
  const limit = options?.limit ?? 10;

  let query = supabase
    .from('media_files')
    .select('id, file_name, file_type, media_type, public_url, storage_path, tags, title, is_headshot, is_primary_headshot, aspect_ratio, image_width, image_height, folder_id, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (options?.mediaTypeFilter === 'image') {
    query = query.in('media_type', ['image', 'photo']);
  } else if (options?.mediaTypeFilter === 'video') {
    query = query.eq('media_type', 'video');
  }

  if (options?.tags && options.tags.length > 0) {
    query = query.overlaps('tags', options.tags);
  }

  const { data: mediaFiles, error } = await query;
  if (error) throw error;
  if (!mediaFiles || mediaFiles.length === 0) return [];

  const scored = (mediaFiles as unknown as MediaFile[]).map((file) =>
    scoreMedia(file, postType, {}),
  );

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// ─── Scoring Engine ─────────────────────────────────────────────────────────────

function scoreMedia(
  file: MediaFile,
  postType: PostType,
  context: { eventName?: string; orgId?: string },
): ScoredMedia {
  let score = 0;
  const reasons: string[] = [];

  // 1. Aspect ratio match (0-30 points)
  if (file.aspect_ratio) {
    const target = ASPECT_RATIO_TARGETS[postType];
    const diff = Math.abs(file.aspect_ratio - target.ideal);
    if (diff < 0.05) {
      score += 30;
      reasons.push('Perfect aspect ratio match');
    } else if (file.aspect_ratio >= target.min && file.aspect_ratio <= target.max) {
      score += 20;
      reasons.push('Good aspect ratio');
    } else {
      score += 5;
      reasons.push('Aspect ratio mismatch');
    }
  }

  // 2. Media type relevance (0-20 points)
  const isVideo = file.media_type === 'video' || file.file_type.startsWith('video/');
  const needsVideo = postType === 'reel' || postType === 'story' || postType === 'short';
  if (needsVideo && isVideo) {
    score += 20;
    reasons.push('Video matches post type');
  } else if (!needsVideo && !isVideo) {
    score += 20;
    reasons.push('Image matches post type');
  } else if (needsVideo && !isVideo) {
    score += 5; // Images can be used in reels/stories but less ideal
  }

  // 3. Tag relevance (0-20 points)
  if (file.tags && file.tags.length > 0 && context.eventName) {
    const eventWords = context.eventName.split(/\s+/);
    const matchingTags = file.tags.filter((tag) =>
      eventWords.some((word) => tag.toLowerCase().includes(word)),
    );
    if (matchingTags.length > 0) {
      score += Math.min(20, matchingTags.length * 10);
      reasons.push(`Tags match event: ${matchingTags.join(', ')}`);
    }
  }

  // 4. Headshot bonus for comedy posts (0-10 points)
  if (file.is_headshot) {
    score += 5;
    reasons.push('Headshot');
  }
  if (file.is_primary_headshot) {
    score += 10;
    reasons.push('Primary headshot');
  }

  // 5. Recency bonus (0-10 points)
  const ageMs = Date.now() - new Date(file.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 7) {
    score += 10;
    reasons.push('Recent upload (< 1 week)');
  } else if (ageDays < 30) {
    score += 5;
    reasons.push('Recent upload (< 1 month)');
  }

  // 6. Has public URL (5 points) — ready to use
  if (file.public_url) {
    score += 5;
    reasons.push('Public URL available');
  }

  // 7. Resolution quality (0-5 points)
  if (file.image_width && file.image_height) {
    const pixels = file.image_width * file.image_height;
    if (pixels >= 1080 * 1080) {
      score += 5;
      reasons.push('High resolution');
    } else if (pixels >= 640 * 640) {
      score += 2;
    }
  }

  return { file, score, reasons };
}
