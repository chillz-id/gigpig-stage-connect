import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  uiPreferencesService,
  type SidebarPreferences,
  type UIPreferences,
} from '@/services/preferences/ui-preferences-service';

export const useSidebarPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch sidebar preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['ui-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return {} as UIPreferences;
      return uiPreferencesService.getPreferences(user.id);
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - preferences rarely change
    cacheTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Update sidebar preferences mutation
  const updateSidebarMutation = useMutation({
    mutationFn: async (sidebarPrefs: SidebarPreferences) => {
      if (!user?.id) throw new Error('User not authenticated');
      await uiPreferencesService.updateSidebarPreferences(user.id, sidebarPrefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-preferences', user?.id] });
    },
  });

  // Helper functions
  const isItemHidden = (itemId: string): boolean => {
    return preferences?.sidebar?.hidden_items?.includes(itemId) || false;
  };

  const getItemOrder = (): string[] => {
    return preferences?.sidebar?.item_order || [];
  };

  const hideItem = async (itemId: string) => {
    const currentHidden = preferences?.sidebar?.hidden_items || [];
    if (!currentHidden.includes(itemId)) {
      await updateSidebarMutation.mutateAsync({
        hidden_items: [...currentHidden, itemId],
      });
    }
  };

  const showItem = async (itemId: string) => {
    const currentHidden = preferences?.sidebar?.hidden_items || [];
    await updateSidebarMutation.mutateAsync({
      hidden_items: currentHidden.filter((id) => id !== itemId),
    });
  };

  const setItemOrder = async (order: string[]) => {
    await updateSidebarMutation.mutateAsync({
      item_order: order,
    });
  };

  return {
    preferences: preferences?.sidebar || {},
    isLoading,
    isItemHidden,
    getItemOrder,
    hideItem,
    showItem,
    setItemOrder,
    updateSidebar: updateSidebarMutation.mutateAsync,
  };
};
