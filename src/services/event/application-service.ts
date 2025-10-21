import { supabase } from '@/integrations/supabase/client';
import type { ApplicationInsert, ApplicationUpdate } from '@/types/application';

const supabaseClient = supabase as any;

export interface EventApplication {
  id: string;
  event_id: string;
  comedian_id: string;
  status: string | null;
  message?: string | null;
  spot_type?: string | null;
  availability_confirmed?: boolean | null;
  requirements_acknowledged?: boolean | null;
  applied_at: string | null;
  responded_at?: string | null;
}

export interface ApplicationEventSummary {
  id: string;
  title: string;
  venue: string;
  address?: string | null;
  event_date: string;
  start_time?: string | null;
  city: string;
  state: string;
  status?: string | null;
  banner_url?: string | null;
  promoter?: {
    id: string;
    name: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface ComedianApplicationRecord extends EventApplication {
  event?: ApplicationEventSummary;
}

export interface ApplicationDetailsRecord extends EventApplication {
  event: {
    id: string;
    title: string;
    venue: string;
    venue_address?: string | null;
    event_date: string;
    event_time?: string | null;
    city: string;
    state: string;
    description?: string | null;
    requirements?: string | null;
    total_spots?: number | null;
    available_spots?: number | null;
  } | null;
  comedian: {
    id: string;
    name: string;
    email?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
    bio?: string | null;
    location?: string | null;
    years_experience?: number | null;
    website_url?: string | null;
    instagram_url?: string | null;
    twitter_url?: string | null;
    youtube_url?: string | null;
    facebook_url?: string | null;
    tiktok_url?: string | null;
  } | null;
}

export interface ApplicationNotificationContext {
  event_id: string;
  event_title: string;
  event_date: string;
  promoter_id: string | null;
}

const mapComedianApplication = (row: any): ComedianApplicationRecord => ({
  id: row.id,
  event_id: row.event_id,
  comedian_id: row.comedian_id,
  status: row.status,
  message: row.message,
  spot_type: row.spot_type,
  availability_confirmed: row.availability_confirmed,
  requirements_acknowledged: row.requirements_acknowledged,
  applied_at: row.applied_at,
  responded_at: row.responded_at,
  event: row.events
    ? {
        id: row.events.id,
        title: row.events.title ?? '',
        venue: row.events.venue ?? '',
        address: row.events.address ?? row.events.venue_address ?? null,
        event_date: row.events.event_date ?? '',
        start_time: row.events.start_time ?? null,
        city: row.events.city ?? '',
        state: row.events.state ?? '',
        status: row.events.status ?? null,
        banner_url: row.events.banner_url ?? null,
        promoter: row.events.promoter
          ? {
              id: row.events.promoter.id,
              name: row.events.promoter.name ?? null,
              avatar_url: row.events.promoter.avatar_url ?? null,
            }
          : null,
      }
    : undefined,
});

export const eventApplicationService = {
  async listByEvent(eventId: string): Promise<EventApplication[]> {
    const { data, error } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('event_id', eventId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return (data as EventApplication[] | null) ?? [];
  },

  async listForComedian(comedianId: string): Promise<ComedianApplicationRecord[]> {
    const { data, error } = await supabaseClient
      .from('applications')
      .select(
        `
        *,
        events!inner (
          id,
          title,
          venue,
          address,
          venue_address,
          event_date,
          start_time,
          city,
          state,
          status,
          banner_url,
          promoter_id,
          promoter:profiles!events_promoter_id_fkey (
            id,
            name,
            avatar_url
          )
        )
      `
      )
      .eq('comedian_id', comedianId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as any[]).map(mapComedianApplication);
  },

  async hasExistingApplication(eventId: string, comedianId: string): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from('applications')
      .select('id')
      .eq('event_id', eventId)
      .eq('comedian_id', comedianId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return Boolean(data);
  },

  async apply(comedianId: string, payload: Omit<ApplicationInsert, 'comedian_id' | 'status'>) {
    const { data, error } = await supabaseClient
      .from('applications')
      .insert({
        ...payload,
        comedian_id: comedianId,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as EventApplication;
  },

  async withdrawForComedian(applicationId: string, comedianId: string) {
    const { data, error } = await supabaseClient
      .from('applications')
      .update({
        status: 'withdrawn',
        responded_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .eq('comedian_id', comedianId)
      .select('id, event_id')
      .maybeSingle();

    if (error) throw error;

    return data as { id: string; event_id: string } | null;
  },

  async updateForComedian(
    applicationId: string,
    comedianId: string,
    updates: {
      message?: string;
      spot_type?: string;
      availability_confirmed?: boolean;
      requirements_acknowledged?: boolean;
    }
  ) {
    const { error } = await supabaseClient
      .from('applications')
      .update(updates)
      .eq('id', applicationId)
      .eq('comedian_id', comedianId);

    if (error) throw error;
  },

  async update(id: string, updates: ApplicationUpdate) {
    const { data, error } = await supabaseClient
      .from('applications')
      .update({
        ...updates,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as EventApplication;
  },

  async bulkUpdate(ids: string[], updates: ApplicationUpdate) {
    const { error } = await supabaseClient
      .from('applications')
      .update({
        ...updates,
      })
      .in('id', ids);

    if (error) throw error;
  },

  async getDetails(applicationId: string): Promise<ApplicationDetailsRecord | null> {
    const { data, error } = await supabaseClient
      .from('applications')
      .select(`
        id,
        event_id,
        comedian_id,
        status,
        message,
        spot_type,
        availability_confirmed,
        requirements_acknowledged,
        applied_at,
        responded_at,
        events!inner (
          id,
          title,
          venue,
          venue_address,
          event_date,
          event_time,
          city,
          state,
          description,
          requirements,
          total_spots,
          available_spots
        ),
        profiles!inner (
          id,
          name,
          email,
          avatar_url,
          phone,
          bio,
          location,
          years_experience,
          website_url,
          instagram_url,
          twitter_url,
          youtube_url,
          facebook_url,
          tiktok_url
        )
      `)
      .eq('id', applicationId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return null;
    }

    const record = data as any;

    return {
      ...record,
      event: record.events ?? null,
      comedian: record.profiles ?? null,
    } as ApplicationDetailsRecord;
  },

  async getNotificationContext(applicationId: string): Promise<ApplicationNotificationContext | null> {
    const { data, error } = await supabaseClient
      .from('applications')
      .select(
        `
        event_id,
        events (
          title,
          event_date,
          promoter_id
        )
      `
      )
      .eq('id', applicationId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return null;
    }

    const record = data as any;
    return {
      event_id: record.event_id,
      event_title: record.events?.title ?? 'Event',
      event_date: record.events?.event_date ?? new Date().toISOString(),
      promoter_id: record.events?.promoter_id ?? null,
    };
  },

  async getEventNotificationMetadata(eventId: string): Promise<ApplicationNotificationContext | null> {
    const { data, error } = await supabaseClient
      .from('events')
      .select('id, title, event_date, promoter_id')
      .eq('id', eventId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) return null;

    return {
      event_id: data.id,
      event_title: data.title ?? 'Event',
      event_date: data.event_date ?? new Date().toISOString(),
      promoter_id: data.promoter_id ?? null,
    };
  },

  async getComedianName(comedianId: string): Promise<string | null> {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', comedianId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.name ?? null;
  },
};

export type EventApplicationService = typeof eventApplicationService;
