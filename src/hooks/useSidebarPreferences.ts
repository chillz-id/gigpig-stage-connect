import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface SidebarPreferences {
  hidden_items?: string[];
  item_order?: string[];
}

interface UseSidebarPreferencesOptions {
  profileId?: string;
  profileType?: 'comedian' | 'manager' | 'organization' | 'venue';
}

export const useSidebarPreferences = (options?: UseSidebarPreferencesOptions) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profileId, profileType } = options || {};

  // Fetch sidebar preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['sidebar-preferences', user?.id, profileType, profileId],
    queryFn: async () => {
      if (!user?.id) return null;

      let query = supabase
        .from('sidebar_preferences')
        .select('hidden_items, item_order')
        .eq('user_id', user.id);

      // If profileId and profileType provided, query for per-profile preferences
      if (profileId && profileType) {
        query = query
          .eq('profile_type', profileType)
          .eq('profile_id', profileId);
      } else {
        // Query for legacy/global preferences (NULL profile_type and profile_id)
        query = query
          .is('profile_type', null)
          .is('profile_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching sidebar preferences:', error);
        throw error;
      }

      return data as SidebarPreferences | null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - preferences rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Update sidebar preferences mutation
  const updateSidebarMutation = useMutation({
    mutationFn: async (sidebarPrefs: SidebarPreferences) => {
      if (!user?.id) throw new Error('User not authenticated');

      const upsertData = {
        user_id: user.id,
        profile_type: profileType || null,
        profile_id: profileId || null,
        hidden_items: sidebarPrefs.hidden_items || [],
        item_order: sidebarPrefs.item_order || [],
      };

      const { error } = await supabase
        .from('sidebar_preferences')
        .upsert(upsertData, {
          onConflict: 'user_id,COALESCE(profile_type::text,\'\'),COALESCE(profile_id::text,\'\')',
        });

      if (error) {
        console.error('Error updating sidebar preferences:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sidebar-preferences', user?.id, profileType, profileId]
      });
    },
  });

  // Helper functions
  const isItemHidden = (itemId: string): boolean => {
    return preferences?.hidden_items?.includes(itemId) || false;
  };

  const getItemOrder = (): string[] => {
    return preferences?.item_order || [];
  };

  const hideItem = async (itemId: string) => {
    const currentHidden = preferences?.hidden_items || [];
    if (!currentHidden.includes(itemId)) {
      await updateSidebarMutation.mutateAsync({
        hidden_items: [...currentHidden, itemId],
        item_order: preferences?.item_order,
      });
    }
  };

  const showItem = async (itemId: string) => {
    const currentHidden = preferences?.hidden_items || [];
    await updateSidebarMutation.mutateAsync({
      hidden_items: currentHidden.filter((id) => id !== itemId),
      item_order: preferences?.item_order,
    });
  };

  const setItemOrder = async (order: string[]) => {
    await updateSidebarMutation.mutateAsync({
      hidden_items: preferences?.hidden_items,
      item_order: order,
    });
  };

  return {
    preferences: preferences || {},
    isLoading,
    isItemHidden,
    getItemOrder,
    hideItem,
    showItem,
    setItemOrder,
    updateSidebar: updateSidebarMutation.mutateAsync,
  };
};
