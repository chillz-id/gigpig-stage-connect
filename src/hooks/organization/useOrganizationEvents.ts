import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Unified event type that can represent both native events and synced sessions
 */
export interface OrganizationEvent {
  id: string;
  event_date: string;
  event_name: string;
  event_description?: string | null;
  event_image?: string | null;
  is_published: boolean;
  venue?: { name: string } | null;
  ticket_price?: number | null;
  ticket_link?: string | null;
  source: 'native' | 'humanitix' | 'eventbrite';
  canonical_source_id?: string;

  // Financial totals (from session_complete)
  total_ticket_count?: number | null;
  total_order_count?: number | null;
  total_gross_dollars?: number | null;  // with fees
  total_fees_dollars?: number | null;
  total_tax_dollars?: number | null;
  total_net_dollars?: number | null;    // without fees

  // Humanitix breakdown
  humanitix_ticket_count?: number | null;
  humanitix_order_count?: number | null;
  humanitix_gross_dollars?: number | null;
  humanitix_fees_dollars?: number | null;
  humanitix_tax_dollars?: number | null;
  humanitix_net_dollars?: number | null;

  // Eventbrite breakdown
  eventbrite_ticket_count?: number | null;
  eventbrite_order_count?: number | null;
  eventbrite_gross_dollars?: number | null;
  eventbrite_fees_dollars?: number | null;
  eventbrite_tax_dollars?: number | null;
  eventbrite_net_dollars?: number | null;

  // Which platforms have data
  merged_sources?: string[] | null;
}

/**
 * Transform session_complete data to OrganizationEvent format
 */
function transformSessionToEvent(session: any): OrganizationEvent {
  return {
    id: session.canonical_session_source_id,
    event_date: session.session_start,
    event_name: session.session_name || session.event_name,
    event_description: session.description,
    event_image: session.banner_image_url,
    is_published: session.published ?? true,
    venue: session.venue_name ? { name: session.venue_name } : null,
    ticket_price: null, // Sessions don't have individual ticket prices in this view
    ticket_link: session.url || session.url_tickets_popup,
    source: session.canonical_source as 'humanitix' | 'eventbrite',
    canonical_source_id: session.canonical_session_source_id,

    // Financial totals
    total_ticket_count: session.total_ticket_count,
    total_order_count: session.total_order_count,
    total_gross_dollars: session.total_gross_dollars,
    total_fees_dollars: session.total_fees_dollars,
    total_tax_dollars: session.total_tax_dollars,
    total_net_dollars: session.total_net_dollars,

    // Humanitix breakdown
    humanitix_ticket_count: session.humanitix_ticket_count,
    humanitix_order_count: session.humanitix_order_count,
    humanitix_gross_dollars: session.humanitix_gross_dollars,
    humanitix_fees_dollars: session.humanitix_fees_dollars,
    humanitix_tax_dollars: session.humanitix_tax_dollars,
    humanitix_net_dollars: session.humanitix_net_dollars,

    // Eventbrite breakdown
    eventbrite_ticket_count: session.eventbrite_ticket_count,
    eventbrite_order_count: session.eventbrite_order_count,
    eventbrite_gross_dollars: session.eventbrite_gross_dollars,
    eventbrite_fees_dollars: session.eventbrite_fees_dollars,
    eventbrite_tax_dollars: session.eventbrite_tax_dollars,
    eventbrite_net_dollars: session.eventbrite_net_dollars,

    // Merged sources
    merged_sources: session.merged_sources,
  };
}

/**
 * Transform native event to OrganizationEvent format
 */
function transformNativeEvent(event: any): OrganizationEvent {
  return {
    id: event.id,
    event_date: event.event_date,
    event_name: event.title || event.name,
    event_description: event.description || event.details,
    event_image: event.banner_url || event.hero_image_url,
    is_published: event.status === 'published',
    venue: event.venue ? { name: event.venue } : null,
    ticket_price: event.ticket_price,
    ticket_link: null,
    source: 'native',
  };
}

/**
 * Hook to fetch events owned by the current organization
 *
 * Combines:
 * 1. Native events where organization_id matches
 * 2. Synced sessions where the org is a partner (via session_partners)
 *
 * @example
 * ```tsx
 * function OrganizationEvents() {
 *   const { data: events, isLoading } = useOrganizationEvents();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {events?.map(event => (
 *         <EventCard key={event.id} event={event} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useOrganizationEvents = () => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-events', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      // Fetch native events (exclude linked events that exist only for management tabs)
      const { data: nativeEvents, error: nativeError } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgId)
        .is('humanitix_event_id', null)
        .is('eventbrite_event_id', null)
        .order('event_date', { ascending: true });

      if (nativeError) {
        console.error('Error fetching native events:', nativeError);
      }

      // Use RPC to get all sessions efficiently (joins session_partners + session_complete)
      const { data: sessions, error: sessionsError } = await supabase
        .rpc('get_org_all_sessions', { p_org_id: orgId, p_limit: 200 });

      if (sessionsError) {
        console.error('Error fetching session details:', sessionsError);
      }

      const sessionEvents: OrganizationEvent[] = (sessions || []).map(transformSessionToEvent);

      // Combine and sort by date
      const nativeTransformed = (nativeEvents || []).map(transformNativeEvent);
      const allEvents = [...nativeTransformed, ...sessionEvents];

      // Sort by event_date ascending
      allEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

      return allEvents;
    },
    enabled: !!orgId,
  });
};

/**
 * Hook to fetch upcoming events for the current organization
 *
 * Combines:
 * 1. Native events where organization_id matches (future dates)
 * 2. Synced sessions where the org is a partner (future dates)
 *
 * @example
 * ```tsx
 * function UpcomingEvents() {
 *   const { data: events } = useOrganizationUpcomingEvents();
 *   return <EventsList events={events} />;
 * }
 * ```
 */
export const useOrganizationUpcomingEvents = () => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-upcoming-events', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const now = new Date().toISOString();

      // Fetch native upcoming events (exclude linked events that exist only for management tabs)
      const { data: nativeEvents, error: nativeError } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgId)
        .is('humanitix_event_id', null)
        .is('eventbrite_event_id', null)
        .gte('event_date', now)
        .order('event_date', { ascending: true });

      if (nativeError) {
        console.error('Error fetching native upcoming events:', nativeError);
      }

      // Use RPC to get upcoming sessions efficiently (joins session_partners + session_complete)
      const { data: sessions, error: sessionsError } = await supabase
        .rpc('get_org_upcoming_sessions', { p_org_id: orgId })
        .limit(100);

      if (sessionsError) {
        console.error('Error fetching upcoming session details:', sessionsError);
      }

      const sessionEvents: OrganizationEvent[] = (sessions || []).map(transformSessionToEvent);

      // Combine and sort
      const nativeTransformed = (nativeEvents || []).map(transformNativeEvent);
      const allEvents = [...nativeTransformed, ...sessionEvents];
      allEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

      return allEvents;
    },
    enabled: !!orgId,
  });
};

/**
 * Hook to fetch past events for the current organization
 *
 * Combines:
 * 1. Native events where organization_id matches (past dates)
 * 2. Synced sessions where the org is a partner (past dates)
 *
 * @example
 * ```tsx
 * function PastEvents() {
 *   const { data: events } = useOrganizationPastEvents();
 *   return <EventsList events={events} />;
 * }
 * ```
 */
export const useOrganizationPastEvents = () => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-past-events', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const now = new Date().toISOString();

      // Fetch native past events (exclude linked events that exist only for management tabs)
      const { data: nativeEvents, error: nativeError } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgId)
        .is('humanitix_event_id', null)
        .is('eventbrite_event_id', null)
        .lt('event_date', now)
        .order('event_date', { ascending: false });

      if (nativeError) {
        console.error('Error fetching native past events:', nativeError);
      }

      // Use RPC to get past sessions efficiently (joins session_partners + session_complete)
      const { data: sessions, error: sessionsError } = await supabase
        .rpc('get_org_past_sessions', { p_org_id: orgId, p_limit: 100 });

      if (sessionsError) {
        console.error('Error fetching past session details:', sessionsError);
      }

      const sessionEvents: OrganizationEvent[] = (sessions || []).map(transformSessionToEvent);

      // Combine and sort (most recent first for past events)
      const nativeTransformed = (nativeEvents || []).map(transformNativeEvent);
      const allEvents = [...nativeTransformed, ...sessionEvents];
      allEvents.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

      return allEvents;
    },
    enabled: !!orgId,
  });
};
