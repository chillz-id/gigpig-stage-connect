import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface LineupBookingRow {
  id: string;
  event_id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
  performance_notes?: string | null;
  currency: string | null;
  created_at: string;
  is_selected: boolean | null;
  payment_type: 'fixed' | 'percentage_revenue' | 'percentage_door' | null;
  percentage_amount: number | null;
  is_editable: boolean | null;
  profiles?: {
    name?: string | null;
    email?: string | null;
    stage_name?: string | null;
  } | null;
}

export const eventLineupService = {
  async listBookings(eventId: string): Promise<LineupBookingRow[]> {
    const { data, error } = await supabaseClient
      .from('comedian_bookings')
      .select(
        `
        *,
        profiles:profiles!comedian_bookings_comedian_id_fkey (
          name,
          email,
          stage_name
        )
      `
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as LineupBookingRow[];
  },

  async getEventRevenue(eventId: string): Promise<number> {
    const { data, error } = await supabaseClient
      .from('ticket_sales')
      .select('total_amount')
      .eq('event_id', eventId);

    if (error) throw error;

    return (data || []).reduce((sum: number, sale: { total_amount?: number | null }) => {
      return sum + Number(sale.total_amount ?? 0);
    }, 0);
  },

  async updateSelection(bookingId: string, isSelected: boolean) {
    const { error } = await supabaseClient
      .from('comedian_bookings')
      .update({ is_selected: isSelected })
      .eq('id', bookingId);

    if (error) throw error;
  },

  async updateAllSelections(eventId: string, isSelected: boolean) {
    const { error } = await supabaseClient
      .from('comedian_bookings')
      .update({ is_selected: isSelected })
      .eq('event_id', eventId);

    if (error) throw error;
  },

  async createBatchPayment({
    eventId,
    bookingIds,
    totalAmount,
  }: {
    eventId: string;
    bookingIds: string[];
    totalAmount: number;
  }) {
    const { data, error } = await supabaseClient
      .from('batch_payments')
      .insert({
        event_id: eventId,
        total_amount: totalAmount,
        selected_bookings: bookingIds,
        processing_status: 'pending',
        notes: `Batch payment for ${bookingIds.length} comedian(s)`,
      })
      .select('*')
      .single();

    if (error) throw error;

    return data;
  },

  async updatePaymentStatusForBookings(bookingIds: string[], status: string) {
    const { error } = await supabaseClient
      .from('comedian_bookings')
      .update({ payment_status: status })
      .in('id', bookingIds);

    if (error) throw error;
  },

  async deleteBooking(bookingId: string) {
    const { error } = await supabaseClient
      .from('comedian_bookings')
      .delete()
      .eq('id', bookingId);

    if (error) throw error;
  },

  async updatePaymentStatus(bookingId: string, status: string) {
    const { error } = await supabaseClient
      .from('comedian_bookings')
      .update({ payment_status: status })
      .eq('id', bookingId);

    if (error) throw error;
  },
};

export type EventLineupService = typeof eventLineupService;
