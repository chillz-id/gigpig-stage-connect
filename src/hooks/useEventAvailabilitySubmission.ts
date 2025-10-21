import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  eventAvailabilityService,
  type AvailabilitySubmissionPayload,
  type BulkAvailabilitySubmission,
} from '@/services/event/availability-service';

export type AvailabilitySubmission = AvailabilitySubmissionPayload;

/**
 * Hook to submit comedian availability for events
 * Supports both single and bulk submissions
 */
export function useEventAvailabilitySubmission() {
  const queryClient = useQueryClient();

  const submitBulkMutation = useMutation({
    mutationFn: async (input: BulkAvailabilitySubmission) => {
      try {
        return await eventAvailabilityService.submitBulk(input);
      } catch (error: any) {
        console.error('Error submitting availability:', error);
        throw new Error(`Failed to submit availability: ${error?.message ?? 'Unknown error'}`);
      }
    },
    onSuccess: (data) => {
      toast.success(`Successfully submitted availability for ${data?.length || 0} events`);
      queryClient.invalidateQueries({ queryKey: ['event-availability-submissions'] });
    },
    onError: (error: Error) => {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit availability. Please try again.');
    },
  });

  const submitSingleMutation = useMutation({
    mutationFn: async (submission: AvailabilitySubmission) => {
      try {
        return await eventAvailabilityService.submitSingle(submission);
      } catch (error: any) {
        console.error('Error submitting availability:', error);
        throw new Error(`Failed to submit availability: ${error?.message ?? 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      toast.success('Availability submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['event-availability-submissions'] });
    },
    onError: (error: Error) => {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit availability. Please try again.');
    },
  });

  return {
    submitBulk: submitBulkMutation.mutate,
    submitBulkAsync: submitBulkMutation.mutateAsync,
    submitSingle: submitSingleMutation.mutate,
    submitSingleAsync: submitSingleMutation.mutateAsync,
    isSubmitting: submitBulkMutation.isPending || submitSingleMutation.isPending,
    error: submitBulkMutation.error || submitSingleMutation.error,
  };
}
