/**
 * Directory Service
 *
 * CRUD operations for managing comedian directory profiles and media.
 * These profiles exist independently of authenticated users.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  DirectoryProfile,
  DirectoryProfileInsert,
  DirectoryProfileUpdate,
  DirectoryMedia,
  DirectoryMediaInsert,
  DirectoryProfileFilters,
  DirectoryProfileWithMedia,
  DirectoryMediaProfile,
  DirectoryMediaProfileInsert,
  DirectoryMediaEvent,
  DirectoryMediaEventInsert,
  DirectoryMediaWithProfiles,
  MediaProfileRole,
} from '@/types/directory';

const DIRECTORY_MEDIA_BUCKET = 'directory-media';

// ============================================================================
// Directory Profiles
// ============================================================================

/**
 * Create a new directory profile
 */
export async function createDirectoryProfile(
  profile: DirectoryProfileInsert
): Promise<DirectoryProfile> {
  const { data, error } = await supabase
    .from('directory_profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create directory profile: ${error.message}`);
  }

  return data as DirectoryProfile;
}

/**
 * Update an existing directory profile
 */
export async function updateDirectoryProfile(
  id: string,
  updates: DirectoryProfileUpdate
): Promise<DirectoryProfile> {
  const { data, error } = await supabase
    .from('directory_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update directory profile: ${error.message}`);
  }

  return data as DirectoryProfile;
}

/**
 * Get a directory profile by ID
 */
export async function getDirectoryProfileById(
  id: string
): Promise<DirectoryProfile | null> {
  const { data, error } = await supabase
    .from('directory_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get directory profile: ${error.message}`);
  }

  return data as DirectoryProfile;
}

/**
 * Get a directory profile by slug
 */
export async function getDirectoryProfileBySlug(
  slug: string
): Promise<DirectoryProfile | null> {
  const { data, error } = await supabase
    .from('directory_profiles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get directory profile: ${error.message}`);
  }

  return data as DirectoryProfile;
}

/**
 * Get a directory profile by email
 */
export async function getDirectoryProfileByEmail(
  email: string
): Promise<DirectoryProfile | null> {
  const { data, error } = await supabase
    .from('directory_profiles')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get directory profile: ${error.message}`);
  }

  return data as DirectoryProfile;
}

/**
 * Get directory profile claimed by a user
 */
export async function getDirectoryProfileByUserId(
  userId: string
): Promise<DirectoryProfile | null> {
  // Use limit(1) since a user might have multiple profiles (comedian + photographer)
  const { data, error } = await supabase
    .from('directory_profiles')
    .select('*')
    .eq('claimed_by', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to get directory profile:', error);
    return null;
  }

  return data as DirectoryProfile | null;
}

/**
 * Search directory profiles with filters
 */
export async function searchDirectoryProfiles(
  filters: DirectoryProfileFilters = {},
  limit = 50,
  offset = 0
): Promise<{ profiles: DirectoryProfile[]; total: number }> {
  let query = supabase
    .from('directory_profiles')
    .select('*', { count: 'exact' });

  // Apply search filter
  if (filters.search) {
    query = query.or(
      `stage_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  // Apply tags filter
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  // Apply unclaimed filter
  if (filters.unclaimed_only) {
    query = query.is('claimed_at', null);
  }

  // Apply import batch filter
  if (filters.import_batch_id) {
    query = query.eq('import_batch_id', filters.import_batch_id);
  }

  // Apply profile type filter
  if (filters.profile_type) {
    query = query.eq('profile_type', filters.profile_type);
  }

  // Apply pagination and ordering
  query = query
    .order('stage_name', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to search directory profiles: ${error.message}`);
  }

  return {
    profiles: (data ?? []) as DirectoryProfile[],
    total: count ?? 0,
  };
}

/**
 * Get directory profile with all media
 */
export async function getDirectoryProfileWithMedia(
  profileId: string
): Promise<DirectoryProfileWithMedia | null> {
  const { data: profile, error: profileError } = await supabase
    .from('directory_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (profileError) {
    if (profileError.code === 'PGRST116') return null;
    throw new Error(`Failed to get directory profile: ${profileError.message}`);
  }

  const { data: media, error: mediaError } = await supabase
    .from('directory_media')
    .select('*')
    .eq('directory_profile_id', profileId)
    .order('is_primary', { ascending: false })
    .order('display_order', { ascending: true });

  if (mediaError) {
    throw new Error(`Failed to get directory media: ${mediaError.message}`);
  }

  return {
    ...(profile as DirectoryProfile),
    media: (media ?? []) as DirectoryMedia[],
    photo_count: media?.length ?? 0,
  };
}

/**
 * Delete a directory profile (cascades to media)
 */
export async function deleteDirectoryProfile(id: string): Promise<void> {
  const { error } = await supabase
    .from('directory_profiles')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete directory profile: ${error.message}`);
  }
}

// ============================================================================
// Directory Media
// ============================================================================

/**
 * Upload a photo to the directory media bucket
 */
export async function uploadDirectoryPhoto(
  profileId: string,
  file: File,
  options: {
    isHeadshot?: boolean;
    isPrimary?: boolean;
    displayOrder?: number;
    tags?: string[];
    title?: string;
  } = {}
): Promise<DirectoryMedia> {
  // Generate storage path: {profile_id}/{type}/{filename}
  const folder = options.isHeadshot ? 'headshots' : 'gallery';
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${profileId}/${folder}/${timestamp}-${safeFileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(DIRECTORY_MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload photo: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(DIRECTORY_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  // Get image dimensions if it's an image
  let width: number | null = null;
  let height: number | null = null;

  if (file.type.startsWith('image/')) {
    try {
      const dimensions = await getImageDimensions(file);
      width = dimensions.width;
      height = dimensions.height;
    } catch {
      // Dimensions optional, continue without them
    }
  }

  // Create media record
  // Default title to filename without extension if not provided
  const defaultTitle = file.name.replace(/\.[^/.]+$/, '');

  const mediaInsert: DirectoryMediaInsert = {
    directory_profile_id: profileId,
    storage_path: storagePath,
    public_url: urlData.publicUrl,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    image_width: width,
    image_height: height,
    media_type: 'photo',
    is_headshot: options.isHeadshot ?? false,
    is_primary: options.isPrimary ?? false,
    display_order: options.displayOrder ?? 0,
    tags: options.tags ?? [],
    source_filename: file.name,
    title: options.title ?? defaultTitle,
  };

  const { data, error } = await supabase
    .from('directory_media')
    .insert(mediaInsert)
    .select()
    .single();

  if (error) {
    // Clean up uploaded file if record creation fails
    await supabase.storage.from(DIRECTORY_MEDIA_BUCKET).remove([storagePath]);
    throw new Error(`Failed to create media record: ${error.message}`);
  }

  // Update profile's primary headshot URL if this is primary
  if (options.isPrimary && options.isHeadshot) {
    await updateDirectoryProfile(profileId, {
      primary_headshot_url: urlData.publicUrl,
    });
  }

  return data as DirectoryMedia;
}

/**
 * Get all media for a directory profile
 */
export async function getDirectoryMedia(
  profileId: string
): Promise<DirectoryMedia[]> {
  const { data, error } = await supabase
    .from('directory_media')
    .select('*')
    .eq('directory_profile_id', profileId)
    .order('is_primary', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to get directory media: ${error.message}`);
  }

  return (data ?? []) as DirectoryMedia[];
}

/**
 * Update media metadata
 */
export async function updateDirectoryMedia(
  mediaId: string,
  updates: Partial<Pick<DirectoryMedia, 'is_headshot' | 'is_primary' | 'display_order' | 'tags' | 'alt_text'>>
): Promise<DirectoryMedia> {
  const { data, error } = await supabase
    .from('directory_media')
    .update(updates)
    .eq('id', mediaId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update directory media: ${error.message}`);
  }

  return data as DirectoryMedia;
}

/**
 * Set a photo as the primary headshot
 */
export async function setPrimaryHeadshot(
  profileId: string,
  mediaId: string
): Promise<void> {
  // First, unset any existing primary
  await supabase
    .from('directory_media')
    .update({ is_primary: false })
    .eq('directory_profile_id', profileId)
    .eq('is_headshot', true);

  // Set the new primary
  const { data, error } = await supabase
    .from('directory_media')
    .update({ is_primary: true, is_headshot: true })
    .eq('id', mediaId)
    .select('public_url')
    .single();

  if (error) {
    throw new Error(`Failed to set primary headshot: ${error.message}`);
  }

  // Update profile's primary_headshot_url
  if (data?.public_url) {
    await updateDirectoryProfile(profileId, {
      primary_headshot_url: data.public_url as string,
    });
  }
}

/**
 * Delete a media item
 */
export async function deleteDirectoryMedia(mediaId: string): Promise<void> {
  // Get the media record first
  const { data: media, error: getError } = await supabase
    .from('directory_media')
    .select('storage_path, directory_profile_id, is_primary')
    .eq('id', mediaId)
    .single();

  if (getError) {
    throw new Error(`Failed to get media for deletion: ${getError.message}`);
  }

  // Delete from storage
  if (media?.storage_path) {
    await supabase.storage
      .from(DIRECTORY_MEDIA_BUCKET)
      .remove([media.storage_path]);
  }

  // Delete the record
  const { error } = await supabase
    .from('directory_media')
    .delete()
    .eq('id', mediaId);

  if (error) {
    throw new Error(`Failed to delete directory media: ${error.message}`);
  }

  // If this was the primary headshot, clear the profile's primary_headshot_url
  if (media?.is_primary && media?.directory_profile_id) {
    await updateDirectoryProfile(media.directory_profile_id, {
      primary_headshot_url: null,
    });
  }
}

// ============================================================================
// Multi-Profile Photo Functions (Junction Tables)
// ============================================================================

/**
 * Get all profiles linked to a photo
 */
export async function getMediaProfiles(
  mediaId: string
): Promise<Array<{ profile: DirectoryProfile; link: DirectoryMediaProfile }>> {
  const { data, error } = await supabase
    .from('directory_media_profiles')
    .select(`
      *,
      profile:directory_profiles(*)
    `)
    .eq('media_id', mediaId)
    .order('is_primary_subject', { ascending: false });

  if (error) {
    throw new Error(`Failed to get media profiles: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    profile: row.profile as DirectoryProfile,
    link: {
      id: row.id,
      media_id: row.media_id,
      profile_id: row.profile_id,
      role: row.role,
      is_primary_subject: row.is_primary_subject,
      can_use_for_promo: row.can_use_for_promo,
      added_by: row.added_by,
      added_at: row.added_at,
    } as DirectoryMediaProfile,
  }));
}

/**
 * Get all photos linked to a profile (via junction table)
 * By default only returns approved tags - set includeAll=true for all
 */
export async function getProfileMediaViaJunction(
  profileId: string,
  approvedOnly = true
): Promise<DirectoryMedia[]> {
  let query = supabase
    .from('directory_media_profiles')
    .select(`
      media:directory_media(*)
    `)
    .eq('profile_id', profileId);

  if (approvedOnly) {
    query = query.eq('approval_status', 'approved');
  }

  const { data, error } = await query.order('added_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get profile media: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => row.media as DirectoryMedia)
    .filter((media): media is DirectoryMedia => media !== null);
}

/**
 * Link a profile to a photo
 */
export async function addMediaProfile(
  insert: DirectoryMediaProfileInsert
): Promise<DirectoryMediaProfile> {
  const { data, error } = await supabase
    .from('directory_media_profiles')
    .insert(insert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add media profile link: ${error.message}`);
  }

  return data as DirectoryMediaProfile;
}

/**
 * Remove a profile link from a photo
 */
export async function removeMediaProfile(
  mediaId: string,
  profileId: string
): Promise<void> {
  const { error } = await supabase
    .from('directory_media_profiles')
    .delete()
    .eq('media_id', mediaId)
    .eq('profile_id', profileId);

  if (error) {
    throw new Error(`Failed to remove media profile link: ${error.message}`);
  }
}

/**
 * Update a profile link on a photo
 */
export async function updateMediaProfile(
  mediaId: string,
  profileId: string,
  updates: Partial<Pick<DirectoryMediaProfile, 'role' | 'is_primary_subject' | 'can_use_for_promo'>>
): Promise<DirectoryMediaProfile> {
  const { data, error } = await supabase
    .from('directory_media_profiles')
    .update(updates)
    .eq('media_id', mediaId)
    .eq('profile_id', profileId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update media profile link: ${error.message}`);
  }

  return data as DirectoryMediaProfile;
}

/**
 * Get pending photo tags for a profile to review
 */
export async function getPendingTagsForProfile(
  profileId: string
): Promise<Array<{ media: DirectoryMedia; link: DirectoryMediaProfile }>> {
  const { data, error } = await supabase
    .from('directory_media_profiles')
    .select(`
      *,
      media:directory_media(*)
    `)
    .eq('profile_id', profileId)
    .eq('approval_status', 'pending')
    .order('added_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get pending tags: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    media: row.media as DirectoryMedia,
    link: {
      id: row.id,
      media_id: row.media_id,
      profile_id: row.profile_id,
      role: row.role,
      is_primary_subject: row.is_primary_subject,
      can_use_for_promo: row.can_use_for_promo,
      added_by: row.added_by,
      added_at: row.added_at,
      approval_status: row.approval_status,
      responded_at: row.responded_at,
    } as DirectoryMediaProfile,
  }));
}

/**
 * Approve or reject a photo tag
 */
export async function respondToTag(
  mediaId: string,
  profileId: string,
  approved: boolean
): Promise<DirectoryMediaProfile> {
  const { data, error } = await supabase
    .from('directory_media_profiles')
    .update({
      approval_status: approved ? 'approved' : 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('media_id', mediaId)
    .eq('profile_id', profileId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to respond to tag: ${error.message}`);
  }

  return data as DirectoryMediaProfile;
}

/**
 * Get count of pending tags for a profile (for badge notification)
 */
export async function getPendingTagCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('directory_media_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('approval_status', 'pending');

  if (error) {
    throw new Error(`Failed to get pending tag count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Link a photo to an event
 */
export async function addMediaEvent(
  insert: DirectoryMediaEventInsert
): Promise<DirectoryMediaEvent> {
  const { data, error } = await supabase
    .from('directory_media_events')
    .insert(insert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add media event link: ${error.message}`);
  }

  return data as DirectoryMediaEvent;
}

/**
 * Get event link for a photo
 */
export async function getMediaEvent(
  mediaId: string
): Promise<DirectoryMediaEvent | null> {
  const { data, error } = await supabase
    .from('directory_media_events')
    .select('*')
    .eq('media_id', mediaId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get media event: ${error.message}`);
  }

  return data as DirectoryMediaEvent | null;
}

/**
 * Remove event link from a photo
 */
export async function removeMediaEvent(mediaId: string): Promise<void> {
  const { error } = await supabase
    .from('directory_media_events')
    .delete()
    .eq('media_id', mediaId);

  if (error) {
    throw new Error(`Failed to remove media event link: ${error.message}`);
  }
}

/**
 * Get a photo with all linked profiles and event info
 */
export async function getMediaWithProfiles(
  mediaId: string
): Promise<DirectoryMediaWithProfiles | null> {
  // Get the base media
  const { data: media, error: mediaError } = await supabase
    .from('directory_media')
    .select('*')
    .eq('id', mediaId)
    .single();

  if (mediaError) {
    if (mediaError.code === 'PGRST116') return null;
    throw new Error(`Failed to get media: ${mediaError.message}`);
  }

  // Get linked profiles
  const { data: profileLinks, error: profilesError } = await supabase
    .from('directory_media_profiles')
    .select(`
      role,
      is_primary_subject,
      profile:directory_profiles(*)
    `)
    .eq('media_id', mediaId)
    .order('is_primary_subject', { ascending: false });

  if (profilesError) {
    throw new Error(`Failed to get media profiles: ${profilesError.message}`);
  }

  // Get event link
  const { data: eventLink } = await supabase
    .from('directory_media_events')
    .select('*')
    .eq('media_id', mediaId)
    .maybeSingle();

  return {
    ...(media as DirectoryMedia),
    profiles: (profileLinks ?? []).map((link) => ({
      profile: link.profile as DirectoryProfile,
      role: link.role as MediaProfileRole | null,
      is_primary_subject: link.is_primary_subject,
    })),
    event: eventLink as DirectoryMediaEvent | null,
  };
}

/**
 * Bulk add profile links to a photo
 */
export async function bulkAddMediaProfiles(
  mediaId: string,
  profileIds: string[],
  role: MediaProfileRole = 'performer'
): Promise<DirectoryMediaProfile[]> {
  const inserts: DirectoryMediaProfileInsert[] = profileIds.map((profileId, index) => ({
    media_id: mediaId,
    profile_id: profileId,
    role,
    is_primary_subject: index === 0, // First profile is primary
    can_use_for_promo: true,
  }));

  const { data, error } = await supabase
    .from('directory_media_profiles')
    .insert(inserts)
    .select();

  if (error) {
    throw new Error(`Failed to bulk add media profiles: ${error.message}`);
  }

  return (data ?? []) as DirectoryMediaProfile[];
}

/**
 * Get all photos for a venue (via event links)
 */
export async function getVenuePhotos(
  venueId: string,
  limit = 50,
  offset = 0
): Promise<{ photos: DirectoryMedia[]; total: number }> {
  const { data, error, count } = await supabase
    .from('directory_media_events')
    .select(`
      media:directory_media(*)
    `, { count: 'exact' })
    .eq('venue_id', venueId)
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get venue photos: ${error.message}`);
  }

  return {
    photos: (data ?? [])
      .map((row) => row.media as DirectoryMedia)
      .filter((media): media is DirectoryMedia => media !== null),
    total: count ?? 0,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a slug from a stage name
 */
export function generateSlug(stageName: string): string {
  return stageName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get image dimensions from a File
 */
function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get random headshots for automation (e.g., event lineups)
 */
export async function getRandomHeadshots(
  count = 5,
  tags?: string[]
): Promise<Array<{
  profile_id: string;
  stage_name: string;
  slug: string;
  headshot_url: string;
}>> {
  // Use the database function for efficient random selection
  const { data, error } = await supabase.rpc('get_random_directory_headshots', {
    p_count: count,
    p_tags: tags ?? null,
  });

  if (error) {
    throw new Error(`Failed to get random headshots: ${error.message}`);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    profile_id: row.profile_id as string,
    stage_name: row.stage_name as string,
    slug: row.slug as string,
    headshot_url: row.headshot_url as string,
  }));
}

// ============================================================================
// Export as service object
// ============================================================================

export const directoryService = {
  // Profiles
  createProfile: createDirectoryProfile,
  updateProfile: updateDirectoryProfile,
  getProfileById: getDirectoryProfileById,
  getProfileBySlug: getDirectoryProfileBySlug,
  getProfileByEmail: getDirectoryProfileByEmail,
  searchProfiles: searchDirectoryProfiles,
  getProfileWithMedia: getDirectoryProfileWithMedia,
  deleteProfile: deleteDirectoryProfile,

  // Media
  uploadPhoto: uploadDirectoryPhoto,
  getMedia: getDirectoryMedia,
  updateMedia: updateDirectoryMedia,
  setPrimaryHeadshot,
  deleteMedia: deleteDirectoryMedia,

  // Multi-Profile Photos (Junction Tables)
  getMediaProfiles,
  getProfileMediaViaJunction,
  addMediaProfile,
  removeMediaProfile,
  updateMediaProfile,
  addMediaEvent,
  getMediaEvent,
  removeMediaEvent,
  getMediaWithProfiles,
  bulkAddMediaProfiles,
  getVenuePhotos,

  // Photo Tag Approvals
  getPendingTagsForProfile,
  respondToTag,
  getPendingTagCount,
  getDirectoryProfileByUserId,

  // Utilities
  generateSlug,
  getRandomHeadshots,
};
