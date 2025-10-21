import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface Ticket {
  id: string;
  user_id: string;
  event_id: string;
  ticket_type: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  events?: {
    id: string;
    title: string;
    venue: string;
    event_date: string;
    start_time?: string | null;
    image_url?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
}

export interface TicketPurchaseInput {
  event_id: string;
  ticket_type: string;
  quantity: number;
  total_price: number;
}

export const ticketService = {
  async listByUser(userId: string): Promise<Ticket[]> {
    const { data, error } = await supabaseClient
      .from('tickets')
      .select(`
        id,
        user_id,
        event_id,
        ticket_type,
        quantity,
        total_price,
        status,
        payment_status,
        created_at,
        events (
          id,
          title,
          venue,
          event_date,
          start_time,
          image_url,
          city,
          state
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return ((data as Ticket[] | null) ?? []).map((ticket) => ({
      ...ticket,
      events: ticket.events ?? null,
    }));
  },

  async create(userId: string, payload: TicketPurchaseInput) {
    const { data, error } = await supabaseClient
      .from('tickets')
      .insert({
        user_id: userId,
        event_id: payload.event_id,
        ticket_type: payload.ticket_type,
        quantity: payload.quantity,
        total_price: payload.total_price,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as Ticket;
  },

  async cancel(ticketId: string, userId: string) {
    const { error } = await supabaseClient
      .from('tickets')
      .update({ status: 'cancelled', payment_status: 'refunded' })
      .eq('id', ticketId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};

export type TicketService = typeof ticketService;
