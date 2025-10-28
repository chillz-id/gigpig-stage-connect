/**
 * Real-time Service
 *
 * Manages Supabase real-time subscriptions for event management:
 * - Applications (status changes, new applications)
 * - Spots (lineup changes, assignments)
 * - Deals (approvals, settlements)
 * - Events (details, ticket sales)
 *
 * Uses PostgreSQL LISTEN/NOTIFY via Supabase Realtime.
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ApplicationChange = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  applicationId: string;
  eventId: string;
  status?: 'pending' | 'confirmed' | 'rejected' | 'waitlisted';
  comedianId?: string;
};

export type SpotChange = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  spotId: string;
  eventId: string;
  status?: 'open' | 'filled' | 'confirmed';
  assignedComedianId?: string | null;
};

export type DealChange = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  dealId: string;
  eventId: string;
  status?: 'draft' | 'pending_approval' | 'fully_approved' | 'settled' | 'cancelled';
};

export type EventChange = {
  type: 'UPDATE';
  eventId: string;
  field: string;
};

/**
 * Subscribe to application changes for a specific event
 */
export function subscribeToApplications(
  eventId: string,
  callback: (change: ApplicationChange) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`applications:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_applications',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        const change: ApplicationChange = {
          type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          applicationId: (newRecord?.id || oldRecord?.id) as string,
          eventId: eventId,
          status: newRecord?.status,
          comedianId: newRecord?.comedian_id,
        };

        callback(change);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to spot (lineup) changes for a specific event
 */
export function subscribeToSpots(
  eventId: string,
  callback: (change: SpotChange) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`spots:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_spots',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        const change: SpotChange = {
          type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          spotId: (newRecord?.id || oldRecord?.id) as string,
          eventId: eventId,
          status: newRecord?.status,
          assignedComedianId: newRecord?.assigned_comedian_id,
        };

        callback(change);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to deal changes for a specific event
 */
export function subscribeToDeals(
  eventId: string,
  callback: (change: DealChange) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`deals:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_deals',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        const change: DealChange = {
          type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          dealId: (newRecord?.id || oldRecord?.id) as string,
          eventId: eventId,
          status: newRecord?.status,
        };

        callback(change);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to event detail changes
 */
export function subscribeToEvent(
  eventId: string,
  callback: (change: EventChange) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`event:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`,
      },
      (payload) => {
        const { new: newRecord, old: oldRecord } = payload;

        // Detect which field changed
        const changedFields = Object.keys(newRecord || {}).filter(
          (key) => newRecord?.[key] !== oldRecord?.[key]
        );

        changedFields.forEach((field) => {
          const change: EventChange = {
            type: 'UPDATE',
            eventId: eventId,
            field: field,
          };
          callback(change);
        });
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe and remove a channel
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
}

/**
 * Unsubscribe from all channels
 */
export async function unsubscribeAll(): Promise<void> {
  await supabase.removeAllChannels();
}
