import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export interface StorageFile {
  id: string;
  name: string;
  bucket: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  publicUrl: string;
  isImage: boolean;
}

export interface StorageFolder {
  name: string;
  path: string;
}

interface ListResult {
  files: StorageFile[];
  folders: StorageFolder[];
}

// Map virtual paths to real bucket/path
function translatePath(virtualPath: string, userId: string): { bucket: string; path: string } | null {
  const normalized = virtualPath.replace(/^\/+/, '').replace(/\/+$/, '');

  // Root level
  if (!normalized || normalized === 'my-files') {
    return null; // Virtual folder, no bucket mapping
  }

  // my-files/profile/* → media-library bucket (unified storage)
  if (normalized === 'my-files/profile' || normalized.startsWith('my-files/profile/')) {
    const rest = normalized.slice('my-files/profile'.length).replace(/^\//, '');
    return {
      bucket: 'media-library',
      path: `${userId}/my-files/profile${rest ? '/' + rest : ''}`
    };
  }

  // my-files/media/* → media-library bucket
  if (normalized === 'my-files/media' || normalized.startsWith('my-files/media/')) {
    const rest = normalized.slice('my-files/media'.length).replace(/^\//, '');
    return {
      bucket: 'media-library',
      path: `${userId}/my-files/media${rest ? '/' + rest : ''}`
    };
  }

  // my-files/events/* → media-library bucket (event-related media)
  if (normalized === 'my-files/events' || normalized.startsWith('my-files/events/')) {
    const rest = normalized.slice('my-files/events'.length).replace(/^\//, '');
    return {
      bucket: 'media-library',
      path: `${userId}/my-files/events${rest ? '/' + rest : ''}`
    };
  }

  return null;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

function isImageFile(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function getMimeType(name: string): string {
  const ext = name.toLowerCase().split('.').pop();
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'pdf': 'application/pdf',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
  };
  return mimeMap[ext || ''] || 'application/octet-stream';
}

export function useMediaStorage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listFiles = useCallback(async (virtualPath: string): Promise<ListResult> => {
    if (!user) {
      return { files: [], folders: [] };
    }

    setLoading(true);
    setError(null);

    try {
      const normalized = virtualPath.replace(/^\/+/, '').replace(/\/+$/, '');

      // Root level - return virtual folders
      if (!normalized) {
        return {
          files: [],
          folders: [{ name: 'my-files', path: 'my-files' }]
        };
      }

      // my-files level - return virtual subfolders
      if (normalized === 'my-files') {
        return {
          files: [],
          folders: [
            { name: 'profile', path: 'my-files/profile' },
            { name: 'events', path: 'my-files/events' },
            { name: 'media', path: 'my-files/media' }
          ]
        };
      }

      // my-files/profile level - return organized subfolders
      if (normalized === 'my-files/profile') {
        return {
          files: [],
          folders: [
            { name: 'Profile Images', path: 'my-files/profile/Profile Images' },
            { name: 'Headshots', path: 'my-files/profile/Headshots' },
            { name: 'Profile Banners', path: 'my-files/profile/Profile Banners' },
            { name: 'Link Thumbnails', path: 'my-files/profile/Link Thumbnails' }
          ]
        };
      }

      // my-files/events level - return organized subfolders
      if (normalized === 'my-files/events') {
        return {
          files: [],
          folders: [
            { name: 'Event Banners', path: 'my-files/events/Event Banners' }
          ]
        };
      }

      // Real storage path
      const translated = translatePath(normalized, user.id);
      if (!translated) {
        return { files: [], folders: [] };
      }

      const files: StorageFile[] = [];
      const folders: StorageFolder[] = [];

      // Helper to process storage items into our format
      const processStorageItems = (
        items: any[],
        bucket: string,
        basePath: string
      ) => {
        for (const item of items) {
          if (item.id === null) {
            // It's a folder (no id means folder placeholder)
            const folderPath = `${normalized}/${item.name}`;
            // Only add if not already present
            if (!folders.some(f => f.path === folderPath)) {
              folders.push({ name: item.name, path: folderPath });
            }
          } else {
            // It's a file
            const fullPath = `${basePath}/${item.name}`;
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(fullPath);

            // Only add if not already present (avoid duplicates by publicUrl)
            if (!files.some(f => f.publicUrl === urlData.publicUrl)) {
              files.push({
                id: item.id,
                name: item.name,
                bucket: bucket,
                path: fullPath,
                size: item.metadata?.size || 0,
                mimeType: item.metadata?.mimetype || getMimeType(item.name),
                createdAt: item.created_at,
                updatedAt: item.updated_at || item.created_at,
                publicUrl: urlData.publicUrl,
                isImage: isImageFile(item.name)
              });
            }
          }
        }
      };

      // List from primary bucket (media-library)
      const { data: primaryData, error: primaryError } = await supabase.storage
        .from(translated.bucket)
        .list(translated.path, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!primaryError && primaryData) {
        processStorageItems(primaryData, translated.bucket, translated.path);
      }

      // For Headshots folder, also check legacy comedian-media bucket
      if (normalized === 'my-files/profile/Headshots') {
        // Legacy path: comedian-media/{userId}/Headshots/{userId}/...
        const legacyPath = `${user.id}/Headshots/${user.id}`;
        const { data: legacyData, error: legacyError } = await supabase.storage
          .from('comedian-media')
          .list(legacyPath, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (!legacyError && legacyData) {
          processStorageItems(legacyData, 'comedian-media', legacyPath);
        }

        // Also check simpler legacy path: comedian-media/{userId}/Headshots/...
        const simpleLegacyPath = `${user.id}/Headshots`;
        const { data: simpleLegacyData } = await supabase.storage
          .from('comedian-media')
          .list(simpleLegacyPath, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (simpleLegacyData) {
          // Filter out folders that are actually the nested userId folder
          const filteredData = simpleLegacyData.filter(item =>
            item.id !== null || item.name !== user.id
          );
          processStorageItems(filteredData, 'comedian-media', simpleLegacyPath);
        }
      }

      // For Profile Banners, check legacy bucket too
      if (normalized === 'my-files/profile/Profile Banners') {
        const legacyPath = `${user.id}/banners`;
        const { data: legacyData } = await supabase.storage
          .from('comedian-media')
          .list(legacyPath, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (legacyData) {
          processStorageItems(legacyData, 'comedian-media', legacyPath);
        }
      }

      return { files, folders };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list files';
      setError(message);
      return { files: [], folders: [] };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const uploadFile = useCallback(async (
    virtualPath: string,
    file: File
  ): Promise<StorageFile | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const translated = translatePath(virtualPath, user.id);
      if (!translated) {
        throw new Error('Invalid upload path');
      }

      const filePath = `${translated.path}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(translated.bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(translated.bucket)
        .getPublicUrl(filePath);

      return {
        id: crypto.randomUUID(),
        name: file.name,
        bucket: translated.bucket,
        path: filePath,
        size: file.size,
        mimeType: file.type || getMimeType(file.name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publicUrl: urlData.publicUrl,
        isImage: isImageFile(file.name)
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteFile = useCallback(async (file: StorageFile): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase.storage
        .from(file.bucket)
        .remove([file.path]);

      if (deleteError) throw deleteError;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const renameFile = useCallback(async (
    file: StorageFile,
    newName: string
  ): Promise<StorageFile | null> => {
    setLoading(true);
    setError(null);

    try {
      // S3/Supabase doesn't have native rename - must copy then delete
      const oldPath = file.path;
      const pathParts = oldPath.split('/');
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join('/');

      const { error: copyError } = await supabase.storage
        .from(file.bucket)
        .copy(oldPath, newPath);

      if (copyError) throw copyError;

      const { error: deleteError } = await supabase.storage
        .from(file.bucket)
        .remove([oldPath]);

      if (deleteError) {
        console.warn('Failed to delete old file after rename:', deleteError);
      }

      const { data: urlData } = supabase.storage
        .from(file.bucket)
        .getPublicUrl(newPath);

      return {
        ...file,
        name: newName,
        path: newPath,
        publicUrl: urlData.publicUrl,
        updatedAt: new Date().toISOString()
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename file';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfilePic = useCallback(async (file: StorageFile): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: file.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Invalidate profile queries to trigger UI refresh
      queryClient.invalidateQueries({ queryKey: ['comedian-profile-by-slug'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile picture';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, queryClient]);

  const updateBanner = useCallback(async (file: StorageFile): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banner_url: file.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Invalidate profile queries to trigger UI refresh
      queryClient.invalidateQueries({ queryKey: ['comedian-profile-by-slug'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update banner';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, queryClient]);

  const saveEditedImage = useCallback(async (
    file: StorageFile,
    editedBlob: Blob
  ): Promise<StorageFile | null> => {
    setLoading(true);
    setError(null);

    try {
      // Generate new filename with _edited suffix (keep original intact)
      const nameParts = file.name.split('.');
      const ext = nameParts.length > 1 ? nameParts.pop() : 'jpg';
      const baseName = nameParts.join('.');
      const timestamp = Date.now();
      const newFileName = `${baseName}_edited_${timestamp}.${ext}`;

      // Build new path
      const pathParts = file.path.split('/');
      pathParts[pathParts.length - 1] = newFileName;
      const newPath = pathParts.join('/');

      const { error: uploadError } = await supabase.storage
        .from(file.bucket)
        .upload(newPath, editedBlob, { upsert: false });

      if (uploadError) throw uploadError;

      // Return the new file info
      const { data: urlData } = supabase.storage
        .from(file.bucket)
        .getPublicUrl(newPath);

      return {
        id: crypto.randomUUID(),
        name: newFileName,
        bucket: file.bucket,
        path: newPath,
        size: editedBlob.size,
        mimeType: editedBlob.type || file.mimeType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publicUrl: urlData.publicUrl,
        isImage: true
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save edited image';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    listFiles,
    uploadFile,
    deleteFile,
    renameFile,
    updateProfilePic,
    updateBanner,
    saveEditedImage
  };
}
