
import { useState, useEffect } from 'react';
import { DesignSystemSettings } from '@/types/designSystem';
import { DEFAULT_DESIGN_SETTINGS } from '@/utils/designSystem/defaultSettings';
import { applyCSSVariables } from '@/utils/designSystem/cssVariables';
import { useDesignSystemSettings } from './useDesignSystemSettings';
import { useDesignSystemPersistence } from './useDesignSystemPersistence';
import { useToast } from '@/hooks/use-toast';

export const useDesignSystem = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { settings, setSettings, updateSetting, resetToDefault: resetSettingsToDefault } = useDesignSystemSettings();
  const { loadSettings, saveSettings: persistSettings } = useDesignSystemPersistence();
  const { toast } = useToast();

  const loadSettingsAsync = async () => {
    setIsLoading(true);
    try {
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load design settings:', error);
      toast({
        title: "Error",
        description: "Failed to load design settings, using defaults",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (presetName?: string) => {
    await persistSettings(settings, presetName);
  };

  const resetToDefault = () => {
    resetSettingsToDefault();
    applyCSSVariables(DEFAULT_DESIGN_SETTINGS);
  };

  useEffect(() => {
    loadSettingsAsync();
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
    loadSettings: loadSettingsAsync
  };
};
