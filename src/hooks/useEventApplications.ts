
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EventApplication = Tables<'event_applications'>;
type EventApplicationInsert = TablesInsert<'event_applications'>;
type EventApplicationUpdate = TablesUpdate<'event_applications'>;

export const useEventApplications = (eventId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch applications for a specific event
  const {
    data: applications = [],
    isLoading
  } = useQuery({
    queryKey: ['event-applications', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_applications')
        .select('*')
        .eq('event_id', eventId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data as EventApplication[];
    },
    enabled: !!eventId
  });

  // Fetch user's applications
  const {
    data: userApplications = [],
    isLoading: isLoadingUserApplications
  } = useQuery({
    queryKey: ['user-applications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('event_applications')
        .select(`
          *,
          events (
            title,
            venue,
            event_date,
            address
          )
        `)
        .eq('comedian_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Apply to event mutation
  const applyToEventMutation = useMutation({
    mutationFn: async (applicationData: Omit<EventApplicationInsert, 'comedian_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_applications')
        .insert({
          ...applicationData,
          comedian_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-applications'] });
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to apply",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, ...applicationData }: EventApplicationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('event_applications')
        .update(applicationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-applications'] });
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
      toast({
        title: "Application updated",
        description: "Application status has been updated"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update application",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  return {
    applications,
    userApplications,
    isLoading,
    isLoadingUserApplications,
    applyToEvent: applyToEventMutation.mutate,
    updateApplication: updateApplicationMutation.mutate,
    isApplying: applyToEventMutation.isPending,
    isUpdating: updateApplicationMutation.isPending
  };
};
