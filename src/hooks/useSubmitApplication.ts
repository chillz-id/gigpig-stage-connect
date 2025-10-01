import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';

export interface ApplicationSubmitData {
  event_id: string;
  message?: string;
  spot_type?: string;
  availability_confirmed?: boolean;
  requirements_acknowledged?: boolean;
}

export interface ApplicationResponse {
  id: string;
  event_id: string;
  comedian_id: string;
  status: string | null;
  message?: string | null;
  applied_at: string | null;
  responded_at?: string | null;
}

export const useSubmitApplication = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: ApplicationSubmitData): Promise<ApplicationResponse> => {
      if (!user) {
        throw new Error('You must be logged in to apply to events');
      }

      // Check if user already applied
      const { data: existingApplication, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('event_id', data.event_id)
        .eq('comedian_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingApplication) {
        throw new Error('You have already applied to this event');
      }

      // Submit the application
      const { data: application, error } = await supabase
        .from('applications')
        .insert({
          event_id: data.event_id,
          comedian_id: user.id,
          status: 'pending',
          message: data.message,
          spot_type: data.spot_type,
          availability_confirmed: data.availability_confirmed,
          requirements_acknowledged: data.requirements_acknowledged
        })
        .select()
        .single();

      if (error) {
        console.error('Application submission error:', error);
        throw error;
      }

      if (!application) {
        throw new Error('Failed to create application');
      }

      return application as ApplicationResponse;
    },
    onSuccess: async (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['event-applications'] });
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['events', data.event_id] });

      // Get event and promoter details for notification
      try {
        const { data: eventData, error } = await supabase
          .from('events')
          .select(`
            title,
            event_date,
            promoter_id,
            profiles!promoter_id (
              name
            )
          `)
          .eq('id', data.event_id)
          .single();

        if (!error && eventData) {
          const { data: comedianData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user?.id)
            .single();

          const userId = user?.id;
          if (!userId) {
            console.warn('Skipping promoter notification: missing authenticated user id');
            return;
          }

          if (comedianData) {
            await notificationService.notifyApplicationSubmitted(
              eventData.promoter_id,
              userId,
              data.event_id,
              eventData.title,
              comedianData.name,
              eventData.event_date
            );
          }
        }
      } catch (error) {
        console.error('Failed to send application notification:', error);
      }

      toast({
        title: "Application submitted!",
        description: "Your application has been successfully submitted. The promoter will review it soon.",
      });
    },
    onError: (error: any) => {
      console.error('Application submission failed:', error);
      
      let errorMessage = "Failed to submit your application. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === '23505') {
        errorMessage = "You have already applied to this event";
      } else if (error.code === '23503') {
        errorMessage = "Invalid event. The event may no longer exist.";
      } else if (error.code === 'PGRST204') {
        errorMessage = "Unable to submit application. Please check your connection and try again.";
      }
      
      toast({
        title: "Application failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  return {
    submitApplication: submitApplicationMutation.mutate,
    submitApplicationAsync: submitApplicationMutation.mutateAsync,
    isSubmitting: submitApplicationMutation.isPending,
    isSuccess: submitApplicationMutation.isSuccess,
    isError: submitApplicationMutation.isError,
    error: submitApplicationMutation.error,
    reset: submitApplicationMutation.reset
  };
};
