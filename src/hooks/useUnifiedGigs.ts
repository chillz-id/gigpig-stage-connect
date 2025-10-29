import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { manualGigsService } from '@/services/gigs/manual-gigs-service';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedGig {
  id: string;
  title: string;
  venue_name: string | null;
  venue_address: string | null;
  start_datetime: string;
  end_datetime: string | null;
  source: 'platform' | 'manual'; // For color coding
  notes?: string | null;
}

/**
 * Hook to fetch unified gigs from both manual gigs and platform (accepted applications)
 * Returns combined list sorted by start datetime ascending
 */
export function useUnifiedGigs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unified-gigs', user?.id],
    queryFn: async (): Promise<UnifiedGig[]> => {
      if (!user) return [];

      // Fetch manual gigs
      const manualGigs = await manualGigsService.getUserManualGigs(user.id);

      // Fetch confirmed platform spots (from applications + events)
      const { data: acceptedApplications, error } = await supabase
        .from('applications')
        .select(`
          id,
          event_id,
          status,
          events (
            id,
            title,
            venue,
            event_date
          )
        `)
        .eq('comedian_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;

      // Transform manual gigs to UnifiedGig format
      const manual: UnifiedGig[] = manualGigs.map(gig => ({
        id: gig.id,
        title: gig.title,
        venue_name: gig.venue_name,
        venue_address: gig.venue_address,
        start_datetime: gig.start_datetime,
        end_datetime: gig.end_datetime,
        source: 'manual' as const,
        notes: gig.notes,
      }));

      // Transform platform gigs to UnifiedGig format
      const platform: UnifiedGig[] = (acceptedApplications || []).map(app => ({
        id: app.id,
        title: app.events?.title || 'Untitled Event',
        venue_name: app.events?.venue || null,
        venue_address: null,
        start_datetime: app.events?.event_date || '',
        end_datetime: null,
        source: 'platform' as const,
      }));

      // Combine and sort by start datetime ascending
      return [...manual, ...platform].sort((a, b) =>
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
