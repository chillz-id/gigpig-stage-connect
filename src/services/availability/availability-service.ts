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
   * Fetch user's current availability as Set of event IDs
   */
  async getUserAvailability(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('comedian_availability')
      .select('event_id')
      .eq('user_id', userId);

    if (error) throw error;

    return new Set((data || []).map(record => record.event_id));
  }

  /**
   * Batch update availability (delete removed, insert added)
   */
  async batchUpdateAvailability(
    userId: string,
    toRemove: Set<string>,
    toAdd: Set<string>
  ): Promise<void> {
    // Delete removed events
    if (toRemove.size > 0) {
      const { error: deleteError } = await supabase
        .from('comedian_availability')
        .delete()
        .eq('user_id', userId)
        .in('event_id', Array.from(toRemove));

      if (deleteError) throw deleteError;
    }

    // Insert added events
    if (toAdd.size > 0) {
      const records = Array.from(toAdd).map(eventId => ({
        user_id: userId,
        event_id: eventId
      }));

      const { error: insertError } = await supabase
        .from('comedian_availability')
        .insert(records);

      if (insertError) throw insertError;
    }
  }

  /**
   * Toggle single event availability
   */
  async toggleEvent(userId: string, eventId: string, isSelected: boolean): Promise<void> {
    if (isSelected) {
      // Add
      const { error } = await supabase
        .from('comedian_availability')
        .insert({ user_id: userId, event_id: eventId });

      if (error && error.code !== '23505') throw error; // Ignore duplicate errors
    } else {
      // Remove
      const { error } = await supabase
        .from('comedian_availability')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId);

      if (error) throw error;
    }
  }
}

export const availabilityService = new AvailabilityService();
