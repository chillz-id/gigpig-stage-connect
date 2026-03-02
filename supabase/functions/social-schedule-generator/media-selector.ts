/**
 * Media Selector
 *
 * Scans Google Drive via the social-drive Edge Function, syncs assets to
 * social_media_assets, and scores candidates to pick the best media for
 * each draft based on platform, post type, and event context.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AssetCandidate {
  id: string;           // social_media_assets.id (UUID)
  driveFileId: string;
  fileName: string;
  fileType: string;     // 'image' | 'video'
  mimeType: string;
  folderPath: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  usedCount: number;
  eventId: string | null;
  status: string;
}

export interface MediaSelection {
  mediaUrls: string[];      // Kept for backward compat (banner fallback)
  mediaFileIds: string[];   // social_media_assets.id UUIDs
  mediaType: string | null; // 'image' | 'video' | null
}

interface DriveFileRaw {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  imageMediaMetadata?: { width?: number; height?: number };
  videoMediaMetadata?: { width?: number; height?: number; durationMillis?: string };
}

interface ScanResult {
  files: DriveFileRaw[];
  folderPath: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Post types that require video content */
const VIDEO_POST_TYPES = new Set(['reel', 'story', 'short']);

/** Ideal aspect ratios */
const PORTRAIT_RATIO = 9 / 16;  // 0.5625 — reels, stories, shorts
const SQUARE_RATIO = 1;
const LANDSCAPE_RATIO = 16 / 9; // 1.778 — feed posts

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Score a single asset candidate for a given platform + postType.
 * Returns -Infinity if the asset is disqualified.
 */
function scoreAsset(
  asset: AssetCandidate,
  postType: string,
  eventFolderPrefix: string | null,
): number {
  let score = 0;
  const isVideo = asset.fileType === 'video';
  const needsVideo = VIDEO_POST_TYPES.has(postType);

  // ── Format fit ──
  if (needsVideo && !isVideo) return -Infinity; // Video required, asset is image
  if (!needsVideo && isVideo) score -= 20;       // Video used for feed post (prefer image)

  // ── Aspect ratio ──
  if (asset.width && asset.height) {
    const ratio = asset.width / asset.height;

    if (needsVideo) {
      // Reels/stories/shorts prefer portrait (9:16)
      if (Math.abs(ratio - PORTRAIT_RATIO) < 0.1) score += 30;
      else if (ratio < 0.8) score += 15;  // Close to portrait
      else score -= 10;  // Landscape for vertical format
    } else {
      // Feed posts prefer square or landscape
      if (Math.abs(ratio - SQUARE_RATIO) < 0.15) score += 30;
      else if (Math.abs(ratio - LANDSCAPE_RATIO) < 0.3) score += 25;
      else if (ratio > 0.8 && ratio < 2.0) score += 15;
      else score -= 10;
    }
  }

  // ── Event-specific asset ──
  if (eventFolderPrefix && asset.folderPath.startsWith(eventFolderPrefix)) {
    score += 50;
  }

  // ── General brand asset ──
  if (asset.folderPath.includes('/General/')) {
    score += 10;
  }

  // ── Freshness (prefer less-used assets) ──
  score -= (asset.usedCount ?? 0) * 5;

  return score;
}

/**
 * Select the best media asset for a draft.
 *
 * @param candidates    All available assets for this brand
 * @param eventId       The event this draft belongs to
 * @param platform      Target social platform
 * @param postType      'post' | 'reel' | 'story' | 'short'
 * @param eventFolderPrefix  e.g. "iD Comedy Club/2026-03-05 - ID Comedy Club - Friday"
 * @param fallbackBannerUrl  Event hero_image_url or banner_url
 */
export function selectMedia(
  candidates: AssetCandidate[],
  _eventId: string,
  _platform: string,
  postType: string,
  eventFolderPrefix: string | null,
  fallbackBannerUrl: string | null,
): MediaSelection {
  if (candidates.length === 0) {
    return {
      mediaUrls: fallbackBannerUrl ? [fallbackBannerUrl] : [],
      mediaFileIds: [],
      mediaType: null,
    };
  }

  // Score and rank all candidates
  const scored = candidates
    .map((asset) => ({
      asset,
      score: scoreAsset(asset, postType, eventFolderPrefix),
    }))
    .filter((s) => s.score > -Infinity)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      mediaUrls: fallbackBannerUrl ? [fallbackBannerUrl] : [],
      mediaFileIds: [],
      mediaType: null,
    };
  }

  const best = scored[0]!;

  return {
    mediaUrls: [],  // Drive assets use mediaFileIds, not URLs
    mediaFileIds: [best.asset.id],
    mediaType: best.asset.fileType,
  };
}

// ─── Drive Scan & Sync ──────────────────────────────────────────────────────

/**
 * Call social-drive Edge Function to scan a brand's folders,
 * then upsert results into social_media_assets.
 *
 * Returns the synced asset rows for use as candidates.
 */
export async function scanAndSyncBrandAssets(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceKey: string,
  brand: string,
): Promise<{ scanned: number; synced: number; assets: AssetCandidate[] }> {
  // 1. Call social-drive scan action
  const scanResp = await fetch(`${supabaseUrl}/functions/v1/social-drive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ action: 'scan', brand }),
  });

  if (!scanResp.ok) {
    const text = await scanResp.text();
    console.warn(`Drive scan failed for brand "${brand}": ${text}`);
    return { scanned: 0, synced: 0, assets: [] };
  }

  const scanResults: ScanResult[] = await scanResp.json();
  let scanned = 0;
  let synced = 0;

  // 2. Upsert each file into social_media_assets
  for (const folder of scanResults) {
    for (const file of folder.files) {
      scanned++;
      const isVideo = file.mimeType?.startsWith('video/') ?? false;
      const fileType = isVideo ? 'video' : 'image';

      const width = isVideo
        ? file.videoMediaMetadata?.width ?? null
        : file.imageMediaMetadata?.width ?? null;
      const height = isVideo
        ? file.videoMediaMetadata?.height ?? null
        : file.imageMediaMetadata?.height ?? null;
      const durationSeconds = isVideo && file.videoMediaMetadata?.durationMillis
        ? Math.round(parseInt(file.videoMediaMetadata.durationMillis, 10) / 1000)
        : null;

      const { error } = await supabase
        .from('social_media_assets')
        .upsert(
          {
            drive_file_id: file.id,
            brand,
            file_name: file.name,
            file_type: fileType,
            mime_type: file.mimeType ?? null,
            file_size: file.size ? parseInt(file.size, 10) : null,
            folder_path: folder.folderPath,
            drive_url: file.webViewLink ?? null,
            thumbnail_url: file.thumbnailLink ?? null,
            width,
            height,
            duration_seconds: durationSeconds,
          },
          { onConflict: 'drive_file_id' },
        );

      if (!error) synced++;
      else console.warn(`Upsert failed for ${file.name}: ${error.message}`);
    }
  }

  // 3. Load all available assets for this brand
  const { data: assets } = await supabase
    .from('social_media_assets')
    .select('id, drive_file_id, file_name, file_type, mime_type, folder_path, width, height, duration_seconds, used_count, event_id, status')
    .eq('brand', brand)
    .in('status', ['available', 'scheduled']);

  const candidates: AssetCandidate[] = (assets ?? []).map((a) => ({
    id: a.id as string,
    driveFileId: a.drive_file_id as string,
    fileName: a.file_name as string,
    fileType: a.file_type as string,
    mimeType: a.mime_type as string ?? '',
    folderPath: a.folder_path as string,
    width: a.width as number | null,
    height: a.height as number | null,
    durationSeconds: a.duration_seconds as number | null,
    usedCount: (a.used_count as number) ?? 0,
    eventId: a.event_id as string | null,
    status: a.status as string ?? 'available',
  }));

  return { scanned, synced, assets: candidates };
}
