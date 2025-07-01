
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DesignSystemSettings } from '@/types/designSystem';
import { DEFAULT_DESIGN_SETTINGS } from '@/utils/designSystem/defaultSettings';
import { applyCSSVariables } from '@/utils/designSystem/cssVariables';

export const useDesignSystem = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<DesignSystemSettings>(DEFAULT_DESIGN_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('customization_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.settings_data) {
        setSettings(data.settings_data as unknown as DesignSystemSettings);
      } else {
        setSettings(DEFAULT_DESIGN_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading design settings:', error);
      toast({
        title: "Error",
        description: "Failed to load design settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof DesignSystemSettings],
        [setting]: value
      }
    }));
  };

  const saveSettings = async (presetName?: string) => {
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

  const resetToDefault = () => {
    setSettings(DEFAULT_DESIGN_SETTINGS);
    applyCSSVariables(DEFAULT_DESIGN_SETTINGS);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    applyCSSVariables(settings);
  }, [settings]);

  return {
    settings,
    updateSetting,
    saveSettings,
    resetToDefault,
    isLoading,
    loadSettings
  };
};
