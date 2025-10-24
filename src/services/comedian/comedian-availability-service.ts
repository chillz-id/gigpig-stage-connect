import { supabase } from '@/integrations/supabase/client';

export type RecurringType = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface ComedianAvailabilityRow {
  id: string;
  comedian_id: string;
  date: string;
  is_available: boolean;
  time_start?: string;
  time_end?: string;
  notes?: string;
  recurring_type: RecurringType;
  recurring_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ComedianBlockedDateRow {
  id: string;
  comedian_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  recurring_type: RecurringType;
  created_at: string;
  updated_at: string;
}

export const comedianAvailabilityService = {
  /**
   * List availability entries for a comedian
   */
  async listAvailability(comedianId: string): Promise<ComedianAvailabilityRow[]> {
    const { data, error } = await supabase
      .from('comedian_availability')
      .select('*')
      .eq('comedian_id', comedianId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Failed to fetch comedian availability:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * List blocked dates for a comedian
   */
  async listBlockedDates(comedianId: string): Promise<ComedianBlockedDateRow[]> {
    const { data, error } = await supabase
      .from('comedian_blocked_dates')
      .select('*')
      .eq('comedian_id', comedianId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch comedian blocked dates:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Upsert availability (create or update)
   */
  async upsertAvailability({
    comedianId,
    availability,
  }: {
    comedianId: string;
    availability: Omit<ComedianAvailabilityRow, 'id' | 'comedian_id' | 'created_at' | 'updated_at'>;
  }): Promise<ComedianAvailabilityRow> {
    const { data, error } = await supabase
      .from('comedian_availability')
      .upsert({
        comedian_id: comedianId,
        date: availability.date,
        is_available: availability.is_available,
        time_start: availability.time_start,
        time_end: availability.time_end,
        notes: availability.notes,
        recurring_type: availability.recurring_type,
        recurring_end_date: availability.recurring_end_date,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to upsert comedian availability:', error);
      throw error;
    }

    return data;
  },

  /**
   * Add a blocked date period
   */
  async addBlockedDate(
    comedianId: string,
    blockedDate: Omit<ComedianBlockedDateRow, 'id' | 'comedian_id' | 'created_at' | 'updated_at'>
  ): Promise<ComedianBlockedDateRow> {
    const { data, error } = await supabase
      .from('comedian_blocked_dates')
      .insert({
        comedian_id: comedianId,
        start_date: blockedDate.start_date,
        end_date: blockedDate.end_date,
        reason: blockedDate.reason,
        recurring_type: blockedDate.recurring_type,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add blocked date:', error);
      throw error;
    }

    return data;
  },

  /**
   * Remove a blocked date period
   */
  async removeBlockedDate(comedianId: string, blockedDateId: string): Promise<void> {
    const { error } = await supabase
      .from('comedian_blocked_dates')
      .delete()
      .eq('id', blockedDateId)
      .eq('comedian_id', comedianId);

    if (error) {
      console.error('Failed to remove blocked date:', error);
      throw error;
    }
  },

  /**
   * Delete a specific availability entry
   */
  async deleteAvailability(comedianId: string, availabilityId: string): Promise<void> {
    const { error } = await supabase
      .from('comedian_availability')
      .delete()
      .eq('id', availabilityId)
      .eq('comedian_id', comedianId);

    if (error) {
      console.error('Failed to delete availability:', error);
      throw error;
    }
  },
};
