import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketReconciliationService } from '@/services/ticketReconciliationService';
import { PlatformType } from '@/types/ticketSales';

export function useReconciliation(eventId: string) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reconciliation stats
  const { data: reconciliationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['reconciliation-stats', eventId],
    queryFn: () => ticketReconciliationService.getReconciliationStats(eventId),
    enabled: !!eventId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch reconciliation history
  const { data: reconciliationHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['reconciliation-history', eventId],
    queryFn: () => ticketReconciliationService.getReconciliationHistory(eventId),
    enabled: !!eventId,
  });

  // Fetch unresolved discrepancies
  const { data: unresolvedDiscrepancies, isLoading: discrepanciesLoading } = useQuery({
    queryKey: ['unresolved-discrepancies', eventId],
    queryFn: () => ticketReconciliationService.getUnresolvedDiscrepancies(eventId),
    enabled: !!eventId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Run reconciliation mutation
  const runReconciliationMutation = useMutation({
    mutationFn: async (platform?: PlatformType) => {
      return await ticketReconciliationService.reconcileEvent(eventId, platform);
    },
    onSuccess: () => {
      // Invalidate all reconciliation queries
      queryClient.invalidateQueries({ queryKey: ['reconciliation-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-history', eventId] });
      queryClient.invalidateQueries({ queryKey: ['unresolved-discrepancies', eventId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-sales'] });
    },
  });

  // Resolve discrepancy mutation
  const resolveDiscrepancyMutation = useMutation({
    mutationFn: async ({
      discrepancyId,
      resolution,
      notes,
    }: {
      discrepancyId: string;
      resolution: 'ignored' | 'platform_updated' | 'manual_review';
      notes: string;
    }) => {
      return await ticketReconciliationService.manuallyResolveDiscrepancy(
        discrepancyId,
        resolution,
        notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unresolved-discrepancies', eventId] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-stats', eventId] });
    },
  });

  // Manual adjustment mutation
  const createManualAdjustmentMutation = useMutation({
    mutationFn: async ({
      platform,
      adjustment,
    }: {
      platform: PlatformType;
      adjustment: {
        type: 'add_sale' | 'remove_sale' | 'update_amount';
        saleId?: string;
        data?: any;
        reason: string;
      };
    }) => {
      return await ticketReconciliationService.createManualAdjustment(
        eventId,
        platform,
        adjustment
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-sales'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-stats', eventId] });
    },
  });

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reconciliation-stats', eventId] }),
      queryClient.invalidateQueries({ queryKey: ['reconciliation-history', eventId] }),
      queryClient.invalidateQueries({ queryKey: ['unresolved-discrepancies', eventId] }),
    ]);
  };

  useEffect(() => {
    setIsLoading(statsLoading || historyLoading || discrepanciesLoading);
  }, [statsLoading, historyLoading, discrepanciesLoading]);

  return {
    // Data
    reconciliationStats,
    reconciliationHistory,
    unresolvedDiscrepancies,
    isLoading,
    
    // Mutations
    runReconciliation: runReconciliationMutation.mutate,
    resolveDiscrepancy: (discrepancyId: string, resolution: any, notes: string) =>
      resolveDiscrepancyMutation.mutate({ discrepancyId, resolution, notes }),
    createManualAdjustment: createManualAdjustmentMutation.mutate,
    
    // Loading states
    isReconciling: runReconciliationMutation.isPending,
    isResolving: resolveDiscrepancyMutation.isPending,
    isAdjusting: createManualAdjustmentMutation.isPending,
    
    // Utilities
    refreshData,
  };
}

// Hook for automated reconciliation scheduling
export function useReconciliationSchedule(eventId: string, intervalMinutes: number = 60) {
  useEffect(() => {
    if (!eventId || intervalMinutes <= 0) return;

    // Set up periodic reconciliation
    const interval = setInterval(async () => {
      try {
        await ticketReconciliationService.reconcileEvent(eventId);
        console.log(`Automated reconciliation completed for event ${eventId}`);
      } catch (error) {
        console.error(`Automated reconciliation failed for event ${eventId}:`, error);
      }
    }, intervalMinutes * 60 * 1000);

    // Run initial reconciliation
    ticketReconciliationService.reconcileEvent(eventId).catch(console.error);

    return () => clearInterval(interval);
  }, [eventId, intervalMinutes]);
}

// Hook for reconciliation alerts
export function useReconciliationAlerts(eventId: string) {
  const { unresolvedDiscrepancies } = useReconciliation(eventId);
  const [hasAlerted, setHasAlerted] = useState(false);

  useEffect(() => {
    if (!unresolvedDiscrepancies || unresolvedDiscrepancies.length === 0) {
      setHasAlerted(false);
      return;
    }

    const criticalCount = unresolvedDiscrepancies.filter(
      (d: any) => d.severity === 'critical' || d.severity === 'high'
    ).length;

    if (criticalCount > 0 && !hasAlerted) {
      // Could integrate with notification system here
      console.warn(`${criticalCount} critical discrepancies found for event ${eventId}`);
      setHasAlerted(true);
    }
  }, [unresolvedDiscrepancies, eventId, hasAlerted]);

  return {
    criticalDiscrepancies: unresolvedDiscrepancies?.filter(
      (d: any) => d.severity === 'critical' || d.severity === 'high'
    ),
    totalDiscrepancies: unresolvedDiscrepancies?.length || 0,
  };
}