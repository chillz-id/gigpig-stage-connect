/**
 * useEventDeals Hook
 *
 * React Query hook for managing event deals.
 * Provides data fetching, mutations, and workflow actions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getDealsByEvent,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  submitDealForApproval,
  cancelDeal,
  settleDeal,
  calculateDealSplits,
  updateParticipantCalculations,
  getDealStatsByEvent,
  validateDealForSubmission,
  validateDealForSettlement,
  type EventDeal,
  type EventDealWithDetails,
  type CreateDealInput,
  type UpdateDealInput,
  type DealStats,
  type DealCalculation
} from '@/services/eventDealService';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const eventDealsKeys = {
  all: ['event-deals'] as const,
  byEvent: (eventId: string) => [...eventDealsKeys.all, 'event', eventId] as const,
  detail: (dealId: string) => [...eventDealsKeys.all, 'detail', dealId] as const,
  stats: (eventId: string) => [...eventDealsKeys.all, 'stats', eventId] as const,
  calculations: (dealId: string) => [...eventDealsKeys.all, 'calculations', dealId] as const
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all deals for an event
 */
export function useEventDeals(eventId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: eventDealsKeys.byEvent(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      return getDealsByEvent(eventId);
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST116') return false; // Don't retry on not found
      return failureCount < 3;
    },
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading deals',
          description: 'Failed to load event deals. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch a single deal by ID
 */
export function useEventDeal(dealId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: eventDealsKeys.detail(dealId || ''),
    queryFn: async () => {
      if (!dealId) throw new Error('Deal ID is required');
      return getDealById(dealId);
    },
    enabled: !!dealId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    },
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading deal',
          description: 'Failed to load deal details. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch deal statistics for an event
 */
export function useEventDealStats(eventId: string | undefined) {
  return useQuery({
    queryKey: eventDealsKeys.stats(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      return getDealStatsByEvent(eventId);
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000, // 2 minutes (stats change frequently)
    gcTime: 5 * 60 * 1000
  });
}

/**
 * Fetch deal split calculations
 */
export function useDealCalculations(dealId: string | undefined) {
  return useQuery({
    queryKey: eventDealsKeys.calculations(dealId || ''),
    queryFn: async () => {
      if (!dealId) throw new Error('Deal ID is required');
      return calculateDealSplits(dealId);
    },
    enabled: !!dealId,
    staleTime: 30 * 1000, // 30 seconds (calculations should be fresh)
    gcTime: 2 * 60 * 1000
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ input, userId }: { input: CreateDealInput; userId: string }) =>
      createDeal(input, userId),
    onSuccess: (data) => {
      // Invalidate deals list for the event
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.byEvent(data.event_id)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.stats(data.event_id)
      });
      toast({
        title: 'Deal created',
        description: `"${data.deal_name}" has been created successfully.`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error creating deal',
        description: error.message || 'Failed to create deal. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Update an existing deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ dealId, input }: { dealId: string; input: UpdateDealInput }) =>
      updateDeal(dealId, input),
    onMutate: async ({ dealId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: eventDealsKeys.detail(dealId) });

      // Snapshot previous value
      const previousDeal = queryClient.getQueryData<EventDealWithDetails>(
        eventDealsKeys.detail(dealId)
      );

      return { previousDeal };
    },
    onSuccess: (data) => {
      // Update detail cache
      queryClient.setQueryData(eventDealsKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.byEvent(data.event_id)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.stats(data.event_id)
      });
      toast({
        title: 'Deal updated',
        description: 'Deal has been updated successfully.'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousDeal) {
        queryClient.setQueryData(
          eventDealsKeys.detail(variables.dealId),
          context.previousDeal
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error updating deal',
        description: error.message || 'Failed to update deal. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Delete a deal
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ dealId, eventId }: { dealId: string; eventId: string }) =>
      deleteDeal(dealId).then(() => eventId),
    onSuccess: (eventId) => {
      // Invalidate deals list
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.byEvent(eventId)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.stats(eventId)
      });
      toast({
        title: 'Deal deleted',
        description: 'Deal has been deleted successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error deleting deal',
        description: error.message || 'Failed to delete deal. Please try again.'
      });
    },
    retry: 1
  });
}

// ============================================================================
// WORKFLOW ACTIONS
// ============================================================================

/**
 * Submit deal for approval
 */
export function useSubmitDealForApproval() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dealId: string) => {
      // Validate before submission
      const validation = await validateDealForSubmission(dealId);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return submitDealForApproval(dealId);
    },
    onSuccess: (data) => {
      // Update detail cache
      queryClient.setQueryData(eventDealsKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.byEvent(data.event_id)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.stats(data.event_id)
      });
      toast({
        title: 'Deal submitted',
        description: 'Deal has been submitted for approval.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Cannot submit deal',
        description: error.message || 'Failed to submit deal for approval.'
      });
    },
    retry: 1
  });
}

/**
 * Cancel a deal
 */
export function useCancelDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ dealId, userId, reason }: { dealId: string; userId: string; reason?: string }) =>
      cancelDeal(dealId, userId, reason),
    onSuccess: (data) => {
      // Update detail cache
      queryClient.setQueryData(eventDealsKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.byEvent(data.event_id)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.stats(data.event_id)
      });
      toast({
        title: 'Deal cancelled',
        description: 'Deal has been cancelled.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error cancelling deal',
        description: error.message || 'Failed to cancel deal. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Settle a deal (finalize and generate invoices)
 */
export function useSettleDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dealId, userId }: { dealId: string; userId: string }) => {
      // Validate before settlement
      const validation = await validateDealForSettlement(dealId);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return settleDeal(dealId, userId);
    },
    onSuccess: (data) => {
      // Update detail cache
      queryClient.setQueryData(eventDealsKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.byEvent(data.event_id)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.stats(data.event_id)
      });
      toast({
        title: 'Deal settled',
        description: 'Deal has been finalized and invoices will be generated.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Cannot settle deal',
        description: error.message || 'Failed to settle deal.'
      });
    },
    retry: 1
  });
}

/**
 * Update participant calculations
 */
export function useUpdateParticipantCalculations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (dealId: string) => updateParticipantCalculations(dealId),
    onSuccess: (_data, dealId) => {
      // Invalidate calculations
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.calculations(dealId)
      });
      // Invalidate deal details
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.detail(dealId)
      });
      toast({
        title: 'Calculations updated',
        description: 'Participant amounts have been recalculated.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error updating calculations',
        description: error.message || 'Failed to update calculations.'
      });
    },
    retry: 1
  });
}
