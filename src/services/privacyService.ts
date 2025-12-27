import { supabase } from '@/integrations/supabase/client';

/**
 * Privacy Service
 * Handles user privacy settings including profile visibility
 */

export const privacyService = {
  /**
   * Update profile visibility setting
   * @param userId - User ID to update
   * @param visible - Whether profile should be visible in browse/search
   */
  async updateProfileVisibility(userId: string, visible: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ profile_visible: visible })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile visibility:', error);
      throw new Error('Failed to update profile visibility');
    }
  },

  /**
   * Get profile visibility setting
   * @param userId - User ID to query
   * @returns Current visibility setting (defaults to true if not set)
   */
  async getProfileVisibility(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('profile_visible')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile visibility:', error);
      // Default to visible if error or not found
      return true;
    }

    // Return the value, defaulting to true if null/undefined
    return data?.profile_visible ?? true;
  },
};
