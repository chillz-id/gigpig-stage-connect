import { supabase } from '@/integrations/supabase/client';
import type { Application } from '@/hooks/useApplications';

const supabaseClient = supabase as any;

const mapApplication = (row: any): Application => ({
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
  event: row.events,
  comedian: row.profiles,
});

export const applicationService = {
  async listForPromoter(userId: string): Promise<Application[]> {
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('id')
      .or(`promoter_id.eq.${userId},co_promoter_ids.cs.{${userId}}`);

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) return [];

    const eventIds = (events as Array<{ id: string }>).map((event) => event.id);

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
          event_date,
          city,
          state
        ),
        profiles!comedian_id (
          id,
          name,
          avatar_url,
          bio,
          years_experience,
          profile_slug
        )
      `)
      .in('event_id', eventIds)
      .order('applied_at', { ascending: false });

    if (error) throw error;

    return ((data ?? []) as any[]).map(mapApplication);
  },

  async updateStatus(applicationId: string, status: string): Promise<void> {
    const { error } = await supabaseClient
      .from('applications')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (error) throw error;
  },

  async bulkUpdateStatus(applicationIds: string[], status: string): Promise<void> {
    if (!applicationIds.length) return;

    const { error } = await supabaseClient
      .from('applications')
      .update({ status, responded_at: new Date().toISOString() })
      .in('id', applicationIds);

    if (error) throw error;
  },
};

export type ApplicationService = typeof applicationService;
