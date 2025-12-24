import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

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

  const { data, isLoading, error } = useQuery({
    queryKey: ['upcoming-gigs', user?.id],
    queryFn: async () => {
      if (!user?.id || !(hasRole('comedian') || hasRole('comedian_lite'))) {
        return { allConfirmedGigs: [], upcomingGigs: [] };
      }

      // Get ALL confirmed applications (not just upcoming - for metrics)
      const { data, error } = await supabase
        .from('applications')
        .select(
          `
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
        `
        )
        .eq('comedian_id', user.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching gigs:', error);
        throw error;
      }

      const now = new Date();

      // Map all confirmed gigs
      const allConfirmedGigs = (data || [])
        .filter((application: any) => application.events?.event_date)
        .map((application: any) => ({
          id: application.id,
          event_id: application.event_id,
          title: application.events?.title || 'Untitled Event',
          venue: application.events?.venue || 'Venue TBA',
          event_date: application.events?.event_date,
          status: application.status,
          payment_amount: application.events?.pay_per_comedian,
          payment_status: 'pending'
        })) as UpcomingGig[];

      // Filter to upcoming events only
      const upcomingGigs = allConfirmedGigs
        .filter(gig => new Date(gig.event_date) >= now)
        .sort((a, b) => {
          const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
          const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
          return dateA - dateB;
        });

      return { allConfirmedGigs, upcomingGigs };
    },
    enabled: !!user?.id && (hasRole('comedian') || hasRole('comedian_lite')),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const upcomingGigs = data?.upcomingGigs || [];
  const allConfirmedGigs = data?.allConfirmedGigs || [];

  // Get count of confirmed upcoming gigs
  const confirmedGigCount = upcomingGigs.length;

  // Get next upcoming gig
  const nextGig = upcomingGigs.length > 0 ? upcomingGigs[0] : null;

  // Total confirmed gigs (all time)
  const totalConfirmedGigs = allConfirmedGigs.length;

  // This month's confirmed gigs
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thisMonthGigs = allConfirmedGigs.filter(gig => {
    const gigDate = new Date(gig.event_date);
    return isWithinInterval(gigDate, { start: monthStart, end: monthEnd });
  });
  const thisMonthGigCount = thisMonthGigs.length;

  // Total minutes performed (placeholder - will be updated when lineup data is available)
  const totalMinutesPerformed = 0;
  const thisMonthMinutes = 0;

  return {
    upcomingGigs,
    confirmedGigCount,
    nextGig,
    totalConfirmedGigs,
    thisMonthGigCount,
    totalMinutesPerformed,
    thisMonthMinutes,
    isLoading,
    error
  };
};
