import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deadlineMonitoringService } from '@/services/deadlineMonitoringService';
import { useToast } from '@/hooks/use-toast';

interface UseDeadlineMonitoringOptions {
  promoterId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useDeadlineMonitoring({ 
  promoterId, 
  autoRefresh = true, 
  refreshInterval = 120000 // 2 minutes
}: UseDeadlineMonitoringOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Query for dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['deadline-monitoring', promoterId],
    queryFn: () => deadlineMonitoringService.getMonitoringDashboard(promoterId),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 60000, // Consider data stale after 1 minute
  });

  // Mutation for extending deadlines
  const extendDeadlineMutation = useMutation({
    mutationFn: ({ 
      spotId, 
      newDeadline, 
      reason 
    }: { 
      spotId: string; 
      newDeadline: Date; 
      reason?: string 
    }) => deadlineMonitoringService.extendDeadline(spotId, newDeadline, promoterId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadline-monitoring', promoterId] });
      toast({
        title: 'Success',
        description: 'Deadline extended successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to extend deadline',
        variant: 'destructive',
      });
    },
  });

  // Start monitoring service
  const startMonitoring = useCallback(() => {
    if (!isMonitoring) {
      deadlineMonitoringService.startMonitoring();
      setIsMonitoring(true);
      toast({
        title: 'Monitoring Started',
        description: 'Deadline monitoring service is now active',
      });
    }
  }, [isMonitoring, toast]);

  // Stop monitoring service
  const stopMonitoring = useCallback(() => {
    if (isMonitoring) {
      deadlineMonitoringService.stopMonitoring();
      setIsMonitoring(false);
      toast({
        title: 'Monitoring Stopped',
        description: 'Deadline monitoring service has been stopped',
      });
    }
  }, [isMonitoring, toast]);

  // Manual check for expired deadlines
  const checkExpiredDeadlines = useCallback(async () => {
    try {
      const result = await deadlineMonitoringService.checkExpiredDeadlines();
      
      if (result.expired > 0) {
        toast({
          title: 'Deadlines Processed',
          description: `${result.expired} expired spots have been processed`,
        });
        
        // Refresh dashboard
        refetch();
      }
      
      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check expired deadlines',
        variant: 'destructive',
      });
      throw error;
    }
  }, [refetch, toast]);

  // Get spots by urgency
  const getSpotsByUrgency = useCallback((urgency: 'critical' | 'urgent' | 'upcoming') => {
    if (!dashboardData?.events) return [];
    
    const now = new Date();
    const spots: any[] = [];
    
    dashboardData.events.forEach(event => {
      event.event_spots?.forEach(spot => {
        if (spot.confirmation_status === 'pending' && spot.confirmation_deadline) {
          const deadline = new Date(spot.confirmation_deadline);
          const hoursUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          let matchesUrgency = false;
          switch (urgency) {
            case 'critical':
              matchesUrgency = hoursUntil <= 1 && hoursUntil > 0;
              break;
            case 'urgent':
              matchesUrgency = hoursUntil <= 6 && hoursUntil > 1;
              break;
            case 'upcoming':
              matchesUrgency = hoursUntil <= 24 && hoursUntil > 6;
              break;
          }
          
          if (matchesUrgency) {
            spots.push({
              ...spot,
              event: {
                id: event.id,
                title: event.title,
                event_date: event.event_date
              },
              hoursUntilDeadline: hoursUntil
            });
          }
        }
      });
    });
    
    return spots.sort((a, b) => a.hoursUntilDeadline - b.hoursUntilDeadline);
  }, [dashboardData]);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    // Data
    dashboardData,
    stats: dashboardData?.stats || {
      total_pending: 0,
      expiring_24h: 0,
      expiring_6h: 0,
      expired_today: 0,
      confirmed_today: 0
    },
    events: dashboardData?.events || [],
    lastUpdated: dashboardData?.lastUpdated ? new Date(dashboardData.lastUpdated) : null,
    
    // Loading states
    isLoading,
    error,
    isMonitoring,
    
    // Actions
    refetch,
    startMonitoring,
    stopMonitoring,
    checkExpiredDeadlines,
    extendDeadline: extendDeadlineMutation.mutate,
    isExtending: extendDeadlineMutation.isPending,
    
    // Utilities
    getSpotsByUrgency,
  };
}
