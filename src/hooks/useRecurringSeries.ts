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
  description?: string | null;
  created_by?: string | null;
  organization_id?: string | null;
  default_venue?: string | null;
  default_ticket_price?: number | null;
  default_start_time?: string | null;
  default_end_time?: string | null;
  is_active?: boolean;
  event_count: number;
  upcoming_count?: number;
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

      // Fetch series from recurring_series table that user created or is a partner on
      const { data: seriesData, error: seriesError } = await supabase
        .from('recurring_series')
        .select(`
          id,
          name,
          description,
          created_by,
          organization_id,
          default_venue,
          default_ticket_price,
          default_start_time,
          default_end_time,
          is_active
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (seriesError) throw seriesError;

      const seriesIds = (seriesData || []).map(s => s.id);

      if (seriesIds.length === 0) {
        return [];
      }

      // Get session IDs from session_series junction table
      const { data: sessionSeriesData, error: sessionSeriesError } = await supabase
        .from('session_series')
        .select('series_id, canonical_session_source_id')
        .in('series_id', seriesIds);

      if (sessionSeriesError) throw sessionSeriesError;

      // Get all unique session IDs
      const allSessionIds = (sessionSeriesData || []).map(s => s.canonical_session_source_id);

      // Fetch session data from session_complete
      let sessionsData: any[] = [];
      if (allSessionIds.length > 0) {
        const { data, error } = await supabase
          .from('session_complete')
          .select(`
            canonical_session_source_id,
            session_name,
            event_name,
            session_start_local,
            session_start,
            is_past,
            venue_name
          `)
          .in('canonical_session_source_id', allSessionIds);

        if (error) throw error;
        sessionsData = data || [];
      }

      // Build lookup map for session data
      const sessionDataMap = new Map<string, any>();
      sessionsData.forEach(s => {
        sessionDataMap.set(s.canonical_session_source_id, s);
      });

      // Group sessions by series_id
      const sessionsBySeriesId = new Map<string, any[]>();
      for (const ss of sessionSeriesData || []) {
        const sessionData = sessionDataMap.get(ss.canonical_session_source_id);
        if (sessionData) {
          if (!sessionsBySeriesId.has(ss.series_id)) {
            sessionsBySeriesId.set(ss.series_id, []);
          }
          sessionsBySeriesId.get(ss.series_id)!.push(sessionData);
        }
      }

      // Build the RecurringSeries objects
      const result: RecurringSeries[] = (seriesData || []).map(series => {
        const sessions = sessionsBySeriesId.get(series.id) || [];

        // Calculate counts
        const upcomingSessions = sessions.filter(s => !s.is_past);
        const eventCount = sessions.length;

        // Find next upcoming event date
        let nextEventDate: string | null = null;
        for (const session of upcomingSessions) {
          const dateStr = session.session_start_local || session.session_start;
          if (dateStr) {
            if (!nextEventDate || dateStr < nextEventDate) {
              nextEventDate = dateStr;
            }
          }
        }

        // Get venue from first session if not set on series
        const firstVenue = sessions[0]?.venue_name || null;

        return {
          series_id: series.id,
          series_name: series.name,
          description: series.description,
          created_by: series.created_by,
          organization_id: series.organization_id,
          default_venue: series.default_venue,
          default_ticket_price: series.default_ticket_price,
          default_start_time: series.default_start_time,
          default_end_time: series.default_end_time,
          is_active: series.is_active,
          event_count: eventCount,
          upcoming_count: upcomingSessions.length,
          events: [], // Not loading full event list here for performance
          next_event_date: nextEventDate,
          venue_name: series.default_venue || firstVenue,
        };
      });

      // Sort by next upcoming event, then by name
      return result.sort((a, b) => {
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
 * Combines:
 * 1. Native events from events table where user is promoter
 * 2. Sessions from session_complete that the user has access to via organizations
 */
export function useNonRecurringEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['non-recurring-events', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID is required');

      // 1. Fetch native events from events table (existing behavior)
      const { data: nativeEvents, error: nativeError } = await supabase
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
          end_time,
          canonical_session_source_id,
          humanitix_event_id
        `)
        .eq('promoter_id', user.id)
        .or('series_id.is.null,is_recurring.eq.false')
        .neq('status', 'draft')
        .order('event_date', { ascending: false });

      if (nativeError) {
        console.error('Error fetching native events:', nativeError);
        throw nativeError;
      }

      // 2. Get user's organizations using the same RPC as OrganizationContext
      const { data: userOrgs } = await supabase
        .rpc('get_user_organizations', { p_user_id: user.id });

      const orgIds = userOrgs?.map((o: { org_id: string }) => o.org_id) || [];
      console.log('[useNonRecurringEvents] User orgs:', orgIds);

      // 3. Fetch sessions from session_complete via org partnerships
      let sessionEvents: RecurringSeriesEvent[] = [];

      if (orgIds.length > 0) {
        console.log('[useNonRecurringEvents] Fetching sessions for org:', orgIds[0]);

        // Get sessions the user's orgs are partners on
        const { data: sessions, error: sessionsError } = await supabase
          .rpc('get_org_all_sessions', { p_org_id: orgIds[0], p_limit: 500 });

        console.log('[useNonRecurringEvents] Sessions from RPC:', sessions?.length || 0, sessionsError ? `Error: ${sessionsError.message}` : '');

        if (sessionsError) {
          console.error('Error fetching org sessions:', sessionsError);
        } else if (sessions) {
          // Get sessions that are already in a series (from session_series junction table)
          const { data: linkedSessions } = await supabase
            .from('session_series')
            .select('canonical_session_source_id');

          const linkedSessionIds = new Set(
            (linkedSessions || []).map(s => s.canonical_session_source_id)
          );

          console.log('[useNonRecurringEvents] Sessions already in a series:', linkedSessionIds.size);

          // Transform sessions to event format, excluding those already in a series
          const filteredSessions = sessions.filter((s: any) => !linkedSessionIds.has(s.canonical_session_source_id));
          console.log('[useNonRecurringEvents] Sessions NOT in a series:', filteredSessions.length);

          sessionEvents = filteredSessions.map((session: any) => ({
              id: session.canonical_session_source_id,
              title: session.session_name || session.event_name,
              event_date: session.session_start,
              venue: session.venue_name || null,
              address: null,
              status: session.is_past ? 'completed' : 'open',
              series_id: null,
              type: null,
              description: session.description || null,
              ticket_price: null,
              start_time: null,
              end_time: null,
              // Mark as session-based for UI
              _isSession: true,
              _sessionData: session,
            })) as RecurringSeriesEvent[];
        }
      } else {
        console.log('[useNonRecurringEvents] No organizations found for user');
      }

      // 4. Combine and deduplicate (prefer native events over sessions)
      const nativeSessionIds = new Set(
        (nativeEvents || [])
          .filter(e => e.canonical_session_source_id)
          .map(e => e.canonical_session_source_id)
      );

      const dedupedSessionEvents = sessionEvents.filter(
        s => !nativeSessionIds.has(s.id)
      );

      const allEvents = [...(nativeEvents || []), ...dedupedSessionEvents];

      // Sort by event_date descending
      allEvents.sort((a, b) => {
        const dateA = new Date(a.event_date).getTime();
        const dateB = new Date(b.event_date).getTime();
        return dateB - dateA;
      });

      console.log('[useNonRecurringEvents] Native events:', nativeEvents?.length || 0);
      console.log('[useNonRecurringEvents] Session events:', sessionEvents.length);
      console.log('[useNonRecurringEvents] After dedup:', dedupedSessionEvents.length);
      console.log('[useNonRecurringEvents] Total:', allEvents.length);

      return allEvents as RecurringSeriesEvent[];
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

      // Create the recurring_series record (let Supabase generate the UUID)
      const { data: seriesData, error: seriesError } = await supabase
        .from('recurring_series')
        .insert({
          name,
          created_by: user.id,
          is_active: true,
        })
        .select('id')
        .single();

      if (seriesError) throw seriesError;

      const seriesId = seriesData.id;

      // Update all selected events with the new series_id (if any)
      if (eventIds.length > 0) {
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
      }

      return { seriesId, name, eventCount: eventIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['non-recurring-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      toast({
        title: 'Series created',
        description: data.eventCount > 0
          ? `Created series "${data.name}" with ${data.eventCount} event(s).`
          : `Created empty series "${data.name}". Add events to get started.`,
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
 * Handles both native events (from events table) and session-based events (from session_complete)
 * Session-based events are tracked in the session_series junction table
 */
export function useAddToRecurringSeries() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ seriesId, eventIds }: AddToSeriesPayload) => {
      if (!user?.id) throw new Error('User ID is required');

      // Separate native event IDs (UUIDs) from session IDs (numeric strings)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const nativeEventIds = eventIds.filter(id => uuidRegex.test(id));
      const sessionIds = eventIds.filter(id => !uuidRegex.test(id));

      console.log('[useAddToRecurringSeries] Native events:', nativeEventIds.length, 'Session events:', sessionIds.length);

      // Handle session-based events - insert into session_series junction table
      if (sessionIds.length > 0) {
        const sessionSeriesEntries = sessionIds.map(sessionId => ({
          canonical_session_source_id: sessionId,
          series_id: seriesId,
          added_by: user.id,
        }));

        const { error: insertError } = await supabase
          .from('session_series')
          .upsert(sessionSeriesEntries, { onConflict: 'canonical_session_source_id' });

        if (insertError) {
          console.error('Error adding sessions to series:', insertError);
          throw insertError;
        }

        console.log('[useAddToRecurringSeries] Added', sessionIds.length, 'sessions to series');
      }

      // Handle native events - update existing events table entries
      if (nativeEventIds.length > 0) {
        // Get the parent event for this series
        const { data: parentEvent } = await supabase
          .from('events')
          .select('id')
          .eq('series_id', seriesId)
          .is('parent_event_id', null)
          .single();

        const parentId = parentEvent?.id;

        const { error } = await supabase
          .from('events')
          .update({
            series_id: seriesId,
            parent_event_id: parentId,
            is_recurring: true,
          })
          .in('id', nativeEventIds)
          .eq('promoter_id', user.id);

        if (error) throw error;
      }

      return { eventCount: eventIds.length };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['non-recurring-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comedian-events', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['series-events', variables.seriesId] });
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

      // First update events to clear is_recurring and parent_event_id
      // (series_id will be set to NULL by the FK cascade when we delete the series)
      const { error: eventsError } = await supabase
        .from('events')
        .update({
          parent_event_id: null,
          is_recurring: false,
        })
        .eq('series_id', seriesId)
        .eq('promoter_id', user.id);

      if (eventsError) throw eventsError;

      // Delete the series - this will cascade and set series_id to NULL on events
      const { error } = await supabase
        .from('recurring_series')
        .delete()
        .eq('id', seriesId);

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
