
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EventSpot = Tables<'event_spots'>;
type EventSpotInsert = TablesInsert<'event_spots'>;
type EventSpotUpdate = TablesUpdate<'event_spots'>;

export const useEventSpots = (eventId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch spots for an event
  const {
    data: spots = [],
    isLoading
  } = useQuery({
    queryKey: ['event-spots', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_spots')
        .select('*')
        .eq('event_id', eventId)
        .order('spot_order', { ascending: true });

      if (error) throw error;
      return data as EventSpot[];
    },
    enabled: !!eventId
  });

  // Create spot mutation
  const createSpotMutation = useMutation({
    mutationFn: async (spotData: EventSpotInsert) => {
      const { data, error } = await supabase
        .from('event_spots')
        .insert(spotData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-spots'] });
      toast({
        title: "Spot added",
        description: "Event spot has been added successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add spot",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Update spot mutation
  const updateSpotMutation = useMutation({
    mutationFn: async ({ id, ...spotData }: EventSpotUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('event_spots')
        .update(spotData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-spots'] });
      toast({
        title: "Spot updated",
        description: "Event spot has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update spot",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Delete spot mutation
  const deleteSpotMutation = useMutation({
    mutationFn: async (spotId: string) => {
      const { error } = await supabase
        .from('event_spots')
        .delete()
        .eq('id', spotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-spots'] });
      toast({
        title: "Spot deleted",
        description: "Event spot has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete spot",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  return {
    spots,
    isLoading,
    createSpot: createSpotMutation.mutate,
    updateSpot: updateSpotMutation.mutate,
    deleteSpot: deleteSpotMutation.mutate,
    isCreating: createSpotMutation.isPending,
    isUpdating: updateSpotMutation.isPending,
    isDeleting: deleteSpotMutation.isPending
  };
};
