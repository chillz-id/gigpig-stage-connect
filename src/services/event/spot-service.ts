import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

const supabaseClient = supabase as any;

export type EventSpot = Tables<'event_spots'>;
export type EventSpotInsert = TablesInsert<'event_spots'>;
export type EventSpotUpdate = TablesUpdate<'event_spots'>;

export const eventSpotService = {
  async listByEvent(eventId: string): Promise<EventSpot[]> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select('*')
      .eq('event_id', eventId)
      .order('spot_order', { ascending: true });

    if (error) throw error;
    return (data as EventSpot[] | null) ?? [];
  },

  async create(payload: EventSpotInsert): Promise<EventSpot> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as EventSpot;
  },

  async update(id: string, updates: EventSpotUpdate): Promise<EventSpot> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as EventSpot;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('event_spots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async hasPerformer(eventId: string, performerId: string): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select('id')
      .eq('event_id', eventId)
      .eq('performer_id', performerId);

    if (error) throw error;
    return (data as Array<{ id: string }> | null)?.length > 0;
  },

  async reorder(spots: Array<{ id?: string | null; order: number }>): Promise<void> {
    const updatePromises = spots
      .filter((spot) => spot.id)
      .map((spot) =>
        supabaseClient
          .from('event_spots')
          .update({ order_number: spot.order })
          .eq('id', spot.id)
      );

    const results = await Promise.all(updatePromises);
    const firstError = results.find((result) => result.error)?.error;

    if (firstError) throw firstError;
  },
};

export type EventSpotService = typeof eventSpotService;
