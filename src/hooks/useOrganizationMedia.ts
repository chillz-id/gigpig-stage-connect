import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MediaVisibility = 'public' | 'promoters' | 'private';

export interface OrganizationMediaItem {
  id: string;
  organization_id: string;
  media_type: 'photo' | 'video';
  title: string | null;
  description: string | null;
  file_url: string | null;
  file_size: number | null;
  file_type: string | null;
  mime_type: string | null;
  external_url: string | null;
  external_type: 'youtube' | 'vimeo' | 'google_drive' | null;
  external_id: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  show_in_epk: boolean;
  visibility: MediaVisibility;
  display_order: number;
  tags: string[] | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

interface UseOrganizationMediaProps {
  organizationId?: string;
  mediaType?: 'photo' | 'video';
  epkOnly?: boolean;
}

export const useOrganizationMedia = ({
  organizationId,
  mediaType,
  epkOnly = false
}: UseOrganizationMediaProps = {}) => {
  const [media, setMedia] = useState<OrganizationMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMedia = useCallback(async () => {
    if (!organizationId) {
      setMedia([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('organization_media')
        .select('*')
        .eq('organization_id', organizationId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (mediaType) {
        query = query.eq('media_type', mediaType);
      }

      if (epkOnly) {
        query = query.eq('show_in_epk', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        organization_id: item.organization_id,
        media_type: (item.media_type as 'photo' | 'video') || 'photo',
        title: item.title,
        description: item.description,
        file_url: item.file_url,
        file_size: item.file_size,
        file_type: item.file_type,
        mime_type: item.mime_type,
        external_url: item.external_url,
        external_type: item.external_type,
        external_id: item.external_id,
        thumbnail_url: item.thumbnail_url,
        is_featured: item.is_featured || false,
        show_in_epk: item.show_in_epk ?? true,
        visibility: (item.visibility as MediaVisibility) || 'public',
        display_order: item.display_order || 0,
        tags: item.tags || [],
        uploaded_by: item.uploaded_by,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
      }));

      setMedia(mappedData);
    } catch (err) {
      console.error('Error fetching organization media:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [organizationId, mediaType, epkOnly]);

  const addMedia = async (newMedia: Partial<OrganizationMediaItem>) => {
    if (!organizationId) return false;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const maxOrder = media.length > 0
        ? Math.max(...media.map(m => m.display_order))
        : -1;

      const { data, error } = await supabase
        .from('organization_media')
        .insert({
          organization_id: organizationId,
          uploaded_by: userData.user.id,
          media_type: newMedia.media_type || 'photo',
          title: newMedia.title,
          description: newMedia.description,
          file_url: newMedia.file_url,
          file_size: newMedia.file_size,
          file_type: newMedia.file_type,
          mime_type: newMedia.mime_type,
          external_url: newMedia.external_url,
          external_type: newMedia.external_type,
          external_id: newMedia.external_id,
          thumbnail_url: newMedia.thumbnail_url,
          is_featured: newMedia.is_featured || false,
          show_in_epk: newMedia.show_in_epk ?? true,
          visibility: newMedia.visibility || 'public',
          display_order: maxOrder + 1,
          tags: newMedia.tags || [],
        })
        .select()
        .single();

      if (error) throw error;

      await fetchMedia();

      toast({
        title: 'Media added',
        description: 'The media item has been added to your portfolio.',
      });

      return true;
    } catch (err) {
      console.error('Error adding media:', err);
      toast({
        title: 'Add failed',
        description: 'There was an error adding the media item.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateMedia = async (mediaId: string, updates: Partial<OrganizationMediaItem>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.display_order !== undefined) dbUpdates.display_order = updates.display_order;
      if (updates.is_featured !== undefined) dbUpdates.is_featured = updates.is_featured;
      if (updates.show_in_epk !== undefined) dbUpdates.show_in_epk = updates.show_in_epk;
      if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.thumbnail_url !== undefined) dbUpdates.thumbnail_url = updates.thumbnail_url;

      const { error } = await supabase
        .from('organization_media')
        .update(dbUpdates)
        .eq('id', mediaId);

      if (error) throw error;

      setMedia(prev => prev.map(item =>
        item.id === mediaId ? { ...item, ...updates } : item
      ));

      toast({
        title: 'Media updated',
        description: 'Your changes have been saved.',
      });

      return true;
    } catch (err) {
      console.error('Error updating media:', err);
      toast({
        title: 'Update failed',
        description: 'There was an error updating the media item.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      const mediaItem = media.find(item => item.id === mediaId);

      if (mediaItem?.file_url) {
        const url = new URL(mediaItem.file_url);
        const pathParts = url.pathname.split('/');
        const publicIndex = pathParts.indexOf('public');

        if (publicIndex !== -1 && publicIndex + 1 < pathParts.length) {
          const bucket = pathParts[publicIndex + 1];
          const filePath = pathParts.slice(publicIndex + 2).join('/');

          const { error: storageError } = await supabase.storage
            .from(bucket)
            .remove([decodeURIComponent(filePath)]);

          if (storageError) {
            console.warn('Storage deletion error:', storageError);
          }
        }
      }

      const { error } = await supabase
        .from('organization_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      setMedia(prev => prev.filter(item => item.id !== mediaId));

      toast({
        title: 'Media deleted',
        description: 'The media item has been removed from your portfolio.',
      });

      return true;
    } catch (err) {
      console.error('Error deleting media:', err);
      toast({
        title: 'Delete failed',
        description: 'There was an error deleting the media item.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const reorderMedia = async (reorderedItems: OrganizationMediaItem[]) => {
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('organization_media')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      setMedia(reorderedItems.map((item, index) => ({
        ...item,
        display_order: index,
      })));

      toast({
        title: 'Order updated',
        description: 'Media order has been saved.',
      });

      return true;
    } catch (err) {
      console.error('Error reordering media:', err);
      toast({
        title: 'Reorder failed',
        description: 'There was an error reordering the media.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getMediaUrl = (item: OrganizationMediaItem): string => {
    if (item.external_url) {
      if (item.external_type === 'youtube' && item.external_id) {
        return `https://www.youtube.com/watch?v=${item.external_id}`;
      }
      return item.external_url;
    }
    return item.file_url || '';
  };

  const getThumbnailUrl = (item: OrganizationMediaItem): string => {
    if (item.thumbnail_url) {
      return item.thumbnail_url;
    }

    if (item.external_type === 'youtube' && item.external_id) {
      return `https://img.youtube.com/vi/${item.external_id}/maxresdefault.jpg`;
    }

    if (item.media_type === 'photo' && item.file_url) {
      return item.file_url;
    }

    return '/placeholder-video.jpg';
  };

  const getEmbedUrl = (item: OrganizationMediaItem): string | null => {
    if (item.external_type === 'youtube' && item.external_id) {
      return `https://www.youtube.com/embed/${item.external_id}`;
    }
    if (item.external_type === 'vimeo' && item.external_id) {
      return `https://player.vimeo.com/video/${item.external_id}`;
    }
    return null;
  };

  // Extract YouTube video ID from various URL formats
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const photos = useMemo(() =>
    media.filter(item => item.media_type === 'photo'),
    [media]
  );

  const videos = useMemo(() =>
    media.filter(item => item.media_type === 'video'),
    [media]
  );

  const featuredMedia = useMemo(() =>
    media.filter(item => item.is_featured),
    [media]
  );

  return {
    media,
    loading,
    error,
    fetchMedia,
    addMedia,
    updateMedia,
    deleteMedia,
    reorderMedia,
    getMediaUrl,
    getThumbnailUrl,
    getEmbedUrl,
    extractYouTubeId,
    photos,
    videos,
    featuredMedia,
  };
};
