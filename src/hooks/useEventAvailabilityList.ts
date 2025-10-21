import { useQuery } from '@tanstack/react-query';
import {
  eventAvailabilityService,
  type EventAvailabilitySubmission,
  type AvailabilityFilters,
} from '@/services/event/availability-service';

interface UseEventAvailabilityListOptions {
  canonical_source?: string;
  canonical_session_source_id?: string;
  email?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch event availability submissions (for admin/promoter view)
 * Requires authentication with proper role (admin, promoter, venue_manager, agency_manager)
 */
export function useEventAvailabilityList(options: UseEventAvailabilityListOptions = {}) {
  const {
    canonical_source,
    canonical_session_source_id,
    email,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ['event-availability-submissions', canonical_source, canonical_session_source_id, email],
    queryFn: async (): Promise<EventAvailabilitySubmission[]> => {
      const filters: AvailabilityFilters = {
        canonical_source,
        canonical_session_source_id,
        email,
      };

      try {
        return await eventAvailabilityService.list(filters);
      } catch (error: any) {
        console.error('Error fetching availability submissions:', error);
        throw new Error(`Failed to fetch submissions: ${error?.message ?? 'Unknown error'}`);
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch submissions grouped by event
 * Returns a map of event IDs to their submissions
 */
export function useAvailabilityByEvent(enabled = true) {
  return useQuery({
    queryKey: ['availability-by-event'],
    queryFn: async () => {
      try {
        return await eventAvailabilityService.listGroupedByEvent();
      } catch (error: any) {
        console.error('Error fetching availability by event:', error);
        throw new Error(`Failed to fetch availability: ${error?.message ?? 'Unknown error'}`);
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}
