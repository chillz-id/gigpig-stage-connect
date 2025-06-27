
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

export const useEventData = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
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
      
      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }
      
      // Process events and calculate real-time metrics
      const processedEvents = await Promise.all(
        (data || []).map(async (event) => {
          try {
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
            
            const actualTicketsSold = salesData?.reduce((sum, sale) => sum + (sale.ticket_quantity || 0), 0) || 0;
            const actualRevenue = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
            const actualCosts = bookingsData?.reduce((sum, booking) => sum + (booking.performance_fee || 0), 0) || 0;
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
          } catch (error) {
            console.error(`Error processing event ${event.id}:`, error);
            // Return event with default values if processing fails
            return {
              ...event,
              tickets_sold: event.tickets_sold || 0,
              total_revenue: event.total_revenue || 0,
              total_costs: event.total_costs || 0,
              filled_slots: event.filled_slots || 0,
              profit_margin: (event.total_revenue || 0) - (event.total_costs || 0),
              comedian_slots: event.comedian_slots || 5,
              capacity: event.capacity || 0,
              ticket_price: event.ticket_price || 0
            };
          }
        })
      );
      
      setEvents(processedEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive",
      });
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    setEvents,
    loading,
    fetchEvents,
  };
};
