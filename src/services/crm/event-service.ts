import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  start_time?: string | null;
  venue_name?: string | null;
  city?: string | null;
}

export interface UpcomingSessionEvent {
  canonical_source: string;
  canonical_session_source_id: string;
  session_name: string | null;
  event_name: string | null;
  session_start: string | null;
  session_start_local: string | null;
  timezone: string | null;
}

export const eventService = {
  async listUpcoming(limit: number = 10): Promise<UpcomingEvent[]> {
    const { data, error } = await supabaseClient
      .from('events')
      .select('id,title,event_date,start_time,venue_name,city')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data as UpcomingEvent[] | null) ?? [];
  },

  async listUpcomingSessions(limit: number = 100): Promise<UpcomingSessionEvent[]> {
    const { data, error } = await supabaseClient
      .from('session_financials')
      .select(
        'canonical_source, canonical_session_source_id, session_name, event_name, session_start, session_start_local, timezone'
      )
      .gte('session_start', new Date().toISOString())
      .order('session_start', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data as UpcomingSessionEvent[] | null) ?? [];
  },
};

export type EventService = typeof eventService;
