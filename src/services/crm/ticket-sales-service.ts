import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface TicketSale {
  id: string;
  event_id: string;
  customer_name: string;
  customer_email: string;
  ticket_quantity: number;
  ticket_type: string;
  total_amount: number;
  platform: string;
  platform_order_id?: string;
  refund_status: string;
  purchase_date: string;
  created_at: string;
}

export interface TicketSalesMetrics {
  totalSales: number;
  totalRevenue: number;
  totalTickets: number;
  averageTicketPrice: number;
  platformBreakdown: Record<string, number>;
}

export const ticketSalesService = {
  async list(eventId?: string): Promise<TicketSale[]> {
    const query = supabaseClient.from('ticket_sales').select('*');

    if (eventId) {
      query.eq('event_id', eventId);
    }

    const { data, error } = await query.order('purchase_date', { ascending: false });

    if (error) throw error;
    return (data as TicketSale[] | null) ?? [];
  },

  async create(ticketSale: Omit<TicketSale, 'id' | 'created_at' | 'purchase_date'>) {
    const { data, error } = await supabaseClient
      .from('ticket_sales')
      .insert([ticketSale])
      .select()
      .single();

    if (error) throw error;
    return data as TicketSale;
  },

  async update(id: string, updates: Partial<TicketSale>) {
    const { data, error } = await supabaseClient
      .from('ticket_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TicketSale;
  },

  calculateMetrics(ticketSales: TicketSale[]): TicketSalesMetrics {
    const totalRevenue = ticketSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    const totalTickets = ticketSales.reduce((sum, sale) => sum + sale.ticket_quantity, 0);

    const platformBreakdown = ticketSales.reduce<Record<string, number>>((acc, sale) => {
      acc[sale.platform] = (acc[sale.platform] || 0) + 1;
      return acc;
    }, {});

    return {
      totalSales: ticketSales.length,
      totalRevenue,
      totalTickets,
      averageTicketPrice: totalTickets > 0 ? totalRevenue / totalTickets : 0,
      platformBreakdown,
    };
  },
};

export type TicketSalesService = typeof ticketSalesService;
