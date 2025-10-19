
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  eventApplicationService,
  type EventApplication,
} from '@/services/event';
import type { ApplicationInsert, ApplicationUpdate } from '@/types/application';

export const useEventApplications = (eventId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch applications for a specific event
  const {
    data: applications = [],
    isLoading
  } = useQuery({
    queryKey: ['event-applications', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      return eventApplicationService.listByEvent(eventId);
    },
    enabled: !!eventId
  });

  // Fetch user's applications
  const {
    data: userApplications = [],
    isLoading: isLoadingUserApplications
  } = useQuery({
    queryKey: ['user-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      return eventApplicationService.listForComedian(user.id);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches platform standard)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds instead of 5
    enabled: !!user
  });

  // Apply to event mutation
  const applyToEventMutation = useMutation({
    mutationFn: async (applicationData: Omit<ApplicationInsert, 'comedian_id'>) => {
      if (!user) throw new Error('User not authenticated');

      return eventApplicationService.apply(user.id, applicationData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-applications'] });
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
      toast({
        title: "Application submitted!",
        description: "Your application has been submitted successfully"
      });
    },
    onError: (error: any) => {
      console.error('Application error:', error);
      let errorMessage = "An error occurred while applying";
      
      if (error?.code === '23505') {
        errorMessage = "You have already applied to this event";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Failed to apply",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, ...applicationData }: ApplicationUpdate & { id: string }) => {
      return eventApplicationService.update(id, applicationData);
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
