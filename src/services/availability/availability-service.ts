import { supabase } from '@/integrations/supabase/client';

export interface AvailabilityRecord {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
  updated_at: string;
}

class AvailabilityService {
  /**
   * Fetch user's current availability as Set of session source IDs
   * Now queries the unified applications table instead of comedian_event_availability
   */
  async getUserAvailability(userId: string): Promise<Set<string>> {
    console.log('[availability-service] getUserAvailability called for userId:', userId);
    const startTime = performance.now();

    const { data, error } = await supabase
      .from('applications')
      .select('session_source_id')
      .eq('comedian_id', userId)
      .not('session_source_id', 'is', null);

    const duration = performance.now() - startTime;

    if (error) {
      console.error('[availability-service] getUserAvailability FAILED:', {
        userId,
        error,
        duration: `${duration.toFixed(0)}ms`
      });
      throw error;
    }

    console.log('[availability-service] getUserAvailability SUCCESS:', {
      userId,
      count: data?.length || 0,
      duration: `${duration.toFixed(0)}ms`
    });

    return new Set((data || []).map(record => record.session_source_id).filter((id): id is string => id !== null));
  }

  /**
   * Batch update availability (delete removed, insert added)
   * Uses direct fetch to RPC endpoint to bypass Supabase client overhead
   */
  async batchUpdateAvailability(
    userId: string,
    toRemove: Set<string>,
    toAdd: Set<string>
  ): Promise<void> {
    console.log('[availability-service] batchUpdateAvailability called:', {
      userId,
      toRemoveCount: toRemove.size,
      toAddCount: toAdd.size
    });
    const startTime = performance.now();

    // Use direct fetch to bypass supabase.rpc() performance issues
    // See: https://github.com/orgs/supabase/discussions/8733
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/batch_update_availability`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${session?.access_token || supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_to_remove: Array.from(toRemove),
        p_to_add: Array.from(toAdd)
      })
    });

    const totalDuration = performance.now() - startTime;

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      console.error('[availability-service] BATCH UPDATE FAILED:', {
        userId,
        toRemoveCount: toRemove.size,
        toAddCount: toAdd.size,
        error,
        status: response.status,
        duration: `${totalDuration.toFixed(0)}ms`
      });
      throw new Error(error.message || 'Failed to update availability');
    }

    const data = await response.json();

    console.log('[availability-service] BATCH UPDATE SUCCESS:', {
      deleted: data?.deleted,
      inserted: data?.inserted,
      databaseDuration: `${data?.duration_ms?.toFixed(0) || 'N/A'}ms`,
      clientDuration: `${totalDuration.toFixed(0)}ms`,
      networkOverhead: `${(totalDuration - (data?.duration_ms || 0)).toFixed(0)}ms`
    });
  }

  /**
   * Toggle single event availability
   * Now uses the unified applications table with session_source_id
   */
  async toggleEvent(userId: string, sessionSourceId: string, isSelected: boolean): Promise<void> {
    if (isSelected) {
      // Add as pending application
      const { error } = await supabase
        .from('applications')
        .insert({
          comedian_id: userId,
          session_source_id: sessionSourceId,
          status: 'pending',
          applied_at: new Date().toISOString(),
          is_shortlisted: false
        });

      if (error && error.code !== '23505') throw error; // Ignore duplicate errors
    } else {
      // Remove application
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('comedian_id', userId)
        .eq('session_source_id', sessionSourceId);

      if (error) throw error;
    }
  }
}

export const availabilityService = new AvailabilityService();
