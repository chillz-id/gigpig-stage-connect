import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import type { CustomizationData } from '@/types/customization';
import type { DesignSystemSettings } from '@/types/designSystem';

type SettingsPayload = CustomizationData | DesignSystemSettings | Record<string, unknown>;

export interface CustomizationSettingsRecord {
  id: string;
  name: string | null;
  description: string | null;
  settings_data: SettingsPayload;
  is_active: boolean;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ThemePresetInput {
  name: string;
  description?: string;
  settings: SettingsPayload;
  createdBy?: string | null;
}

export interface ActiveSettingsInsert {
  settings: SettingsPayload;
  name?: string;
  description?: string;
  createdBy?: string | null;
}

const supabaseClient = supabase as any;

const handleNotFound = (error: PostgrestError | null) => {
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
};

export const designSystemService = {
  async fetchActiveSettings(): Promise<CustomizationSettingsRecord | null> {
    const { data, error } = await supabaseClient
      .from('customization_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      handleNotFound(error as PostgrestError);
    }

    return (data ?? null) as CustomizationSettingsRecord | null;
  },

  async listThemes(): Promise<CustomizationSettingsRecord[]> {
    const { data, error } = await supabaseClient
      .from('customization_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as CustomizationSettingsRecord[];
  },

  async createPreset({ name, description, settings, createdBy }: ThemePresetInput) {
    const { data, error } = await supabaseClient
      .from('customization_settings')
      .insert({
        name,
        description: description ?? null,
        settings_data: settings as any,
        is_active: false,
        created_by: createdBy ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;

    return data as CustomizationSettingsRecord;
  },

  async upsertActiveSettings({ settings, name, description, createdBy }: ActiveSettingsInsert) {
    const displayName = name ?? 'Active Settings';

    const { error: deactivateError } = await supabaseClient
      .from('customization_settings')
      .update({ is_active: false })
      .neq('id', '');

    if (deactivateError) throw deactivateError;

    const { data, error } = await supabaseClient
      .from('customization_settings')
      .insert({
        name: displayName,
        description: description ?? null,
        settings_data: settings as any,
        is_active: true,
        created_by: createdBy ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;

    return data as CustomizationSettingsRecord;
  },

  async applyTheme(themeId: string) {
    const { error: deactivateError } = await supabaseClient
      .from('customization_settings')
      .update({ is_active: false })
      .neq('id', '');

    if (deactivateError) throw deactivateError;

    const { data, error } = await supabaseClient
      .from('customization_settings')
      .update({ is_active: true })
      .eq('id', themeId)
      .select('*')
      .single();

    if (error) throw error;

    return data as CustomizationSettingsRecord;
  },

  async getThemeById(themeId: string) {
    const { data, error } = await supabaseClient
      .from('customization_settings')
      .select('*')
      .eq('id', themeId)
      .single();

    if (error) throw error;

    return data as CustomizationSettingsRecord;
  },
};

export type DesignSystemService = typeof designSystemService;
