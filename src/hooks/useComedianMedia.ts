import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ComedianMediaItem {
  id: string;
  user_id: string;
  media_type: 'photo' | 'video';
  title: string | null;
  description: string | null;
  file_url: string | null;
  file_size: number | null;
  file_type: string | null;
  external_url: string | null;
  external_type: 'youtube' | 'google_drive' | 'vimeo' | null;
  external_id: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  is_featured: boolean;
  display_order: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface UseComedianMediaProps {
  userId?: string;
  mediaType?: 'photo' | 'video';
}

export const useComedianMedia = ({ userId, mediaType }: UseComedianMediaProps = {}) => {
  const [media, setMedia] = useState<ComedianMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('comedian_media')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (mediaType) {
        query = query.eq('media_type', mediaType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setMedia(data || []);
    } catch (err) {
      console.error('Error fetching comedian media:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [mediaType, userId]);

  const deleteMedia = async (mediaId: string) => {
    try {
      // First get the media item to check if it has a file to delete
      const mediaItem = media.find(item => item.id === mediaId);
      
      if (mediaItem?.file_url) {
        // Extract file path from URL for storage deletion
        const url = new URL(mediaItem.file_url);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const filePath = `${mediaItem.user_id}/${fileName}`;
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('comedian-media')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Storage deletion error:', storageError);
          // Continue with database deletion even if storage fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('comedian_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      // Update local state
      setMedia(prev => prev.filter(item => item.id !== mediaId));

      toast({
        title: "Media deleted",
        description: "The media item has been removed from your portfolio."
      });
    } catch (err) {
      console.error('Error deleting media:', err);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the media item.",
        variant: "destructive"
      });
    }
  };

  const updateMedia = async (mediaId: string, updates: Partial<ComedianMediaItem>) => {
    try {
      const { error } = await supabase
        .from('comedian_media')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaId);

      if (error) throw error;

      // Update local state
      setMedia(prev => prev.map(item => 
        item.id === mediaId 
          ? { ...item, ...updates, updated_at: new Date().toISOString() }
          : item
      ));

      toast({
        title: "Media updated",
        description: "Your changes have been saved."
      });
    } catch (err) {
      console.error('Error updating media:', err);
      toast({
        title: "Update failed",
        description: "There was an error updating the media item.",
        variant: "destructive"
      });
    }
  };

  const reorderMedia = async (mediaId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('comedian_media')
        .update({ display_order: newOrder })
        .eq('id', mediaId);

      if (error) throw error;

      // Update local state and re-sort
      setMedia(prev => {
        const updated = prev.map(item => 
          item.id === mediaId ? { ...item, display_order: newOrder } : item
        );
        return updated.sort((a, b) => a.display_order - b.display_order);
      });
    } catch (err) {
      console.error('Error reordering media:', err);
      toast({
        title: "Reorder failed",
        description: "There was an error reordering the media.",
        variant: "destructive"
      });
    }
  };

  const getMediaUrl = (item: ComedianMediaItem): string => {
    if (item.external_url) {
      if (item.external_type === 'youtube' && item.external_id) {
        return `https://www.youtube.com/watch?v=${item.external_id}`;
      }
      return item.external_url;
    }
    return item.file_url || '';
  };

  const getThumbnailUrl = (item: ComedianMediaItem): string => {
    if (item.thumbnail_url) {
      return item.thumbnail_url;
    }
    
    if (item.external_type === 'youtube' && item.external_id) {
      return `https://img.youtube.com/vi/${item.external_id}/maxresdefault.jpg`;
    }
    
    if (item.media_type === 'photo' && item.file_url) {
      return item.file_url;
    }
    
    return '/placeholder-video.jpg'; // You'll need to add this placeholder
  };

  const getEmbedUrl = (item: ComedianMediaItem): string | null => {
    if (item.external_type === 'youtube' && item.external_id) {
      return `https://www.youtube.com/embed/${item.external_id}`;
    }
    return null;
  };

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return {
    media,
    loading,
    error,
    fetchMedia,
    deleteMedia,
    updateMedia,
    reorderMedia,
    getMediaUrl,
    getThumbnailUrl,
    getEmbedUrl,
    photos: media.filter(item => item.media_type === 'photo'),
    videos: media.filter(item => item.media_type === 'video'),
    featuredMedia: media.filter(item => item.is_featured)
  };
};
