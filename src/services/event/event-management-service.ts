import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export const eventManagementService = {
  async deleteById(eventId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  },
};

export type EventManagementService = typeof eventManagementService;
