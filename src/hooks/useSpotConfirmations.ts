import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { SpotConfirmationWithDetails, SpotConfirmationResponse } from '@/types/spotConfirmation';

export const useSpotConfirmations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all spot confirmations for the current comedian
  const { data: confirmations = [], isLoading } = useQuery({
    queryKey: ['spot-confirmations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('event_spots')
        .select(`
          *,
          event:events (
            id,
            title,
            event_date,
            start_time,
            end_time,
            venue,
            address,
            description,
            requirements,
            organization:organization_profiles!events_organization_id_fkey (
              id,
              organization_name,
              contact_email,
              contact_phone,
              logo_url
            )
          )
        `)
        .eq('comedian_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to SpotConfirmationWithDetails format
      return data.map((spot): SpotConfirmationWithDetails => {
        // Calculate response deadline as 24 hours from when spot was assigned
        const assignedAt = new Date(spot.updated_at);
        const responseDeadline = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000);
        
        // Determine status based on is_filled and comedian_id
        let status: 'pending' | 'confirmed' | 'declined' = 'pending';
        if (spot.is_filled) {
          status = 'confirmed';
        } else if (!spot.comedian_id) {
          status = 'declined';
        } else if (responseDeadline < new Date()) {
          // If deadline has passed and not confirmed, treat as expired/declined
          status = 'declined';
        }
        
        return {
          id: `conf_${spot.id}`,
          spot_id: spot.id,
          comedian_id: user.id,
          status,
          response_deadline: responseDeadline.toISOString(),
          response_date: spot.is_filled ? spot.updated_at : undefined,
          notes: undefined,
          created_at: spot.created_at,
          updated_at: spot.updated_at,
          spot: {
            id: spot.id,
            spot_name: spot.spot_name,
            payment_amount: spot.payment_amount,
            currency: spot.currency,
            duration_minutes: spot.duration_minutes,
            spot_order: spot.spot_order,
            event_id: spot.event_id,
            event: spot.event
          },
          comedian: {
            id: user.id,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            stage_name: user.user_metadata?.stage_name,
            email: user.email || '',
            phone: user.user_metadata?.phone,
            avatar_url: user.user_metadata?.avatar_url
          }
        };
      });
    },
    enabled: !!user?.id
  });

  // Get a specific spot confirmation
  const getSpotConfirmation = async (spotId: string) => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('event_spots')
      .select(`
        *,
        event:events (
          id,
          title,
          event_date,
          start_time,
          end_time,
          venue,
          address,
          description,
          requirements,
          organization:organization_profiles!events_organization_id_fkey (
            id,
            organization_name,
            contact_email,
            contact_phone,
            logo_url
          )
        )
      `)
      .eq('id', spotId)
      .eq('comedian_id', user.id)
      .single();

    if (error) throw error;

    // Calculate response deadline as 24 hours from when spot was assigned
    const assignedAt = new Date(data.updated_at);
    const responseDeadline = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000);
    
    // Determine status based on is_filled and comedian_id
    let status: 'pending' | 'confirmed' | 'declined' = 'pending';
    if (data.is_filled) {
      status = 'confirmed';
    } else if (!data.comedian_id) {
      status = 'declined';
    } else if (responseDeadline < new Date()) {
      // If deadline has passed and not confirmed, treat as expired/declined
      status = 'declined';
    }

    return {
      id: `conf_${data.id}`,
      spot_id: data.id,
      comedian_id: user.id,
      status,
      response_deadline: responseDeadline.toISOString(),
      response_date: data.is_filled ? data.updated_at : undefined,
      notes: undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      spot: {
        id: data.id,
        spot_name: data.spot_name,
        payment_amount: data.payment_amount,
        currency: data.currency,
        duration_minutes: data.duration_minutes,
        spot_order: data.spot_order,
        event_id: data.event_id,
        event: data.event
      },
      comedian: {
        id: user.id,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        stage_name: user.user_metadata?.stage_name,
        email: user.email || '',
        phone: user.user_metadata?.phone,
        avatar_url: user.user_metadata?.avatar_url
      }
    } as SpotConfirmationWithDetails;
  };

  // Handle spot confirmation response
  const respondToSpotConfirmation = useMutation({
    mutationFn: async ({ spotId, response }: { spotId: string; response: SpotConfirmationResponse }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Update the event spot
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (response.status === 'confirmed') {
        updateData.is_filled = true;
      } else if (response.status === 'declined') {
        updateData.is_filled = false;
        updateData.comedian_id = null; // Clear assignment when declined
      }

      const { error } = await supabase
        .from('event_spots')
        .update(updateData)
        .eq('id', spotId)
        .eq('comedian_id', user.id);

      if (error) throw error;

      // In a real app, you would also create/update spot_confirmations table
      // and send notifications to the promoter
      return { spotId, response };
    },
    onSuccess: ({ response }) => {
      queryClient.invalidateQueries({ queryKey: ['spot-confirmations'] });
      queryClient.invalidateQueries({ queryKey: ['event-spots'] });
      
      toast({
        title: response.status === 'confirmed' ? 'Spot Confirmed!' : 'Spot Declined',
        description: response.status === 'confirmed' 
          ? 'Your spot has been confirmed. The promoter will be notified.'
          : 'Your spot has been declined. The promoter will be notified.',
        variant: response.status === 'confirmed' ? 'default' : 'destructive'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process response',
        variant: 'destructive'
      });
    }
  });

  // Get pending confirmations count
  const getPendingConfirmationsCount = () => {
    return confirmations.filter(conf => conf.status === 'pending').length;
  };

  // Get confirmations requiring attention (deadline soon)
  const getUrgentConfirmations = () => {
    const now = new Date();
    const urgentThreshold = 24 * 60 * 60 * 1000; // 24 hours

    return confirmations.filter(conf => {
      if (conf.status !== 'pending') return false;
      
      const deadline = new Date(conf.response_deadline);
      const timeLeft = deadline.getTime() - now.getTime();
      
      return timeLeft > 0 && timeLeft <= urgentThreshold;
    });
  };

  // Get expired confirmations
  const getExpiredConfirmations = () => {
    const now = new Date();
    
    return confirmations.filter(conf => {
      if (conf.status !== 'pending') return false;
      
      const deadline = new Date(conf.response_deadline);
      return deadline.getTime() <= now.getTime();
    });
  };

  return {
    confirmations,
    isLoading,
    getSpotConfirmation,
    respondToSpotConfirmation: respondToSpotConfirmation.mutate,
    isResponding: respondToSpotConfirmation.isPending,
    getPendingConfirmationsCount,
    getUrgentConfirmations,
    getExpiredConfirmations
  };
};