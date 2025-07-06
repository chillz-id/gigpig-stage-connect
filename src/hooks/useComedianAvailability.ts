import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ComedianAvailability {
  id: string;
  comedian_id: string;
  date: string;
  is_available: boolean;
  time_start?: string;
  time_end?: string;
  notes?: string;
  recurring_type: 'none' | 'weekly' | 'monthly';
  recurring_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ComedianBlockedDates {
  id: string;
  comedian_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  recurring_type: 'none' | 'weekly' | 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
}

export const useComedianAvailability = (comedianId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use current user if no comedianId provided
  const targetComedianId = comedianId || user?.id;

  // Fetch availability
  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['comedian-availability', targetComedianId],
    queryFn: async () => {
      if (!targetComedianId) return [];

      const { data, error } = await supabase
        .from('comedian_availability')
        .select('*')
        .eq('comedian_id', targetComedianId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as ComedianAvailability[];
    },
    enabled: !!targetComedianId
  });

  // Fetch blocked dates
  const { data: blockedDates, isLoading: blockedDatesLoading } = useQuery({
    queryKey: ['comedian-blocked-dates', targetComedianId],
    queryFn: async () => {
      if (!targetComedianId) return [];

      const { data, error } = await supabase
        .from('comedian_blocked_dates')
        .select('*')
        .eq('comedian_id', targetComedianId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as ComedianBlockedDates[];
    },
    enabled: !!targetComedianId
  });

  // Set availability mutation
  const setAvailabilityMutation = useMutation({
    mutationFn: async (availability: Partial<ComedianAvailability>) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('comedian_availability')
        .upsert({
          comedian_id: user.id,
          ...availability,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'comedian_id,date'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comedian-availability', user?.id] });
      toast({
        title: "Availability Updated",
        description: "Your availability has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive"
      });
    }
  });

  // Set blocked dates mutation
  const setBlockedDatesMutation = useMutation({
    mutationFn: async (blockedDate: Omit<ComedianBlockedDates, 'id' | 'comedian_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('comedian_blocked_dates')
        .insert({
          comedian_id: user.id,
          ...blockedDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comedian-blocked-dates', user?.id] });
      toast({
        title: "Blocked Period Added",
        description: "Your unavailable period has been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add blocked period",
        variant: "destructive"
      });
    }
  });

  // Remove blocked date mutation
  const removeBlockedDateMutation = useMutation({
    mutationFn: async (blockedDateId: string) => {
      const { error } = await supabase
        .from('comedian_blocked_dates')
        .delete()
        .eq('id', blockedDateId)
        .eq('comedian_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comedian-blocked-dates', user?.id] });
      toast({
        title: "Blocked Period Removed",
        description: "The blocked period has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove blocked period",
        variant: "destructive"
      });
    }
  });

  // Helper function to check if a date is available
  const isDateAvailable = (date: string): boolean => {
    if (!availability && !blockedDates) return true;

    // Check if date is explicitly blocked
    const isBlocked = blockedDates?.some(blocked => {
      const blockStart = new Date(blocked.start_date);
      const blockEnd = new Date(blocked.end_date);
      const checkDate = new Date(date);
      return checkDate >= blockStart && checkDate <= blockEnd;
    });

    if (isBlocked) return false;

    // Check specific availability setting
    const dayAvailability = availability?.find(avail => avail.date === date);
    if (dayAvailability) {
      return dayAvailability.is_available;
    }

    // Default to available if not specified
    return true;
  };

  return {
    availability,
    blockedDates,
    isLoading: availabilityLoading || blockedDatesLoading,
    setAvailability: setAvailabilityMutation.mutate,
    setBlockedDates: setBlockedDatesMutation.mutate,
    removeBlockedDate: removeBlockedDateMutation.mutate,
    isSettingAvailability: setAvailabilityMutation.isPending,
    isSettingBlockedDates: setBlockedDatesMutation.isPending,
    isDateAvailable
  };
};