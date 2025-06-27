
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EventProfitabilityData {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  total_revenue: number;
  total_costs: number;
  profit_margin: number;
  tickets_sold: number;
}

export const useEventProfitability = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['event-profitability'],
    queryFn: async (): Promise<EventProfitabilityData[]> => {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;

      const enrichedEvents = await Promise.all(
        eventsData.map(async (event) => {
          // Get ticket sales for this event
          const { data: ticketSales } = await supabase
            .from('ticket_sales')
            .select('*')
            .eq('event_id', event.id);

          // Get comedian bookings for this event
          const { data: comedianBookings } = await supabase
            .from('comedian_bookings')
            .select('*')
            .eq('event_id', event.id);

          // Get venue costs for this event
          const { data: venueCosts } = await supabase
            .from('venue_costs')
            .select('*')
            .eq('event_id', event.id);

          // Get marketing costs for this event
          const { data: marketingCosts } = await supabase
            .from('marketing_costs')
            .select('*')
            .eq('event_id', event.id);

          const totalRevenue = ticketSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
          const comedianCosts = comedianBookings?.reduce((sum, booking) => sum + Number(booking.performance_fee || 0), 0) || 0;
          const totalVenueCosts = venueCosts?.reduce((sum, cost) => sum + Number(cost.amount), 0) || 0;
          const totalMarketingCosts = marketingCosts?.reduce((sum, cost) => sum + Number(cost.amount), 0) || 0;
          const totalCosts = comedianCosts + totalVenueCosts + totalMarketingCosts;
          const profitMargin = totalRevenue - totalCosts;
          const ticketsSold = ticketSales?.reduce((sum, sale) => sum + sale.ticket_quantity, 0) || 0;

          return {
            id: event.id,
            title: event.title,
            venue: event.venue,
            event_date: event.event_date,
            total_revenue: totalRevenue,
            total_costs: totalCosts,
            profit_margin: profitMargin,
            tickets_sold: ticketsSold
          };
        })
      );

      return enrichedEvents;
    },
  });

  const exportData = (data: EventProfitabilityData[], filename: string) => {
    const csv = [
      ['Event', 'Venue', 'Date', 'Revenue', 'Costs', 'Profit', 'Margin %', 'Tickets Sold'],
      ...data.map(event => [
        event.title,
        event.venue,
        new Date(event.event_date).toLocaleDateString('en-AU'),
        event.total_revenue.toFixed(2),
        event.total_costs.toFixed(2),
        event.profit_margin.toFixed(2),
        ((event.profit_margin / Math.max(event.total_revenue, 1)) * 100).toFixed(2),
        event.tickets_sold.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return {
    events: events || [],
    isLoading,
    exportData
  };
};
