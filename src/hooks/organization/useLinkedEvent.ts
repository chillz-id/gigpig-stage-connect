/**
 * useLinkedEvent Hook
 *
 * Manages the relationship between synced sessions (Humanitix/Eventbrite)
 * and native events in Stand Up Sydney.
 *
 * When a synced session is opened for management, this hook:
 * 1. Checks if a native event is already linked
 * 2. If not, creates one automatically
 * 3. Returns the native event UUID for use with management tabs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { OrganizationEvent } from './useOrganizationEvents';

interface LinkedEventResult {
  eventId: string;
  isNewlyCreated: boolean;
}

/**
 * Find an existing linked event or create one for a synced session
 */
export function useLinkedEvent(event: OrganizationEvent | null) {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();

  const isNative = event?.source === 'native';
  const sourceId = event?.canonical_source_id || event?.id;
  const source = event?.source;

  return useQuery({
    queryKey: ['linked-event', source, sourceId],
    queryFn: async (): Promise<LinkedEventResult> => {
      if (!event || !sourceId || !source || isNative) {
        throw new Error('Invalid event for linking');
      }

      // Check for existing linked event
      const sourceColumn = source === 'humanitix' ? 'humanitix_event_id' : 'eventbrite_event_id';

      const { data: existingEvent, error: findError } = await supabase
        .from('events')
        .select('id')
        .eq(sourceColumn, sourceId)
        .maybeSingle();

      if (findError) {
        console.error('Error finding linked event:', findError);
        throw findError;
      }

      if (existingEvent) {
        return { eventId: existingEvent.id, isNewlyCreated: false };
      }

      // No linked event exists - create minimal link record
      // Display data comes from session_complete, we only store the link

      // Extract local time from event_date timestamp for start_time field
      // event_date is a full timestamp like "2025-01-15T09:00:00+00:00"
      // We need to extract the local time portion (e.g., "19:00:00" for Sydney)
      let startTime: string | null = null;
      if (event.event_date) {
        try {
          const eventDateObj = new Date(event.event_date);
          // Format time in Sydney timezone (same as the events are displayed)
          const timeFormatter = new Intl.DateTimeFormat('en-AU', {
            timeZone: 'Australia/Sydney',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          startTime = timeFormatter.format(eventDateObj);
        } catch (e) {
          console.warn('Could not extract start time from event_date:', e);
        }
      }

      const eventData: Record<string, unknown> = {
        // Required fields (NOT NULL in schema)
        title: `Linked: ${event.event_name}`,
        name: event.event_name,
        event_date: event.event_date,
        start_time: startTime, // Extract local time from the timestamp
        venue: event.venue?.name || 'See ticketing platform',
        address: event.venue?.name || 'See ticketing platform',
        // Link metadata
        source: source,
        source_id: sourceId,
        status: 'draft', // Link records use draft status (valid: draft, open, closed, cancelled, completed)
        organization_id: orgId,
        created_by_organization_id: orgId,
        // Link to the source platform
        humanitix_event_id: source === 'humanitix' ? sourceId : null,
        eventbrite_event_id: source === 'eventbrite' ? sourceId : null,
      };

      const { data: newEvent, error: createError } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating linked event:', createError);
        throw createError;
      }

      // Invalidate organization events to include the new linked event
      queryClient.invalidateQueries({ queryKey: ['organization-events'] });

      return { eventId: newEvent.id, isNewlyCreated: true };
    },
    enabled: !!event && !isNative && !!sourceId && !!orgId,
    staleTime: Infinity, // Once linked, doesn't change
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get the effective event ID to use for management tabs
 * - For native events: returns the event ID directly
 * - For synced events: returns the linked native event ID
 */
export function useEffectiveEventId(event: OrganizationEvent | null) {
  const linkedEventQuery = useLinkedEvent(event);
  const isNative = event?.source === 'native';

  if (!event) {
    return { eventId: null, isLoading: false, error: null };
  }

  if (isNative) {
    return { eventId: event.id, isLoading: false, error: null };
  }

  return {
    eventId: linkedEventQuery.data?.eventId || null,
    isLoading: linkedEventQuery.isLoading,
    error: linkedEventQuery.error,
    isNewlyCreated: linkedEventQuery.data?.isNewlyCreated || false,
  };
}
