
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CustomizationData } from '@/types/customization';

export const useThemeOperations = (
  settings: CustomizationData | null,
  loadSettings: () => void,
  loadSavedThemes: () => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const saveTheme = async () => {
    if (!settings || !themeName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a theme name",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('customization_settings')
        .insert({
          name: themeName,
          description: themeDescription,
          settings_data: settings as any,
          is_active: false,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Theme saved successfully"
      });
      
      setThemeName('');
      setThemeDescription('');
      loadSavedThemes();
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Error",
        description: "Failed to save theme",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadTheme = async (themeId: string) => {
    try {
      const { data, error } = await supabase
        .from('customization_settings')
        .select('*')
        .eq('id', themeId)
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Theme loaded successfully"
      });
      
      return data.settings_data as unknown as CustomizationData;
    } catch (error) {
      console.error('Error loading theme:', error);
      toast({
        title: "Error",
        description: "Failed to load theme",
        variant: "destructive"
      });
    }
  };

  const applyTheme = async (themeId: string) => {
    try {
      await supabase
        .from('customization_settings')
        .update({ is_active: false })
        .neq('id', '');

      const { error } = await supabase
        .from('customization_settings')
        .update({ is_active: true })
        .eq('id', themeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Theme applied successfully"
      });
      
      loadSettings();
      loadSavedThemes();
    } catch (error) {
      console.error('Error applying theme:', error);
      toast({
        title: "Error",
        description: "Failed to apply theme",
        variant: "destructive"
      });
    }
  };

  return {
    themeName,
    setThemeName,
    themeDescription,
    setThemeDescription,
    isSaving,
    saveTheme,
    loadTheme,
    applyTheme
  };
};
