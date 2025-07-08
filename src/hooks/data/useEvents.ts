import { createCrudHook } from '@/lib/api/hooks';
import { eventsApi } from '@/services/api/events';
import { Event } from '@/types/event';
import { useQuery } from '@tanstack/react-query';

// Create the base CRUD hook
const useEventsCrud = createCrudHook<Event>(eventsApi, {
  queryKey: ['events'],
  messages: {
    createSuccess: 'Event created successfully',
    updateSuccess: 'Event updated successfully',
    deleteSuccess: 'Event deleted successfully'
  }
});

// Extended events hook with additional functionality
export function useEvents(filters?: {
  status?: string;
  venue_id?: string;
  date_from?: string;
  date_to?: string;
  my_events?: boolean;
}) {
  // Get base CRUD functionality
  const crud = useEventsCrud(filters);
  
  // Add custom query for events with details
  const {
    data: eventsWithDetails,
    isLoading: isLoadingDetails,
    refetch: refetchDetails
  } = useQuery({
    queryKey: ['events-with-details', filters],
    queryFn: async () => {
      const response = await eventsApi.getEventsWithDetails(filters);
      if (response.error) throw response.error;
      return response.data || [];
    }
  });
  
  // Additional mutations
  const publishEvent = async (eventId: string) => {
    const response = await eventsApi.updateStatus(eventId, 'published');
    if (response.error) throw response.error;
    crud.refetch();
    refetchDetails();
    return response.data;
  };
  
  const unpublishEvent = async (eventId: string) => {
    const response = await eventsApi.updateStatus(eventId, 'draft');
    if (response.error) throw response.error;
    crud.refetch();
    refetchDetails();
    return response.data;
  };
  
  const addCoPromoter = async (eventId: string, promoterId: string) => {
    const response = await eventsApi.addCoPromoter(eventId, promoterId);
    if (response.error) throw response.error;
    crud.refetch();
    refetchDetails();
    return response.data;
  };
  
  const removeCoPromoter = async (eventId: string, promoterId: string) => {
    const response = await eventsApi.removeCoPromoter(eventId, promoterId);
    if (response.error) throw response.error;
    crud.refetch();
    refetchDetails();
    return response.data;
  };
  
  return {
    // Spread base CRUD functionality
    ...crud,
    
    // Override items with detailed data when available
    items: eventsWithDetails || crud.items,
    isLoading: crud.isLoading || isLoadingDetails,
    
    // Additional methods
    publishEvent,
    unpublishEvent,
    addCoPromoter,
    removeCoPromoter,
    refetchDetails
  };
}

// Optimized hook for event listings (Shows page)
export function useEventsForListing(filters?: {
  status?: string;
  venue_id?: string;
  date_from?: string;
  date_to?: string;
  my_events?: boolean;
}) {
  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ['events-listing', filters],
    queryFn: async () => {
      const response = await eventsApi.getEventsForListing(filters);
      if (response.error) throw response.error;
      return response.data || [];
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });
  
  return {
    events,
    isLoading,
    error,
    refetch
  };
}

// Hook for single event
export function useEvent(eventId: string | undefined) {
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['events', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const response = await eventsApi.findById(eventId);
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: !!eventId
  });
  
  return {
    event,
    isLoading,
    error
  };
}