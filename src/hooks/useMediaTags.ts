import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserTag {
  tag: string;
  usage_count: number;
}

interface UseMediaTagsReturn {
  userTags: UserTag[];
  isLoadingTags: boolean;
  fetchUserTags: (search?: string) => Promise<UserTag[]>;
  updateMediaTags: (fileId: string, tags: string[]) => Promise<void>;
  addMediaTags: (fileId: string, tags: string[]) => Promise<void>;
  removeMediaTags: (fileId: string, tags: string[]) => Promise<void>;
  bulkAddTags: (fileIds: string[], tags: string[]) => Promise<void>;
  bulkUpdateTags: (fileIds: string[], tags: string[]) => Promise<void>;
  isUpdating: boolean;
}

/**
 * Hook for managing media file tags
 * - Provides autocomplete suggestions from user's tag vocabulary
 * - Handles adding/removing/updating tags on media files
 * - Syncs with user_media_tags for vocabulary tracking
 */
export function useMediaTags(): UseMediaTagsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user's tag vocabulary for autocomplete
  const fetchUserTags = useCallback(async (search?: string): Promise<UserTag[]> => {
    if (!user?.id) return [];

    setIsLoadingTags(true);
    try {
      const { data, error } = await supabase.rpc('get_user_tags', {
        p_user_id: user.id,
        p_search: search || null,
      });

      if (error) throw error;

      const tags = (data || []) as UserTag[];
      setUserTags(tags);
      return tags;
    } catch (error: unknown) {
      console.error('Error fetching user tags:', error);
      return [];
    } finally {
      setIsLoadingTags(false);
    }
  }, [user?.id]);

  // Load initial tags
  useEffect(() => {
    if (user?.id) {
      fetchUserTags();
    }
  }, [user?.id, fetchUserTags]);

  // Update tags on a single media file (replace all)
  const updateMediaTags = useCallback(async (fileId: string, tags: string[]): Promise<void> => {
    if (!user?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('update_media_tags', {
        p_file_id: fileId,
        p_tags: tags,
      });

      if (error) throw error;

      // Refresh user tags to get updated usage counts
      await fetchUserTags();

      toast({
        title: 'Tags Updated',
        description: `Tags have been updated successfully.`,
      });
    } catch (error: unknown) {
      console.error('Error updating media tags:', error);
      const message = error instanceof Error ? error.message : 'Failed to update tags';
      toast({
        title: 'Failed to Update Tags',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, toast, fetchUserTags]);

  // Add tags to a media file (append to existing)
  const addMediaTags = useCallback(async (fileId: string, tags: string[]): Promise<void> => {
    if (!user?.id || tags.length === 0) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('add_media_tags', {
        p_file_id: fileId,
        p_tags: tags,
      });

      if (error) throw error;

      // Refresh user tags
      await fetchUserTags();

      toast({
        title: 'Tags Added',
        description: `${tags.length} tag(s) added successfully.`,
      });
    } catch (error: unknown) {
      console.error('Error adding media tags:', error);
      const message = error instanceof Error ? error.message : 'Failed to add tags';
      toast({
        title: 'Failed to Add Tags',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, toast, fetchUserTags]);

  // Remove specific tags from a media file
  const removeMediaTags = useCallback(async (fileId: string, tags: string[]): Promise<void> => {
    if (!user?.id || tags.length === 0) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('remove_media_tags', {
        p_file_id: fileId,
        p_tags: tags,
      });

      if (error) throw error;

      toast({
        title: 'Tags Removed',
        description: `${tags.length} tag(s) removed successfully.`,
      });
    } catch (error: unknown) {
      console.error('Error removing media tags:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove tags';
      toast({
        title: 'Failed to Remove Tags',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, toast]);

  // Bulk add tags to multiple files
  const bulkAddTags = useCallback(async (fileIds: string[], tags: string[]): Promise<void> => {
    if (!user?.id || fileIds.length === 0 || tags.length === 0) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('bulk_add_media_tags', {
        p_file_ids: fileIds,
        p_tags: tags,
      });

      if (error) throw error;

      // Refresh user tags
      await fetchUserTags();

      toast({
        title: 'Tags Added',
        description: `Tags added to ${fileIds.length} file(s).`,
      });
    } catch (error: unknown) {
      console.error('Error bulk adding tags:', error);
      const message = error instanceof Error ? error.message : 'Failed to add tags';
      toast({
        title: 'Failed to Add Tags',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, toast, fetchUserTags]);

  // Bulk update tags on multiple files (replace all)
  const bulkUpdateTags = useCallback(async (fileIds: string[], tags: string[]): Promise<void> => {
    if (!user?.id || fileIds.length === 0) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('bulk_update_media_tags', {
        p_file_ids: fileIds,
        p_tags: tags,
      });

      if (error) throw error;

      // Refresh user tags
      await fetchUserTags();

      toast({
        title: 'Tags Updated',
        description: `Tags updated on ${fileIds.length} file(s).`,
      });
    } catch (error: unknown) {
      console.error('Error bulk updating tags:', error);
      const message = error instanceof Error ? error.message : 'Failed to update tags';
      toast({
        title: 'Failed to Update Tags',
        description: message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, toast, fetchUserTags]);

  return {
    userTags,
    isLoadingTags,
    fetchUserTags,
    updateMediaTags,
    addMediaTags,
    removeMediaTags,
    bulkAddTags,
    bulkUpdateTags,
    isUpdating,
  };
}

/**
 * Convenience hook for tag autocomplete - returns tags filtered by search
 * Used by MediaTagInput component
 */
export function useUserTags(search: string = '') {
  const { user } = useAuth();
  const [tags, setTags] = useState<UserTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setTags([]);
      return;
    }

    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_user_tags', {
          p_user_id: user.id,
          p_search: search || null,
        });

        if (error) throw error;
        setTags((data || []) as UserTag[]);
      } catch (error: unknown) {
        console.error('Error fetching user tags:', error);
        setTags([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(fetchTags, 200);
    return () => clearTimeout(timeoutId);
  }, [user?.id, search]);

  return { tags, isLoading };
}
