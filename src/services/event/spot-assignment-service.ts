import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface SpotAssignmentPayload {
  eventId: string;
  comedianId: string;
  spotType: string;
  confirmationDeadlineHours: number;
}

export interface EventSummary {
  title: string;
  event_date: string;
  venue?: string | null;
}

export const spotAssignmentService = {
  async assignViaRpc(payload: SpotAssignmentPayload) {
    const { data, error } = await supabaseClient.rpc('assign_spot_to_comedian', {
      p_event_id: payload.eventId,
      p_comedian_id: payload.comedianId,
      p_spot_type: payload.spotType,
      p_confirmation_deadline_hours: payload.confirmationDeadlineHours,
    });

    if (error) throw error;
    return data;
  },

  async getEventSummary(eventId: string): Promise<EventSummary | null> {
    const { data, error } = await supabaseClient
      .from('events')
      .select('title, event_date, venue')
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as EventSummary;
  },

  async isComedianAssigned(eventId: string, comedianId: string): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select('id')
      .eq('event_id', eventId)
      .eq('comedian_id', comedianId)
      .eq('is_filled', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return Boolean(data);
  },

  async findAvailableSpot(eventId: string, spotType: string) {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select('id')
      .eq('event_id', eventId)
      .eq('spot_name', spotType)
      .eq('is_filled', false)
      .limit(1);

    if (error) throw error;

    return (data as Array<{ id: string }> | null)?.[0] ?? null;
  },

  async markSpotAssigned(spotId: string, comedianId: string, confirmationDeadline: Date) {
    const { error } = await supabaseClient
      .from('event_spots')
      .update({
        comedian_id: comedianId,
        is_filled: true,
        confirmation_status: 'pending',
        confirmation_deadline: confirmationDeadline.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', spotId);

    if (error) throw error;
  },
};

export type SpotAssignmentService = typeof spotAssignmentService;
