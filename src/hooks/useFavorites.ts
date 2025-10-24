import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { favoriteService } from '@/services';
import { useToast } from '@/hooks/use-toast';

export const FAVORITES_QUERY_KEY = 'event-favorites';

export const useFavorites = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: favoriteIds = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [FAVORITES_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user || !hasRole('comedian')) {
        return [] as string[];
      }

      return favoriteService.listByUser(user.id);
    },
    staleTime: 60 * 1000,
    enabled: !!user,
  });

  const favoritesSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      if (!hasRole('comedian')) {
        throw new Error('ONLY_COMEDIANS_CAN_FAVORITE');
      }

      const isFavorited = favoritesSet.has(eventId);
      await favoriteService.toggle(user.id, eventId, !isFavorited);
      return !isFavorited;
    },
    onSuccess: (isNowFavorited) => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES_QUERY_KEY, user?.id] });
      toast({
        title: isNowFavorited ? 'Added to favorites' : 'Removed from favorites',
        description: isNowFavorited
          ? 'This show is now in your favorites list.'
          : 'This show has been removed from your favorites.',
      });
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === 'AUTH_REQUIRED') {
          toast({
            title: 'Sign in required',
            description: 'Please sign in as a comedian to save favorites.',
            variant: 'destructive',
          });
          return;
        }

        if (error.message === 'ONLY_COMEDIANS_CAN_FAVORITE') {
          toast({
            title: 'Comedian access required',
            description: 'Only comedians can favorite shows.',
            variant: 'destructive',
          });
          return;
        }
      }

      toast({
        title: 'Could not update favorites',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const toggleFavorite = (eventId: string) => toggleMutation.mutate(eventId);

  const isFavorited = (eventId?: string | null) => {
    if (!eventId) {
      return false;
    }
    return favoritesSet.has(eventId);
  };

  return {
    favorites: favoritesSet,
    favoriteIds,
    isLoading,
    error,
    toggleFavorite,
    isFavorited,
    isToggling: toggleMutation.isPending,
  };
};

export type UseFavoritesReturn = ReturnType<typeof useFavorites>;
