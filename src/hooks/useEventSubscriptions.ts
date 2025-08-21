
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEventSubscriptions = (
  fetchEvents: () => void,
  fetchComedianBookings: (eventId: string) => void,
  selectedEvent: string | null
) => {
  const subscriptionsRef = useRef<{
    events?: any;
    ticketSales?: any;
    comedianBookings?: any;
  }>({});

  useEffect(() => {
    fetchEvents();

    // Clean up existing subscriptions first
    const cleanup = () => {
      if (subscriptionsRef.current.events) {
        supabase.removeChannel(subscriptionsRef.current.events);
      }
      if (subscriptionsRef.current.ticketSales) {
        supabase.removeChannel(subscriptionsRef.current.ticketSales);
      }
      if (subscriptionsRef.current.comedianBookings) {
        supabase.removeChannel(subscriptionsRef.current.comedianBookings);
      }
      subscriptionsRef.current = {};
    };

    cleanup();

    // Set up new subscriptions with unique channel names
    const eventsSubscription = supabase
      .channel(`events_changes_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, 
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    const ticketSalesSubscription = supabase
      .channel(`ticket_sales_changes_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_sales' }, 
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    const comedianBookingsSubscription = supabase
      .channel(`comedian_bookings_changes_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comedian_bookings' }, 
        () => {
          fetchEvents();
          if (selectedEvent) fetchComedianBookings(selectedEvent);
        }
      )
      .subscribe();

    // Store subscriptions for cleanup
    subscriptionsRef.current = {
      events: eventsSubscription,
      ticketSales: ticketSalesSubscription,
      comedianBookings: comedianBookingsSubscription
    };

    return cleanup;
  }, [selectedEvent, fetchEvents, fetchComedianBookings]);
};
