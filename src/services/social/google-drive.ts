/**
 * Google Drive Service
 *
 * Client-side service that proxies all Google Drive API calls through
 * the social-drive Edge Function to keep service account credentials server-side.
 */

import { supabase } from '@/integrations/supabase/client';
import type { DriveProxyRequest, DriveFile, DriveBrand, DriveMediaAsset } from '@/types/social';

interface DriveProxyResponse<T = unknown> {
  ok: boolean;
  data: T;
  error?: string;
}

export class DriveServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'DriveServiceError';
  }
}

async function driveRequest<T = unknown>(request: DriveProxyRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke<DriveProxyResponse<T>>(
    'social-drive',
    { body: request },
  );

  if (error) {
    throw new DriveServiceError(error.message || 'Failed to call Drive proxy');
  }

  if (!data?.ok) {
    throw new DriveServiceError(data?.error ?? 'Drive API error');
  }

  return data.data;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * List media files in a Drive folder by path.
 */
export async function listDriveFolder(
  folderPath: string,
  pageToken?: string,
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  return driveRequest({ action: 'list', folderPath, pageToken });
}

/**
 * List media files in a Drive folder by ID.
 */
export async function listDriveFolderById(
  folderId: string,
  pageToken?: string,
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  return driveRequest({ action: 'list', folderId, pageToken });
}

/**
 * Get metadata for a single file.
 */
export async function getDriveFile(fileId: string): Promise<DriveFile> {
  return driveRequest({ action: 'get', fileId });
}

/**
 * Create a public shareable URL for a file (for Metricool to access).
 */
export async function shareDriveFile(fileId: string): Promise<{ url: string }> {
  return driveRequest({ action: 'share', fileId });
}

/**
 * Move a file to another folder (e.g., Ready to Post → Posted).
 */
export async function moveDriveFile(fileId: string, destinationFolderId: string): Promise<unknown> {
  return driveRequest({ action: 'move', fileId, destinationFolderId });
}

/**
 * Resolve a folder path to a Drive folder ID.
 */
export async function resolveDrivePath(folderPath: string): Promise<{ folderId: string }> {
  return driveRequest({ action: 'resolve-path', folderPath });
}

/**
 * Scan all "Ready to Post" subfolders for a brand.
 * Returns files grouped by subfolder.
 */
export async function scanBrandMedia(
  brand: DriveBrand,
): Promise<{ files: DriveFile[]; folderPath: string }[]> {
  return driveRequest({ action: 'scan', brand });
}

/**
 * Create a folder in Google Drive.
 * Returns the folder ID (creates if missing, returns existing if found).
 */
export async function createDriveFolder(
  folderName: string,
  parentPath?: string,
): Promise<{ folderId: string; name: string; created: boolean }> {
  return driveRequest({
    action: 'create-folder',
    folderName,
    folderPath: parentPath,
  });
}

/**
 * List subfolders in a Drive folder.
 */
export async function listDriveFolders(
  folderPath?: string,
  folderId?: string,
): Promise<{ folders: { id: string; name: string; createdTime?: string }[] }> {
  return driveRequest({ action: 'list-folders', folderPath, folderId });
}

// ─── Asset Database Operations ──────────────────────────────────────────────

/**
 * Sync Drive files into the social_media_assets database table.
 * Creates new records for files not yet tracked, skips existing ones.
 */
export async function syncDriveAssets(
  brand: DriveBrand,
  files: DriveFile[],
  folderPath: string,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const isVideo = file.mimeType.startsWith('video/');
    const fileType = isVideo ? 'video' : 'image';

    const { error } = await supabase
      .from('social_media_assets')
      .upsert(
        {
          drive_file_id: file.id,
          brand,
          file_name: file.name,
          file_type: fileType,
          mime_type: file.mimeType,
          file_size: file.size ? parseInt(file.size, 10) : null,
          folder_path: folderPath,
          thumbnail_url: file.thumbnailLink ?? null,
          drive_url: file.webViewLink ?? null,
          width: isVideo
            ? file.videoMediaMetadata?.width ?? null
            : file.imageMediaMetadata?.width ?? null,
          height: isVideo
            ? file.videoMediaMetadata?.height ?? null
            : file.imageMediaMetadata?.height ?? null,
          duration_seconds: file.videoMediaMetadata?.durationMillis
            ? Math.round(parseInt(file.videoMediaMetadata.durationMillis, 10) / 1000)
            : null,
          status: 'available',
        },
        { onConflict: 'drive_file_id', ignoreDuplicates: true },
      );

    if (error) {
      console.error(`Failed to upsert asset ${file.name}:`, error);
      skipped++;
    } else {
      created++;
    }
  }

  return { created, skipped };
}

/**
 * Get tracked assets for a brand, optionally filtered by status.
 */
export async function getAssets(
  brand?: DriveBrand,
  status?: DriveMediaAsset['status'],
): Promise<DriveMediaAsset[]> {
  let query = supabase
    .from('social_media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (brand) query = query.eq('brand', brand);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw new DriveServiceError(error.message);
  return (data ?? []) as unknown as DriveMediaAsset[];
}

/**
 * Mark an asset as used (scheduled/posted) and increment used_count.
 */
export async function markAssetUsed(
  assetId: string,
  platform: string,
  draftId?: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('social_media_assets')
    .select('used_count, posted_platforms, draft_ids, first_used_at')
    .eq('id', assetId)
    .single();

  const currentPlatforms = (existing as { posted_platforms: string[] | null } | null)?.posted_platforms ?? [];
  const currentDraftIds = (existing as { draft_ids: string[] | null } | null)?.draft_ids ?? [];
  const isFirstUse = !(existing as { first_used_at: string | null } | null)?.first_used_at;

  const { error } = await supabase
    .from('social_media_assets')
    .update({
      status: 'scheduled',
      used_count: ((existing as { used_count: number } | null)?.used_count ?? 0) + 1,
      last_used_at: new Date().toISOString(),
      ...(isFirstUse ? { first_used_at: new Date().toISOString() } : {}),
      posted_platforms: [...new Set([...currentPlatforms, platform])],
      ...(draftId ? { draft_ids: [...currentDraftIds, draftId] } : {}),
    })
    .eq('id', assetId);

  if (error) throw new DriveServiceError(error.message);
}

/**
 * Mark an asset as posted and move the file to the event's Posted folder.
 * Uses the asset's folder_path to derive the sibling Posted folder.
 * e.g., "iD Comedy Club/2026-03-06 - Fri Night/Ready to Post" → "iD Comedy Club/2026-03-06 - Fri Night/Posted"
 */
export async function markAssetPosted(assetId: string, brand: DriveBrand): Promise<void> {
  // Get the asset to find the Drive file ID and folder path
  const { data: asset } = await supabase
    .from('social_media_assets')
    .select('drive_file_id, folder_path')
    .eq('id', assetId)
    .single();

  if (!asset) throw new DriveServiceError('Asset not found');

  const typedAsset = asset as { drive_file_id: string; folder_path: string | null };

  try {
    // Derive the Posted folder from the asset's current folder path
    // folder_path could be "Brand/2026-03-06 - Fri Night/Ready to Post" or "Brand/General/Reels"
    let postedPath: string;
    if (typedAsset.folder_path?.includes('/Ready to Post')) {
      // Replace "Ready to Post" with "Posted" in the path
      postedPath = typedAsset.folder_path.replace('/Ready to Post', '/Posted');
    } else {
      // Fallback: use brand-level path (for General content or legacy paths)
      postedPath = `${brand}/Posted`;
    }

    const { folderId: postedFolderId } = await resolveDrivePath(postedPath);
    await moveDriveFile(typedAsset.drive_file_id, postedFolderId);
  } catch (e) {
    console.error('Failed to move file to Posted folder:', e);
    // Don't throw — the status update is more important than the move
  }

  const { error } = await supabase
    .from('social_media_assets')
    .update({ status: 'posted' })
    .eq('id', assetId);

  if (error) throw new DriveServiceError(error.message);
}
