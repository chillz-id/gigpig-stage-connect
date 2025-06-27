
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomizationData } from '@/types/customization';

const DEFAULT_SETTINGS: CustomizationData = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    tertiary: '#8b5cf6',
    background: '#ffffff',
    cardBackground: '#f8fafc',
    headerBackground: '#1e293b',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textLink: '#3b82f6',
    border: '#e2e8f0',
    accent: '#10b981'
  },
  typography: {
    headingSize: 24,
    bodySize: 16,
    smallSize: 14,
    headingWeight: 600,
    bodyWeight: 400
  },
  components: {
    buttonRadius: 6,
    cardRadius: 8,
    inputRadius: 6,
    profilePictureShape: 'circle',
    profilePictureSize: 80
  },
  layout: {
    containerMaxWidth: 1200,
    pageMargin: 16,
    componentSpacing: 16
  },
  icons: {
    size: 20,
    color: '#64748b'
  }
};

export const useCustomizationData = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CustomizationData | null>(null);
  const [savedThemes, setSavedThemes] = useState<any[]>([]);
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

      if (data) {
        setSettings(data.settings_data as unknown as CustomizationData);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load customization settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('customization_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedThemes(data || []);
    } catch (error) {
      console.error('Error loading saved themes:', error);
    }
  };

  const updateSettings = (section: keyof CustomizationData, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }));
  };

  const resetToDefault = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  useEffect(() => {
    loadSettings();
    loadSavedThemes();
  }, []);

  return {
    settings,
    savedThemes,
    isLoading,
    updateSettings,
    resetToDefault,
    loadSettings,
    loadSavedThemes
  };
};
