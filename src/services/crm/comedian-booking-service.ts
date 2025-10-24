import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface ComedianBooking {
  id: string;
  event_id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
  created_at?: string;
  updated_at?: string;
}

export const comedianBookingService = {
  async listByEvent(eventId: string): Promise<ComedianBooking[]> {
    const { data, error } = await supabaseClient
      .from('comedian_bookings')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as ComedianBooking[] | null) ?? [];
  },
};

export type ComedianBookingService = typeof comedianBookingService;
