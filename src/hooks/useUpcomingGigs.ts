import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UpcomingGig {
  id: string;
  event_id: string;
  title: string;
  venue: string;
  event_date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  payment_amount?: number;
  payment_status?: string;
}

export const useUpcomingGigs = () => {
  const { user, hasRole } = useAuth();

  const { data: upcomingGigs = [], isLoading, error } = useQuery({
    queryKey: ['upcoming-gigs', user?.id],
    queryFn: async () => {
      if (!user?.id || !(hasRole('comedian') || hasRole('comedian_lite'))) {
        return [];
      }

      // Get confirmed applications for upcoming events
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          event_id,
          status,
          applied_at,
          events!applications_event_id_fkey (
            id,
            title,
            venue,
            event_date,
            pay_per_comedian,
            currency
          )
        `)
        .eq('comedian_id', user.id)
        .eq('status', 'accepted')
        .gte('events.event_date', new Date().toISOString());

      if (error) {
        console.error('Error fetching upcoming gigs:', error);
        throw error;
      }

      // Map and sort by event date in JavaScript (can't order by nested field in PostgREST)
      return (data || [])
        .map((application: any) => ({
          id: application.id,
          event_id: application.event_id,
          title: application.events?.title || 'Untitled Event',
          venue: application.events?.venue || 'Venue TBA',
          event_date: application.events?.event_date,
          status: application.status,
          payment_amount: application.events?.pay_per_comedian,
          payment_status: 'pending' // Default status
        }))
        .sort((a, b) => {
          // Sort by event_date ascending
          const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
          const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
          return dateA - dateB;
        }) as UpcomingGig[];
    },
    enabled: !!user?.id && (hasRole('comedian') || hasRole('comedian_lite')),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Get count of confirmed upcoming gigs
  const confirmedGigCount = upcomingGigs.filter(
    gig => gig.status === 'accepted' && new Date(gig.event_date) > new Date()
  ).length;

  // Get next upcoming gig
  const nextGig = upcomingGigs.length > 0 ? upcomingGigs[0] : null;

  return {
    upcomingGigs,
    confirmedGigCount,
    nextGig,
    isLoading,
    error
  };
};