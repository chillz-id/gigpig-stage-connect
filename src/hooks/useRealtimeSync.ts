/**
 * useRealtimeSync Hooks
 *
 * React hooks for real-time data synchronization with Supabase.
 * Automatically invalidates TanStack Query caches when changes occur.
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  subscribeToApplications,
  subscribeToSpots,
  subscribeToDeals,
  subscribeToEvent,
  unsubscribe,
  type ApplicationChange,
  type SpotChange,
  type DealChange,
  type EventChange,
} from '@/services/realtimeService';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to real-time application changes
 * Invalidates application-related queries on changes
 */
export function useRealtimeApplications(eventId: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = subscribeToApplications(eventId, (change: ApplicationChange) => {
      console.log('[Realtime] Application change:', change);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['event-applications', eventId] });
      queryClient.invalidateQueries({ queryKey: ['application-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['shortlist', eventId] });

      // If status changed to confirmed, also invalidate lineup queries
      if (change.status === 'confirmed') {
        queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
        queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      }
    });

    // Monitor connection state
    channel.on('system', {}, (payload) => {
      if (payload.status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else if (payload.status === 'CLOSED') {
        setIsConnected(false);
      }
    });

    return () => {
      unsubscribe(channel);
      setIsConnected(false);
    };
  }, [eventId, queryClient]);

  return { isConnected };
}

/**
 * Subscribe to real-time spot (lineup) changes
 * Invalidates lineup-related queries on changes
 */
export function useRealtimeSpots(eventId: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = subscribeToSpots(eventId, (change: SpotChange) => {
      console.log('[Realtime] Spot change:', change);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });

      // If a comedian was assigned, invalidate their queries too
      if (change.assignedComedianId) {
        queryClient.invalidateQueries({ queryKey: ['comedian-spots', change.assignedComedianId] });
      }
    });

    // Monitor connection state
    channel.on('system', {}, (payload) => {
      if (payload.status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else if (payload.status === 'CLOSED') {
        setIsConnected(false);
      }
    });

    return () => {
      unsubscribe(channel);
      setIsConnected(false);
    };
  }, [eventId, queryClient]);

  return { isConnected };
}

/**
 * Subscribe to real-time deal changes
 * Invalidates deal-related queries on changes
 */
export function useRealtimeDeals(eventId: string, userId: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = subscribeToDeals(eventId, (change: DealChange) => {
      console.log('[Realtime] Deal change:', change);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['event-deals', eventId] });
      queryClient.invalidateQueries({ queryKey: ['deal-stats', eventId, userId] });

      // If deal was settled, invalidate payment queries
      if (change.status === 'settled') {
        queryClient.invalidateQueries({ queryKey: ['payments', eventId] });
      }
    });

    // Monitor connection state
    channel.on('system', {}, (payload) => {
      if (payload.status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else if (payload.status === 'CLOSED') {
        setIsConnected(false);
      }
    });

    return () => {
      unsubscribe(channel);
      setIsConnected(false);
    };
  }, [eventId, userId, queryClient]);

  return { isConnected };
}

/**
 * Subscribe to real-time event changes
 * Invalidates event-related queries on changes
 */
export function useRealtimeEvent(eventId: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = subscribeToEvent(eventId, (change: EventChange) => {
      console.log('[Realtime] Event change:', change);

      // Invalidate event queries
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });

      // If ticket/capacity changed, invalidate ticket sales queries
      if (change.field === 'capacity' || change.field === 'tickets_sold') {
        queryClient.invalidateQueries({ queryKey: ['ticket-sales', eventId] });
      }
    });

    // Monitor connection state
    channel.on('system', {}, (payload) => {
      if (payload.status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else if (payload.status === 'CLOSED') {
        setIsConnected(false);
      }
    });

    return () => {
      unsubscribe(channel);
      setIsConnected(false);
    };
  }, [eventId, queryClient]);

  return { isConnected };
}

/**
 * Subscribe to all event management real-time updates
 * Convenience hook that enables all subscriptions at once
 */
export function useRealtimeEventManagement(eventId: string, userId: string) {
  const applications = useRealtimeApplications(eventId);
  const spots = useRealtimeSpots(eventId);
  const deals = useRealtimeDeals(eventId, userId);
  const event = useRealtimeEvent(eventId);

  const isFullyConnected =
    applications.isConnected &&
    spots.isConnected &&
    deals.isConnected &&
    event.isConnected;

  return {
    isFullyConnected,
    connections: {
      applications: applications.isConnected,
      spots: spots.isConnected,
      deals: deals.isConnected,
      event: event.isConnected,
    },
  };
}
