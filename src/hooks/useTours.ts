import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Tour Types
 */
export interface Tour {
  id: string;
  name: string;
  description?: string | null;
  tour_manager_id: string;
  agency_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  tour_type?: string | null;
  is_public?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TourEvent {
  id: string;
  title: string;
  event_date: string;
  venue?: string | null;
  address?: string | null;
  status: string;
  tour_id?: string | null;
  ticket_price?: number | null;
  start_time?: string | null;
}

export interface TourWithEvents extends Tour {
  events: TourEvent[];
  event_count: number;
  next_event_date?: string | null;
}

export interface CreateTourPayload {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  eventIds?: string[];
}

export interface AddEventsToTourPayload {
  tourId: string;
  eventIds: string[];
}

/**
 * Hook to fetch all tours for the current user with their events
 */
export function useTours() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tours', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');

      // Fetch tours where user is the tour manager
      const { data: tours, error: toursError } = await supabase
        .from('tours')
        .select('*')
        .eq('tour_manager_id', user.id)
        .order('created_at', { ascending: false });

      if (toursError) throw toursError;

      // Fetch events for each tour
      const toursWithEvents: TourWithEvents[] = [];

      for (const tour of tours || []) {
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            title,
            event_date,
            venue,
            address,
            status,
            tour_id,
            ticket_price,
            start_time
          `)
          .eq('tour_id', tour.id)
          .order('event_date', { ascending: true });

        if (eventsError) {
          console.error('Error fetching tour events:', eventsError);
        }

        const tourEvents = (events || []) as TourEvent[];

        // Find next upcoming event
        const now = new Date();
        const nextEvent = tourEvents.find(e => new Date(e.event_date) >= now);

        toursWithEvents.push({
          ...tour,
          events: tourEvents,
          event_count: tourEvents.length,
          next_event_date: nextEvent?.event_date || null,
        });
      }

      return toursWithEvents;
    },
    enabled: !!user?.id,
  });
}

/**
 * Extended TourEvent with series info
 */
export interface TourEventWithSeries extends TourEvent {
  series_id?: string | null;
  is_recurring?: boolean | null;
}

/**
 * Grouped recurring series for tours modal
 */
export interface TourRecurringSeries {
  series_id: string;
  series_name: string;
  events: TourEventWithSeries[];
  event_count: number;
}

/**
 * Hook to fetch events not assigned to any tour (includes recurring and partner events)
 */
export function useUnassignedEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unassigned-tour-events', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');

      // Fetch events where user is promoter
      const { data: ownedEvents, error: ownedError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          venue,
          address,
          status,
          tour_id,
          ticket_price,
          start_time,
          series_id,
          is_recurring
        `)
        .eq('promoter_id', user.id)
        .is('tour_id', null)
        .neq('status', 'draft')
        .order('event_date', { ascending: true })
        .limit(1000);

      if (ownedError) throw ownedError;

      // Fetch events where user is a partner
      const { data: partnerEventIds, error: partnerError } = await supabase
        .from('event_partners')
        .select('event_id')
        .eq('partner_profile_id', user.id)
        .eq('status', 'active');

      if (partnerError) throw partnerError;

      let partnerEvents: TourEventWithSeries[] = [];
      if (partnerEventIds && partnerEventIds.length > 0) {
        const ids = partnerEventIds.map(p => p.event_id);
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            title,
            event_date,
            venue,
            address,
            status,
            tour_id,
            ticket_price,
            start_time,
            series_id,
            is_recurring
          `)
          .in('id', ids)
          .is('tour_id', null)
          .neq('status', 'draft')
          .order('event_date', { ascending: true });

        if (eventsError) throw eventsError;
        partnerEvents = (events || []) as TourEventWithSeries[];
      }

      // Combine and deduplicate
      const allEvents = [...(ownedEvents || []), ...partnerEvents] as TourEventWithSeries[];
      const uniqueEvents = Array.from(
        new Map(allEvents.map(e => [e.id, e])).values()
      );

      return uniqueEvents;
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook to get grouped recurring series from unassigned events
 */
export function useGroupedUnassignedEvents(events: TourEventWithSeries[] | undefined) {
  // Separate recurring and standalone events
  const recurringEvents = events?.filter(e => e.series_id && e.is_recurring) || [];
  const standaloneEvents = events?.filter(e => !e.series_id || !e.is_recurring) || [];

  // Group recurring events by series_id
  const seriesMap = new Map<string, TourRecurringSeries>();
  for (const event of recurringEvents) {
    const seriesId = event.series_id!;
    if (!seriesMap.has(seriesId)) {
      // Use the first event's title as series name
      const seriesName = event.title?.replace(/\s*-\s*\d+.*$/, '').trim() || 'Unnamed Series';
      seriesMap.set(seriesId, {
        series_id: seriesId,
        series_name: seriesName,
        events: [],
        event_count: 0,
      });
    }
    const series = seriesMap.get(seriesId)!;
    series.events.push(event);
    series.event_count++;
  }

  return {
    recurringSeries: Array.from(seriesMap.values()),
    standaloneEvents,
  };
}

/**
 * Hook to create a new tour
 */
export function useCreateTour() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, description, start_date, end_date, eventIds }: CreateTourPayload) => {
      if (!user?.id) throw new Error('User ID is required');

      // Create the tour
      const { data: tour, error: tourError } = await supabase
        .from('tours')
        .insert({
          name,
          description,
          start_date,
          end_date,
          tour_manager_id: user.id,
          status: 'planning',
        })
        .select()
        .single();

      if (tourError) throw tourError;

      // If eventIds provided, assign them to this tour
      if (eventIds && eventIds.length > 0) {
        const { error: updateError } = await supabase
          .from('events')
          .update({ tour_id: tour.id })
          .in('id', eventIds)
          .eq('promoter_id', user.id);

        if (updateError) throw updateError;
      }

      return { tour, eventCount: eventIds?.length || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tours', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-tour-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Tour created',
        description: `Created tour "${data.tour.name}"${data.eventCount > 0 ? ` with ${data.eventCount} events` : ''}.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating tour',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to add events to an existing tour
 */
export function useAddEventsToTour() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tourId, eventIds }: AddEventsToTourPayload) => {
      if (!user?.id) throw new Error('User ID is required');

      const { error } = await supabase
        .from('events')
        .update({ tour_id: tourId })
        .in('id', eventIds)
        .eq('promoter_id', user.id);

      if (error) throw error;

      return { eventCount: eventIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tours', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-tour-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Events added to tour',
        description: `Added ${data.eventCount} event(s) to the tour.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error adding events',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to remove an event from a tour
 */
export function useRemoveEventFromTour() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('User ID is required');

      const { error } = await supabase
        .from('events')
        .update({ tour_id: null })
        .eq('id', eventId)
        .eq('promoter_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-tour-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Event removed from tour',
        description: 'The event is no longer part of the tour.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error removing event',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a tour
 */
export function useUpdateTour() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tourId, updates }: { tourId: string; updates: Partial<Tour> }) => {
      if (!user?.id) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('tours')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tourId)
        .eq('tour_manager_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours', user?.id] });
      toast({
        title: 'Tour updated',
        description: 'Tour details have been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating tour',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a tour (events are unassigned, not deleted)
 */
export function useDeleteTour() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tourId: string) => {
      if (!user?.id) throw new Error('User ID is required');

      // First, unassign all events from this tour
      const { error: unassignError } = await supabase
        .from('events')
        .update({ tour_id: null })
        .eq('tour_id', tourId);

      if (unassignError) throw unassignError;

      // Then delete the tour
      const { error: deleteError } = await supabase
        .from('tours')
        .delete()
        .eq('id', tourId)
        .eq('tour_manager_id', user.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-tour-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Tour deleted',
        description: 'The tour has been deleted. Events have been unassigned.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting tour',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}
