/**
 * useDealStats Hook
 *
 * Fetches and calculates deal statistics for an event with revenue visibility rules:
 * - Event owners see all deals
 * - Participants only see deals they're in AND where all participants have confirmed
 * - Counts deals by status (draft, pending approval, fully approved, settled)
 * - Calculates total revenue, settled revenue, pending revenue
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DealStats {
  totalDeals: number;
  draftDeals: number;
  pendingDeals: number;
  approvedDeals: number;
  settledDeals: number;
  totalRevenue: number;
  settledRevenue: number;
  pendingRevenue: number;
}

export function useDealStats(eventId: string, userId: string, isOwner: boolean) {
  return useQuery<DealStats>({
    queryKey: ['deal-stats', eventId, userId],
    queryFn: async () => {
      const { data: deals, error } = await supabase
        .from('event_deals')
        .select(`
          id,
          status,
          total_revenue,
          deal_participants (
            participant_id,
            split_type,
            approval_status,
            split_percentage,
            flat_fee_amount,
            door_split_percentage,
            guaranteed_minimum
          )
        `)
        .eq('event_id', eventId);

      if (error) {
        console.error('Failed to fetch deal stats:', error);
        throw new Error(`Failed to fetch deal stats: ${error.message}`);
      }

      // Apply revenue visibility rules
      let visibleDeals = deals || [];
      if (!isOwner) {
        visibleDeals = (deals || []).filter((deal: any) => {
          const isParticipant = deal.deal_participants.some((p: any) => p.participant_id === userId);
          if (!isParticipant) return false;
          const allConfirmed = deal.deal_participants.every((p: any) => p.approval_status === 'approved');
          return allConfirmed;
        });
      }

      // Calculate statistics
      const totalDeals = visibleDeals.length;

      const draftDeals = visibleDeals.filter(
        (deal: any) => deal.status === 'draft'
      ).length;

      const pendingDeals = visibleDeals.filter(
        (deal: any) => deal.status === 'pending_approval'
      ).length;

      const approvedDeals = visibleDeals.filter(
        (deal: any) => deal.status === 'fully_approved'
      ).length;

      const settledDeals = visibleDeals.filter(
        (deal: any) => deal.status === 'settled'
      ).length;

      const totalRevenue = visibleDeals.reduce(
        (sum: number, deal: any) => sum + (deal.total_revenue || 0),
        0
      );

      const settledRevenue = visibleDeals.reduce((sum: number, deal: any) => {
        if (deal.status === 'settled') {
          return sum + (deal.total_revenue || 0);
        }
        return sum;
      }, 0);

      const pendingRevenue = visibleDeals.reduce((sum: number, deal: any) => {
        if (deal.status === 'pending_approval' || deal.status === 'fully_approved') {
          return sum + (deal.total_revenue || 0);
        }
        return sum;
      }, 0);

      return {
        totalDeals,
        draftDeals,
        pendingDeals,
        approvedDeals,
        settledDeals,
        totalRevenue,
        settledRevenue,
        pendingRevenue,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
