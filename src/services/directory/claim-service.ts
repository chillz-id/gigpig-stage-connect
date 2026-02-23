/**
 * Directory Profile Claim Service
 *
 * Handles the flow when a comedian signs up and wants to claim their
 * pre-existing directory profile. Copies photos to their media library
 * and links the profiles.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  DirectoryProfile,
  DirectoryMedia,
  ClaimableProfile,
  ClaimResult,
} from '@/types/directory';

/**
 * Find claimable directory profiles by email
 */
export async function findClaimableProfile(
  email: string
): Promise<ClaimableProfile | null> {
  const { data, error } = await supabase
    .from('directory_profiles')
    .select(`
      id,
      stage_name,
      email,
      short_bio,
      primary_headshot_url,
      directory_media(id)
    `)
    .ilike('email', email.toLowerCase().trim())
    .is('claimed_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to find claimable profile: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    stage_name: data.stage_name,
    email: data.email ?? '',
    short_bio: data.short_bio,
    primary_headshot_url: data.primary_headshot_url,
    photo_count: (data.directory_media as unknown[])?.length ?? 0,
  };
}

/**
 * Claim a directory profile for a comedian
 *
 * This will:
 * 1. Link the directory profile to the comedian profile
 * 2. Copy all photos from directory_media to the comedian's media library
 * 3. Update the comedian profile with imported data
 * 4. Mark the directory profile as claimed
 */
export async function claimDirectoryProfile(
  directoryProfileId: string,
  comedianId: string,
  userId: string
): Promise<ClaimResult> {
  try {
    // Get the directory profile with all media
    const { data: dirProfile, error: profileError } = await supabase
      .from('directory_profiles')
      .select('*')
      .eq('id', directoryProfileId)
      .is('claimed_at', null) // Must not already be claimed
      .single();

    if (profileError || !dirProfile) {
      return {
        success: false,
        error: 'Directory profile not found or already claimed',
      };
    }

    // Get all directory media for this profile
    const { data: dirMedia, error: mediaError } = await supabase
      .from('directory_media')
      .select('*')
      .eq('directory_profile_id', directoryProfileId);

    if (mediaError) {
      return {
        success: false,
        error: `Failed to fetch media: ${mediaError.message}`,
      };
    }

    // Copy photos to comedian's media library
    let photosCopied = 0;

    if (dirMedia && dirMedia.length > 0) {
      for (const media of dirMedia as DirectoryMedia[]) {
        try {
          // Copy from directory-media bucket to comedian-media bucket
          const newPath = `${userId}/${media.is_headshot ? 'headshots' : 'gallery'}/${Date.now()}-${media.file_name}`;

          // Download from directory-media
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('directory-media')
            .download(media.storage_path);

          if (downloadError || !fileData) {
            console.error(`Failed to download ${media.storage_path}:`, downloadError);
            continue;
          }

          // Upload to comedian-media bucket
          const { error: uploadError } = await supabase.storage
            .from('comedian-media')
            .upload(newPath, fileData, {
              contentType: media.file_type,
              upsert: false,
            });

          if (uploadError) {
            console.error(`Failed to upload to ${newPath}:`, uploadError);
            continue;
          }

          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('comedian-media')
            .getPublicUrl(newPath);

          // Create media record for comedian
          await supabase.from('comedian_media').insert({
            user_id: userId,
            comedian_id: comedianId,
            storage_path: newPath,
            public_url: urlData.publicUrl,
            file_name: media.file_name,
            file_type: media.file_type,
            file_size: media.file_size,
            image_width: media.image_width,
            image_height: media.image_height,
            media_type: media.media_type,
            is_headshot: media.is_headshot,
            is_primary: media.is_primary,
            display_order: media.display_order,
            tags: media.tags,
            alt_text: media.alt_text,
            source: 'directory_claim',
          });

          photosCopied++;
        } catch {
          // Continue with other photos if one fails
          console.error(`Failed to copy media ${media.id}`);
        }
      }
    }

    // Update comedian profile with directory data
    const updateData: Record<string, unknown> = {};

    if (dirProfile.short_bio && !updateData.bio) {
      updateData.short_bio = dirProfile.short_bio;
    }
    if (dirProfile.long_bio && !updateData.long_bio) {
      updateData.long_bio = dirProfile.long_bio;
    }
    if (dirProfile.origin_city && !updateData.origin_city) {
      updateData.origin_city = dirProfile.origin_city;
    }
    if (dirProfile.origin_country && !updateData.origin_country) {
      updateData.origin_country = dirProfile.origin_country;
    }
    if (dirProfile.website && !updateData.website) {
      updateData.website = dirProfile.website;
    }
    if (dirProfile.booking_email && !updateData.booking_email) {
      updateData.booking_email = dirProfile.booking_email;
    }
    if (dirProfile.instagram_url && !updateData.instagram_url) {
      updateData.instagram_url = dirProfile.instagram_url;
    }
    if (dirProfile.tiktok_url && !updateData.tiktok_url) {
      updateData.tiktok_url = dirProfile.tiktok_url;
    }
    if (dirProfile.youtube_url && !updateData.youtube_url) {
      updateData.youtube_url = dirProfile.youtube_url;
    }
    if (dirProfile.facebook_url && !updateData.facebook_url) {
      updateData.facebook_url = dirProfile.facebook_url;
    }

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('comedians')
        .update(updateData)
        .eq('id', comedianId);
    }

    // If primary headshot was set, update comedian's primary headshot
    if (dirProfile.primary_headshot_url) {
      // Find the copied primary headshot
      const { data: primaryMedia } = await supabase
        .from('comedian_media')
        .select('public_url')
        .eq('comedian_id', comedianId)
        .eq('is_primary', true)
        .eq('is_headshot', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (primaryMedia?.public_url) {
        await supabase
          .from('comedians')
          .update({ primary_headshot_url: primaryMedia.public_url })
          .eq('id', comedianId);
      }
    }

    // Mark directory profile as claimed
    await supabase
      .from('directory_profiles')
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by: userId,
        comedians_id: comedianId,
      })
      .eq('id', directoryProfileId);

    return {
      success: true,
      comedian_id: comedianId,
      photos_copied: photosCopied,
    };
  } catch (error) {
    console.error('Claim process failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a user has any claimable profiles
 * Call this after signup/login to prompt the user
 */
export async function checkForClaimableProfiles(
  email: string
): Promise<ClaimableProfile[]> {
  const { data, error } = await supabase
    .from('directory_profiles')
    .select(`
      id,
      stage_name,
      email,
      short_bio,
      primary_headshot_url,
      directory_media(id)
    `)
    .ilike('email', email.toLowerCase().trim())
    .is('claimed_at', null);

  if (error) {
    console.error('Failed to check claimable profiles:', error);
    return [];
  }

  return (data ?? []).map(d => ({
    id: d.id,
    stage_name: d.stage_name,
    email: d.email ?? '',
    short_bio: d.short_bio,
    primary_headshot_url: d.primary_headshot_url,
    photo_count: (d.directory_media as unknown[])?.length ?? 0,
  }));
}

// Export as service object
export const directoryClaimService = {
  findClaimableProfile,
  claimDirectoryProfile,
  checkForClaimableProfiles,
};
