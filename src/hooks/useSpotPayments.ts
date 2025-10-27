/**
 * useSpotPayments Hook
 *
 * React Query hook for managing spot payments and tax calculations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { eventSpotService, type EventSpot } from '@/services/event/spot-service';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const spotPaymentsKeys = {
  all: ['spot-payments'] as const,
  byEvent: (eventId: string) => [...spotPaymentsKeys.all, 'event', eventId] as const,
  unpaid: (eventId: string) => [...spotPaymentsKeys.all, 'unpaid', eventId] as const,
  stats: (eventId: string) => [...spotPaymentsKeys.all, 'stats', eventId] as const
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all spots for an event (includes payment info)
 */
export function useEventSpots(eventId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: spotPaymentsKeys.byEvent(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      return eventSpotService.listByEvent(eventId);
    },
    enabled: !!eventId,
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
          title: 'Error loading spots',
          description: 'Failed to load event spots. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch unpaid spots for an event
 */
export function useUnpaidSpots(eventId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: spotPaymentsKeys.unpaid(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      return eventSpotService.getUnpaidSpots(eventId);
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000, // 2 minutes (payment status changes frequently)
    gcTime: 5 * 60 * 1000,
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading unpaid spots',
          description: 'Failed to load unpaid spots. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch payment statistics for an event
 */
export function usePaymentStats(eventId: string | undefined) {
  return useQuery({
    queryKey: spotPaymentsKeys.stats(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      return eventSpotService.getPaymentStats(eventId);
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update payment details for a spot
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      spotId,
      payment
    }: {
      spotId: string;
      payment: {
        payment_amount: number;
        tax_included: boolean;
        tax_rate: number;
        payment_notes?: string;
        payment_status?: 'unpaid' | 'pending' | 'paid' | 'partially_paid' | 'refunded';
      };
    }) => eventSpotService.updatePayment(spotId, payment),
    onMutate: async ({ spotId }) => {
      // Get event ID from spot (need to fetch it first)
      const spots = queryClient.getQueriesData<EventSpot[]>({ queryKey: spotPaymentsKeys.all });
      let eventId: string | undefined;

      for (const [key, data] of spots) {
        if (data) {
          const spot = data.find((s) => s.id === spotId);
          if (spot) {
            eventId = spot.event_id;
            break;
          }
        }
      }

      return { eventId };
    },
    onSuccess: (data, variables, context) => {
      if (context?.eventId) {
        // Invalidate all spot queries for this event
        queryClient.invalidateQueries({
          queryKey: spotPaymentsKeys.byEvent(context.eventId)
        });
        queryClient.invalidateQueries({
          queryKey: spotPaymentsKeys.unpaid(context.eventId)
        });
        queryClient.invalidateQueries({
          queryKey: spotPaymentsKeys.stats(context.eventId)
        });
      }
      toast({
        title: 'Payment updated',
        description: 'Payment details have been updated successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error updating payment',
        description: error.message || 'Failed to update payment. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Mark spot as paid
 */
export function useMarkAsPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ spotId, eventId }: { spotId: string; eventId: string }) =>
      eventSpotService.markAsPaid(spotId).then(() => eventId),
    onSuccess: (eventId) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.byEvent(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.unpaid(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.stats(eventId)
      });
      toast({
        title: 'Marked as paid',
        description: 'Spot has been marked as paid.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error marking as paid',
        description: error.message || 'Failed to mark as paid. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Bulk update payment status
 */
export function useBulkUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      spotIds,
      status,
      eventId
    }: {
      spotIds: string[];
      status: 'unpaid' | 'pending' | 'paid' | 'partially_paid' | 'refunded';
      eventId: string;
    }) => eventSpotService.bulkUpdatePaymentStatus(spotIds, status).then(() => ({ count: spotIds.length, eventId })),
    onSuccess: ({ count, eventId }) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.byEvent(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.unpaid(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.stats(eventId)
      });
      toast({
        title: 'Payment status updated',
        description: `${count} spots have been updated.`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error updating payment status',
        description: error.message || 'Failed to update payment status. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Toggle tax included/excluded for a spot
 */
export function useToggleTaxIncluded() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ spotId, eventId }: { spotId: string; eventId: string }) =>
      eventSpotService.toggleTaxIncluded(spotId).then(() => eventId),
    onSuccess: (eventId) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.byEvent(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.stats(eventId)
      });
      toast({
        title: 'Tax setting updated',
        description: 'Tax included/excluded setting has been toggled.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error toggling tax setting',
        description: error.message || 'Failed to toggle tax setting. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Apply tax rate to all spots in an event
 */
export function useApplyTaxRateToEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      eventId,
      taxRate,
      taxIncluded
    }: {
      eventId: string;
      taxRate: number;
      taxIncluded: boolean;
    }) => eventSpotService.applyTaxRateToEvent(eventId, taxRate, taxIncluded),
    onSuccess: (_data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.byEvent(variables.eventId)
      });
      queryClient.invalidateQueries({
        queryKey: spotPaymentsKeys.stats(variables.eventId)
      });
      toast({
        title: 'Tax rate applied',
        description: 'Tax rate has been applied to all spots in the event.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error applying tax rate',
        description: error.message || 'Failed to apply tax rate. Please try again.'
      });
    },
    retry: 1
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate tax breakdown (client-side utility)
 */
export function calculateTaxBreakdown(
  amount: number,
  taxIncluded: boolean,
  taxRate: number
): { gross: number; net: number; tax: number } {
  return eventSpotService.calculateTaxBreakdown(amount, taxIncluded, taxRate);
}
