import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Recurring Series Types for Comedian-managed events
 */
export interface RecurringSeriesEvent {
  id: string;
  title: string;
  event_date: string;
  venue?: string | null;
  address?: string | null;
  status: string;
  series_id?: string | null;
  parent_event_id?: string | null;
  is_recurring?: boolean | null;
  type?: string | null;
  description?: string | null;
  ticket_price?: number | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface RecurringSeries {
  series_id: string;
  series_name: string;
  event_count: number;
  events: RecurringSeriesEvent[];
  next_event_date?: string | null;
  venue_name?: string | null;
}

export interface CreateSeriesPayload {
  name: string;
  eventIds: string[];
}

export interface AddToSeriesPayload {
  seriesId: string;
  eventIds: string[];
}

export interface BulkUpdatePayload {
  seriesId: string;
  eventIds?: string[]; // If not provided, update all in series
  updates: {
    title?: string;
    description?: string;
    type?: string;
    venue?: string;
    ticket_price?: number;
    start_time?: string;
    end_time?: string;
  };
  applyToFutureOnly?: boolean;
}

/**
 * Hook to fetch recurring events grouped by series for a comedian
 */
export function useRecurringSeries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring-series', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');

      // Fetch all events for this user that have series_id (recurring)
      const { data: seriesEvents, error: seriesError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          venue,
          address,
          status,
          series_id,
          parent_event_id,
          is_recurring,
          type,
          description,
          ticket_price,
          start_time,
          end_time
        `)
        .eq('promoter_id', user.id)
        .not('series_id', 'is', null)
        .eq('is_recurring', true)
        .order('event_date', { ascending: true });

      if (seriesError) throw seriesError;

      // Group events by series_id
      const seriesMap = new Map<string, RecurringSeries>();

      for (const event of seriesEvents || []) {
        const seriesId = event.series_id!;

        if (!seriesMap.has(seriesId)) {
          // Use the first event's title as series name (strip date suffix if present)
          const seriesName = event.title?.replace(/\s*-\s*\d+.*$/, '').trim() || 'Unnamed Series';

          seriesMap.set(seriesId, {
            series_id: seriesId,
            series_name: seriesName,
            event_count: 0,
            events: [],
            venue_name: event.venue,
          });
        }

        const series = seriesMap.get(seriesId)!;
        series.events.push(event as RecurringSeriesEvent);
        series.event_count++;

        // Track next upcoming event
        const eventDate = new Date(event.event_date);
        if (eventDate >= new Date()) {
          if (!series.next_event_date || eventDate < new Date(series.next_event_date)) {
            series.next_event_date = event.event_date;
          }
        }
      }

      return Array.from(seriesMap.values()).sort((a, b) => {
        // Sort by next upcoming event, then by name
        if (a.next_event_date && b.next_event_date) {
          return new Date(a.next_event_date).getTime() - new Date(b.next_event_date).getTime();
        }
        if (a.next_event_date) return -1;
        if (b.next_event_date) return 1;
        return a.series_name.localeCompare(b.series_name);
      });
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook to fetch non-recurring events (events without a series)
 */
export function useNonRecurringEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['non-recurring-events', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          venue,
          address,
          status,
          series_id,
          type,
          description,
          ticket_price,
          start_time,
          end_time
        `)
        .eq('promoter_id', user.id)
        .or('series_id.is.null,is_recurring.eq.false')
        .neq('status', 'draft')
        .order('event_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as RecurringSeriesEvent[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook to create a new recurring series from selected events
 */
export function useCreateRecurringSeries() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, eventIds }: CreateSeriesPayload) => {
      if (!user?.id) throw new Error('User ID is required');
      if (eventIds.length === 0) throw new Error('At least one event is required');

      // Generate a new series_id
      const seriesId = crypto.randomUUID();

      // Update all selected events with the new series_id
      const { error } = await supabase
        .from('events')
        .update({
          series_id: seriesId,
          is_recurring: true,
        })
        .in('id', eventIds)
        .eq('promoter_id', user.id);

      if (error) throw error;

      // Set the first event as parent
      const { error: parentError } = await supabase
        .from('events')
        .update({ parent_event_id: null })
        .eq('id', eventIds[0])
        .eq('promoter_id', user.id);

      if (parentError) throw parentError;

      // Set other events to reference the parent
      if (eventIds.length > 1) {
        const { error: childError } = await supabase
          .from('events')
          .update({ parent_event_id: eventIds[0] })
          .in('id', eventIds.slice(1))
          .eq('promoter_id', user.id);

        if (childError) throw childError;
      }

      return { seriesId, name, eventCount: eventIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['non-recurring-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Recurring series created',
        description: `Created series "${data.name}" with ${data.eventCount} events.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating series',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to add events to an existing recurring series
 */
export function useAddToRecurringSeries() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ seriesId, eventIds }: AddToSeriesPayload) => {
      if (!user?.id) throw new Error('User ID is required');

      // Get the parent event for this series
      const { data: parentEvent } = await supabase
        .from('events')
        .select('id')
        .eq('series_id', seriesId)
        .is('parent_event_id', null)
        .single();

      const parentId = parentEvent?.id;

      // Update events with series_id and parent_event_id
      const { error } = await supabase
        .from('events')
        .update({
          series_id: seriesId,
          parent_event_id: parentId,
          is_recurring: true,
        })
        .in('id', eventIds)
        .eq('promoter_id', user.id);

      if (error) throw error;

      return { eventCount: eventIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['non-recurring-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Events added to series',
        description: `Added ${data.eventCount} event(s) to the recurring series.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error adding to series',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to remove an event from its recurring series
 */
export function useRemoveFromRecurringSeries() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('User ID is required');

      const { error } = await supabase
        .from('events')
        .update({
          series_id: null,
          parent_event_id: null,
          is_recurring: false,
        })
        .eq('id', eventId)
        .eq('promoter_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['non-recurring-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Event removed from series',
        description: 'The event is now standalone.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error removing from series',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to bulk update events in a recurring series
 */
export function useBulkUpdateRecurringSeries() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ seriesId, eventIds, updates, applyToFutureOnly }: BulkUpdatePayload) => {
      if (!user?.id) throw new Error('User ID is required');

      let query = supabase
        .from('events')
        .update(updates)
        .eq('promoter_id', user.id);

      if (eventIds && eventIds.length > 0) {
        // Update specific events
        query = query.in('id', eventIds);
      } else if (applyToFutureOnly) {
        // Update only future events in series
        query = query
          .eq('series_id', seriesId)
          .gte('event_date', new Date().toISOString());
      } else {
        // Update all events in series
        query = query.eq('series_id', seriesId);
      }

      const { data, error } = await query.select('id');

      if (error) throw error;

      return { updatedCount: data?.length || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Series updated',
        description: `Updated ${data.updatedCount} event(s).`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating series',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete an entire recurring series (removes series_id from all events)
 */
export function useDeleteRecurringSeries() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (seriesId: string) => {
      if (!user?.id) throw new Error('User ID is required');

      const { error } = await supabase
        .from('events')
        .update({
          series_id: null,
          parent_event_id: null,
          is_recurring: false,
        })
        .eq('series_id', seriesId)
        .eq('promoter_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['non-recurring-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Series disbanded',
        description: 'All events are now standalone.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error disbanding series',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}
