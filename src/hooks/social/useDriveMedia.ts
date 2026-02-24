/**
 * Hooks for Google Drive media management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  scanBrandMedia,
  syncDriveAssets,
  getAssets,
  markAssetUsed,
  markAssetPosted,
  listDriveFolder,
} from '@/services/social/google-drive';
import type { DriveBrand, DriveMediaAsset } from '@/types/social';

/**
 * Fetch tracked assets from the database for a brand.
 */
export function useDriveAssets(brand?: DriveBrand, status?: DriveMediaAsset['status']) {
  return useQuery({
    queryKey: ['drive-assets', brand, status],
    queryFn: () => getAssets(brand, status),
    enabled: !!brand,
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

/**
 * Browse files in a specific Drive folder path.
 */
export function useDriveFolder(folderPath: string | undefined) {
  return useQuery({
    queryKey: ['drive-folder', folderPath],
    queryFn: () => listDriveFolder(folderPath!),
    enabled: !!folderPath,
    staleTime: 60 * 1000,
  });
}

/**
 * Scan a brand's "Ready to Post" folders on Google Drive
 * and sync new files into the database.
 */
export function useSyncDriveMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brand: DriveBrand) => {
      // 1. Scan Drive for files in Ready to Post
      const folderGroups = await scanBrandMedia(brand);

      // 2. Sync each folder's files into DB
      let totalCreated = 0;
      let totalSkipped = 0;

      for (const group of folderGroups) {
        const { created, skipped } = await syncDriveAssets(brand, group.files, group.folderPath);
        totalCreated += created;
        totalSkipped += skipped;
      }

      return { totalCreated, totalSkipped, foldersScanned: folderGroups.length };
    },
    onSuccess: (_data, brand) => {
      queryClient.invalidateQueries({ queryKey: ['drive-assets', brand] });
    },
  });
}

/**
 * Mark an asset as used (for scheduling a post).
 */
export function useMarkAssetUsed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetId,
      platform,
      draftId,
    }: {
      assetId: string;
      platform: string;
      draftId?: string;
    }) => {
      await markAssetUsed(assetId, platform, draftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive-assets'] });
    },
  });
}

/**
 * Mark an asset as posted and move the file on Drive.
 */
export function useMarkAssetPosted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, brand }: { assetId: string; brand: DriveBrand }) => {
      await markAssetPosted(assetId, brand);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive-assets'] });
    },
  });
}
