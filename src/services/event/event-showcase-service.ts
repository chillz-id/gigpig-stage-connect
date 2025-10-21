import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface FeaturedEvent {
  id: string;
  title: string;
  event_date: string;
  start_time?: string | null;
  venue?: string | null;
  city?: string | null;
  image_url?: string | null;
  ticket_url?: string | null;
  ticket_price?: number | null;
}

const baseSelect = `
  id,
  title,
  event_date,
  start_time,
  venue,
  city,
  image_url,
  ticket_url,
  ticket_price
`;

export const eventShowcaseService = {
  async listFeatured(limit: number = 6): Promise<FeaturedEvent[]> {
    const { data, error } = await supabaseClient
      .from('events')
      .select(baseSelect)
      .eq('featured', true)
      .eq('status', 'published')
      .order('event_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data as FeaturedEvent[] | null) ?? [];
  },

  async listUpcoming(fromDate: Date, limit: number = 6): Promise<FeaturedEvent[]> {
    const { data, error } = await supabaseClient
      .from('events')
      .select(baseSelect)
      .eq('status', 'published')
      .gte('event_date', fromDate.toISOString())
      .order('event_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data as FeaturedEvent[] | null) ?? [];
  },
};

export type EventShowcaseService = typeof eventShowcaseService;
