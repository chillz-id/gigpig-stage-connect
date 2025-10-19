import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface UpcomingGig {
  id: string;
  event_id: string;
  title: string;
  venue: string;
  event_date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  payment_amount?: number | null;
  payment_status?: string | null;
}

export const gigService = {
  async listUpcomingForComedian(comedianId: string): Promise<UpcomingGig[]> {
    const { data, error} = await supabaseClient
      .from('applications')
      .select(`
        id,
        event_id,
        status,
        events!inner(
          id,
          title,
          venue,
          event_date,
          pay_per_comedian,
          currency
        )
      `)
      .eq('comedian_id', comedianId)
      .eq('status', 'accepted');

    if (error) throw error;

    const rows = (data as Array<{
      id: string;
      event_id: string;
      status: UpcomingGig['status'];
      events?: {
        title?: string | null;
        venue?: string | null;
        event_date?: string | null;
        pay_per_comedian?: number | null;
      } | null;
    }> | null) ?? [];

    // Filter and sort client-side since PostgREST doesn't support filtering/ordering by joined table columns
    const now = new Date().toISOString();
    return rows
      .filter(app => app.events?.event_date && app.events.event_date >= now)
      .sort((a, b) => {
        const dateA = a.events?.event_date ?? '';
        const dateB = b.events?.event_date ?? '';
        return dateA.localeCompare(dateB);
      })
      .map((application) => ({
        id: application.id,
        event_id: application.event_id,
        title: application.events?.title ?? 'Untitled Event',
        venue: application.events?.venue ?? 'Venue TBA',
        event_date: application.events?.event_date ?? '',
        status: application.status,
        payment_amount: application.events?.pay_per_comedian ?? null,
        payment_status: 'pending',
      } satisfies UpcomingGig));
  },
};

export type GigService = typeof gigService;
