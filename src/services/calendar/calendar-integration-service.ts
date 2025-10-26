import { supabase } from '@/integrations/supabase/client';

export interface CalendarIntegration {
  id?: string;
  user_id: string;
  provider: 'google' | 'apple' | 'outlook';
  access_token?: string;
  refresh_token?: string;
  calendar_id?: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

class CalendarIntegrationService {
  async listByUser(userId: string): Promise<CalendarIntegration[]> {
    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching calendar integrations:', error);
      throw error;
    }

    return data || [];
  }

  async upsertIntegration(integration: CalendarIntegration): Promise<CalendarIntegration> {
    const { data, error } = await supabase
      .from('calendar_integrations')
      .upsert(
        {
          user_id: integration.user_id,
          provider: integration.provider,
          access_token: integration.access_token,
          refresh_token: integration.refresh_token,
          calendar_id: integration.calendar_id,
          is_active: integration.is_active,
          settings: integration.settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting calendar integration:', error);
      throw error;
    }

    return data;
  }

  async updateById(id: string, updates: Partial<CalendarIntegration>): Promise<CalendarIntegration> {
    const { data, error } = await supabase
      .from('calendar_integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar integration:', error);
      throw error;
    }

    return data;
  }

  async deleteById(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_integrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar integration:', error);
      throw error;
    }
  }

  async getByUserAndProvider(
    userId: string,
    provider: 'google' | 'apple' | 'outlook'
  ): Promise<CalendarIntegration | null> {
    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching calendar integration:', error);
      throw error;
    }

    return data;
  }
}

export const calendarIntegrationService = new CalendarIntegrationService();
