
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  totalTickets: number;
  totalEvents: number;
  revenueChange: number;
}

interface ChartData {
  revenueChart: Array<{ date: string; revenue: number }>;
  costBreakdown: Array<{ category: string; amount: number }>;
}

export const useFinancialMetrics = (period: string) => {
  return useQuery({
    queryKey: ['financial-metrics', period],
    queryFn: async (): Promise<{ metrics: FinancialMetrics; chartData: ChartData }> => {
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get ticket sales data
      const { data: ticketSales } = await supabase
        .from('ticket_sales')
        .select('*')
        .gte('purchase_date', startDate.toISOString());

      // Get comedian bookings data
      const { data: comedianBookings } = await supabase
        .from('comedian_bookings')
        .select('*')
        .gte('created_at', startDate.toISOString());

      // Get venue costs data
      const { data: venueCosts } = await supabase
        .from('venue_costs')
        .select('*')
        .gte('cost_date', startDate.toISOString());

      // Get marketing costs data
      const { data: marketingCosts } = await supabase
        .from('marketing_costs')
        .select('*')
        .gte('spend_date', startDate.toISOString());

      const totalRevenue = ticketSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const comedianCosts = comedianBookings?.reduce((sum, booking) => sum + Number(booking.performance_fee || 0), 0) || 0;
      const totalVenueCosts = venueCosts?.reduce((sum, cost) => sum + Number(cost.amount), 0) || 0;
      const totalMarketingCosts = marketingCosts?.reduce((sum, cost) => sum + Number(cost.amount), 0) || 0;
      const totalCosts = comedianCosts + totalVenueCosts + totalMarketingCosts;
      const netProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const totalTickets = ticketSales?.reduce((sum, sale) => sum + sale.ticket_quantity, 0) || 0;

      // Get unique events count
      const eventIds = new Set(ticketSales?.map(sale => sale.event_id).filter(Boolean));
      const totalEvents = eventIds.size;

      // Calculate revenue change (mock for now)
      const revenueChange = Math.random() * 20 - 10; // Random between -10 and 10

      // Prepare chart data
      const revenueChart = [];
      const costBreakdown = [
        { category: 'Comedians', amount: comedianCosts },
        { category: 'Venue', amount: totalVenueCosts },
        { category: 'Marketing', amount: totalMarketingCosts }
      ];

      // Generate daily revenue data for chart
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayRevenue = ticketSales?.filter(sale => {
          const saleDate = new Date(sale.purchase_date);
          return saleDate.toDateString() === date.toDateString();
        }).reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

        revenueChart.push({
          date: date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue
        });
      }

      return {
        metrics: {
          totalRevenue,
          totalCosts,
          netProfit,
          profitMargin,
          totalTickets,
          totalEvents,
          revenueChange
        },
        chartData: {
          revenueChart,
          costBreakdown
        }
      };
    },
  });
};
