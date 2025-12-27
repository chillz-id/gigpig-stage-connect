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

const mapComedianApplication = (row: any): ComedianApplicationRecord => {
  const base: EventApplication = {
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
  };

  if (!row.events) {
    return base;
  }

  return {
    ...base,
    event: {
      id: row.events.id,
      title: row.events.title ?? '',
      venue: row.events.venue ?? '',
      address: row.events.address ?? null,
      event_date: row.events.event_date ?? '',
      start_time: row.events.start_time ?? null,
      city: row.events.city ?? '',
      state: row.events.state ?? '',
      status: row.events.status ?? null,
      banner_url: row.events.banner_url ?? null,
      promoter: row.events.organization
        ? {
            id: row.events.organization.id,
            name: row.events.organization.organization_name ?? null,
            avatar_url: row.events.organization.logo_url ?? null,
          }
        : null,
    },
  };
};

export const eventApplicationService = {
  /**
   * List applications by internal event UUID
   */
  async listByEvent(eventId: string): Promise<EventApplication[]> {
    const { data, error } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('event_id', eventId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return (data as EventApplication[] | null) ?? [];
  },

  /**
   * List applications by session source ID (Humanitix session ID)
   * Used for calendar-based applications from the Find Gigs page
   */
  async listBySessionSourceId(sessionSourceId: string): Promise<EventApplication[]> {
    const { data, error } = await supabaseClient
      .from('applications')
      .select(`
        *,
        comedian:profiles!applications_comedian_id_fkey (
          id,
          name,
          avatar_url,
          bio,
          years_experience
        )
      `)
      .eq('session_source_id', sessionSourceId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return (data as EventApplication[] | null) ?? [];
  },

  async listForComedian(comedianId: string): Promise<ComedianApplicationRecord[]> {
    // Fetch all applications (both event-based and session-based)
    const { data, error } = await supabaseClient
      .from('applications')
      .select(
        `
        *,
        events (
          id,
          title,
          venue,
          address,
          event_date,
          start_time,
          city,
          state,
          status,
          banner_url,
          organization_id
        )
      `
      )
      .eq('comedian_id', comedianId)
      .order('applied_at', { ascending: false });

    if (error) throw error;

    const applications = (data ?? []) as any[];

    // Get session_source_ids for applications without event_id
    const sessionSourceIds = applications
      .filter((app) => !app.event_id && app.session_source_id)
      .map((app) => app.session_source_id);

    // Fetch session data from sessions_htx for session-based applications
    let sessionMap: Record<string, any> = {};
    if (sessionSourceIds.length > 0) {
      const { data: sessionsData, error: sessionsError } = await supabaseClient
        .from('sessions_htx')
        .select('source_id, name, venue_name, start_date_local')
        .in('source_id', sessionSourceIds);

      if (sessionsError) {
        console.error('Error fetching session data:', sessionsError);
      }

      if (sessionsData) {
        sessionMap = sessionsData.reduce((acc: Record<string, any>, session: any) => {
          acc[session.source_id] = session;
          return acc;
        }, {});
      }
    }

    // Map applications, enriching session-based ones with session data
    return applications.map((row) => {
      // If has event_id, use the standard mapper
      if (row.event_id && row.events) {
        return mapComedianApplication(row);
      }

      // For session-based applications, build event data from sessions_htx
      const session = sessionMap[row.session_source_id];
      const base: EventApplication = {
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
      };

      if (!session) {
        return base;
      }

      // Parse start_date_local - format is "YYYY-MM-DD HH:MM:SS" (space-separated)
      let eventDate = '';
      let startTime: string | null = null;
      if (session.start_date_local) {
        // Handle both "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS" formats
        const dateStr = session.start_date_local.replace('T', ' ');
        const parts = dateStr.split(' ');
        eventDate = parts[0] || '';
        startTime = parts[1]?.substring(0, 5) || null;
      }

      return {
        ...base,
        event: {
          id: row.session_source_id, // Use session_source_id as identifier
          title: session.name ?? '',
          venue: session.venue_name ?? '',
          address: null,
          event_date: eventDate,
          start_time: startTime,
          city: '',
          state: '',
          status: null,
          banner_url: null,
          promoter: null,
        },
      };
    });
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
          address,
          event_date,
          start_time,
          city,
          state,
          description,
          requirements
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

  // Application Approval Workflow (No reject - only shortlist and accept)

  async approveApplication(applicationId: string): Promise<EventApplication> {
    const { data, error } = await supabaseClient
      .from('applications')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select('*')
      .single();

    if (error) throw error;
    return data as EventApplication;
  },

  async addToShortlist(applicationId: string): Promise<void> {
    const { error} = await supabaseClient
      .from('applications')
      .update({
        is_shortlisted: true,
        shortlisted_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) throw error;
  },

  async removeFromShortlist(applicationId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('applications')
      .update({
        is_shortlisted: false,
        shortlisted_at: null,
      })
      .eq('id', applicationId);

    if (error) throw error;
  },

  // Bulk Operations

  async bulkApprove(applicationIds: string[]): Promise<void> {
    const { error } = await supabaseClient
      .from('applications')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .in('id', applicationIds);

    if (error) throw error;
  },

  async bulkShortlist(applicationIds: string[]): Promise<void> {
    const { error } = await supabaseClient
      .from('applications')
      .update({
        is_shortlisted: true,
        shortlisted_at: new Date().toISOString(),
      })
      .in('id', applicationIds);

    if (error) throw error;
  },

  // Query Operations

  async getShortlistedApplications(eventId: string): Promise<EventApplication[]> {
    const { data, error } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_shortlisted', true)
      .order('shortlisted_at', { ascending: false });

    if (error) throw error;
    return (data as EventApplication[] | null) ?? [];
  },

  // Cleanup (called after event ends)

  async deleteApplicationsForEvent(eventId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('applications')
      .delete()
      .eq('event_id', eventId);

    if (error) throw error;
  },
};

export type EventApplicationService = typeof eventApplicationService;
