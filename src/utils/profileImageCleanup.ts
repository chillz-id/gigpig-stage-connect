import { supabase } from '@/integrations/supabase/client';

/**
 * Deletes old profile images for a user, keeping only the current and previous one
 * @param userId - The user's ID
 * @param currentImagePath - The path of the current/new image to keep
 * @returns Number of images deleted
 */
export async function cleanupOldProfileImages(
  userId: string,
  currentImagePath: string
): Promise<number> {
  try {
    // List all files in the user's profile images folder
    const { data: files, error: listError } = await supabase.storage
      .from('profile-images')
      .list(userId, {
        limit: 100,
        offset: 0,
      });

    if (listError) {
      console.error('Error listing profile images:', listError);
      return 0;
    }

    if (!files || files.length <= 2) {
      // If we have 2 or fewer images, don't delete anything
      return 0;
    }

    // Filter only image files and exclude the current one
    const imageFiles = files
      .filter(file => {
        const fullPath = `${userId}/${file.name}`;
        return (
          fullPath !== currentImagePath &&
          file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)
        );
      })
      // Sort by name (which includes timestamp) to get chronological order
      .sort((a, b) => b.name.localeCompare(a.name));

    if (imageFiles.length <= 1) {
      // We want to keep at least 1 previous image
      return 0;
    }

    // Keep the most recent previous image, delete all others
    const filesToDelete = imageFiles
      .slice(1) // Skip the most recent one
      .map(file => `${userId}/${file.name}`);

    if (filesToDelete.length === 0) {
      return 0;
    }
    
    const { error: deleteError } = await supabase.storage
      .from('profile-images')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('Error deleting old profile images:', deleteError);
      return 0;
    }

    console.log(`Cleaned up ${filesToDelete.length} old profile images for user ${userId}, kept the previous one as fallback`);
    return filesToDelete.length;
  } catch (error) {
    console.error('Profile image cleanup failed:', error);
    return 0;
  }
}

/**
 * Alternative approach: Use a consistent filename to automatically overwrite
 * This is simpler but doesn't allow rollback to previous images
 */
export function getConsistentProfileImagePath(userId: string): string {
  return `${userId}/profile.png`;
}

/**
 * Keep only the last N profile images for a user
 * @param userId - The user's ID
 * @param keepCount - Number of recent images to keep (default: 3)
 */
export async function pruneProfileImages(
  userId: string,
  keepCount: number = 3
): Promise<number> {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('profile-images')
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: {
          column: 'created_at',
          order: 'desc'
        }
      });

    if (listError || !files) {
      return 0;
    }

    // Filter only image files
    const imageFiles = files.filter(file =>
      file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)
    );

    // If we have more than keepCount images, delete the oldest ones
    if (imageFiles.length > keepCount) {
      const filesToDelete = imageFiles
        .slice(keepCount)
        .map(file => `${userId}/${file.name}`);

      const { error: deleteError } = await supabase.storage
        .from('profile-images')
        .remove(filesToDelete);

      if (!deleteError) {
        return filesToDelete.length;
      }
    }

    return 0;
  } catch (error) {
    console.error('Profile image pruning failed:', error);
    return 0;
  }
}