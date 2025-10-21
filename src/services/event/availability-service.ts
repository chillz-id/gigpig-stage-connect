import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface EventAvailabilitySubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  canonical_source: string;
  canonical_session_source_id: string;
  is_available: boolean;
  notes: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityFilters {
  canonical_source?: string;
  canonical_session_source_id?: string;
  email?: string;
}

export interface AvailabilitySubmissionPayload {
  first_name: string;
  last_name: string;
  email: string;
  canonical_source: string;
  canonical_session_source_id: string;
  is_available: boolean;
  notes?: string | null;
}

export interface BulkAvailabilitySubmission {
  first_name: string;
  last_name: string;
  email: string;
  submissions: Array<{
    canonical_source: string;
    canonical_session_source_id: string;
    is_available: boolean;
  }>;
}

export const eventAvailabilityService = {
  async list(filters: AvailabilityFilters = {}): Promise<EventAvailabilitySubmission[]> {
    const { canonical_source, canonical_session_source_id, email } = filters;

    let query = supabaseClient
      .from('comedian_event_availability_submissions')
      .select('*')
      .eq('is_available', true)
      .order('submitted_at', { ascending: false });

    if (canonical_source && canonical_session_source_id) {
      query = query
        .eq('canonical_source', canonical_source)
        .eq('canonical_session_source_id', canonical_session_source_id);
    }

    if (email) {
      query = query.ilike('email', `%${email}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as EventAvailabilitySubmission[] | null) ?? [];
  },

  async listGroupedByEvent(): Promise<Record<string, EventAvailabilitySubmission[]>> {
    const { data, error } = await supabaseClient
      .from('comedian_event_availability_submissions')
      .select('*')
      .eq('is_available', true)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    const submissions = (data as EventAvailabilitySubmission[] | null) ?? [];
    return submissions.reduce<Record<string, EventAvailabilitySubmission[]>>((acc, submission) => {
      const key = `${submission.canonical_source}:${submission.canonical_session_source_id}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(submission);
      return acc;
    }, {});
  },

  async submitSingle(submission: AvailabilitySubmissionPayload) {
    const { data, error } = await supabaseClient
      .from('comedian_event_availability_submissions')
      .upsert(
        [{
          ...submission,
          submitted_at: new Date().toISOString(),
        }],
        {
          onConflict: 'email,canonical_source,canonical_session_source_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as EventAvailabilitySubmission;
  },

  async submitBulk(payload: BulkAvailabilitySubmission) {
    const insertData = payload.submissions.map((submission) => ({
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      canonical_source: submission.canonical_source,
      canonical_session_source_id: submission.canonical_session_source_id,
      is_available: submission.is_available,
      submitted_at: new Date().toISOString(),
    }));

    const { data, error } = await supabaseClient
      .from('comedian_event_availability_submissions')
      .upsert(insertData, {
        onConflict: 'email,canonical_source,canonical_session_source_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) throw error;
    return (data as EventAvailabilitySubmission[] | null) ?? [];
  },
};

export type EventAvailabilityService = typeof eventAvailabilityService;
