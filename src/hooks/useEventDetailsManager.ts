
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TicketSale {
  id: string;
  event_id: string;
  customer_name: string;
  customer_email: string;
  ticket_quantity: number;
  total_amount: number;
  platform: string;
  purchase_date: string;
}

interface ComedianBooking {
  id: string;
  event_id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
}

export const useEventDetailsManager = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([]);
  const [comedianBookings, setComedianBookings] = useState<ComedianBooking[]>([]);

  const fetchComedianBookings = useCallback(async (eventId: string) => {
    try {
      console.log('Fetching comedian bookings for event:', eventId);
      const { data, error } = await supabase
        .from('comedian_bookings')
        .select('*')
        .eq('event_id', eventId);

      if (error) {
        console.error('Error fetching comedian bookings:', error);
        return;
      }

      console.log('Comedian bookings fetched:', data?.length || 0);
      setComedianBookings(data || []);
    } catch (error) {
      console.error('Error fetching comedian bookings:', error);
      setComedianBookings([]);
    }
  }, []);

  const fetchTicketSales = useCallback(async (eventId: string) => {
    try {
      console.log('Fetching ticket sales for event:', eventId);
      const { data, error } = await supabase
        .from('ticket_sales')
        .select('*')
        .eq('event_id', eventId);

      if (error) {
        console.error('Error fetching ticket sales:', error);
        return;
      }

      console.log('Ticket sales fetched:', data?.length || 0);
      setTicketSales(data || []);
    } catch (error) {
      console.error('Error fetching ticket sales:', error);
      setTicketSales([]);
    }
  }, []);

  const handleViewEventDetails = useCallback(async (eventId: string) => {
    console.log('Viewing event details for:', eventId);
    setSelectedEvent(eventId);
    
    // Fetch related data
    await Promise.all([
      fetchTicketSales(eventId),
      fetchComedianBookings(eventId)
    ]);
  }, [fetchTicketSales, fetchComedianBookings]);

  const handleCloseEventDetails = useCallback(() => {
    console.log('Closing event details');
    setSelectedEvent(null);
    setTicketSales([]);
    setComedianBookings([]);
  }, []);

  return {
    selectedEvent,
    ticketSales,
    comedianBookings,
    fetchComedianBookings,
    handleViewEventDetails,
    handleCloseEventDetails,
  };
};
