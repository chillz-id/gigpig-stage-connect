/**
 * Album Service
 *
 * Handles CRUD operations for media albums and album items.
 */

import { supabase } from '@/integrations/supabase/client';

export type AlbumOwnerType = 'user' | 'directory_profile' | 'organization';

export interface Album {
  id: string;
  user_id?: string | null;
  directory_profile_id?: string | null;
  organization_id?: string | null;
  name: string;
  description?: string | null;
  cover_media_id?: string | null;
  is_public: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithCover extends Album {
  cover_url?: string | null;
  item_count?: number;
}

export interface AlbumItem {
  id: string;
  album_id: string;
  media_id: string;
  display_order: number;
  added_at: string;
}

export interface CreateAlbumParams {
  ownerId: string;
  ownerType: AlbumOwnerType;
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateAlbumParams {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
  displayOrder?: number;
}

class AlbumService {
  /**
   * Create a new album
   */
  async createAlbum(params: CreateAlbumParams): Promise<Album> {
    const { ownerId, ownerType, name, description, isPublic = false } = params;

    const albumData: Record<string, unknown> = {
      name,
      description: description || null,
      is_public: isPublic,
    };

    // Set the appropriate owner field
    switch (ownerType) {
      case 'user':
        albumData.user_id = ownerId;
        break;
      case 'directory_profile':
        albumData.directory_profile_id = ownerId;
        break;
      case 'organization':
        albumData.organization_id = ownerId;
        break;
    }

    const { data, error } = await supabase
      .from('media_albums')
      .insert(albumData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create album:', error);
      throw new Error(`Failed to create album: ${error.message}`);
    }

    return data as Album;
  }

  /**
   * Update an existing album
   */
  async updateAlbum(albumId: string, updates: UpdateAlbumParams): Promise<Album> {
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

    const { data, error } = await supabase
      .from('media_albums')
      .update(updateData)
      .eq('id', albumId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update album:', error);
      throw new Error(`Failed to update album: ${error.message}`);
    }

    return data as Album;
  }

  /**
   * Delete an album and all its items
   */
  async deleteAlbum(albumId: string): Promise<void> {
    const { error } = await supabase
      .from('media_albums')
      .delete()
      .eq('id', albumId);

    if (error) {
      console.error('Failed to delete album:', error);
      throw new Error(`Failed to delete album: ${error.message}`);
    }
  }

  /**
   * Get all albums for an owner
   */
  async getAlbums(ownerId: string, ownerType: AlbumOwnerType): Promise<AlbumWithCover[]> {
    let query = supabase
      .from('media_albums')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Filter by owner type
    switch (ownerType) {
      case 'user':
        query = query.eq('user_id', ownerId);
        break;
      case 'directory_profile':
        query = query.eq('directory_profile_id', ownerId);
        break;
      case 'organization':
        query = query.eq('organization_id', ownerId);
        break;
    }

    const { data: albums, error } = await query;

    if (error) {
      console.error('Failed to fetch albums:', error);
      throw new Error(`Failed to fetch albums: ${error.message}`);
    }

    // Enrich with cover URLs and item counts
    const enrichedAlbums: AlbumWithCover[] = await Promise.all(
      (albums || []).map(async (album) => {
        let cover_url: string | null = null;
        let item_count = 0;

        // Get item count
        const { count } = await supabase
          .from('media_album_items')
          .select('*', { count: 'exact', head: true })
          .eq('album_id', album.id);

        item_count = count || 0;

        // Get cover URL if cover_media_id is set
        if (album.cover_media_id) {
          const { data: media } = await supabase
            .from('media_files')
            .select('public_url, storage_path')
            .eq('id', album.cover_media_id)
            .single();

          if (media) {
            cover_url = media.public_url ||
              `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media-library/${media.storage_path}`;
          }
        } else if (item_count > 0) {
          // Fall back to first item as cover
          const { data: firstItem } = await supabase
            .from('media_album_items')
            .select('media_id')
            .eq('album_id', album.id)
            .order('display_order', { ascending: true })
            .limit(1)
            .single();

          if (firstItem) {
            const { data: media } = await supabase
              .from('media_files')
              .select('public_url, storage_path')
              .eq('id', firstItem.media_id)
              .single();

            if (media) {
              cover_url = media.public_url ||
                `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media-library/${media.storage_path}`;
            }
          }
        }

        return {
          ...album,
          cover_url,
          item_count,
        } as AlbumWithCover;
      })
    );

    return enrichedAlbums;
  }

  /**
   * Get a single album by ID
   */
  async getAlbum(albumId: string): Promise<AlbumWithCover | null> {
    const { data: album, error } = await supabase
      .from('media_albums')
      .select('*')
      .eq('id', albumId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to fetch album:', error);
      throw new Error(`Failed to fetch album: ${error.message}`);
    }

    // Get item count
    const { count } = await supabase
      .from('media_album_items')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', albumId);

    // Get cover URL
    let cover_url: string | null = null;
    if (album.cover_media_id) {
      const { data: media } = await supabase
        .from('media_files')
        .select('public_url, storage_path')
        .eq('id', album.cover_media_id)
        .single();

      if (media) {
        cover_url = media.public_url ||
          `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media-library/${media.storage_path}`;
      }
    }

    return {
      ...album,
      cover_url,
      item_count: count || 0,
    } as AlbumWithCover;
  }

  /**
   * Get all media items in an album
   */
  async getAlbumItems(albumId: string): Promise<Array<AlbumItem & { media: { id: string; public_url: string | null; storage_path: string; file_name: string } }>> {
    const { data, error } = await supabase
      .from('media_album_items')
      .select(`
        id,
        album_id,
        media_id,
        display_order,
        added_at,
        media:media_files(id, public_url, storage_path, file_name)
      `)
      .eq('album_id', albumId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch album items:', error);
      throw new Error(`Failed to fetch album items: ${error.message}`);
    }

    return (data || []).map(item => ({
      ...item,
      media: Array.isArray(item.media) ? item.media[0] : item.media,
    })) as Array<AlbumItem & { media: { id: string; public_url: string | null; storage_path: string; file_name: string } }>;
  }

  /**
   * Add photos to an album
   */
  async addPhotosToAlbum(albumId: string, mediaIds: string[]): Promise<void> {
    if (mediaIds.length === 0) return;

    // Get current max display_order
    const { data: maxOrderItem } = await supabase
      .from('media_album_items')
      .select('display_order')
      .eq('album_id', albumId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const startOrder = (maxOrderItem?.display_order ?? -1) + 1;

    const items = mediaIds.map((mediaId, index) => ({
      album_id: albumId,
      media_id: mediaId,
      display_order: startOrder + index,
    }));

    const { error } = await supabase
      .from('media_album_items')
      .upsert(items, { onConflict: 'album_id,media_id' });

    if (error) {
      console.error('Failed to add photos to album:', error);
      throw new Error(`Failed to add photos to album: ${error.message}`);
    }
  }

  /**
   * Remove a photo from an album
   */
  async removePhotoFromAlbum(albumId: string, mediaId: string): Promise<void> {
    const { error } = await supabase
      .from('media_album_items')
      .delete()
      .eq('album_id', albumId)
      .eq('media_id', mediaId);

    if (error) {
      console.error('Failed to remove photo from album:', error);
      throw new Error(`Failed to remove photo from album: ${error.message}`);
    }
  }

  /**
   * Set the cover photo for an album
   */
  async setCoverPhoto(albumId: string, mediaId: string | null): Promise<void> {
    const { error } = await supabase
      .from('media_albums')
      .update({ cover_media_id: mediaId })
      .eq('id', albumId);

    if (error) {
      console.error('Failed to set cover photo:', error);
      throw new Error(`Failed to set cover photo: ${error.message}`);
    }
  }

  /**
   * Reorder photos in an album
   */
  async reorderPhotos(albumId: string, orderedMediaIds: string[]): Promise<void> {
    const updates = orderedMediaIds.map((mediaId, index) => ({
      album_id: albumId,
      media_id: mediaId,
      display_order: index,
    }));

    // Use upsert to update display_order
    const { error } = await supabase
      .from('media_album_items')
      .upsert(updates, { onConflict: 'album_id,media_id' });

    if (error) {
      console.error('Failed to reorder photos:', error);
      throw new Error(`Failed to reorder photos: ${error.message}`);
    }
  }

  // ============================================
  // EPK Album Selection Methods
  // ============================================

  /**
   * Get albums selected for EPK display
   */
  async getEPKAlbums(comedianId: string): Promise<AlbumWithCover[]> {
    const { data, error } = await supabase
      .from('epk_album_selections')
      .select(`
        id,
        album_id,
        display_order,
        album:media_albums(*)
      `)
      .eq('comedian_id', comedianId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch EPK albums:', error);
      throw new Error(`Failed to fetch EPK albums: ${error.message}`);
    }

    // Extract albums and enrich with cover URLs
    const albums = (data || [])
      .filter(item => item.album)
      .map(item => item.album as Album);

    // Enrich albums with covers and counts
    const enrichedAlbums = await Promise.all(
      albums.map(async (album) => {
        let cover_url: string | null = null;
        let item_count = 0;

        const { count } = await supabase
          .from('media_album_items')
          .select('*', { count: 'exact', head: true })
          .eq('album_id', album.id);

        item_count = count || 0;

        if (album.cover_media_id) {
          const { data: media } = await supabase
            .from('media_files')
            .select('public_url, storage_path')
            .eq('id', album.cover_media_id)
            .single();

          if (media) {
            cover_url = media.public_url ||
              `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media-library/${media.storage_path}`;
          }
        } else if (item_count > 0) {
          const { data: firstItem } = await supabase
            .from('media_album_items')
            .select('media_id')
            .eq('album_id', album.id)
            .order('display_order', { ascending: true })
            .limit(1)
            .single();

          if (firstItem) {
            const { data: media } = await supabase
              .from('media_files')
              .select('public_url, storage_path')
              .eq('id', firstItem.media_id)
              .single();

            if (media) {
              cover_url = media.public_url ||
                `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media-library/${media.storage_path}`;
            }
          }
        }

        return {
          ...album,
          cover_url,
          item_count,
        } as AlbumWithCover;
      })
    );

    return enrichedAlbums;
  }

  /**
   * Get EPK album IDs for a comedian
   */
  async getEPKAlbumIds(comedianId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('epk_album_selections')
      .select('album_id')
      .eq('comedian_id', comedianId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch EPK album IDs:', error);
      throw new Error(`Failed to fetch EPK album IDs: ${error.message}`);
    }

    return (data || []).map(item => item.album_id);
  }

  /**
   * Add an album to EPK display
   */
  async addEPKAlbum(comedianId: string, albumId: string): Promise<void> {
    // Get current max display_order
    const { data: maxOrderItem } = await supabase
      .from('epk_album_selections')
      .select('display_order')
      .eq('comedian_id', comedianId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const newOrder = (maxOrderItem?.display_order ?? -1) + 1;

    const { error } = await supabase
      .from('epk_album_selections')
      .upsert({
        comedian_id: comedianId,
        album_id: albumId,
        display_order: newOrder,
      }, { onConflict: 'comedian_id,album_id' });

    if (error) {
      console.error('Failed to add EPK album:', error);
      throw new Error(`Failed to add EPK album: ${error.message}`);
    }
  }

  /**
   * Remove an album from EPK display
   */
  async removeEPKAlbum(comedianId: string, albumId: string): Promise<void> {
    const { error } = await supabase
      .from('epk_album_selections')
      .delete()
      .eq('comedian_id', comedianId)
      .eq('album_id', albumId);

    if (error) {
      console.error('Failed to remove EPK album:', error);
      throw new Error(`Failed to remove EPK album: ${error.message}`);
    }
  }

  /**
   * Set all EPK albums (replaces existing selections)
   */
  async setEPKAlbums(comedianId: string, albumIds: string[]): Promise<void> {
    // Delete existing selections
    const { error: deleteError } = await supabase
      .from('epk_album_selections')
      .delete()
      .eq('comedian_id', comedianId);

    if (deleteError) {
      console.error('Failed to clear EPK albums:', deleteError);
      throw new Error(`Failed to clear EPK albums: ${deleteError.message}`);
    }

    // Insert new selections
    if (albumIds.length > 0) {
      const selections = albumIds.map((albumId, index) => ({
        comedian_id: comedianId,
        album_id: albumId,
        display_order: index,
      }));

      const { error: insertError } = await supabase
        .from('epk_album_selections')
        .insert(selections);

      if (insertError) {
        console.error('Failed to set EPK albums:', insertError);
        throw new Error(`Failed to set EPK albums: ${insertError.message}`);
      }
    }
  }

  /**
   * Get all media from EPK-selected albums for a comedian
   */
  async getEPKAlbumMedia(comedianId: string): Promise<Array<{
    id: string;
    public_url: string | null;
    storage_path: string;
    file_name: string;
    album_name: string;
  }>> {
    // First get the selected album IDs
    const albumIds = await this.getEPKAlbumIds(comedianId);

    if (albumIds.length === 0) {
      return [];
    }

    // Get all media from these albums
    const { data, error } = await supabase
      .from('media_album_items')
      .select(`
        media_id,
        display_order,
        media:media_files(id, public_url, storage_path, file_name),
        album:media_albums(name)
      `)
      .in('album_id', albumIds)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch EPK album media:', error);
      throw new Error(`Failed to fetch EPK album media: ${error.message}`);
    }

    return (data || [])
      .filter(item => item.media)
      .map(item => {
        const media = Array.isArray(item.media) ? item.media[0] : item.media;
        const album = Array.isArray(item.album) ? item.album[0] : item.album;
        return {
          id: media?.id || '',
          public_url: media?.public_url || null,
          storage_path: media?.storage_path || '',
          file_name: media?.file_name || '',
          album_name: album?.name || '',
        };
      });
  }
}

export const albumService = new AlbumService();
export default albumService;
