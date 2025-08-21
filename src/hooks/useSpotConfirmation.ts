import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/services/notificationService';

export interface SpotConfirmationData {
  spotId: string;
  action: 'confirm' | 'decline';
  eventId?: string;
  comedianId?: string;
}

export const useSpotConfirmation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmSpotMutation = useMutation({
    mutationFn: async ({ spotId, action, eventId, comedianId }: SpotConfirmationData) => {
      const now = new Date().toISOString();
      
      // First, verify the spot belongs to the comedian
      if (comedianId) {
        const { data: spotCheck, error: checkError } = await supabase
          .from('event_spots')
          .select('id, comedian_id, event_id, confirmation_deadline')
          .eq('id', spotId)
          .eq('comedian_id', comedianId)
          .single();

        if (checkError || !spotCheck) {
          throw new Error('You are not authorized to confirm this spot');
        }

        // Check if deadline has passed
        if (action === 'confirm' && spotCheck.confirmation_deadline) {
          const deadline = new Date(spotCheck.confirmation_deadline);
          if (deadline < new Date()) {
            throw new Error('Confirmation deadline has passed');
          }
        }
      }
      
      const updateData: any = {
        updated_at: now,
        confirmation_status: action === 'confirm' ? 'confirmed' : 'declined'
      };

      if (action === 'confirm') {
        updateData.confirmed_at = now;
      } else {
        updateData.declined_at = now;
      }

      const { error } = await supabase
        .from('event_spots')
        .update(updateData)
        .eq('id', spotId);

      if (error) throw error;

      // Create notification for the event promoter
      if (eventId && comedianId) {
        try {
          // Get event and comedian details
          const [eventResult, comedianResult] = await Promise.all([
            supabase
              .from('events')
              .select('title, event_date, promoter_id')
              .eq('id', eventId)
              .single(),
            supabase
              .from('profiles')
              .select('name')
              .eq('id', comedianId)
              .single()
          ]);

          if (eventResult.data && comedianResult.data) {
            const { title, event_date, promoter_id } = eventResult.data;
            const { name: comedianName } = comedianResult.data;

            await notificationService.createNotification({
              user_id: promoter_id,
              type: action === 'confirm' ? 'spot_confirmed' : 'spot_declined',
              title: `Spot ${action === 'confirm' ? 'Confirmed' : 'Declined'}: ${title}`,
              message: `${comedianName} has ${action === 'confirm' ? 'confirmed' : 'declined'} their spot for "${title}" on ${new Date(event_date).toLocaleDateString()}.`,
              priority: 'medium',
              data: {
                event_id: eventId,
                comedian_id: comedianId,
                spot_id: spotId,
                action
              },
              action_url: `/admin/events/${eventId}`,
              action_label: 'View Event'
            });
          }
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }
      }

      return { spotId, action };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['event-spots'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['comedian-spots'] });

      const action = data.action === 'confirm' ? 'confirmed' : 'declined';
      toast({
        title: `Spot ${action}`,
        description: `You have successfully ${action} the spot assignment.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating spot",
        description: error.message || "Failed to update spot confirmation",
        variant: "destructive"
      });
    }
  });

  // Simplified methods for confirming/declining
  const confirmSpot = (spotId: string) => {
    confirmSpotMutation.mutate({ spotId, action: 'confirm' });
  };

  const declineSpot = (spotId: string, reason?: string) => {
    confirmSpotMutation.mutate({ spotId, action: 'decline' });
  };

  return {
    confirmSpot,
    declineSpot,
    updateSpot: confirmSpotMutation.mutate,
    isUpdating: confirmSpotMutation.isPending,
    confirmSpotAsync: confirmSpotMutation.mutateAsync
  };
};

// Hook for getting comedian's assigned spots
export const useComedianSpots = (comedianId: string) => {
  const queryClient = useQueryClient();

  return queryClient.getQueryData(['comedian-spots', comedianId]) || [];
};