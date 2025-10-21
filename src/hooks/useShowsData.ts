import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { eventBrowseService, type BrowseEvent } from '@/services/event/event-browse-service';
import type { CalendarRange } from '@/hooks/useCalendarRange';

export interface ShowsFilters {
  includePast?: boolean;
  statuses?: string[];
  type?: string;
  city?: string;
  includeDraftsForOwner?: boolean;
}

interface UseShowsDataParams {
  range: CalendarRange;
  filters?: ShowsFilters;
  enabled?: boolean;
}

export const useShowsData = ({
  range,
  filters,
  enabled = true,
}: UseShowsDataParams) => {
  const { user } = useAuth();

  const query = useQuery<BrowseEvent[]>({
    queryKey: [
      'shows-data',
      range.startISO,
      range.endISO,
      filters?.includePast ?? false,
      filters?.statuses ?? null,
      filters?.type ?? null,
      filters?.city ?? null,
      filters?.includeDraftsForOwner ?? false,
      user?.id ?? null,
    ],
    queryFn: () =>
      eventBrowseService.list({
        startDate: range.startISO,
        endDate: range.endISO,
        includePast: filters?.includePast ?? false,
        statuses: filters?.statuses,
        type: filters?.type,
        city: filters?.city,
        includeDraftsForOwner: filters?.includeDraftsForOwner ?? false,
        userId: user?.id ?? null,
      }),
    enabled,
    staleTime: 60 * 1000,
  });

  return query;
};

export type UseShowsDataReturn = ReturnType<typeof useShowsData>;
