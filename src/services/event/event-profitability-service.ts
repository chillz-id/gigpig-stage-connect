import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface EventProfitability {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  total_revenue: number;
  total_costs: number;
  profit_margin: number;
  tickets_sold: number;
}

export const eventProfitabilityService = {
  async list(): Promise<EventProfitability[]> {
    const { data: eventsData, error } = await supabaseClient
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) throw error;

    const events = (eventsData as any[] | null) ?? [];

    return Promise.all(
      events.map(async (event) => {
        const [
          { data: ticketSalesData, error: ticketSalesError },
          { data: comedianBookingsData, error: comedianBookingsError },
          { data: venueCostsData, error: venueCostsError },
          { data: marketingCostsData, error: marketingCostsError },
        ] = await Promise.all([
          supabaseClient
            .from('ticket_sales')
            .select('ticket_quantity, total_amount')
            .eq('event_id', event.id),
          supabaseClient
            .from('comedian_bookings')
            .select('performance_fee')
            .eq('event_id', event.id),
          supabaseClient
            .from('venue_costs')
            .select('amount')
            .eq('event_id', event.id),
          supabaseClient
            .from('marketing_costs')
            .select('amount')
            .eq('event_id', event.id),
        ]);

        if (ticketSalesError) {
          console.warn(`Failed to fetch ticket sales for event ${event.id}`, ticketSalesError);
        }
        if (comedianBookingsError) {
          console.warn(`Failed to fetch comedian bookings for event ${event.id}`, comedianBookingsError);
        }
        if (venueCostsError) {
          console.warn(`Failed to fetch venue costs for event ${event.id}`, venueCostsError);
        }
        if (marketingCostsError) {
          console.warn(`Failed to fetch marketing costs for event ${event.id}`, marketingCostsError);
        }

        const ticketSales = (ticketSalesData as Array<{ ticket_quantity?: number | null; total_amount?: number | null }> | null) ?? [];
        const comedianBookings = (comedianBookingsData as Array<{ performance_fee?: number | null }> | null) ?? [];
        const venueCosts = (venueCostsData as Array<{ amount?: number | null }> | null) ?? [];
        const marketingCosts = (marketingCostsData as Array<{ amount?: number | null }> | null) ?? [];

        const totalRevenue = ticketSales.reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0);
        const comedianCosts = comedianBookings.reduce((sum, booking) => sum + Number(booking.performance_fee ?? 0), 0);
        const totalVenueCosts = venueCosts.reduce((sum, cost) => sum + Number(cost.amount ?? 0), 0);
        const totalMarketingCosts = marketingCosts.reduce((sum, cost) => sum + Number(cost.amount ?? 0), 0);
        const totalCosts = comedianCosts + totalVenueCosts + totalMarketingCosts;
        const ticketsSold = ticketSales.reduce((sum, sale) => sum + Number(sale.ticket_quantity ?? 0), 0);

        return {
          id: event.id,
          title: event.title,
          venue: event.venue,
          event_date: event.event_date,
          total_revenue: totalRevenue,
          total_costs: totalCosts,
          profit_margin: totalRevenue - totalCosts,
          tickets_sold: ticketsSold,
        } satisfies EventProfitability;
      })
    );
  },
};

export type EventProfitabilityService = typeof eventProfitabilityService;
