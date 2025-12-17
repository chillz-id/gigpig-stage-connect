
import { useState, useEffect, useCallback } from 'react';
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
  // Sync-related fields
  source: 'humanitix' | 'eventbrite' | 'platform' | string | null;
  source_id: string | null;
  canonical_session_source_id: string | null;
  synced_at: string | null;
  is_synced: boolean | null;
  ticket_count: number | null;
  gross_dollars: number | null;
  net_dollars: number | null;
  fees_dollars: number | null;
  order_count: number | null;
  last_order_at: string | null;
  ticket_url: string | null;
}

export const useEventData = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
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
          capacity,
          source,
          source_id,
          canonical_session_source_id,
          synced_at,
          is_synced,
          ticket_count,
          gross_dollars,
          net_dollars,
          fees_dollars,
          order_count,
          last_order_at,
          ticket_url
        `)
        .order('event_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }
      
      
      // Process events and calculate real-time metrics safely
      const processedEvents = await Promise.all(
        (data || []).map(async (event) => {
          try {
            // Get actual ticket sales count
            const { data: salesData, error: salesError } = await supabase
              .from('ticket_sales')
              .select('ticket_quantity, total_amount')
              .eq('event_id', event.id);
            
            if (salesError) {
              console.warn(`Error fetching sales for event ${event.id}:`, salesError);
            }
            
            // Get actual comedian bookings count
            const { data: bookingsData, error: bookingsError } = await supabase
              .from('comedian_bookings')
              .select('performance_fee')
              .eq('event_id', event.id);
            
            if (bookingsError) {
              console.warn(`Error fetching bookings for event ${event.id}:`, bookingsError);
            }
            
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
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    setEvents,
    loading,
    fetchEvents,
  };
};
