import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  totalTickets: number;
  totalEvents: number;
  revenueChange: number;
}

export interface ChartData {
  revenueChart: Array<{ date: string; revenue: number }>;
  costBreakdown: Array<{ category: string; amount: number }>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface VenueCostRow {
  id: string;
  event_id: string;
  cost_type: string;
  description: string | null;
  amount: number;
  cost_date: string;
  payment_status: string;
  created_at?: string;
  updated_at?: string;
}

export interface MarketingCostRow {
  id: string;
  event_id: string | null;
  campaign_name: string | null;
  platform: string | null;
  cost_type: string;
  amount: number;
  spend_date: string;
  impressions: number | null;
  clicks: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ComedianCostRow {
  id: string;
  event_id: string | null;
  performance_fee: number | null;
  payment_status: string | null;
  performance_notes: string | null;
  comedian_id: string;
  created_at: string;
  updated_at: string;
}

const defaultDateRange = (input?: Partial<DateRange>): DateRange => {
  const end = input?.end ?? new Date();
  const start = input?.start ?? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
};

const fetchTableRange = async ({
  table,
  column,
  start,
  end,
}: {
  table: string;
  column: string;
  start: string;
  end: string;
}) => {
  const { data, error } = await supabaseClient
    .from(table)
    .select('*')
    .gte(column, start)
    .lte(column, end);

  if (error) throw error;
  return data as Record<string, unknown>[] | null;
};

export const financialService = {
  async listVenueCosts(): Promise<VenueCostRow[]> {
    const { data, error } = await supabaseClient
      .from('venue_costs')
      .select('*')
      .order('cost_date', { ascending: false });

    if (error) throw error;

    return (data || []) as VenueCostRow[];
  },

  async listMarketingCosts(): Promise<MarketingCostRow[]> {
    const { data, error } = await supabaseClient
      .from('marketing_costs')
      .select('*')
      .order('spend_date', { ascending: false });

    if (error) throw error;

    return (data || []) as MarketingCostRow[];
  },

  async listComedianCosts(): Promise<ComedianCostRow[]> {
    const { data, error } = await supabaseClient
      .from('comedian_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as ComedianCostRow[];
  },

  async getMetrics(range?: Partial<DateRange>): Promise<{ metrics: FinancialMetrics; chartData: ChartData }> {
    const { start, end } = defaultDateRange(range);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const [ticketSales, comedianBookings, venueCosts, marketingCosts] = await Promise.all([
      fetchTableRange({ table: 'ticket_sales', column: 'purchase_date', start: startIso, end: endIso }),
      fetchTableRange({ table: 'comedian_bookings', column: 'created_at', start: startIso, end: endIso }),
      fetchTableRange({ table: 'venue_costs', column: 'cost_date', start: startIso, end: endIso }),
      fetchTableRange({ table: 'marketing_costs', column: 'spend_date', start: startIso, end: endIso }),
    ]);

    const toNumber = (value: unknown) => Number(value ?? 0);

    const totalRevenue =
      ticketSales?.reduce((sum, sale) => sum + toNumber((sale as { total_amount?: number }).total_amount), 0) ?? 0;

    const comedianCosts =
      comedianBookings?.reduce(
        (sum, booking) => sum + toNumber((booking as { performance_fee?: number }).performance_fee),
        0
      ) ?? 0;

    const totalVenueCosts =
      venueCosts?.reduce((sum, cost) => sum + toNumber((cost as { amount?: number }).amount), 0) ?? 0;

    const totalMarketingCosts =
      marketingCosts?.reduce((sum, cost) => sum + toNumber((cost as { amount?: number }).amount), 0) ?? 0;

    const totalCosts = comedianCosts + totalVenueCosts + totalMarketingCosts;
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const totalTickets =
      ticketSales?.reduce((sum, sale) => sum + toNumber((sale as { ticket_quantity?: number }).ticket_quantity), 0) ??
      0;

    const eventIds = new Set(
      ticketSales?.map((sale) => (sale as { event_id?: string | null }).event_id).filter(Boolean) as string[]
    );

    const revenueChange = Math.random() * 20 - 10; // TODO: replace mock delta with real comparison

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const revenueChart: Array<{ date: string; revenue: number }> = [];

    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dayRevenue =
        ticketSales
          ?.filter((sale) => {
            const saleDate = new Date((sale as { purchase_date?: string }).purchase_date ?? '');
            return saleDate.toDateString() === date.toDateString();
          })
          .reduce((sum, sale) => sum + toNumber((sale as { total_amount?: number }).total_amount), 0) ?? 0;

      revenueChart.push({
        date: date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
      });
    }

    const costBreakdown = [
      { category: 'Comedians', amount: comedianCosts },
      { category: 'Venue', amount: totalVenueCosts },
      { category: 'Marketing', amount: totalMarketingCosts },
    ];

    return {
      metrics: {
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        totalTickets,
        totalEvents: eventIds.size,
        revenueChange,
      },
      chartData: {
        revenueChart,
        costBreakdown,
      },
    };
  },
};

export type FinancialService = typeof financialService;
