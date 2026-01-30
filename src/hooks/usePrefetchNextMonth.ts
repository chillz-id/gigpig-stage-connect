import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

// Format Date as yyyy-mm-dd using local time to avoid UTC timezone shift
const toLocalDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface UsePrefetchNextMonthOptions {
  currentMonth: Date;
  timezone: string;
}

/**
 * usePrefetchNextMonth Hook
 *
 * Prefetches the next month's events using React Query's prefetchQuery.
 * This ensures instant transitions when navigating to the next month.
 */
export function usePrefetchNextMonth({
  currentMonth,
  timezone,
}: UsePrefetchNextMonthOptions) {
  const queryClient = useQueryClient();

  const prefetchNextMonth = useCallback(async () => {
    const nextMonth = addMonths(currentMonth, 1);
    const startDate = toLocalDateString(startOfMonth(nextMonth));
    const endDate = toLocalDateString(endOfMonth(nextMonth));

    // Use datetime format matching event-browse-service
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    // Prefetch the next month's events
    await queryClient.prefetchQuery({
      queryKey: ['session-calendar', startDate, endDate, timezone, false],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('session_complete')
          .select('*')
          .ilike('timezone', timezone)
          .gte('session_start_local', startDateTime)
          .lte('session_start_local', endDateTime)
          .order('session_start_local', { ascending: true });

        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [currentMonth, timezone, queryClient]);

  const prefetchPrevMonth = useCallback(async () => {
    const prevMonth = addMonths(currentMonth, -1);
    const startDate = toLocalDateString(startOfMonth(prevMonth));
    const endDate = toLocalDateString(endOfMonth(prevMonth));

    // Use datetime format matching event-browse-service
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    // Prefetch the previous month's events
    await queryClient.prefetchQuery({
      queryKey: ['session-calendar', startDate, endDate, timezone, false],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('session_complete')
          .select('*')
          .ilike('timezone', timezone)
          .gte('session_start_local', startDateTime)
          .lte('session_start_local', endDateTime)
          .order('session_start_local', { ascending: true });

        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [currentMonth, timezone, queryClient]);

  // Prefetch both adjacent months
  const prefetchAdjacentMonths = useCallback(async () => {
    await Promise.all([prefetchNextMonth(), prefetchPrevMonth()]);
  }, [prefetchNextMonth, prefetchPrevMonth]);

  return {
    prefetchNextMonth,
    prefetchPrevMonth,
    prefetchAdjacentMonths,
  };
}
