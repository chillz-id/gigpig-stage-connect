import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  uiPreferencesService,
  type CalendarPreferences,
  type UIPreferences,
} from '@/services/preferences/ui-preferences-service';

export const useCalendarPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch calendar preferences
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

  // Update calendar preferences mutation
  const updateCalendarMutation = useMutation({
    mutationFn: async (calendarPrefs: CalendarPreferences) => {
      if (!user?.id) throw new Error('User not authenticated');
      await uiPreferencesService.updateCalendarPreferences(user.id, calendarPrefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-preferences', user?.id] });
    },
  });

  // Helper functions
  const shouldHideSundays = (): boolean => {
    return preferences?.calendar?.hide_sundays_shows || false;
  };

  const toggleSundayVisibility = async () => {
    const currentValue = shouldHideSundays();
    await updateCalendarMutation.mutateAsync({
      hide_sundays_shows: !currentValue,
    });
  };

  return {
    preferences: preferences?.calendar || {},
    isLoading,
    shouldHideSundays,
    toggleSundayVisibility,
    updateCalendar: updateCalendarMutation.mutateAsync,
  };
};
