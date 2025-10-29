import { supabase } from '@/integrations/supabase/client';

export interface ManualGig {
  id: string;
  user_id: string;
  title: string;
  venue_name: string | null;
  venue_address: string | null;
  start_datetime: string;
  end_datetime: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

class ManualGigsService {
  /**
   * Fetch all manual gigs for a user, ordered by start date
   */
  async getUserManualGigs(userId: string): Promise<ManualGig[]> {
    const { data, error } = await supabase
      .from('manual_gigs')
      .select('*')
      .eq('user_id', userId)
      .order('start_datetime', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new manual gig
   */
  async createManualGig(gig: Omit<ManualGig, 'id' | 'created_at' | 'updated_at'>): Promise<ManualGig> {
    const { data, error } = await supabase
      .from('manual_gigs')
      .insert(gig)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing manual gig
   */
  async updateManualGig(gigId: string, updates: Partial<ManualGig>): Promise<ManualGig> {
    const { data, error } = await supabase
      .from('manual_gigs')
      .update(updates)
      .eq('id', gigId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a manual gig
   */
  async deleteManualGig(gigId: string): Promise<void> {
    const { error } = await supabase
      .from('manual_gigs')
      .delete()
      .eq('id', gigId);

    if (error) throw error;
  }
}

export const manualGigsService = new ManualGigsService();
