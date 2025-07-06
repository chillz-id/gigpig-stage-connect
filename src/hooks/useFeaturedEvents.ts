
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFeaturedEvents = () => {
  return useQuery({
    queryKey: ['featured-events'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      console.log('useFeaturedEvents: Today is', today.toISOString());

      // First try to get featured events (temporarily showing all featured events)
      const { data: featuredData, error: featuredError } = await supabase
        .from('events')
        .select('*')
        .eq('featured', true)
        .order('event_date', { ascending: true })
        .limit(6);

      if (featuredError) throw featuredError;

      console.log('useFeaturedEvents: Featured events found:', featuredData?.length || 0);

      // If we have featured events, return them
      if (featuredData && featuredData.length > 0) {
        return featuredData;
      }

      // Otherwise, fall back to recent upcoming events
      const { data: recentData, error: recentError } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', today.toISOString())
        .order('event_date', { ascending: true })
        .limit(6);

      if (recentError) throw recentError;
      console.log('useFeaturedEvents: Fallback events found:', recentData?.length || 0);
      return recentData || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
