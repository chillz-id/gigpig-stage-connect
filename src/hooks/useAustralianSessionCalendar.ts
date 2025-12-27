import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { eventBrowseService } from '@/services/event/event-browse-service';
import type { BrowseEvent } from '@/services/event/event-browse-service';

const TIMEZONE_MAP = {
  Sydney: 'Australia/Sydney',
  Melbourne: 'Australia/Melbourne',
} as const;

type AustralianCity = keyof typeof TIMEZONE_MAP;

export const useAustralianSessionCalendar = (
  start: Date,
  end: Date,
  city: AustralianCity = 'Sydney'
) => {
  return useQuery<BrowseEvent[]>({
    queryKey: [
      'australian-session-calendar',
      city,
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd'),
    ],
    queryFn: async () => {
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');

      // Database-level timezone filter - more reliable than city name
      return await eventBrowseService.list({
        startDate,
        endDate,
        includePast: false,
        timezone: TIMEZONE_MAP[city],
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
