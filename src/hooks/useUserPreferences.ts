/**
 * useUserPreferences Hook
 *
 * React Query hook for managing user preferences (favourites and hidden comedians).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getFavourites,
  getHiddenComedians,
  isFavourited,
  isHidden,
  addToFavourites,
  removeFromFavourites,
  hideComedian,
  unhideComedian
} from '@/services/userPreferencesService';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const userPreferencesKeys = {
  all: ['user-preferences'] as const,
  favourites: (userId: string) => [...userPreferencesKeys.all, 'favourites', userId] as const,
  hidden: (userId: string, eventId?: string) =>
    [...userPreferencesKeys.all, 'hidden', userId, eventId || 'global'] as const,
  isFavourited: (userId: string, comedianId: string) =>
    [...userPreferencesKeys.all, 'is-favourited', userId, comedianId] as const,
  isHidden: (userId: string, comedianId: string, eventId?: string) =>
    [...userPreferencesKeys.all, 'is-hidden', userId, comedianId, eventId || 'global'] as const
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all favourited comedian IDs for a user
 */
export function useUserFavourites(userId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: userPreferencesKeys.favourites(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return getFavourites(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    },
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading favourites',
          description: 'Failed to load favourited comedians. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch all hidden comedian IDs for a user
 * If eventId is provided, includes both event-specific and global hidden comedians
 */
export function useHiddenComedians(userId: string | undefined, eventId?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: userPreferencesKeys.hidden(userId || '', eventId),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return getHiddenComedians(userId, eventId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    },
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading hidden comedians',
          description: 'Failed to load hidden comedians. Please try again.'
        });
      }
    }
  });
}

/**
 * Check if a comedian is favourited by the user
 */
export function useIsFavourited(userId: string | undefined, comedianId: string | undefined) {
  return useQuery({
    queryKey: userPreferencesKeys.isFavourited(userId || '', comedianId || ''),
    queryFn: async () => {
      if (!userId || !comedianId) throw new Error('User ID and Comedian ID are required');
      return isFavourited(userId, comedianId);
    },
    enabled: !!userId && !!comedianId,
    staleTime: 2 * 60 * 1000, // 2 minutes (checks change frequently)
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    }
  });
}

/**
 * Check if a comedian is hidden for the user
 * If eventId is provided, checks both event-specific and global hiding
 */
export function useIsHidden(
  userId: string | undefined,
  comedianId: string | undefined,
  eventId?: string
) {
  return useQuery({
    queryKey: userPreferencesKeys.isHidden(userId || '', comedianId || '', eventId),
    queryFn: async () => {
      if (!userId || !comedianId) throw new Error('User ID and Comedian ID are required');
      return isHidden(userId, comedianId, eventId);
    },
    enabled: !!userId && !!comedianId,
    staleTime: 2 * 60 * 1000, // 2 minutes (checks change frequently)
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    }
  });
}

// ============================================================================
// FAVOURITE MUTATIONS
// ============================================================================

/**
 * Add a comedian to user's favourites
 */
export function useFavouriteComedian() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, comedianId }: { userId: string; comedianId: string }) =>
      addToFavourites(userId, comedianId).then(() => ({ userId, comedianId })),
    onMutate: async ({ userId, comedianId }) => {
      // Optimistic update for favourites list
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.favourites(userId) });
      const previousFavourites = queryClient.getQueryData<string[]>(
        userPreferencesKeys.favourites(userId)
      );

      if (previousFavourites) {
        queryClient.setQueryData<string[]>(
          userPreferencesKeys.favourites(userId),
          [...previousFavourites, comedianId]
        );
      }

      // Optimistic update for favourite check
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.isFavourited(userId, comedianId) });
      const previousCheck = queryClient.getQueryData<boolean>(
        userPreferencesKeys.isFavourited(userId, comedianId)
      );

      queryClient.setQueryData<boolean>(
        userPreferencesKeys.isFavourited(userId, comedianId),
        true
      );

      return { previousFavourites, previousCheck };
    },
    onSuccess: ({ userId, comedianId }) => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.favourites(userId)
      });
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.isFavourited(userId, comedianId)
      });
      toast({
        title: 'Added to favourites',
        description: 'Comedian has been added to your favourites.'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousFavourites) {
        queryClient.setQueryData(
          userPreferencesKeys.favourites(variables.userId),
          context.previousFavourites
        );
      }
      if (context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          userPreferencesKeys.isFavourited(variables.userId, variables.comedianId),
          context.previousCheck
        );
      }
      console.error('Error adding to favourites:', error);
      toast({
        variant: 'destructive',
        title: 'Error adding to favourites',
        description: error instanceof Error
          ? `Failed to add to favourites: ${error.message}`
          : 'Failed to add comedian to favourites. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Remove a comedian from user's favourites
 */
export function useUnfavouriteComedian() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, comedianId }: { userId: string; comedianId: string }) =>
      removeFromFavourites(userId, comedianId).then(() => ({ userId, comedianId })),
    onMutate: async ({ userId, comedianId }) => {
      // Optimistic update for favourites list
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.favourites(userId) });
      const previousFavourites = queryClient.getQueryData<string[]>(
        userPreferencesKeys.favourites(userId)
      );

      if (previousFavourites) {
        queryClient.setQueryData<string[]>(
          userPreferencesKeys.favourites(userId),
          previousFavourites.filter((id) => id !== comedianId)
        );
      }

      // Optimistic update for favourite check
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.isFavourited(userId, comedianId) });
      const previousCheck = queryClient.getQueryData<boolean>(
        userPreferencesKeys.isFavourited(userId, comedianId)
      );

      queryClient.setQueryData<boolean>(
        userPreferencesKeys.isFavourited(userId, comedianId),
        false
      );

      return { previousFavourites, previousCheck };
    },
    onSuccess: ({ userId, comedianId }) => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.favourites(userId)
      });
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.isFavourited(userId, comedianId)
      });
      toast({
        title: 'Removed from favourites',
        description: 'Comedian has been removed from your favourites.'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousFavourites) {
        queryClient.setQueryData(
          userPreferencesKeys.favourites(variables.userId),
          context.previousFavourites
        );
      }
      if (context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          userPreferencesKeys.isFavourited(variables.userId, variables.comedianId),
          context.previousCheck
        );
      }
      console.error('Error removing from favourites:', error);
      toast({
        variant: 'destructive',
        title: 'Error removing from favourites',
        description: error instanceof Error
          ? `Failed to remove from favourites: ${error.message}`
          : 'Failed to remove comedian from favourites. Please try again.'
      });
    },
    retry: 1
  });
}

// ============================================================================
// HIDE COMEDIAN MUTATIONS
// ============================================================================

/**
 * Hide a comedian from view
 * Scope can be 'event' (hide for specific event) or 'global' (hide everywhere)
 */
export function useHideComedian() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      comedianId,
      scope,
      eventId
    }: {
      userId: string;
      comedianId: string;
      scope: 'event' | 'global';
      eventId?: string;
    }) => hideComedian(userId, comedianId, scope, eventId).then(() => ({ userId, comedianId, scope, eventId })),
    onMutate: async ({ userId, comedianId, eventId }) => {
      // Optimistic update for hidden list
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.hidden(userId, eventId) });
      const previousHidden = queryClient.getQueryData<string[]>(
        userPreferencesKeys.hidden(userId, eventId)
      );

      if (previousHidden) {
        queryClient.setQueryData<string[]>(
          userPreferencesKeys.hidden(userId, eventId),
          [...previousHidden, comedianId]
        );
      }

      // Optimistic update for hidden check
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.isHidden(userId, comedianId, eventId) });
      const previousCheck = queryClient.getQueryData<boolean>(
        userPreferencesKeys.isHidden(userId, comedianId, eventId)
      );

      queryClient.setQueryData<boolean>(
        userPreferencesKeys.isHidden(userId, comedianId, eventId),
        true
      );

      return { previousHidden, previousCheck };
    },
    onSuccess: ({ userId, comedianId, scope, eventId }) => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.hidden(userId, eventId)
      });
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.isHidden(userId, comedianId, eventId)
      });

      // Also invalidate global hidden list if hiding event-specific
      if (scope === 'event') {
        queryClient.invalidateQueries({
          queryKey: userPreferencesKeys.hidden(userId)
        });
      }

      toast({
        title: 'Comedian hidden',
        description: scope === 'global'
          ? 'Comedian has been hidden from all views.'
          : 'Comedian has been hidden for this event.'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousHidden) {
        queryClient.setQueryData(
          userPreferencesKeys.hidden(variables.userId, variables.eventId),
          context.previousHidden
        );
      }
      if (context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          userPreferencesKeys.isHidden(variables.userId, variables.comedianId, variables.eventId),
          context.previousCheck
        );
      }
      console.error('Error hiding comedian:', error);
      toast({
        variant: 'destructive',
        title: 'Error hiding comedian',
        description: error instanceof Error
          ? `Failed to hide comedian: ${error.message}`
          : 'Failed to hide comedian. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Unhide a comedian
 * If eventId is provided, removes event-specific hiding
 * If eventId is not provided, removes global hiding
 */
export function useUnhideComedian() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      comedianId,
      eventId
    }: {
      userId: string;
      comedianId: string;
      eventId?: string;
    }) => unhideComedian(userId, comedianId, eventId).then(() => ({ userId, comedianId, eventId })),
    onMutate: async ({ userId, comedianId, eventId }) => {
      // Optimistic update for hidden list
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.hidden(userId, eventId) });
      const previousHidden = queryClient.getQueryData<string[]>(
        userPreferencesKeys.hidden(userId, eventId)
      );

      if (previousHidden) {
        queryClient.setQueryData<string[]>(
          userPreferencesKeys.hidden(userId, eventId),
          previousHidden.filter((id) => id !== comedianId)
        );
      }

      // Optimistic update for hidden check
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.isHidden(userId, comedianId, eventId) });
      const previousCheck = queryClient.getQueryData<boolean>(
        userPreferencesKeys.isHidden(userId, comedianId, eventId)
      );

      queryClient.setQueryData<boolean>(
        userPreferencesKeys.isHidden(userId, comedianId, eventId),
        false
      );

      return { previousHidden, previousCheck };
    },
    onSuccess: ({ userId, comedianId, eventId }) => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.hidden(userId, eventId)
      });
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.isHidden(userId, comedianId, eventId)
      });

      // Also invalidate global hidden list if unhiding event-specific
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: userPreferencesKeys.hidden(userId)
        });
      }

      toast({
        title: 'Comedian unhidden',
        description: eventId
          ? 'Comedian has been unhidden for this event.'
          : 'Comedian has been unhidden from all views.'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousHidden) {
        queryClient.setQueryData(
          userPreferencesKeys.hidden(variables.userId, variables.eventId),
          context.previousHidden
        );
      }
      if (context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          userPreferencesKeys.isHidden(variables.userId, variables.comedianId, variables.eventId),
          context.previousCheck
        );
      }
      console.error('Error unhiding comedian:', error);
      toast({
        variant: 'destructive',
        title: 'Error unhiding comedian',
        description: error instanceof Error
          ? `Failed to unhide comedian: ${error.message}`
          : 'Failed to unhide comedian. Please try again.'
      });
    },
    retry: 1
  });
}

// ============================================================================
// BULK OPERATIONS (for future use)
// ============================================================================

/**
 * Bulk add comedians to favourites
 * Currently wraps single operations - can be optimized with batch API in future
 */
export function useBulkFavourite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      comedianIds
    }: {
      userId: string;
      comedianIds: string[];
    }) => {
      await Promise.all(comedianIds.map((comedianId) => addToFavourites(userId, comedianId)));
      return { userId, count: comedianIds.length };
    },
    onSuccess: ({ userId, count }) => {
      // Invalidate all favourite queries for this user
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.favourites(userId)
      });
      queryClient.invalidateQueries({
        queryKey: ['user-preferences', 'is-favourited', userId]
      });
      toast({
        title: 'Added to favourites',
        description: `${count} comedians have been added to your favourites.`
      });
    },
    onError: (error: any) => {
      console.error('Error bulk adding to favourites:', error);
      toast({
        variant: 'destructive',
        title: 'Error adding to favourites',
        description: error instanceof Error
          ? `Failed to add to favourites: ${error.message}`
          : 'Failed to add comedians to favourites. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Bulk unhide comedians
 * Currently wraps single operations - can be optimized with batch API in future
 */
export function useBulkUnhide() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      comedianIds,
      eventId
    }: {
      userId: string;
      comedianIds: string[];
      eventId?: string;
    }) => {
      await Promise.all(comedianIds.map((comedianId) => unhideComedian(userId, comedianId, eventId)));
      return { userId, count: comedianIds.length, eventId };
    },
    onSuccess: ({ userId, count, eventId }) => {
      // Invalidate all hidden queries for this user
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.hidden(userId, eventId)
      });
      queryClient.invalidateQueries({
        queryKey: ['user-preferences', 'is-hidden', userId]
      });

      // Also invalidate global if event-specific
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: userPreferencesKeys.hidden(userId)
        });
      }

      toast({
        title: 'Comedians unhidden',
        description: `${count} comedians have been unhidden.`
      });
    },
    onError: (error: any) => {
      console.error('Error bulk unhiding comedians:', error);
      toast({
        variant: 'destructive',
        title: 'Error unhiding comedians',
        description: error instanceof Error
          ? `Failed to unhide comedians: ${error.message}`
          : 'Failed to unhide comedians. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Bulk hide comedians
 * Uses Promise.allSettled for partial success handling
 */
export function useBulkHide() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      comedianIds,
      scope,
      eventId
    }: {
      userId: string;
      comedianIds: string[];
      scope: 'event' | 'global';
      eventId?: string;
    }) => {
      const results = await Promise.allSettled(
        comedianIds.map((comedianId) => hideComedian(userId, comedianId, scope, eventId))
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return { userId, succeeded, failed, total: comedianIds.length, eventId, scope };
    },
    onSuccess: ({ userId, succeeded, failed, total, eventId, scope }) => {
      // Invalidate all hidden queries for this user
      queryClient.invalidateQueries({
        queryKey: userPreferencesKeys.hidden(userId, eventId)
      });
      queryClient.invalidateQueries({
        queryKey: ['user-preferences', 'is-hidden', userId]
      });

      // Also invalidate global if hiding event-specific
      if (scope === 'event') {
        queryClient.invalidateQueries({
          queryKey: userPreferencesKeys.hidden(userId)
        });
      }

      if (failed > 0) {
        toast({
          variant: 'destructive',
          title: 'Partial success',
          description: `Hid ${succeeded}/${total} comedians (${failed} failed)`
        });
      } else {
        toast({
          title: 'Comedians hidden',
          description: `Successfully hid ${succeeded} comedians`
        });
      }
    },
    onError: (error: any) => {
      console.error('Error bulk hiding comedians:', error);
      toast({
        variant: 'destructive',
        title: 'Error hiding comedians',
        description: error instanceof Error
          ? `Failed to hide comedians: ${error.message}`
          : 'Failed to hide comedians. Please try again.'
      });
    },
    retry: 1
  });
}
