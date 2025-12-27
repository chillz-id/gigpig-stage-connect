import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RecurringType = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface BlockedDate {
  id: string;
  comedian_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  recurring_type: RecurringType | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateBlockedDateData {
  dateStart: Date;
  dateEnd: Date;
  reason: string;
  recurringType?: RecurringType;
}

export interface UpdateBlockedDateData {
  id: string;
  dateStart?: Date;
  dateEnd?: Date;
  reason?: string;
  recurringType?: RecurringType;
}

/**
 * useBlockedDates Hook
 *
 * Provides CRUD operations for blocked dates and times:
 * - Fetch blocked dates for authenticated user
 * - Create new blocked date ranges (with optional time blocks)
 * - Update existing blocked dates
 * - Delete blocked dates
 * - Support for recurring blocks (weekly, monthly, yearly)
 * - Real-time cache invalidation
 * - Error handling with toast notifications
 */
export const useBlockedDates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch blocked dates for current user
  const {
    data: blockedDates = [],
    isLoading: isFetching,
    error: fetchError,
  } = useQuery({
    queryKey: ['blocked-dates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('comedian_blocked_dates')
        .select('*')
        .eq('comedian_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as BlockedDate[];
    },
  });

  // Create blocked date mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateBlockedDateData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newBlock, error } = await supabase
        .from('comedian_blocked_dates')
        .insert({
          comedian_id: user.id,
          start_date: data.dateStart.toISOString().split('T')[0], // DATE format
          end_date: data.dateEnd.toISOString().split('T')[0], // DATE format
          reason: data.reason,
          recurring_type: data.recurringType || 'none',
        })
        .select()
        .single();

      if (error) throw error;
      return newBlock as BlockedDate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast({
        title: 'Dates blocked',
        description: 'Selected dates have been blocked on your calendar',
      });
    },
    onError: (error: Error) => {
      console.error('Error creating blocked dates:', error);
      toast({
        title: 'Failed to block dates',
        description: error.message || 'An error occurred while blocking dates',
        variant: 'destructive',
      });
    },
  });

  // Update blocked date mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateBlockedDateData) => {
      const updateData: Partial<BlockedDate> = {
        updated_at: new Date().toISOString(),
      };

      if (data.dateStart !== undefined) {
        updateData.start_date = data.dateStart.toISOString().split('T')[0];
      }
      if (data.dateEnd !== undefined) {
        updateData.end_date = data.dateEnd.toISOString().split('T')[0];
      }
      if (data.reason !== undefined) {
        updateData.reason = data.reason;
      }
      if (data.recurringType !== undefined) {
        updateData.recurring_type = data.recurringType;
      }

      const { data: updatedBlock, error } = await supabase
        .from('comedian_blocked_dates')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return updatedBlock as BlockedDate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast({
        title: 'Block updated',
        description: 'Blocked dates have been updated successfully',
      });
    },
    onError: (error: Error) => {
      console.error('Error updating blocked dates:', error);
      toast({
        title: 'Failed to update block',
        description: error.message || 'An error occurred while updating the block',
        variant: 'destructive',
      });
    },
  });

  // Delete blocked date mutation
  const deleteMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('comedian_blocked_dates')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast({
        title: 'Block removed',
        description: 'Blocked dates have been removed from your calendar',
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting blocked dates:', error);
      toast({
        title: 'Failed to remove block',
        description: error.message || 'An error occurred while removing the block',
        variant: 'destructive',
      });
    },
  });

  // Helper function to create blocked dates
  const createBlockedDates = async (data: CreateBlockedDateData): Promise<BlockedDate | null> => {
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

  // Helper function to update blocked dates
  const updateBlockedDates = async (data: UpdateBlockedDateData): Promise<BlockedDate | null> => {
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

  // Helper function to delete blocked dates
  const deleteBlockedDates = async (blockId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await deleteMutation.mutateAsync(blockId);
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    blockedDates,
    isLoading: isLoading || isFetching,
    error: fetchError,
    createBlockedDates,
    updateBlockedDates,
    deleteBlockedDates,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
