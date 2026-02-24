/**
 * Schedule Generator Hook
 *
 * React hook for triggering the schedule generator
 * and displaying results via toast notifications.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateSchedule } from '@/services/social/schedule-generator';
import type { GenerateScheduleResult } from '@/services/social/schedule-generator';
import { useToast } from '@/hooks/use-toast';

export function useScheduleGenerator() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation<GenerateScheduleResult, Error, string[] | undefined>({
    mutationFn: (eventIds) => generateSchedule(eventIds),
    onSuccess: (result) => {
      // Invalidate review queue and draft counts so new drafts appear
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['social-draft-counts'] });

      if (result.draftsCreated > 0) {
        toast({
          title: 'Schedule generated',
          description: result.summary,
        });
      } else if (result.draftsSkipped > 0) {
        toast({
          title: 'Schedule up to date',
          description: `All ${result.draftsSkipped} posting windows already have drafts.`,
        });
      } else {
        toast({
          title: 'No drafts created',
          description: result.eventsProcessed === 0
            ? 'No upcoming events found in the next 4 weeks.'
            : 'No new posting windows to generate.',
        });
      }

      if (result.errors.length > 0) {
        toast({
          title: 'Some issues occurred',
          description: result.errors.slice(0, 3).join('; '),
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Schedule generation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    generateSchedule: mutation.mutate,
    isGenerating: mutation.isPending,
    lastResult: mutation.data,
  };
}
