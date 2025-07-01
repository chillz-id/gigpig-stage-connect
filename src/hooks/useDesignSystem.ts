
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DesignSystemSettings } from '@/types/designSystem';

const DEFAULT_SETTINGS: DesignSystemSettings = {
  colors: {
    primary: '#7C3AED',
    secondary: '#64748B',
    accent: '#F59E0B',
    background: '#FFFFFF',
    foreground: '#0F172A',
    card: '#FFFFFF',
    'card-foreground': '#0F172A',
    muted: '#F8FAFC',
    'muted-foreground': '#64748B',
    border: '#E2E8F0',
    input: '#FFFFFF',
    'primary-foreground': '#FFFFFF',
    'secondary-foreground': '#FFFFFF',
    destructive: '#EF4444',
    'destructive-foreground': '#FFFFFF',
    success: '#10B981',
    'success-foreground': '#FFFFFF',
    warning: '#F59E0B',
    'warning-foreground': '#FFFFFF',
  },
  buttons: {
    borderRadius: 8,
    borderWidth: 1,
    paddingX: 16,
    paddingY: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    h1Size: 32,
    h2Size: 24,
    h3Size: 20,
    bodySize: 16,
    smallSize: 14,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  layout: {
    containerMaxWidth: 1200,
    sectionPadding: 24,
    cardSpacing: 16,
    gridGap: 24,
  },
  effects: {
    shadowIntensity: 0.1,
    blurIntensity: 12,
    animationSpeed: 'normal',
    hoverScale: 1.02,
  },
};

export const useDesignSystem = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<DesignSystemSettings>(DEFAULT_SETTINGS);
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
        setSettings(DEFAULT_SETTINGS);
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
    setSettings(DEFAULT_SETTINGS);
    applyCSSVariables(DEFAULT_SETTINGS);
  };

  const applyCSSVariables = (settings: DesignSystemSettings) => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(settings.colors).forEach(([key, value]) => {
      const hsl = hexToHsl(value);
      root.style.setProperty(`--${key}`, hsl);
    });

    // Apply other variables
    root.style.setProperty('--button-border-radius', `${settings.buttons.borderRadius}px`);
    root.style.setProperty('--button-font-size', `${settings.buttons.fontSize}px`);
    root.style.setProperty('--button-font-weight', settings.buttons.fontWeight.toString());
  };

  const hexToHsl = (hex: string): string => {
    // Convert hex to HSL for CSS custom properties
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
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
