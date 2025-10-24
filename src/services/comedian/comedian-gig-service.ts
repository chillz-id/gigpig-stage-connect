import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

const supabaseClient = supabase as any;

export type GigStatus = 'confirmed' | 'pending' | 'cancelled';
export type CalendarSyncStatus = 'pending' | 'synced' | 'failed';

export interface CalendarEventRow {
  id: string;
  comedian_id: string;
  event_id?: string | null;
  title: string;
  event_date: string;
  venue: string;
  status: GigStatus;
  calendar_sync_status: CalendarSyncStatus;
  created_at: string;
  updated_at: string;
  events?: {
    id: string;
    title: string;
    venue: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    promoter_id: string;
    profiles?: {
      name: string;
      email?: string | null;
    } | null;
  } | null;
}

export interface EventSpotRow {
  id: string;
  comedian_id: string;
  event_id: string;
  spot_name: string;
  is_paid: boolean;
  payment_amount?: number | null;
  duration_minutes?: number | null;
  created_at: string;
  updated_at: string;
  events?: {
    id: string;
    title: string;
    venue: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    event_date?: string | null;
    promoter_id: string;
    profiles?: {
      name: string;
      email?: string | null;
    } | null;
  } | null;
}

export interface ComedianGig {
  id: string;
  comedian_id: string;
  event_id?: string | null;
  title: string;
  event_date: string;
  venue: string;
  status: GigStatus;
  calendar_sync_status: CalendarSyncStatus;
  created_at: string;
  updated_at: string;
  event?: {
    id: string;
    title: string;
    venue: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    promoter_id: string;
    promoter?: {
      name: string;
      email?: string | null;
    } | null;
  };
  event_spot?: {
    id: string;
    spot_name: string;
    is_paid: boolean;
    payment_amount?: number | null;
    duration_minutes?: number | null;
  };
}

const mapCalendarEventToGig = (row: CalendarEventRow): ComedianGig => ({
  id: row.id,
  comedian_id: row.comedian_id,
  event_id: row.event_id ?? null,
  title: row.title,
  event_date: row.event_date,
  venue: row.venue,
  status: row.status,
  calendar_sync_status: row.calendar_sync_status,
  created_at: row.created_at,
  updated_at: row.updated_at,
  event: row.events
    ? {
        id: row.events.id,
        title: row.events.title,
        venue: row.events.venue,
        address: row.events.address ?? undefined,
        city: row.events.city ?? undefined,
        state: row.events.state ?? undefined,
        start_time: row.events.start_time ?? undefined,
        end_time: row.events.end_time ?? undefined,
        promoter_id: row.events.promoter_id,
        promoter: row.events.profiles
          ? {
              name: row.events.profiles.name,
              email: row.events.profiles.email ?? undefined,
            }
          : undefined,
      }
    : undefined,
});

const mapSpotToGig = (row: EventSpotRow): ComedianGig => ({
  id: `spot-${row.id}`,
  comedian_id: row.comedian_id,
  event_id: row.event_id,
  title: row.events?.title ?? 'Upcoming Performance',
  event_date: row.events?.event_date ?? new Date().toISOString(),
  venue: row.events?.venue ?? 'TBA',
  status: 'confirmed',
  calendar_sync_status: 'pending',
  created_at: row.created_at,
  updated_at: row.updated_at,
  event: row.events
    ? {
        id: row.events.id,
        title: row.events.title,
        venue: row.events.venue,
        address: row.events.address ?? undefined,
        city: row.events.city ?? undefined,
        state: row.events.state ?? undefined,
        start_time: row.events.start_time ?? undefined,
        end_time: row.events.end_time ?? undefined,
        promoter_id: row.events.promoter_id,
        promoter: row.events.profiles
          ? {
              name: row.events.profiles.name,
              email: row.events.profiles.email ?? undefined,
            }
          : undefined,
      }
    : undefined,
  event_spot: {
    id: row.id,
    spot_name: row.spot_name,
    is_paid: row.is_paid,
    payment_amount: row.payment_amount ?? undefined,
    duration_minutes: row.duration_minutes ?? undefined,
  },
});

const dedupeAndSortGigs = (gigs: ComedianGig[]): ComedianGig[] => {
  const byKey = new Map<string, ComedianGig>();

  gigs.forEach((gig) => {
    const key = gig.event_id ?? gig.id;
    if (!byKey.has(key)) {
      byKey.set(key, gig);
    }
  });

  return Array.from(byKey.values()).sort((a, b) => {
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
  });
};

export const comedianGigService = {
  async listForComedian(comedianId: string): Promise<ComedianGig[]> {
    const [calendarEvents, eventSpots] = await Promise.all([
      supabaseClient
        .from('calendar_events')
        .select(`
          *,
          events:event_id (
            id,
            title,
            venue,
            address,
            city,
            state,
            start_time,
            end_time,
            promoter_id,
            profiles:promoter_id (
              name,
              email
            )
          )
        `)
        .eq('comedian_id', comedianId)
        .order('event_date', { ascending: true }),
      supabaseClient
        .from('event_spots')
        .select(`
          *,
          events:event_id (
            id,
            title,
            venue,
            address,
            city,
            state,
            start_time,
            end_time,
            event_date,
            promoter_id,
            profiles:promoter_id (
              name,
              email
            )
          )
        `)
        .eq('comedian_id', comedianId)
        .eq('is_filled', true),
    ]);

    const { data: eventData, error: eventError } = calendarEvents as unknown as {
      data: CalendarEventRow[] | null;
      error: PostgrestError | null;
    };

    const { data: spotData, error: spotError } = eventSpots as unknown as {
      data: EventSpotRow[] | null;
      error: PostgrestError | null;
    };

    if (eventError) throw eventError;
    if (spotError) {
      console.error('Error fetching spots:', spotError);
    }

    const calendarGigs = (eventData || []).map(mapCalendarEventToGig);
    const spotGigs = (spotData || []).map(mapSpotToGig);

    return dedupeAndSortGigs([...calendarGigs, ...spotGigs]);
  },

  async createGig({
    comedianId,
    title,
    eventDate,
    venue,
    status = 'confirmed',
  }: {
    comedianId: string;
    title: string;
    eventDate: string;
    venue: string;
    status?: GigStatus;
  }) {
    const { data, error } = await supabaseClient
      .from('calendar_events')
      .insert({
        comedian_id: comedianId,
        title,
        event_date: eventDate,
        venue,
        status,
        calendar_sync_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;

    return data as CalendarEventRow;
  },

  async updateGigStatus({
    gigId,
    comedianId,
    status,
  }: {
    gigId: string;
    comedianId: string;
    status: GigStatus;
  }) {
    const { data, error } = await supabaseClient
      .from('calendar_events')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gigId)
      .eq('comedian_id', comedianId)
      .select('*')
      .single();

    if (error) throw error;

    return data as CalendarEventRow;
  },

  async listActiveCalendarIntegrations(userId: string, provider?: string) {
    let query = supabaseClient
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as Array<{ id: string; provider: string }>;
  },

  async updateCalendarSyncStatus(gigId: string, status: CalendarSyncStatus) {
    const { error } = await supabaseClient
      .from('calendar_events')
      .update({ calendar_sync_status: status })
      .eq('id', gigId);

    if (error) throw error;
  },
};

export type ComedianGigService = typeof comedianGigService;
