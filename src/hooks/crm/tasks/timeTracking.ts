import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { timeTrackingService } from '@/services/task';

export function useTimeTracking(taskId: string) {
  const queryClient = useQueryClient();

  const startTimer = useMutation({
    mutationFn: (description?: string) => timeTrackingService.startTimer(taskId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-time-entries', taskId] });
      toast({
        title: 'Timer started',
        description: 'Time tracking has started for this task.',
      });
    },
  });

  const stopTimer = useMutation({
    mutationFn: (entryId: string) => timeTrackingService.stopTimer(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-time-entries', taskId] });
      toast({
        title: 'Timer stopped',
        description: 'Time tracking has been stopped and recorded.',
      });
    },
  });

  const timeEntries = useQuery({
    queryKey: ['task-time-entries', taskId],
    queryFn: () => timeTrackingService.getTaskTimeEntries(taskId),
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000,
  });

  return {
    startTimer: startTimer.mutate,
    stopTimer: stopTimer.mutate,
    timeEntries: timeEntries.data || [],
    isStartingTimer: startTimer.isPending,
    isStoppingTimer: stopTimer.isPending,
    isLoadingEntries: timeEntries.isLoading,
  };
}
