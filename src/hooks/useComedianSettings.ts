import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ComedianSettings {
  auto_confirm_spots: boolean;
  // Add more settings as needed
}

const DEFAULT_SETTINGS: ComedianSettings = {
  auto_confirm_spots: false,
};

/**
 * Hook to manage comedian-specific settings stored in comedians.metadata
 */
export const useComedianSettings = (comedianId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings from comedians.metadata
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['comedian-settings', comedianId],
    queryFn: async (): Promise<ComedianSettings> => {
      if (!comedianId) return DEFAULT_SETTINGS;

      const { data, error } = await supabase
        .from('comedians')
        .select('metadata')
        .eq('id', comedianId)
        .single();

      if (error) {
        console.error('[useComedianSettings] Error fetching settings:', error);
        return DEFAULT_SETTINGS;
      }

      // Extract settings from metadata, with defaults
      const metadata = (data?.metadata as Record<string, unknown>) || {};
      return {
        auto_confirm_spots: Boolean(metadata.auto_confirm_spots) || false,
      };
    },
    enabled: !!comedianId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<ComedianSettings>) => {
      if (!comedianId) throw new Error('No comedian ID');

      // First fetch current metadata to preserve other fields
      const { data: current, error: fetchError } = await supabase
        .from('comedians')
        .select('metadata')
        .eq('id', comedianId)
        .single();

      if (fetchError) throw fetchError;

      const currentMetadata = (current?.metadata as Record<string, unknown>) || {};

      // Merge new settings into metadata
      const updatedMetadata = {
        ...currentMetadata,
        ...newSettings,
      };

      const { error: updateError } = await supabase
        .from('comedians')
        .update({ metadata: updatedMetadata })
        .eq('id', comedianId);

      if (updateError) throw updateError;

      return updatedMetadata;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comedian-settings', comedianId] });
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated.',
      });
    },
    onError: (error: Error) => {
      console.error('[useComedianSettings] Error updating settings:', error);
      toast({
        title: 'Failed to save settings',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Convenience method to toggle auto-confirm
  const setAutoConfirmSpots = (enabled: boolean) => {
    updateSettingsMutation.mutate({ auto_confirm_spots: enabled });
  };

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    setAutoConfirmSpots,
    isUpdating: updateSettingsMutation.isPending,
  };
};
