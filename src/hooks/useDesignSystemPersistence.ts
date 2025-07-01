
import { supabase } from '@/integrations/supabase/client';
import { DesignSystemSettings } from '@/types/designSystem';
import { DEFAULT_DESIGN_SETTINGS } from '@/utils/designSystem/defaultSettings';
import { applyCSSVariables } from '@/utils/designSystem/cssVariables';

export const useDesignSystemPersistence = () => {

  const loadSettings = async (): Promise<DesignSystemSettings> => {
    try {
      console.log('🔍 Loading design settings from database...');
      
      const { data, error } = await supabase
        .from('customization_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      // PGRST116 means no rows returned, which is expected if no active settings exist
      if (error && error.code !== 'PGRST116') {
        console.error('Database error:', error);
        throw error;
      }

      if (data && data.settings_data) {
        console.log('✅ Found active design settings:', data.name);
        return data.settings_data as unknown as DesignSystemSettings;
      } else {
        console.log('⚠️ No active design settings found, using defaults');
        return DEFAULT_DESIGN_SETTINGS;
      }
    } catch (error) {
      console.error('❌ Error loading design settings:', error);
      return DEFAULT_DESIGN_SETTINGS;
    }
  };

  const saveSettings = async (settings: DesignSystemSettings, presetName?: string) => {
    try {
      if (presetName) {
        // Save as named preset
        const { error } = await supabase
          .from('customization_settings')
          .insert({
            name: presetName,
            settings_data: settings as unknown as any,
            is_active: false,
          });

        if (error) throw error;
      } else {
        // Apply as active settings
        await supabase
          .from('customization_settings')
          .update({ is_active: false })
          .neq('id', '');

        const { error } = await supabase
          .from('customization_settings')
          .insert({
            name: 'Active Settings',
            settings_data: settings as unknown as any,
            is_active: true,
          });

        if (error) throw error;
        
        // Apply CSS variables
        applyCSSVariables(settings);
      }
    } catch (error) {
      console.error('Error saving design settings:', error);
      throw error;
    }
  };

  return {
    loadSettings,
    saveSettings
  };
};
