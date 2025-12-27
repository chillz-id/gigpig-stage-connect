import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ComedianGig {
  id: string;
  comedian_id: string;
  event_id?: string;
  title: string;
  event_date: string;
  venue: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  calendar_sync_status: 'pending' | 'synced' | 'failed';
  banner_url?: string | null;
  ticket_link?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
  // Event details if linked
  event?: {
    id: string;
    title: string;
    venue: string;
    address?: string;
    city?: string;
    state?: string;
    start_time?: string;
    end_time?: string;
    promoter_id: string;
    promoter?: {
      name: string;
      email?: string;
    };
  };
  // Event spot details if applicable
  event_spot?: {
    id: string;
    spot_name: string;
    is_paid: boolean;
    payment_amount?: number;
    duration_minutes?: number;
  };
}

export const useComedianGigs = (comedianId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use current user if no comedianId provided
  const targetComedianId = comedianId || user?.id;

  // Fetch confirmed gigs from calendar_events
  const { data: gigs, isLoading, error } = useQuery({
    queryKey: ['comedian-gigs', targetComedianId],
    queryFn: async () => {
      if (!targetComedianId) return [];

      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          events:event_id (
            id,
            title,
            venue,
            address,
            event_date,
            promoter_id
          )
        `)
        .eq('comedian_id', targetComedianId)
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Also fetch confirmed event spots for this comedian
      const { data: spotData, error: spotError } = await supabase
        .from('event_spots')
        .select(`
          *,
          events:event_id (
            id,
            title,
            venue,
            address,
            event_date,
            promoter_id
          )
        `)
        .eq('comedian_id', targetComedianId)
        .eq('is_filled', true);

      if (spotError) console.error('Error fetching spots:', spotError);

      // Combine calendar events with confirmed spots
      const calendarGigs: ComedianGig[] = (data || []).map(event => ({
        id: event.id,
        comedian_id: event.comedian_id,
        event_id: event.event_id,
        title: event.title,
        event_date: event.event_date,
        venue: event.venue,
        status: event.status,
        calendar_sync_status: event.calendar_sync_status,
        banner_url: event.banner_url,
        ticket_link: event.ticket_link,
        description: event.description,
        created_at: event.created_at,
        updated_at: event.updated_at,
        event: event.events ? {
          id: event.events.id,
          title: event.events.title,
          venue: event.events.venue,
          address: event.events.address,
          city: undefined, // Not in events table
          state: undefined, // Not in events table
          start_time: event.events.event_date,
          end_time: undefined, // Not in events table
          promoter_id: event.events.promoter_id
        } : undefined
      }));

      const spotGigs: ComedianGig[] = (spotData || []).map(spot => ({
        id: `spot-${spot.id}`,
        comedian_id: spot.comedian_id,
        event_id: spot.event_id,
        title: spot.events?.title || 'Upcoming Performance',
        event_date: spot.events?.event_date || new Date().toISOString(),
        venue: spot.events?.venue || 'TBA',
        status: 'confirmed' as const,
        calendar_sync_status: 'pending' as const,
        ticket_link: null,
        description: null,
        created_at: spot.created_at,
        updated_at: spot.updated_at,
        event: spot.events ? {
          id: spot.events.id,
          title: spot.events.title,
          venue: spot.events.venue,
          address: spot.events.address,
          city: undefined, // Not in events table
          state: undefined, // Not in events table
          start_time: spot.events.event_date,
          end_time: undefined, // Not in events table
          promoter_id: spot.events.promoter_id
        } : undefined,
        event_spot: {
          id: spot.id,
          spot_name: spot.spot_name,
          is_paid: spot.is_paid,
          payment_amount: spot.payment_amount,
          duration_minutes: spot.duration_minutes
        }
      }));

      // Combine and deduplicate
      const allGigs = [...calendarGigs, ...spotGigs];
      const uniqueGigs = allGigs.filter((gig, index, self) => 
        index === self.findIndex(g => g.event_id === gig.event_id)
      );

      return uniqueGigs.sort((a, b) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );
    },
    enabled: !!targetComedianId
  });

  // Add manual gig mutation
  const addGigMutation = useMutation({
    mutationFn: async (gig: {
      title: string;
      event_date: string;
      venue: string;
      status?: 'confirmed' | 'pending';
      banner_url?: string | null;
      ticket_link?: string | null;
      description?: string | null;
    }) => {
      console.log('📅 [useComedianGigs] addGig mutation triggered with:', gig);
      console.log('📅 [useComedianGigs] user.id:', user?.id);

      if (!user?.id) throw new Error('Must be logged in');

      const insertData = {
        comedian_id: user.id,
        title: gig.title,
        event_date: gig.event_date,
        venue: gig.venue,
        status: gig.status || 'confirmed',
        banner_url: gig.banner_url || null,
        ticket_link: gig.ticket_link || null,
        description: gig.description || null,
        calendar_sync_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📅 [useComedianGigs] Inserting data:', insertData);

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ [useComedianGigs] Insert error:', error);
        throw error;
      }

      console.log('✅ [useComedianGigs] Insert successful:', data);
      return data;
    },
    onSuccess: async (newGig) => {
      queryClient.invalidateQueries({ queryKey: ['comedian-gigs', user?.id] });
      
      // Trigger calendar sync if gig is confirmed
      if (newGig.status === 'confirmed') {
        // Check if user has Google Calendar integration
        const { data: integrations } = await supabase
          .from('calendar_integrations')
          .select('*')
          .eq('user_id', user?.id)
          .eq('provider', 'google')
          .eq('is_active', true);

        if (integrations && integrations.length > 0) {
          // Trigger sync to Google Calendar
          try {
            await fetch('/api/google-calendar/sync-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                integration_id: integrations[0].id,
                event_id: newGig.id,
                action: 'create'
              })
            });
            
            // Update sync status
            await supabase
              .from('calendar_events')
              .update({ calendar_sync_status: 'synced' })
              .eq('id', newGig.id);
              
          } catch (syncError) {
            console.error('Calendar sync failed:', syncError);
            // Update sync status to failed
            await supabase
              .from('calendar_events')
              .update({ calendar_sync_status: 'failed' })
              .eq('id', newGig.id);
          }
        }
      }
      
      toast({
        title: "Gig Added",
        description: "Your gig has been added to your calendar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add gig",
        variant: "destructive"
      });
    }
  });

  // Update gig status mutation
  const updateGigMutation = useMutation({
    mutationFn: async ({ gigId, status }: { gigId: string; status: 'confirmed' | 'pending' | 'cancelled' }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('calendar_events')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', gigId)
        .eq('comedian_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comedian-gigs', user?.id] });
      toast({
        title: "Gig Updated",
        description: "Your gig status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update gig",
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const getUpcomingGigs = () => {
    const now = new Date();
    return gigs?.filter(gig => new Date(gig.event_date) >= now) || [];
  };

  const getPastGigs = () => {
    const now = new Date();
    return gigs?.filter(gig => new Date(gig.event_date) < now) || [];
  };

  const getGigsByStatus = (status: 'confirmed' | 'pending' | 'cancelled') => {
    return gigs?.filter(gig => gig.status === status) || [];
  };

  return {
    gigs: gigs || [],
    isLoading,
    error,
    addGig: addGigMutation.mutate,
    updateGig: updateGigMutation.mutate,
    isAddingGig: addGigMutation.isPending,
    isUpdatingGig: updateGigMutation.isPending,
    getUpcomingGigs,
    getPastGigs,
    getGigsByStatus
  };
};