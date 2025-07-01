
import { useState } from 'react';
import { DesignSystemSettings } from '@/types/designSystem';
import { DEFAULT_DESIGN_SETTINGS } from '@/utils/designSystem/defaultSettings';

export const useDesignSystemSettings = () => {
  const [settings, setSettings] = useState<DesignSystemSettings>(DEFAULT_DESIGN_SETTINGS);

  const updateSetting = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof DesignSystemSettings],
        [setting]: value
      }
    }));
  };

  const resetToDefault = () => {
    setSettings(DEFAULT_DESIGN_SETTINGS);
  };

  return {
    settings,
    setSettings,
    updateSetting,
    resetToDefault
  };
};
