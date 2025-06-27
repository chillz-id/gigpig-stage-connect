
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  status: string;
  ticket_price: number | null;
  tickets_sold: number;
  comedian_slots: number;
  filled_slots: number;
  total_revenue: number;
  total_costs: number;
  profit_margin: number;
  settlement_status: string;
  promoter_id: string;
  capacity: number;
}

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

export const useEventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([]);
  const [comedianBookings, setComedianBookings] = useState<ComedianBooking[]>([]);
  const { toast } = useToast();

  // Fetch events from database with enhanced data
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          venue,
          status,
          ticket_price,
          tickets_sold,
          comedian_slots,
          filled_slots,
          total_revenue,
          total_costs,
          profit_margin,
          settlement_status,
          promoter_id,
          capacity
        `)
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      
      // Process events and calculate real-time metrics
      const processedEvents = await Promise.all(
        (data || []).map(async (event) => {
          // Get actual ticket sales count
          const { data: salesData } = await supabase
            .from('ticket_sales')
            .select('ticket_quantity, total_amount')
            .eq('event_id', event.id);
          
          // Get actual comedian bookings count
          const { data: bookingsData } = await supabase
            .from('comedian_bookings')
            .select('performance_fee')
            .eq('event_id', event.id);
          
          const actualTicketsSold = salesData?.reduce((sum, sale) => sum + sale.ticket_quantity, 0) || 0;
          const actualRevenue = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
          const actualCosts = bookingsData?.reduce((sum, booking) => sum + booking.performance_fee, 0) || 0;
          const actualFilledSlots = bookingsData?.length || 0;
          
          return {
            ...event,
            tickets_sold: actualTicketsSold,
            total_revenue: actualRevenue,
            total_costs: actualCosts,
            filled_slots: actualFilledSlots,
            profit_margin: actualRevenue - actualCosts,
            comedian_slots: event.comedian_slots || 5,
            capacity: event.capacity || 0,
            ticket_price: event.ticket_price || 0
          };
        })
      );
      
      setEvents(processedEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch ticket sales for selected event
  const fetchTicketSales = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_sales')
        .select('*')
        .eq('event_id', eventId)
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      setTicketSales(data || []);
    } catch (error: any) {
      console.error('Error fetching ticket sales:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ticket sales.",
        variant: "destructive",
      });
    }
  };

  // Fetch comedian bookings for selected event
  const fetchComedianBookings = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('comedian_bookings')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setComedianBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching comedian bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch comedian bookings.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      
      // Close event details if the deleted event was selected
      if (selectedEvent === eventId) {
        handleCloseEventDetails();
      }

      toast({
        title: "Event Deleted",
        description: "Event has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  const handleViewEventDetails = (eventId: string) => {
    console.log('Viewing details for event:', eventId);
    setSelectedEvent(eventId);
    fetchTicketSales(eventId);
    fetchComedianBookings(eventId);
  };

  const handleCloseEventDetails = () => {
    setSelectedEvent(null);
    setTicketSales([]);
    setComedianBookings([]);
  };

  return {
    events,
    setEvents,
    loading,
    selectedEvent,
    ticketSales,
    comedianBookings,
    fetchEvents,
    fetchTicketSales,
    fetchComedianBookings,
    handleDeleteEvent,
    handleViewEventDetails,
    handleCloseEventDetails,
  };
};
