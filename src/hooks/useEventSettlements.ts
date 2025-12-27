/**
 * useEventSettlements Hook
 *
 * Calculates and manages event settlements including:
 * - Spot payments (paid spots to comedians)
 * - Deal settlements (revenue sharing with partners)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SpotSettlement {
  id: string;
  spot_name: string;
  comedian_id: string | null;
  comedian_name: string | null;
  payment_amount: number;
  payment_gross: number | null;
  payment_net: number | null;
  payment_tax: number | null;
  payment_status: 'unpaid' | 'pending' | 'paid';
  is_paid: boolean;
  gst_mode: string;
}

export interface DealSettlement {
  id: string;
  deal_title: string;
  deal_type: string;
  total_amount: number;
  status: string;
  participants: DealParticipant[];
}

export interface DealParticipant {
  id: string;
  user_id: string;
  user_name: string;
  split_amount: number;
  split_percentage: number;
  approval_status: string;
}

export interface SettlementSummary {
  // Spot settlements
  totalSpotsPending: number;
  totalSpotsSettled: number;
  spotsCount: number;
  settledSpotsCount: number;

  // Deal settlements
  totalDealsPending: number;
  totalDealsSettled: number;
  dealsCount: number;
  settledDealsCount: number;

  // Combined
  totalPending: number;
  totalSettled: number;
  grandTotal: number;
}

/**
 * Fetch settlement data for an event
 */
export function useEventSettlements(eventId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['event-settlements', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');

      // Fetch spots with comedian names
      const { data: spots, error: spotsError } = await supabase
        .from('event_spots')
        .select(`
          id,
          spot_name,
          comedian_id,
          payment_amount,
          payment_gross,
          payment_net,
          payment_tax,
          payment_status,
          is_paid,
          gst_mode
        `)
        .eq('event_id', eventId)
        .eq('is_paid', true)
        .order('spot_order', { ascending: true });

      if (spotsError) {
        console.error('Error fetching spots:', spotsError);
        throw spotsError;
      }

      // Fetch comedian names for spots
      const comedianIds = (spots || [])
        .filter(s => s.comedian_id)
        .map(s => s.comedian_id);

      let comedianNames: Record<string, string> = {};
      if (comedianIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, stage_name, first_name, last_name')
          .in('id', comedianIds);

        if (profiles) {
          comedianNames = profiles.reduce((acc, p) => {
            acc[p.id] = p.stage_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown';
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Transform spots into settlements
      const spotSettlements: SpotSettlement[] = (spots || []).map(spot => ({
        id: spot.id,
        spot_name: spot.spot_name,
        comedian_id: spot.comedian_id,
        comedian_name: spot.comedian_id ? comedianNames[spot.comedian_id] || 'Unknown' : null,
        payment_amount: spot.payment_amount || 0,
        payment_gross: spot.payment_gross,
        payment_net: spot.payment_net,
        payment_tax: spot.payment_tax,
        payment_status: (spot.payment_status as 'unpaid' | 'pending' | 'paid') || 'unpaid',
        is_paid: spot.is_paid,
        gst_mode: spot.gst_mode || 'none',
      }));

      // Calculate summary
      const totalSpotsPending = spotSettlements
        .filter(s => s.payment_status !== 'paid')
        .reduce((sum, s) => sum + (s.payment_gross || s.payment_amount || 0), 0);

      const totalSpotsSettled = spotSettlements
        .filter(s => s.payment_status === 'paid')
        .reduce((sum, s) => sum + (s.payment_gross || s.payment_amount || 0), 0);

      const settledSpotsCount = spotSettlements.filter(s => s.payment_status === 'paid').length;

      // TODO: Add deal settlements when event_deals table is available
      const dealSettlements: DealSettlement[] = [];
      const totalDealsPending = 0;
      const totalDealsSettled = 0;
      const settledDealsCount = 0;

      const summary: SettlementSummary = {
        totalSpotsPending,
        totalSpotsSettled,
        spotsCount: spotSettlements.length,
        settledSpotsCount,
        totalDealsPending,
        totalDealsSettled,
        dealsCount: dealSettlements.length,
        settledDealsCount,
        totalPending: totalSpotsPending + totalDealsPending,
        totalSettled: totalSpotsSettled + totalDealsSettled,
        grandTotal: totalSpotsPending + totalSpotsSettled + totalDealsPending + totalDealsSettled,
      };

      return {
        spots: spotSettlements,
        deals: dealSettlements,
        summary,
      };
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Settle a spot payment (mark as paid)
 */
export function useSettleSpot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ spotId, eventId }: { spotId: string; eventId: string }) => {
      const { data, error } = await supabase
        .from('event_spots')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', spotId)
        .select()
        .single();

      if (error) throw error;
      return { spot: data, eventId };
    },
    onSuccess: ({ eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-settlements', eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      toast({
        title: 'Spot settled',
        description: 'Payment has been marked as settled.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error settling spot',
        description: error.message || 'Failed to settle spot payment.',
      });
    },
  });
}

/**
 * Batch settle multiple spots
 */
export function useBatchSettleSpots() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ spotIds, eventId }: { spotIds: string[]; eventId: string }) => {
      const { data, error } = await supabase
        .from('event_spots')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .in('id', spotIds)
        .select();

      if (error) throw error;
      return { spots: data, eventId, count: spotIds.length };
    },
    onSuccess: ({ eventId, count }) => {
      queryClient.invalidateQueries({ queryKey: ['event-settlements', eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      toast({
        title: 'Spots settled',
        description: `${count} payment(s) have been marked as settled.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error settling spots',
        description: error.message || 'Failed to settle spot payments.',
      });
    },
  });
}

/**
 * Revert a spot settlement (mark as unpaid)
 */
export function useRevertSpotSettlement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ spotId, eventId }: { spotId: string; eventId: string }) => {
      const { data, error } = await supabase
        .from('event_spots')
        .update({
          payment_status: 'unpaid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', spotId)
        .select()
        .single();

      if (error) throw error;
      return { spot: data, eventId };
    },
    onSuccess: ({ eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-settlements', eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      toast({
        title: 'Settlement reverted',
        description: 'Payment has been marked as unpaid.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error reverting settlement',
        description: error.message || 'Failed to revert spot settlement.',
      });
    },
  });
}
