
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

  // Fetch spots for an event with comedian and directory profile data
  const {
    data: spots = [],
    isLoading,
    refetch
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

      // Fetch comedian profiles and directory profiles for spots
      const spotsWithProfiles = await Promise.all(
        (data || []).map(async (spot) => {
          let comedian = null;
          let directoryProfile = null;

          // Fetch comedian profile if assigned
          if (spot.comedian_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, stage_name, avatar_url')
              .eq('id', spot.comedian_id)
              .single();
            comedian = profile;
          }

          // Fetch directory profile if assigned (for unclaimed profiles)
          if (spot.directory_profile_id) {
            const { data: dirProfile } = await supabase
              .from('directory_profiles')
              .select('id, stage_name, primary_headshot_url, origin_city, claimed_at')
              .eq('id', spot.directory_profile_id)
              .single();
            directoryProfile = dirProfile;
          }

          return { ...spot, comedian, directoryProfile };
        })
      );

      return spotsWithProfiles;
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
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
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
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
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
      // First, get the spot being deleted to know its order
      const { data: deletedSpot, error: fetchError } = await supabase
        .from('event_spots')
        .select('spot_order, event_id')
        .eq('id', spotId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the spot
      const { error: deleteError } = await supabase
        .from('event_spots')
        .delete()
        .eq('id', spotId);

      if (deleteError) throw deleteError;

      // Get remaining spots and recalculate their order
      const { data: remainingSpots, error: remainingError } = await supabase
        .from('event_spots')
        .select('id, spot_order')
        .eq('event_id', deletedSpot.event_id)
        .order('spot_order', { ascending: true });

      if (remainingError) throw remainingError;

      // Update spot_order for all remaining spots to be sequential
      if (remainingSpots && remainingSpots.length > 0) {
        const updates = remainingSpots.map((spot, index) =>
          supabase
            .from('event_spots')
            .update({ spot_order: index + 1 })
            .eq('id', spot.id)
        );
        await Promise.all(updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
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
    refetch,
    createSpot: createSpotMutation.mutate,
    updateSpot: updateSpotMutation.mutate,
    deleteSpot: deleteSpotMutation.mutate,
    isCreating: createSpotMutation.isPending,
    isUpdating: updateSpotMutation.isPending,
    isDeleting: deleteSpotMutation.isPending
  };
};

/**
 * Assign a comedian to an existing spot via drag-and-drop
 * If the comedian is GST registered, auto-default spot GST to 'addition'
 */
export const useAssignComedianToSpot = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spotId,
      comedianId,
      eventId
    }: {
      spotId: string;
      comedianId: string;
      eventId: string;
    }) => {
      // Check if comedian is GST registered
      const { data: profile } = await supabase
        .from('profiles')
        .select('gst_registered')
        .eq('id', comedianId)
        .single();

      const updateData: Record<string, unknown> = {
        comedian_id: comedianId,
        is_filled: true,
        confirmation_status: 'confirmed',
        confirmed_at: new Date().toISOString()
      };

      // If comedian is GST registered, auto-default GST to 'addition'
      if (profile?.gst_registered) {
        updateData.payment_gst_type = 'addition';
      }

      const { data, error } = await supabase
        .from('event_spots')
        .update(updateData)
        .eq('id', spotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
      toast({
        title: 'Comedian assigned',
        description: 'Comedian has been assigned to the spot'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to assign comedian',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  });
};

/**
 * Create a new spot and assign a comedian in one operation (drag to empty area)
 * Optionally accepts a position to insert at specific location in the lineup
 * If the comedian is GST registered, auto-default spot GST to 'addition'
 */
export const useCreateAndAssignSpot = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      comedianId,
      spotType = 'Spot',
      duration = 5,
      position
    }: {
      eventId: string;
      comedianId: string;
      spotType?: string;
      duration?: number;
      position?: number; // Optional position to insert at
    }) => {
      // Check if comedian is GST registered
      const { data: profile } = await supabase
        .from('profiles')
        .select('gst_registered')
        .eq('id', comedianId)
        .single();

      let spotOrder: number;

      if (position !== undefined) {
        // Use the provided position
        spotOrder = position;
      } else {
        // Get the next spot order (append to end)
        const { data: existingSpots, error: fetchError } = await supabase
          .from('event_spots')
          .select('spot_order')
          .eq('event_id', eventId)
          .order('spot_order', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        spotOrder = existingSpots && existingSpots.length > 0
          ? (existingSpots[0].spot_order || 0) + 1
          : 1;
      }

      // Create the spot with comedian assigned
      const insertData: Record<string, unknown> = {
        event_id: eventId,
        spot_name: spotType,
        spot_order: spotOrder,
        comedian_id: comedianId,
        duration_minutes: duration,
        is_filled: true,
        confirmation_status: 'confirmed',
        confirmed_at: new Date().toISOString()
      };

      // If comedian is GST registered, auto-default GST to 'addition'
      if (profile?.gst_registered) {
        insertData.payment_gst_type = 'addition';
      }

      const { data, error } = await supabase
        .from('event_spots')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
      toast({
        title: 'Spot created',
        description: 'New spot created with comedian assigned'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create spot',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  });
};

/**
 * Quick inline duration update
 */
export const useUpdateSpotDuration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spotId,
      duration,
      eventId
    }: {
      spotId: string;
      duration: number;
      eventId: string;
    }) => {
      const { error } = await supabase
        .from('event_spots')
        .update({ duration_minutes: duration })
        .eq('id', spotId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
    }
  });
};

/**
 * Quick inline spot type update
 */
export const useUpdateSpotType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spotId,
      spotType,
      eventId
    }: {
      spotId: string;
      spotType: string;
      eventId: string;
    }) => {
      const { error } = await supabase
        .from('event_spots')
        .update({ spot_name: spotType })
        .eq('id', spotId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
    }
  });
};

/**
 * Toggle paid status
 */
export const useToggleSpotPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spotId,
      isPaid,
      eventId
    }: {
      spotId: string;
      isPaid: boolean;
      eventId: string;
    }) => {
      const { error } = await supabase
        .from('event_spots')
        .update({ is_paid: isPaid })
        .eq('id', spotId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
    }
  });
};

/**
 * Reorder spots in the lineup
 */
export const useReorderSpots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      spotIds
    }: {
      eventId: string;
      spotIds: string[];
    }) => {
      // Update each spot's order based on its position in the array
      const updates = spotIds.map((spotId, index) =>
        supabase
          .from('event_spots')
          .update({ spot_order: index + 1 })
          .eq('id', spotId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
    }
  });
};

/**
 * Assign extra staff (production/visual artist) to a spot
 * If the staff member is GST registered, auto-default spot GST to 'addition'
 */
export const useAssignExtraToSpot = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spotId,
      staffId,
      staffName,
      staffAvatar,
      eventId
    }: {
      spotId: string;
      staffId: string;
      staffName: string;
      staffAvatar?: string;
      eventId: string;
    }) => {
      // Check if staff member is GST registered
      const { data: profile } = await supabase
        .from('profiles')
        .select('gst_registered')
        .eq('id', staffId)
        .single();

      const updateData: Record<string, unknown> = {
        staff_id: staffId,
        staff_name: staffName,
        staff_avatar: staffAvatar || null,
        is_filled: true,
        confirmation_status: 'confirmed',
        confirmed_at: new Date().toISOString()
      };

      // If staff is GST registered, auto-default GST to 'addition'
      if (profile?.gst_registered) {
        updateData.payment_gst_type = 'addition';
      }

      const { data, error } = await supabase
        .from('event_spots')
        .update(updateData)
        .eq('id', spotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
      toast({
        title: 'Staff assigned',
        description: 'Staff member has been assigned to the spot'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to assign staff',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  });
};

/**
 * Unassign extra staff from a spot
 */
export const useUnassignExtraFromSpot = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spotId,
      eventId
    }: {
      spotId: string;
      eventId: string;
    }) => {
      const { data, error } = await supabase
        .from('event_spots')
        .update({
          staff_id: null,
          staff_name: null,
          staff_avatar: null,
          is_filled: false,
          confirmation_status: 'pending'
        })
        .eq('id', spotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
      toast({
        title: 'Staff unassigned',
        description: 'Staff member has been removed from the spot'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to unassign staff',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  });
};

/**
 * Unassign a comedian from a spot
 */
export const useUnassignComedianFromSpot = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spotId,
      eventId
    }: {
      spotId: string;
      eventId: string;
    }) => {
      const { data, error } = await supabase
        .from('event_spots')
        .update({
          comedian_id: null,
          directory_profile_id: null, // Also clear directory profile
          is_filled: false,
          confirmation_status: 'pending'
        })
        .eq('id', spotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
      toast({
        title: 'Comedian unassigned',
        description: 'Comedian has been removed from the spot'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to unassign comedian',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  });
};

/**
 * Assign an unclaimed directory profile to an existing spot
 * Used for pre-launch lineup building with profiles that haven't been claimed yet
 */
export const useAssignDirectoryProfileToSpot = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spotId,
      directoryProfileId,
      eventId
    }: {
      spotId: string;
      directoryProfileId: string;
      eventId: string;
    }) => {
      const { data, error } = await supabase
        .from('event_spots')
        .update({
          directory_profile_id: directoryProfileId,
          comedian_id: null, // Clear comedian_id (mutually exclusive)
          is_filled: true,
          confirmation_status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', spotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
      toast({
        title: 'Profile assigned',
        description: 'Directory profile has been assigned to the spot'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to assign profile',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  });
};

/**
 * Create a new spot and assign a directory profile in one operation
 */
export const useCreateAndAssignDirectoryProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      directoryProfileId,
      spotType = 'Spot',
      duration = 5,
      position
    }: {
      eventId: string;
      directoryProfileId: string;
      spotType?: string;
      duration?: number;
      position?: number;
    }) => {
      let spotOrder: number;

      if (position !== undefined) {
        spotOrder = position;
      } else {
        // Get the next spot order (append to end)
        const { data: existingSpots, error: fetchError } = await supabase
          .from('event_spots')
          .select('spot_order')
          .eq('event_id', eventId)
          .order('spot_order', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        spotOrder = existingSpots && existingSpots.length > 0
          ? (existingSpots[0].spot_order || 0) + 1
          : 1;
      }

      // Create the spot with directory profile assigned
      const { data, error } = await supabase
        .from('event_spots')
        .insert({
          event_id: eventId,
          spot_name: spotType,
          spot_order: spotOrder,
          directory_profile_id: directoryProfileId,
          duration_minutes: duration,
          is_filled: true,
          confirmation_status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', variables.eventId] });
      toast({
        title: 'Spot created',
        description: 'New spot created with directory profile assigned'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create spot',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  });
};
