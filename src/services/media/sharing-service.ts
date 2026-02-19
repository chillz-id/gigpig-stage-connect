/**
 * Media Sharing Service
 *
 * Handles sharing albums and media items with other users, profiles, and organizations.
 */

import { supabase } from '@/integrations/supabase/client';

export type ShareResourceType = 'album' | 'media';
export type ShareTargetType = 'user' | 'profile' | 'organization';
export type ShareStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export interface MediaShare {
  id: string;
  resource_type: ShareResourceType;
  album_id?: string;
  media_id?: string;
  shared_by: string;
  shared_with_type: ShareTargetType;
  shared_with_user_id?: string;
  shared_with_profile_id?: string;
  shared_with_org_id?: string;
  status: ShareStatus;
  can_copy: boolean;
  message?: string;
  shared_at: string;
  responded_at?: string;
}

export interface ShareWithDetails extends MediaShare {
  // Shared by info
  sharer?: {
    id: string;
    email?: string;
    stage_name?: string;
  };
  // What is shared
  album?: {
    id: string;
    name: string;
    cover_url?: string;
    item_count?: number;
  };
  media?: {
    id: string;
    file_name: string;
    public_url?: string;
  };
  // Target info
  target?: {
    id: string;
    name: string;
    type: ShareTargetType;
  };
}

interface ShareOptions {
  canCopy?: boolean;
  message?: string;
}

class SharingService {
  /**
   * Share an album with a user, profile, or organization
   */
  async shareAlbum(
    albumId: string,
    targetType: ShareTargetType,
    targetId: string,
    options: ShareOptions = {}
  ): Promise<MediaShare> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const shareData: Record<string, unknown> = {
      resource_type: 'album',
      album_id: albumId,
      shared_by: user.user.id,
      shared_with_type: targetType,
      can_copy: options.canCopy ?? true,
      message: options.message,
    };

    // Set the appropriate target field
    switch (targetType) {
      case 'user':
        shareData.shared_with_user_id = targetId;
        break;
      case 'profile':
        shareData.shared_with_profile_id = targetId;
        break;
      case 'organization':
        shareData.shared_with_org_id = targetId;
        break;
    }

    const { data, error } = await supabase
      .from('media_shares')
      .insert(shareData)
      .select()
      .single();

    if (error) throw error;
    return data as MediaShare;
  }

  /**
   * Share individual media with a user, profile, or organization
   */
  async shareMedia(
    mediaId: string,
    targetType: ShareTargetType,
    targetId: string,
    options: ShareOptions = {}
  ): Promise<MediaShare> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const shareData: Record<string, unknown> = {
      resource_type: 'media',
      media_id: mediaId,
      shared_by: user.user.id,
      shared_with_type: targetType,
      can_copy: options.canCopy ?? true,
      message: options.message,
    };

    // Set the appropriate target field
    switch (targetType) {
      case 'user':
        shareData.shared_with_user_id = targetId;
        break;
      case 'profile':
        shareData.shared_with_profile_id = targetId;
        break;
      case 'organization':
        shareData.shared_with_org_id = targetId;
        break;
    }

    const { data, error } = await supabase
      .from('media_shares')
      .insert(shareData)
      .select()
      .single();

    if (error) throw error;
    return data as MediaShare;
  }

  /**
   * Revoke a share
   */
  async revokeShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('media_shares')
      .update({ status: 'revoked' })
      .eq('id', shareId);

    if (error) throw error;
  }

  /**
   * Delete a share entirely
   */
  async deleteShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('media_shares')
      .delete()
      .eq('id', shareId);

    if (error) throw error;
  }

  /**
   * Get shares that have been shared with the current user
   */
  async getSharesSharedWithMe(userId: string): Promise<ShareWithDetails[]> {
    // Get user's profile IDs
    const { data: profiles } = await supabase
      .from('directory_profiles')
      .select('id')
      .eq('claimed_by', userId);

    const profileIds = profiles?.map(p => p.id) || [];

    // Get user's organization IDs
    const { data: orgs } = await supabase
      .from('organization_team_members')
      .select('organization_id')
      .eq('user_id', userId);

    const orgIds = orgs?.map(o => o.organization_id) || [];

    // Build the query to get all shares for this user
    let query = supabase
      .from('media_shares')
      .select(`
        *,
        album:media_albums(id, name, cover_media_id),
        media:media_files(id, file_name, public_url, storage_path)
      `)
      .neq('status', 'revoked');

    // We need to use OR conditions for multiple targets
    const orConditions: string[] = [`shared_with_user_id.eq.${userId}`];

    if (profileIds.length > 0) {
      orConditions.push(`shared_with_profile_id.in.(${profileIds.join(',')})`);
    }

    if (orgIds.length > 0) {
      orConditions.push(`shared_with_org_id.in.(${orgIds.join(',')})`);
    }

    query = query.or(orConditions.join(','));

    const { data, error } = await query.order('shared_at', { ascending: false });

    if (error) throw error;

    // Get album cover URLs and item counts
    const shares = (data || []) as ShareWithDetails[];
    for (const share of shares) {
      if (share.album) {
        // Get item count
        const { count } = await supabase
          .from('media_album_items')
          .select('*', { count: 'exact', head: true })
          .eq('album_id', share.album.id);

        (share.album as Record<string, unknown>).item_count = count || 0;

        // Get cover URL if there's a cover media
        if ((share.album as Record<string, unknown>).cover_media_id) {
          const { data: coverMedia } = await supabase
            .from('media_files')
            .select('public_url, storage_path')
            .eq('id', (share.album as Record<string, unknown>).cover_media_id as string)
            .single();

          if (coverMedia) {
            // Determine bucket from storage_path
            const bucket = coverMedia.storage_path?.startsWith('directory-media/')
              ? 'directory-media'
              : 'media-library';
            (share.album as Record<string, unknown>).cover_url = coverMedia.public_url ||
              `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${coverMedia.storage_path}`;
          }
        }
      }
    }

    return shares;
  }

  /**
   * Get shares that I am sharing with others
   */
  async getSharesIAmSharing(userId: string): Promise<ShareWithDetails[]> {
    const { data, error } = await supabase
      .from('media_shares')
      .select(`
        *,
        album:media_albums(id, name, cover_media_id),
        media:media_files(id, file_name, public_url, storage_path)
      `)
      .eq('shared_by', userId)
      .neq('status', 'revoked')
      .order('shared_at', { ascending: false });

    if (error) throw error;

    // Enrich with target info
    const shares = (data || []) as ShareWithDetails[];
    for (const share of shares) {
      // Get target info based on type
      if (share.shared_with_user_id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', share.shared_with_user_id)
          .single();

        if (userData) {
          share.target = {
            id: userData.id,
            name: userData.full_name || userData.email || 'Unknown User',
            type: 'user',
          };
        }
      } else if (share.shared_with_profile_id) {
        const { data: profileData } = await supabase
          .from('directory_profiles')
          .select('id, stage_name')
          .eq('id', share.shared_with_profile_id)
          .single();

        if (profileData) {
          share.target = {
            id: profileData.id,
            name: profileData.stage_name || 'Unknown Profile',
            type: 'profile',
          };
        }
      } else if (share.shared_with_org_id) {
        const { data: orgData } = await supabase
          .from('organization_profiles')
          .select('id, organization_name')
          .eq('id', share.shared_with_org_id)
          .single();

        if (orgData) {
          share.target = {
            id: orgData.id,
            name: orgData.organization_name || 'Unknown Organization',
            type: 'organization',
          };
        }
      }

      // Get album info if applicable
      if (share.album) {
        const { count } = await supabase
          .from('media_album_items')
          .select('*', { count: 'exact', head: true })
          .eq('album_id', share.album.id);

        (share.album as Record<string, unknown>).item_count = count || 0;
      }
    }

    return shares;
  }

  /**
   * Get pending shares for the current user
   */
  async getPendingShares(userId: string): Promise<ShareWithDetails[]> {
    const shares = await this.getSharesSharedWithMe(userId);
    return shares.filter(s => s.status === 'pending');
  }

  /**
   * Accept or decline a share
   */
  async respondToShare(shareId: string, accept: boolean): Promise<void> {
    const { error } = await supabase
      .from('media_shares')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', shareId);

    if (error) throw error;
  }

  /**
   * Copy shared media to own profile
   * This creates a copy of the media in the recipient's media library
   */
  async copySharedMediaToProfile(shareId: string, targetProfileId: string): Promise<void> {
    // Get the share details
    const { data: share, error: shareError } = await supabase
      .from('media_shares')
      .select(`
        *,
        album:media_albums(id),
        media:media_files(*)
      `)
      .eq('id', shareId)
      .single();

    if (shareError) throw shareError;
    if (!share) throw new Error('Share not found');
    if (!share.can_copy) throw new Error('This share does not allow copying');

    if (share.resource_type === 'media' && share.media) {
      // Copy single media item
      const mediaData = share.media as Record<string, unknown>;
      const { error } = await supabase
        .from('media_files')
        .insert({
          directory_profile_id: targetProfileId,
          media_type: mediaData.media_type as string || 'photo',
          file_name: mediaData.file_name,
          file_type: mediaData.file_type || 'image',
          file_size: mediaData.file_size || 0,
          storage_path: mediaData.storage_path,
          public_url: mediaData.public_url,
          tags: mediaData.tags || [],
        });

      if (error) throw error;
    } else if (share.resource_type === 'album' && share.album) {
      // Copy all media items in the album
      const albumData = share.album as { id: string };
      const { data: albumItems, error: itemsError } = await supabase
        .from('media_album_items')
        .select('media:media_files(*)')
        .eq('album_id', albumData.id);

      if (itemsError) throw itemsError;

      // Copy each media item
      for (const item of albumItems || []) {
        const mediaData = item.media as Record<string, unknown>;
        if (mediaData) {
          await supabase
            .from('media_files')
            .insert({
              directory_profile_id: targetProfileId,
              media_type: mediaData.media_type as string || 'photo',
              file_name: mediaData.file_name,
              file_type: mediaData.file_type || 'image',
              file_size: mediaData.file_size || 0,
              storage_path: mediaData.storage_path,
              public_url: mediaData.public_url,
              tags: mediaData.tags || [],
            });
        }
      }
    }
  }

  /**
   * Search for users/profiles/orgs to share with
   */
  async searchShareTargets(query: string): Promise<Array<{
    id: string;
    name: string;
    type: ShareTargetType;
    subtitle?: string;
  }>> {
    const results: Array<{
      id: string;
      name: string;
      type: ShareTargetType;
      subtitle?: string;
    }> = [];

    // Search directory profiles
    const { data: profiles } = await supabase
      .from('directory_profiles')
      .select('id, stage_name, profile_type')
      .ilike('stage_name', `%${query}%`)
      .limit(10);

    if (profiles) {
      results.push(...profiles.map(p => ({
        id: p.id,
        name: p.stage_name || 'Unknown',
        type: 'profile' as ShareTargetType,
        subtitle: p.profile_type || 'Profile',
      })));
    }

    // Search organizations
    const { data: orgs } = await supabase
      .from('organization_profiles')
      .select('id, organization_name')
      .ilike('organization_name', `%${query}%`)
      .limit(10);

    if (orgs) {
      results.push(...orgs.map(o => ({
        id: o.id,
        name: o.organization_name || 'Unknown',
        type: 'organization' as ShareTargetType,
        subtitle: 'Organization',
      })));
    }

    return results;
  }
}

export const sharingService = new SharingService();
export default sharingService;
