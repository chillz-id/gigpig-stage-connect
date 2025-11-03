import { useQuery } from '@tanstack/react-query';
import { eventBrowseService, BrowseEvent } from '@/services/event/event-browse-service';
import { useAuth } from '@/contexts/AuthContext';

interface UseSessionCalendarOptions {
  startDate: string; // ISO date (yyyy-mm-dd)
  endDate: string;   // ISO date (yyyy-mm-dd)
  includePast?: boolean;
  timezone?: string; // e.g., 'Australia/Sydney', 'Australia/Melbourne'
}

interface UseSessionCalendarReturn {
  events: BrowseEvent[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching scraped events from session_complete view (Humanitix/Eventbrite data)
 *
 * This hook provides access to real-world Sydney comedy scene events for the Gigs page.
 * Events are scraped from external ticketing platforms and enriched with financial data.
 *
 * @param options - Filter options for event browsing
 * @returns Events list, loading state, and error
 *
 * @example
 * ```tsx
 * const { events, isLoading, error } = useSessionCalendar({
 *   startDate: '2025-11-01',
 *   endDate: '2025-11-30',
 *   timezone: 'Australia/Sydney',
 *   includePast: false
 * });
 * ```
 */
export function useSessionCalendar(options: UseSessionCalendarOptions): UseSessionCalendarReturn {
  const { user } = useAuth();

  const {
    startDate,
    endDate,
    includePast = false,
    timezone = 'Australia/Sydney', // Default to Sydney timezone
  } = options;

  const { data, isLoading, error } = useQuery({
    queryKey: ['session-calendar', startDate, endDate, includePast, timezone, user?.id],
    queryFn: () =>
      eventBrowseService.list({
        startDate,
        endDate,
        includePast,
        timezone,
        userId: user?.id ?? null,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes - queries stay fresh
    gcTime: 10 * 60 * 1000,   // 10 minutes - unused data garbage collected
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no data found)
      if (error?.status === 404) {
        return false;
      }
      // Max 3 retries for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s (capped at 30s)
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
  });

  return {
    events: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
