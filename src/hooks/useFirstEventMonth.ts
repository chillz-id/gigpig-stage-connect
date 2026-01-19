import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseFirstEventMonthOptions {
  city: string;
  enabled?: boolean;
}

interface FirstEventMonth {
  year: number;
  month: number; // 0-indexed (January = 0)
  date: Date;
}

/**
 * useFirstEventMonth Hook
 *
 * Queries for the first event date for a given city.
 * Used to auto-navigate to the first month with events when switching cities.
 */
export function useFirstEventMonth({ city, enabled = true }: UseFirstEventMonthOptions) {
  // Map city to timezone
  const getTimezoneFromCity = (city: string): string => {
    switch (city.toLowerCase()) {
      case 'sydney':
        return 'Australia/Sydney';
      case 'melbourne':
        return 'Australia/Melbourne';
      default:
        return 'Australia/Sydney';
    }
  };

  const timezone = getTimezoneFromCity(city);

  const { data, isLoading, error } = useQuery<FirstEventMonth | null>({
    queryKey: ['first-event-month', city],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Query for the first upcoming event in this city
      // Use session_start_local column (matches event-browse-service)
      const todayDateTime = `${todayStr} 00:00:00`;
      const { data, error } = await supabase
        .from('session_complete')
        .select('session_start_local')
        .ilike('timezone', timezone)
        .gte('session_start_local', todayDateTime)
        .order('session_start_local', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        // No events found is a valid result
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      if (!data?.session_start_local) {
        return null;
      }

      // Parse session_start_local (format: "YYYY-MM-DD HH:MM:SS")
      const eventDate = new Date(data.session_start_local.replace(' ', 'T'));
      return {
        year: eventDate.getFullYear(),
        month: eventDate.getMonth(),
        date: eventDate,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
  });

  return {
    firstEventMonth: data ?? null,
    isLoading,
    error,
    hasEvents: data !== null,
  };
}
