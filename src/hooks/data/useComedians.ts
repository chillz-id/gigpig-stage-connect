import { createCrudHook } from '@/lib/api/hooks';
import { comediansApi, Comedian, ComedianFilters } from '@/services/api/comedians';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleApiSuccess, handleApiError } from '@/lib/api/base';

// Create the base CRUD hook
const useComediansCrud = createCrudHook<Comedian>(comediansApi, {
  queryKey: ['comedians'],
  messages: {
    createSuccess: 'Comedian profile created successfully',
    updateSuccess: 'Comedian profile updated successfully',
    deleteSuccess: 'Comedian profile deleted successfully'
  }
});

// Extended comedians hook
export function useComedians(filters?: ComedianFilters) {
  const crud = useComediansCrud(filters);
  
  // Custom query for comedians with stats
  const {
    data: comediansWithStats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['comedians-with-stats', filters],
    queryFn: async () => {
      const response = await comediansApi.getComediansWithStats(filters);
      if (response.error) throw response.error;
      return response.data || [];
    }
  });
  
  return {
    ...crud,
    // Use comedians with stats when available
    comedians: comediansWithStats || crud.items,
    isLoading: crud.isLoading || isLoadingStats,
    refetchStats
  };
}

// Hook for comedian availability
export function useComedianAvailability(comedianId: string | undefined, dateRange?: { start: string; end: string }) {
  const queryClient = useQueryClient();
  
  const {
    data: availability = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['comedian-availability', comedianId, dateRange],
    queryFn: async () => {
      if (!comedianId || !dateRange) return [];
      const response = await comediansApi.getComedianAvailability(
        comedianId,
        dateRange.start,
        dateRange.end
      );
      if (response.error) throw response.error;
      return response.data || [];
    },
    enabled: !!comedianId && !!dateRange
  });
  
  const updateAvailability = useMutation({
    mutationFn: async ({ date, isAvailable }: { date: string; isAvailable: boolean }) => {
      if (!comedianId) throw new Error('No comedian ID');
      const response = await comediansApi.updateAvailability(comedianId, date, isAvailable);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comedian-availability', comedianId] });
      handleApiSuccess('Availability updated');
    },
    onError: (error) => {
      handleApiError(error, 'update availability');
    }
  });
  
  return {
    availability,
    isLoading,
    updateAvailability: updateAvailability.mutate,
    isUpdating: updateAvailability.isPending,
    refetch
  };
}

// Hook for comedian gigs
export function useComedianGigs(comedianId: string | undefined) {
  const {
    data: upcomingGigs = [],
    isLoading: isLoadingUpcoming
  } = useQuery({
    queryKey: ['comedian-upcoming-gigs', comedianId],
    queryFn: async () => {
      if (!comedianId) return [];
      const response = await comediansApi.getUpcomingGigs(comedianId);
      if (response.error) throw response.error;
      return response.data || [];
    },
    enabled: !!comedianId
  });
  
  const {
    data: pastPerformances = [],
    isLoading: isLoadingPast
  } = useQuery({
    queryKey: ['comedian-past-performances', comedianId],
    queryFn: async () => {
      if (!comedianId) return [];
      const response = await comediansApi.getPastPerformances(comedianId);
      if (response.error) throw response.error;
      return response.data || [];
    },
    enabled: !!comedianId
  });
  
  return {
    upcomingGigs,
    pastPerformances,
    isLoading: isLoadingUpcoming || isLoadingPast
  };
}

// Hook for single comedian
export function useComedian(comedianId: string | undefined) {
  const {
    data: comedian,
    isLoading,
    error
  } = useQuery({
    queryKey: ['comedians', comedianId],
    queryFn: async () => {
      if (!comedianId) return null;
      const response = await comediansApi.findById(comedianId);
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: !!comedianId
  });
  
  return {
    comedian,
    isLoading,
    error
  };
}