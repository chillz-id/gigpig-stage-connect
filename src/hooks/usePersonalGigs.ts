import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PersonalGig {
  id: string;
  user_id: string;
  title: string;
  venue: string | null;
  date: string;
  end_time: string | null;
  notes: string | null;
  source: 'manual' | 'google_import';
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonalGigData {
  title: string;
  venue?: string;
  date: Date;
  endTime?: string;
  notes?: string;
  source?: 'manual' | 'google_import';
  googleEventId?: string;
}

export interface UpdatePersonalGigData {
  id: string;
  title?: string;
  venue?: string;
  date?: Date;
  endTime?: string;
  notes?: string;
}

/**
 * usePersonalGigs Hook
 *
 * Provides CRUD operations for personal gigs:
 * - Fetch personal gigs for authenticated user
 * - Create new personal gigs (manual or Google import)
 * - Update existing personal gigs
 * - Delete personal gigs
 * - Real-time cache invalidation
 * - Error handling with toast notifications
 */
export const usePersonalGigs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch personal gigs for current user
  const {
    data: personalGigs = [],
    isLoading: isFetching,
    error: fetchError,
  } = useQuery({
    queryKey: ['personal-gigs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('personal_gigs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as PersonalGig[];
    },
  });

  // Create personal gig mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreatePersonalGigData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newGig, error } = await supabase
        .from('personal_gigs')
        .insert({
          user_id: user.id,
          title: data.title,
          venue: data.venue || null,
          date: data.date.toISOString(),
          end_time: data.endTime || null,
          notes: data.notes || null,
          source: data.source || 'manual',
          google_event_id: data.googleEventId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return newGig as PersonalGig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-gigs'] });
      toast({
        title: 'Gig added',
        description: 'Personal gig has been added to your calendar',
      });
    },
    onError: (error: Error) => {
      console.error('Error creating personal gig:', error);
      toast({
        title: 'Failed to add gig',
        description: error.message || 'An error occurred while adding the gig',
        variant: 'destructive',
      });
    },
  });

  // Update personal gig mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdatePersonalGigData) => {
      const updateData: Partial<PersonalGig> = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.venue !== undefined) updateData.venue = data.venue || null;
      if (data.date !== undefined) updateData.date = data.date.toISOString();
      if (data.endTime !== undefined) updateData.end_time = data.endTime || null;
      if (data.notes !== undefined) updateData.notes = data.notes || null;

      const { data: updatedGig, error } = await supabase
        .from('personal_gigs')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return updatedGig as PersonalGig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-gigs'] });
      toast({
        title: 'Gig updated',
        description: 'Personal gig has been updated successfully',
      });
    },
    onError: (error: Error) => {
      console.error('Error updating personal gig:', error);
      toast({
        title: 'Failed to update gig',
        description: error.message || 'An error occurred while updating the gig',
        variant: 'destructive',
      });
    },
  });

  // Delete personal gig mutation
  const deleteMutation = useMutation({
    mutationFn: async (gigId: string) => {
      const { error } = await supabase
        .from('personal_gigs')
        .delete()
        .eq('id', gigId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-gigs'] });
      toast({
        title: 'Gig deleted',
        description: 'Personal gig has been removed from your calendar',
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting personal gig:', error);
      toast({
        title: 'Failed to delete gig',
        description: error.message || 'An error occurred while deleting the gig',
        variant: 'destructive',
      });
    },
  });

  // Helper function to create personal gig
  const createPersonalGig = async (data: CreatePersonalGigData): Promise<PersonalGig | null> => {
    setIsLoading(true);
    try {
      const result = await createMutation.mutateAsync(data);
      return result;
    } catch (error) {
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to update personal gig
  const updatePersonalGig = async (data: UpdatePersonalGigData): Promise<PersonalGig | null> => {
    setIsLoading(true);
    try {
      const result = await updateMutation.mutateAsync(data);
      return result;
    } catch (error) {
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to delete personal gig
  const deletePersonalGig = async (gigId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await deleteMutation.mutateAsync(gigId);
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    personalGigs,
    isLoading: isLoading || isFetching,
    error: fetchError,
    createPersonalGig,
    updatePersonalGig,
    deletePersonalGig,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
