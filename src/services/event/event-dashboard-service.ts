import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface EventSummary {
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

export const eventDashboardService = {
  async list(): Promise<EventSummary[]> {
    const { data, error } = await supabaseClient
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

    const baseEvents = (data as EventSummary[] | null) ?? [];

    return Promise.all(
      baseEvents.map(async (event) => {
        try {
          const [{ data: salesData, error: salesError }, { data: bookingsData, error: bookingsError }] = await Promise.all([
            supabaseClient
              .from('ticket_sales')
              .select('ticket_quantity, total_amount')
              .eq('event_id', event.id),
            supabaseClient
              .from('comedian_bookings')
              .select('performance_fee')
              .eq('event_id', event.id),
          ]);

          if (salesError) {
            console.warn(`Error fetching sales for event ${event.id}:`, salesError);
          }

          if (bookingsError) {
            console.warn(`Error fetching bookings for event ${event.id}:`, bookingsError);
          }

          const actualTicketsSold = (salesData ?? []).reduce(
            (sum: number, sale: { ticket_quantity?: number | null }) => sum + (sale.ticket_quantity || 0),
            0
          );
          const actualRevenue = (salesData ?? []).reduce(
            (sum: number, sale: { total_amount?: number | null }) => sum + (sale.total_amount || 0),
            0
          );
          const actualCosts = (bookingsData ?? []).reduce(
            (sum: number, booking: { performance_fee?: number | null }) => sum + (booking.performance_fee || 0),
            0
          );
          const actualFilledSlots = bookingsData?.length ?? 0;

          return {
            ...event,
            tickets_sold: actualTicketsSold,
            total_revenue: actualRevenue,
            total_costs: actualCosts,
            filled_slots: actualFilledSlots,
            profit_margin: actualRevenue - actualCosts,
            comedian_slots: event.comedian_slots ?? 5,
            capacity: event.capacity ?? 0,
            ticket_price: event.ticket_price ?? 0,
          } satisfies EventSummary;
        } catch (processingError) {
          console.error(`Error processing event ${event.id}:`, processingError);
          return {
            ...event,
            tickets_sold: event.tickets_sold ?? 0,
            total_revenue: event.total_revenue ?? 0,
            total_costs: event.total_costs ?? 0,
            filled_slots: event.filled_slots ?? 0,
            profit_margin: (event.total_revenue ?? 0) - (event.total_costs ?? 0),
            comedian_slots: event.comedian_slots ?? 5,
            capacity: event.capacity ?? 0,
            ticket_price: event.ticket_price ?? 0,
          } satisfies EventSummary;
        }
      })
    );
  },
};

export type EventDashboardService = typeof eventDashboardService;
