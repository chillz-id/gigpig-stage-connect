import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/services/notificationService';

export interface SpotAssignmentData {
  eventId: string;
  comedianId: string;
  spotType: string;
  confirmationDeadlineHours?: number;
}

export const useSpotAssignment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const assignSpotMutation = useMutation({
    mutationFn: async ({ eventId, comedianId, spotType, confirmationDeadlineHours = 48 }: SpotAssignmentData) => {
      // Start a transaction to ensure data consistency
      const { data, error } = await supabase.rpc('assign_spot_to_comedian', {
        p_event_id: eventId,
        p_comedian_id: comedianId,
        p_spot_type: spotType,
        p_confirmation_deadline_hours: confirmationDeadlineHours
      });

      if (error) {
        // If the RPC function doesn't exist, fall back to manual implementation
        if (error.message.includes('function assign_spot_to_comedian') || error.code === '42883') {
          return await manualSpotAssignment(eventId, comedianId, spotType, confirmationDeadlineHours);
        }
        throw error;
      }

      return data;
    },
    onSuccess: async (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['event-spots'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });

      // Create notification for the comedian
      try {
        const { data: eventData } = await supabase
          .from('events')
          .select('title, event_date, venue')
          .eq('id', variables.eventId)
          .single();

        if (eventData) {
          await notificationService.createNotification({
            user_id: variables.comedianId,
            type: 'spot_assigned',
            title: 'Spot Assignment Confirmed',
            message: `You've been assigned a ${variables.spotType} spot at "${eventData.title}" on ${new Date(eventData.event_date).toLocaleDateString()}. Please confirm your availability within 48 hours.`,
            priority: 'high',
            data: {
              event_id: variables.eventId,
              spot_type: variables.spotType
            },
            action_url: `/events/${variables.eventId}`,
            action_label: 'Confirm Spot'
          });
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      toast({
        title: "Spot assigned successfully",
        description: `${variables.spotType} spot has been assigned and comedian has been notified.`,
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to assign spot";
      
      if (error.message?.includes('No available spots')) {
        errorMessage = `No available ${error.spotType || ''} spots found for this event`;
      } else if (error.message?.includes('already assigned')) {
        errorMessage = "This comedian is already assigned to a spot for this event";
      }

      toast({
        title: "Error assigning spot",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Simple assignment function for when we have a specific spot ID
  const assignSpotById = async (spotId: string, comedianId: string) => {
    const confirmationDeadline = new Date();
    confirmationDeadline.setHours(confirmationDeadline.getHours() + 48);

    const { error } = await supabase
      .from('event_spots')
      .update({
        comedian_id: comedianId,
        is_filled: true,
        confirmation_status: 'pending',
        confirmation_deadline: confirmationDeadline.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', spotId);

    if (error) throw error;

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    queryClient.invalidateQueries({ queryKey: ['event-spots'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });

    return { spot_id: spotId };
  };

  return {
    assignSpot: assignSpotMutation.mutate,
    isAssigning: assignSpotMutation.isPending,
    assignSpotAsync: assignSpotMutation.mutateAsync,
    assignSpotById
  };
};

// Manual implementation for spot assignment
const manualSpotAssignment = async (
  eventId: string,
  comedianId: string,
  spotType: string,
  confirmationDeadlineHours: number
) => {
  // Check if comedian is already assigned to a spot for this event
  const { data: existingSpot, error: existingError } = await supabase
    .from('event_spots')
    .select('id')
    .eq('event_id', eventId)
    .eq('comedian_id', comedianId)
    .eq('is_filled', true)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  if (existingSpot) {
    throw new Error('Comedian is already assigned to a spot for this event');
  }

  // Find an available spot of the requested type
  const { data: availableSpots, error: spotsError } = await supabase
    .from('event_spots')
    .select('id')
    .eq('event_id', eventId)
    .eq('spot_name', spotType)
    .eq('is_filled', false)
    .limit(1);

  if (spotsError) throw spotsError;

  if (!availableSpots || availableSpots.length === 0) {
    const error = new Error(`No available ${spotType} spots found for this event`);
    (error as any).spotType = spotType;
    throw error;
  }

  const spotId = availableSpots[0].id;

  // Calculate confirmation deadline
  const confirmationDeadline = new Date();
  confirmationDeadline.setHours(confirmationDeadline.getHours() + confirmationDeadlineHours);

  // Update the spot with comedian assignment
  const { error: updateError } = await supabase
    .from('event_spots')
    .update({
      comedian_id: comedianId,
      is_filled: true,
      confirmation_status: 'pending',
      confirmation_deadline: confirmationDeadline.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', spotId);

  if (updateError) throw updateError;

  return { spot_id: spotId, confirmation_deadline: confirmationDeadline };
};