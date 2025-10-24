import { useQuery } from '@tanstack/react-query';
import { eventService, type UpcomingSessionEvent } from '@/services/crm/event-service';

interface UseUpcomingEventsOptions {
  enabled?: boolean;
  limit?: number;
}

/**
 * Hook to fetch upcoming events from session_financials view
 * Events are ordered by session_start ascending
 */
export function useUpcomingEvents(options: UseUpcomingEventsOptions = {}) {
  const { enabled = true, limit = 100 } = options;

  return useQuery({
    queryKey: ['upcoming-events', limit],
    queryFn: () => eventService.listUpcomingSessions(limit),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

export type { UpcomingSessionEvent as UpcomingEvent } from '@/services/crm/event-service';
