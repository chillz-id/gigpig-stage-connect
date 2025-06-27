
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEventSubscriptions = (
  fetchEvents: () => void,
  fetchComedianBookings: (eventId: string) => void,
  selectedEvent: string | null
) => {
  useEffect(() => {
    fetchEvents();

    // Set up real-time subscriptions for live updates
    const eventsSubscription = supabase
      .channel('events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, 
        () => {
          console.log('Events table changed, refreshing data...');
          fetchEvents();
        }
      )
      .subscribe();

    const ticketSalesSubscription = supabase
      .channel('ticket_sales_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_sales' }, 
        () => {
          console.log('Ticket sales changed, refreshing data...');
          fetchEvents(); // Refresh events to get updated counts
        }
      )
      .subscribe();

    const comedianBookingsSubscription = supabase
      .channel('comedian_bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comedian_bookings' }, 
        () => {
          console.log('Comedian bookings changed, refreshing data...');
          fetchEvents();
          if (selectedEvent) fetchComedianBookings(selectedEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsSubscription);
      supabase.removeChannel(ticketSalesSubscription);
      supabase.removeChannel(comedianBookingsSubscription);
    };
  }, [selectedEvent, fetchEvents, fetchComedianBookings]);
};
