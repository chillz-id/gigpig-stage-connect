import { supabase } from '@/integrations/supabase/client';
import { getDefaultHiddenItemsForRole, type UserRole } from '@/config/sidebarMenuItems';

export interface SidebarPreferences {
  hidden_items?: string[];
  item_order?: string[];
}

export interface CalendarPreferences {
  hide_sundays_shows?: boolean;
}

export interface UIPreferences {
  sidebar?: SidebarPreferences;
  calendar?: CalendarPreferences;
}

export const uiPreferencesService = {
  /**
   * Get user UI preferences with role-based defaults
   */
  async getPreferences(userId: string, userRole?: UserRole): Promise<UIPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('ui_preferences')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching UI preferences:', error);

      // If no preferences exist and we have a role, return defaults
      if (userRole) {
        return {
          sidebar: {
            hidden_items: getDefaultHiddenItemsForRole(userRole),
            item_order: [],
          },
        };
      }

      return {};
    }

    const prefs = (data?.ui_preferences as UIPreferences) || {};

    // If preferences exist but sidebar is empty and we have a role, apply defaults
    if (userRole && (!prefs.sidebar || (prefs.sidebar.hidden_items === undefined && prefs.sidebar.item_order === undefined))) {
      return {
        ...prefs,
        sidebar: {
          hidden_items: getDefaultHiddenItemsForRole(userRole),
          item_order: [],
        },
      };
    }

    return prefs;
  },

  /**
   * Initialize preferences with role-based defaults
   */
  async initializePreferences(userId: string, userRole: UserRole): Promise<void> {
    const defaultPrefs: UIPreferences = {
      sidebar: {
        hidden_items: getDefaultHiddenItemsForRole(userRole),
        item_order: [],
      },
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ui_preferences: defaultPrefs,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error initializing UI preferences:', error);
      throw error;
    }
  },

  /**
   * Update sidebar preferences
   */
  async updateSidebarPreferences(
    userId: string,
    sidebarPrefs: SidebarPreferences
  ): Promise<void> {
    // Get current preferences
    const current = await this.getPreferences(userId);

    const updated: UIPreferences = {
      ...current,
      sidebar: {
        ...current.sidebar,
        ...sidebarPrefs,
      },
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ui_preferences: updated,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error updating sidebar preferences:', error);
      throw error;
    }
  },

  /**
   * Update calendar preferences
   */
  async updateCalendarPreferences(
    userId: string,
    calendarPrefs: CalendarPreferences
  ): Promise<void> {
    // Get current preferences
    const current = await this.getPreferences(userId);

    const updated: UIPreferences = {
      ...current,
      calendar: {
        ...current.calendar,
        ...calendarPrefs,
      },
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ui_preferences: updated,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error updating calendar preferences:', error);
      throw error;
    }
  },

  /**
   * Reset UI preferences to defaults
   */
  async resetPreferences(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ui_preferences: {},
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error resetting UI preferences:', error);
      throw error;
    }
  },
};
