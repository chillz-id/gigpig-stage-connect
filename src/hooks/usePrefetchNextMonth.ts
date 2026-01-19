import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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
    const startDate = startOfMonth(nextMonth).toISOString().split('T')[0];
    const endDate = endOfMonth(nextMonth).toISOString().split('T')[0];

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
    const startDate = startOfMonth(prevMonth).toISOString().split('T')[0];
    const endDate = endOfMonth(prevMonth).toISOString().split('T')[0];

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
