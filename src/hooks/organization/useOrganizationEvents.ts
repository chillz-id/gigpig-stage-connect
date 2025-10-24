import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Hook to fetch events owned by the current organization
 *
 * Filters events where organization_id matches the current org.
 * Returns events with full details including promoter and venue information.
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

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching organization events:', error);
        throw error;
      }

      return data;
    },
    enabled: !!orgId,
  });
};

/**
 * Hook to fetch upcoming events for the current organization
 *
 * Returns only events with event_date in the future.
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

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgId)
        .gte('event_date', now)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching organization upcoming events:', error);
        throw error;
      }

      return data;
    },
    enabled: !!orgId,
  });
};

/**
 * Hook to fetch past events for the current organization
 *
 * Returns only events with event_date in the past.
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

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgId)
        .lt('event_date', now)
        .order('event_date', { ascending: false });

      if (error) {
        console.error('Error fetching organization past events:', error);
        throw error;
      }

      return data;
    },
    enabled: !!orgId,
  });
};
