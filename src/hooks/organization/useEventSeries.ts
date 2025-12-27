import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Event Series Types
 */
export interface EventSeriesEvent {
  id: string;
  title: string;
  event_date: string;
  venue_name?: string | null;
  address?: string | null;
  status: string;
  source: string;
  series_id?: string | null;
  parent_event_id?: string | null;
  is_recurring?: boolean | null;
  tags?: string[] | null;
  show_type?: string | null;
  description?: string | null;
}

export interface EventSeries {
  series_id: string;
  series_name: string;
  event_count: number;
  events: EventSeriesEvent[];
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
    tags?: string[];
    show_type?: string;
    venue_name?: string;
  };
}

/**
 * Hook to fetch events grouped by series for an organization
 */
export function useEventSeries() {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['event-series', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID is required');

      // Fetch all events for this organization that have series_id
      const { data: seriesEvents, error: seriesError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          venue_name,
          address,
          status,
          source,
          series_id,
          parent_event_id,
          is_recurring,
          tags,
          show_type,
          description
        `)
        .eq('organization_id', orgId)
        .not('series_id', 'is', null)
        .order('event_date', { ascending: true });

      if (seriesError) throw seriesError;

      // Group events by series_id
      const seriesMap = new Map<string, EventSeries>();

      for (const event of seriesEvents || []) {
        const seriesId = event.series_id!;

        if (!seriesMap.has(seriesId)) {
          seriesMap.set(seriesId, {
            series_id: seriesId,
            series_name: event.title?.replace(/\s*-\s*\d+.*$/, '').trim() || 'Unnamed Series',
            event_count: 0,
            events: [],
            venue_name: event.venue_name,
          });
        }

        const series = seriesMap.get(seriesId)!;
        series.events.push(event as EventSeriesEvent);
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
    enabled: !!orgId,
  });
}

/**
 * Hook to fetch ungrouped events (events without a series)
 */
export function useUngroupedEvents() {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['ungrouped-events', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          venue_name,
          address,
          status,
          source,
          series_id,
          tags,
          show_type,
          description
        `)
        .eq('organization_id', orgId)
        .is('series_id', null)
        .order('event_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EventSeriesEvent[];
    },
    enabled: !!orgId,
  });
}

/**
 * Hook to create a new series from selected events
 */
export function useCreateSeries() {
  const queryClient = useQueryClient();
  const { orgId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, eventIds }: CreateSeriesPayload) => {
      if (!orgId) throw new Error('Organization ID is required');
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
        .eq('organization_id', orgId);

      if (error) throw error;

      // Set the first event as parent
      const { error: parentError } = await supabase
        .from('events')
        .update({ parent_event_id: null })
        .eq('id', eventIds[0])
        .eq('organization_id', orgId);

      if (parentError) throw parentError;

      // Set other events to reference the parent
      if (eventIds.length > 1) {
        const { error: childError } = await supabase
          .from('events')
          .update({ parent_event_id: eventIds[0] })
          .in('id', eventIds.slice(1))
          .eq('organization_id', orgId);

        if (childError) throw childError;
      }

      return { seriesId, name, eventCount: eventIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-series', orgId] });
      queryClient.invalidateQueries({ queryKey: ['ungrouped-events', orgId] });
      toast({
        title: 'Series created',
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
 * Hook to add events to an existing series
 */
export function useAddToSeries() {
  const queryClient = useQueryClient();
  const { orgId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ seriesId, eventIds }: AddToSeriesPayload) => {
      if (!orgId) throw new Error('Organization ID is required');

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
        .eq('organization_id', orgId);

      if (error) throw error;

      return { eventCount: eventIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-series', orgId] });
      queryClient.invalidateQueries({ queryKey: ['ungrouped-events', orgId] });
      toast({
        title: 'Events added to series',
        description: `Added ${data.eventCount} event(s) to the series.`,
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
 * Hook to remove an event from its series
 */
export function useRemoveFromSeries() {
  const queryClient = useQueryClient();
  const { orgId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!orgId) throw new Error('Organization ID is required');

      const { error } = await supabase
        .from('events')
        .update({
          series_id: null,
          parent_event_id: null,
          is_recurring: false,
        })
        .eq('id', eventId)
        .eq('organization_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-series', orgId] });
      queryClient.invalidateQueries({ queryKey: ['ungrouped-events', orgId] });
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
 * Hook to bulk update events in a series
 */
export function useBulkUpdateSeries() {
  const queryClient = useQueryClient();
  const { orgId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ seriesId, eventIds, updates }: BulkUpdatePayload) => {
      if (!orgId) throw new Error('Organization ID is required');

      let query = supabase
        .from('events')
        .update(updates)
        .eq('organization_id', orgId);

      if (eventIds && eventIds.length > 0) {
        // Update specific events
        query = query.in('id', eventIds);
      } else {
        // Update all events in series
        query = query.eq('series_id', seriesId);
      }

      const { data, error } = await query.select('id');

      if (error) throw error;

      return { updatedCount: data?.length || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-series', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-events', orgId] });
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
 * Hook to delete an entire series (removes series_id from all events)
 */
export function useDeleteSeries() {
  const queryClient = useQueryClient();
  const { orgId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (seriesId: string) => {
      if (!orgId) throw new Error('Organization ID is required');

      const { error } = await supabase
        .from('events')
        .update({
          series_id: null,
          parent_event_id: null,
          is_recurring: false,
        })
        .eq('series_id', seriesId)
        .eq('organization_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-series', orgId] });
      queryClient.invalidateQueries({ queryKey: ['ungrouped-events', orgId] });
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
