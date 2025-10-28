/**
 * useDealParticipants Hook
 *
 * React Query hook for managing deal participants and approval workflows.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getParticipantsByDeal,
  getParticipantById,
  getParticipantHistory,
  addParticipant,
  updateParticipantSplit,
  removeParticipant,
  approveParticipant,
  requestChanges,
  declineParticipation,
  approveAllPendingForUser,
  autoAddComedianManager,
  getPendingApprovalsForUser,
  getParticipantStatsByDeal,
  validateParticipantSplit,
  type DealParticipant,
  type DealParticipantWithDetails,
  type CreateParticipantInput,
  type UpdateParticipantSplitInput,
  type ParticipantHistoryEntry,
  type ParticipantStats
} from '@/services/dealParticipantService';
import { eventDealsKeys } from './useEventDeals';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const dealParticipantsKeys = {
  all: ['deal-participants'] as const,
  byDeal: (dealId: string) => [...dealParticipantsKeys.all, 'deal', dealId] as const,
  detail: (participantId: string) => [...dealParticipantsKeys.all, 'detail', participantId] as const,
  history: (participantId: string) => [...dealParticipantsKeys.all, 'history', participantId] as const,
  pendingForUser: (userId: string) => [...dealParticipantsKeys.all, 'pending', userId] as const,
  stats: (dealId: string) => [...dealParticipantsKeys.all, 'stats', dealId] as const
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all participants for a deal
 */
export function useDealParticipants(dealId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: dealParticipantsKeys.byDeal(dealId || ''),
    queryFn: async () => {
      if (!dealId) throw new Error('Deal ID is required');
      return getParticipantsByDeal(dealId);
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
          title: 'Error loading participants',
          description: 'Failed to load deal participants. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch a single participant by ID
 */
export function useDealParticipant(participantId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: dealParticipantsKeys.detail(participantId || ''),
    queryFn: async () => {
      if (!participantId) throw new Error('Participant ID is required');
      return getParticipantById(participantId);
    },
    enabled: !!participantId,
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
          title: 'Error loading participant',
          description: 'Failed to load participant details. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch participant history (version tracking)
 */
export function useParticipantHistory(participantId: string | undefined) {
  return useQuery({
    queryKey: dealParticipantsKeys.history(participantId || ''),
    queryFn: async () => {
      if (!participantId) throw new Error('Participant ID is required');
      return getParticipantHistory(participantId);
    },
    enabled: !!participantId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

/**
 * Fetch pending approvals for a user
 */
export function usePendingApprovalsForUser(userId: string | undefined) {
  return useQuery({
    queryKey: dealParticipantsKeys.pendingForUser(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return getPendingApprovalsForUser(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes (approval status changes frequently)
    gcTime: 5 * 60 * 1000
  });
}

/**
 * Fetch participant statistics for a deal
 */
export function useParticipantStats(dealId: string | undefined) {
  return useQuery({
    queryKey: dealParticipantsKeys.stats(dealId || ''),
    queryFn: async () => {
      if (!dealId) throw new Error('Deal ID is required');
      return getParticipantStatsByDeal(dealId);
    },
    enabled: !!dealId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add a participant to a deal
 */
export function useAddParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateParticipantInput & { autoAddManager?: boolean }) => {
      // Validate split configuration
      const validation = validateParticipantSplit(input);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const participant = await addParticipant(input);

      // Auto-add manager if this is a comedian and flag is set
      if (input.autoAddManager && input.participant_type === 'comedian') {
        await autoAddComedianManager(input.deal_id, input.participant_id);
      }

      return participant;
    },
    onSuccess: (data) => {
      // Invalidate participants list
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.byDeal(data.deal_id)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.stats(data.deal_id)
      });
      // Invalidate deal calculations
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.calculations(data.deal_id)
      });
      toast({
        title: 'Participant added',
        description: 'Participant has been added to the deal.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error adding participant',
        description: error.message || 'Failed to add participant. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Update participant split terms
 */
export function useUpdateParticipantSplit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ participantId, input }: { participantId: string; input: UpdateParticipantSplitInput }) => {
      // Validate split configuration
      const validation = validateParticipantSplit(input as any);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return updateParticipantSplit(participantId, input);
    },
    onMutate: async ({ participantId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: dealParticipantsKeys.detail(participantId) });

      // Snapshot previous value
      const previousParticipant = queryClient.getQueryData<DealParticipantWithDetails>(
        dealParticipantsKeys.detail(participantId)
      );

      return { previousParticipant };
    },
    onSuccess: (data) => {
      // Update detail cache
      queryClient.setQueryData(dealParticipantsKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.byDeal(data.deal_id)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.stats(data.deal_id)
      });
      // Invalidate history
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.history(data.id)
      });
      toast({
        title: 'Split terms updated',
        description: 'Participant split terms have been updated. Approval status reset to pending.'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousParticipant) {
        queryClient.setQueryData(
          dealParticipantsKeys.detail(variables.participantId),
          context.previousParticipant
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error updating split terms',
        description: error.message || 'Failed to update split terms. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Remove a participant from a deal
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ participantId, dealId }: { participantId: string; dealId: string }) =>
      removeParticipant(participantId).then(() => dealId),
    onSuccess: (dealId) => {
      // Invalidate participants list
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.byDeal(dealId)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.stats(dealId)
      });
      toast({
        title: 'Participant removed',
        description: 'Participant has been removed from the deal.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error removing participant',
        description: error.message || 'Failed to remove participant. Please try again.'
      });
    },
    retry: 1
  });
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Approve participant terms
 */
export function useApproveParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ participantId, userId }: { participantId: string; userId: string }) =>
      approveParticipant(participantId, userId),
    onSuccess: (data) => {
      // Update detail cache
      queryClient.setQueryData(dealParticipantsKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.byDeal(data.deal_id)
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.stats(data.deal_id)
      });
      // Invalidate deal details (status may have changed)
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.detail(data.deal_id)
      });
      toast({
        title: 'Terms approved',
        description: 'You have approved your participation terms.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error approving terms',
        description: error.message || 'Failed to approve terms. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Request changes to participant terms
 */
export function useRequestChanges() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      participantId,
      userId,
      input
    }: {
      participantId: string;
      userId: string;
      input: UpdateParticipantSplitInput;
    }) => requestChanges(participantId, userId, input),
    onSuccess: (data) => {
      // Update detail cache
      queryClient.setQueryData(dealParticipantsKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.byDeal(data.deal_id)
      });
      // Invalidate history
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.history(data.id)
      });
      toast({
        title: 'Changes requested',
        description: 'Your requested changes have been submitted.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error requesting changes',
        description: error.message || 'Failed to request changes. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Decline participation
 */
export function useDeclineParticipation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      participantId,
      userId,
      reason
    }: {
      participantId: string;
      userId: string;
      reason?: string;
    }) => declineParticipation(participantId, userId, reason),
    onSuccess: (data) => {
      // Update detail cache
      queryClient.setQueryData(dealParticipantsKeys.detail(data.id), data);
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.byDeal(data.deal_id)
      });
      // Invalidate deal details
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.detail(data.deal_id)
      });
      toast({
        title: 'Participation declined',
        description: 'You have declined to participate in this deal.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error declining participation',
        description: error.message || 'Failed to decline participation. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Approve all pending terms for a user
 */
export function useApproveAllPendingForUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ dealId, userId }: { dealId: string; userId: string }) =>
      approveAllPendingForUser(dealId, userId),
    onSuccess: (data, variables) => {
      // Invalidate participants list
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.byDeal(variables.dealId)
      });
      // Invalidate deal details
      queryClient.invalidateQueries({
        queryKey: eventDealsKeys.detail(variables.dealId)
      });
      // Invalidate pending approvals
      queryClient.invalidateQueries({
        queryKey: dealParticipantsKeys.pendingForUser(variables.userId)
      });
      toast({
        title: 'All terms approved',
        description: `You have approved ${data.length} participation terms.`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error approving terms',
        description: error.message || 'Failed to approve terms. Please try again.'
      });
    },
    retry: 1
  });
}
