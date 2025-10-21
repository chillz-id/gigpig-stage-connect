import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

const supabaseClient = supabase as any;

export type EventTemplate = Tables<'event_templates'>;
export type EventTemplateInsert = TablesInsert<'event_templates'>;

export const eventTemplateService = {
  async listByPromoter(promoterId: string): Promise<EventTemplate[]> {
    const { data, error } = await supabaseClient
      .from('event_templates')
      .select('*')
      .eq('promoter_id', promoterId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as EventTemplate[] | null) ?? [];
  },

  async create(template: Omit<EventTemplateInsert, 'promoter_id'>, promoterId: string): Promise<EventTemplate> {
    const { data, error } = await supabaseClient
      .from('event_templates')
      .insert({
        ...template,
        promoter_id: promoterId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EventTemplate;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('event_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export type EventTemplateService = typeof eventTemplateService;
