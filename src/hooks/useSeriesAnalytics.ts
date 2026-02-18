/**
 * useSeriesAnalytics Hook
 *
 * React Query hook for fetching analytics data for a recurring series.
 * Aggregates financial and attendance data across all events in the series.
 */

import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface SeriesEventAnalytics {
  id: string;
  event_uuid: string | null; // UUID from events table for navigation
  title: string;
  event_date: string;
  status: string;
  tickets_sold: number;
  total_revenue: number;
  gross_revenue: number;
  net_revenue: number;
  ticket_price: number | null;
  venue_name: string | null;
  is_past?: boolean;
}

export interface SeriesAnalytics {
  seriesId: string;
  seriesName: string;
  totalRevenue: number;
  grossRevenue: number;
  netRevenue: number;
  totalTicketsSold: number;
  eventCount: number;
  upcomingEventCount: number;
  pastEventCount: number;
  averageTicketsPerEvent: number;
  averageRevenuePerEvent: number;
  events: SeriesEventAnalytics[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const seriesAnalyticsKeys = {
  all: ['series-analytics'] as const,
  bySeries: (seriesId: string, dateRange?: DateRange) => {
    const key = [...seriesAnalyticsKeys.all, 'series', seriesId] as const;
    if (dateRange) {
      return [...key, dateRange.start.toISOString(), dateRange.end.toISOString()] as const;
    }
    return key;
  },
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

async function getSeriesAnalytics(
  seriesId: string,
  dateRange?: DateRange
): Promise<SeriesAnalytics> {
  // Get the series info
  const { data: seriesData, error: seriesError } = await supabase
    .from('recurring_series')
    .select('id, name')
    .eq('id', seriesId)
    .single();

  if (seriesError) {
    console.error('Error fetching series:', seriesError);
    throw seriesError;
  }

  // Step 1: Get session IDs from session_series junction table
  const { data: seriesSessions, error: junctionError } = await supabase
    .from('session_series')
    .select('canonical_session_source_id')
    .eq('series_id', seriesId);

  if (junctionError) {
    console.error('Error fetching session_series:', junctionError);
    throw junctionError;
  }

  const sessionIds = (seriesSessions || []).map(s => s.canonical_session_source_id);

  if (sessionIds.length === 0) {
    return {
      seriesId,
      seriesName: seriesData?.name || 'Unknown Series',
      totalRevenue: 0,
      grossRevenue: 0,
      netRevenue: 0,
      totalTicketsSold: 0,
      eventCount: 0,
      upcomingEventCount: 0,
      pastEventCount: 0,
      averageTicketsPerEvent: 0,
      averageRevenuePerEvent: 0,
      events: [],
    };
  }

  // Step 2: Fetch session data from session_complete (the source of truth)
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('session_complete')
    .select(`
      canonical_session_source_id,
      event_source_id,
      session_name,
      event_name,
      session_start,
      session_start_local,
      status,
      is_past,
      venue_name,
      total_ticket_count,
      total_gross_dollars,
      total_net_dollars
    `)
    .in('canonical_session_source_id', sessionIds)
    .order('session_start', { ascending: false });

  if (sessionsError) {
    console.error('Error fetching session_complete:', sessionsError);
    throw sessionsError;
  }

  // Step 3: Look up event UUIDs from events table
  // events.humanitix_event_id often stores the SESSION ID (canonical_session_source_id), not the parent event ID
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, canonical_session_source_id, humanitix_event_id')
    .or(`humanitix_event_id.in.(${sessionIds.join(',')}),canonical_session_source_id.in.(${sessionIds.join(',')})`);

  // Build lookup map - humanitix_event_id matching session ID is the correct link to ticket data
  const eventUuidBySessionId = new Map<string, string>();
  (eventsData || []).forEach(e => {
    // Prioritize events where humanitix_event_id matches the session ID (these have ticket data)
    if (e.humanitix_event_id && !eventUuidBySessionId.has(e.humanitix_event_id)) {
      eventUuidBySessionId.set(e.humanitix_event_id, e.id);
    }
  });
  // Fallback: canonical_session_source_id (only if not already mapped)
  (eventsData || []).forEach(e => {
    if (e.canonical_session_source_id && !eventUuidBySessionId.has(e.canonical_session_source_id)) {
      eventUuidBySessionId.set(e.canonical_session_source_id, e.id);
    }
  });

  // Transform to event analytics format
  let eventAnalytics: SeriesEventAnalytics[] = (sessionsData || []).map(session => {
    // Parse LOCAL date - extract YYYY-MM-DD from session_start_local (the source of truth for display)
    // session_start_local format: "2026-02-18 19:30:00" or "2026-02-18T19:30:00..."
    const localDateStr = session.session_start_local ? String(session.session_start_local) : '';
    const eventDate = localDateStr ? localDateStr.slice(0, 10) : ''; // Extract "YYYY-MM-DD" directly

    const grossRevenue = parseFloat(String(session.total_gross_dollars || 0));
    const netRevenue = parseFloat(String(session.total_net_dollars || 0));
    // Look up by canonical_session_source_id (maps to humanitix_event_id OR canonical_session_source_id)
    const eventUuid = eventUuidBySessionId.get(session.canonical_session_source_id) || null;

    return {
      id: session.canonical_session_source_id,
      event_uuid: eventUuid,
      title: session.session_name || session.event_name || 'Untitled',
      event_date: eventDate,
      status: session.is_past ? 'completed' : (session.status || 'open'),
      tickets_sold: session.total_ticket_count || 0,
      total_revenue: grossRevenue,
      gross_revenue: grossRevenue,
      net_revenue: netRevenue,
      ticket_price: null,
      venue_name: session.venue_name || null,
      is_past: session.is_past ?? false,
    };
  });

  // Apply date range filter if provided
  if (dateRange) {
    const startDate = dateRange.start.toISOString().split('T')[0];
    const endDate = dateRange.end.toISOString().split('T')[0];
    eventAnalytics = eventAnalytics.filter(e => {
      return e.event_date >= startDate && e.event_date <= endDate;
    });
  }

  // Calculate aggregates using is_past from session_complete
  const pastEvents = eventAnalytics.filter(e => e.is_past);
  const upcomingEvents = eventAnalytics.filter(e => !e.is_past);

  // Totals from ALL events
  const totalRevenue = eventAnalytics.reduce((sum, e) => sum + e.total_revenue, 0);
  const grossRevenue = eventAnalytics.reduce((sum, e) => sum + e.gross_revenue, 0);
  const netRevenue = eventAnalytics.reduce((sum, e) => sum + e.net_revenue, 0);
  const totalTicketsSold = eventAnalytics.reduce((sum, e) => sum + e.tickets_sold, 0);

  // Averages from PAST events only (completed shows)
  const pastRevenue = pastEvents.reduce((sum, e) => sum + e.total_revenue, 0);
  const pastTicketsSold = pastEvents.reduce((sum, e) => sum + e.tickets_sold, 0);

  const eventCount = eventAnalytics.length;
  const upcomingEventCount = upcomingEvents.length;
  const pastEventCount = pastEvents.length;

  return {
    seriesId,
    seriesName: seriesData?.name || 'Unknown Series',
    totalRevenue,
    grossRevenue,
    netRevenue,
    totalTicketsSold,
    eventCount,
    upcomingEventCount,
    pastEventCount,
    averageTicketsPerEvent: pastEventCount > 0 ? pastTicketsSold / pastEventCount : 0,
    averageRevenuePerEvent: pastEventCount > 0 ? pastRevenue / pastEventCount : 0,
    events: eventAnalytics,
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch analytics for a series with optional date range filtering
 */
export function useSeriesAnalytics(
  seriesId: string | undefined,
  dateRange?: DateRange
) {
  const { toast } = useToast();

  return useQuery({
    queryKey: seriesAnalyticsKeys.bySeries(seriesId || '', dateRange),
    queryFn: async () => {
      if (!seriesId) throw new Error('Series ID is required');
      return getSeriesAnalytics(seriesId, dateRange);
    },
    enabled: !!seriesId,
    staleTime: 2 * 60 * 1000, // 2 minutes (analytics should be relatively fresh)
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: Error & { code?: string }) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    },
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading analytics',
          description: 'Failed to load series analytics. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch basic series info (name, event count, and other details)
 */
export function useSeriesInfo(seriesId: string | undefined) {
  return useQuery({
    queryKey: ['series-info', seriesId],
    queryFn: async () => {
      if (!seriesId) throw new Error('Series ID is required');

      // Get series info
      const { data, error } = await supabase
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
          is_active,
          created_at,
          updated_at
        `)
        .eq('id', seriesId)
        .single();

      if (error) {
        console.error('Error fetching series info:', error);
        throw error;
      }

      // Get event count from session_series junction table
      const { count: eventCount } = await supabase
        .from('session_series')
        .select('*', { count: 'exact', head: true })
        .eq('series_id', seriesId);

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        created_by: data.created_by,
        organization_id: data.organization_id,
        default_venue: data.default_venue,
        default_ticket_price: data.default_ticket_price,
        default_start_time: data.default_start_time,
        default_end_time: data.default_end_time,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        event_count: eventCount || 0,
      };
    },
    enabled: !!seriesId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
