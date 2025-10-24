import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface EventPromoterProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface EventDetailsRow {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time?: string | null;
  venue: string | null;
  address: string | null;
  description?: string | null;
  requirements?: string | null;
  promoter_id: string;
  promoter?: EventPromoterProfile | null;
}

export interface EventSpotDetailsRow {
  id: string;
  comedian_id: string | null;
  event_id: string;
  spot_name: string;
  payment_amount: number | null;
  currency: string | null;
  duration_minutes: number | null;
  spot_order: number | null;
  is_filled: boolean;
  confirmation_status?: string | null;
  confirmation_deadline?: string | null;
  confirmed_at?: string | null;
  declined_at?: string | null;
  created_at: string;
  updated_at: string;
  event?: EventDetailsRow | null;
}

const spotDetailsSelect = `
  *,
  event:events (
    id,
    title,
    event_date,
    start_time,
    end_time,
    venue,
    address,
    description,
    requirements,
    promoter_id,
    promoter:profiles!events_promoter_id_fkey (
      id,
      first_name,
      last_name,
      email,
      phone,
      avatar_url
    )
  )
`;

export const comedianSpotService = {
  async listForComedian(comedianId: string): Promise<EventSpotDetailsRow[]> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select(spotDetailsSelect)
      .eq('comedian_id', comedianId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as EventSpotDetailsRow[];
  },

  async getForComedian(spotId: string, comedianId: string): Promise<EventSpotDetailsRow | null> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select(spotDetailsSelect)
      .eq('id', spotId)
      .eq('comedian_id', comedianId)
      .single();

    if (error) throw error;

    return (data as EventSpotDetailsRow) ?? null;
  },

  async updateSpotAssignment(
    spotId: string,
    payload: Partial<EventSpotDetailsRow>
  ): Promise<EventSpotDetailsRow> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', spotId)
      .select(spotDetailsSelect)
      .single();

    if (error) throw error;

    return data as EventSpotDetailsRow;
  },

  async respondToSpot({
    spotId,
    comedianId,
    status,
  }: {
    spotId: string;
    comedianId: string;
    status: 'confirmed' | 'declined';
  }) {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      confirmation_status: status,
    };

    if (status === 'confirmed') {
      updateData.is_filled = true;
      updateData.confirmed_at = new Date().toISOString();
    } else {
      updateData.is_filled = false;
      updateData.comedian_id = null;
      updateData.declined_at = new Date().toISOString();
    }

    const { error } = await supabaseClient
      .from('event_spots')
      .update(updateData)
      .eq('id', spotId)
      .eq('comedian_id', comedianId);

    if (error) throw error;
  },

  async getSpotSummary(spotId: string): Promise<{
    event_id: string;
    comedian_id: string | null;
    confirmation_deadline?: string | null;
  }> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select('id, event_id, comedian_id, confirmation_deadline')
      .eq('id', spotId)
      .single();

    if (error) throw error;

    return data as {
      event_id: string;
      comedian_id: string | null;
      confirmation_deadline?: string | null;
    };
  },

  async getEventSummary(eventId: string): Promise<{
    title: string;
    event_date: string;
    promoter_id: string;
    venue?: string | null;
    promoter?: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
  } | null> {
    const { data, error } = await supabaseClient
      .from('events')
      .select(
        `
        title,
        event_date,
        promoter_id,
        venue,
        address,
        promoter:profiles (
          first_name,
          last_name,
          email
        )
      `
      )
      .eq('id', eventId)
      .single();

    if (error) throw error;

    return data as {
      title: string;
      event_date: string;
      promoter_id: string;
      venue?: string | null;
      address?: string | null;
      promoter?: {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
      } | null;
    };
  },

  async getComedianProfile(comedianId: string): Promise<{ name: string; email: string | null } | null> {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('name, email')
      .eq('id', comedianId)
      .single();

    if (error) throw error;

    return data as { name: string; email: string | null } | null;
  },
};

export type ComedianSpotService = typeof comedianSpotService;
