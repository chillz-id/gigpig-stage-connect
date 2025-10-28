/**
 * useApplicationApproval Hook
 *
 * React Query hook for managing application approval workflows and shortlisting.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getApplicationsByEvent,
  getShortlistedApplications,
  getShortlistStats,
  approveApplication,
  rejectApplication,
  bulkApproveApplications,
  bulkRejectApplications,
  addToShortlist,
  removeFromShortlist,
  bulkAddToShortlist,
  bulkRemoveFromShortlist,
  type ApplicationData,
  type ShortlistStats
} from '@/services/applicationService';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const applicationsKeys = {
  all: ['applications'] as const,
  byEvent: (eventId: string, statusFilter?: string) =>
    [...applicationsKeys.all, 'event', eventId, statusFilter || 'all'] as const,
  shortlisted: (eventId: string) => [...applicationsKeys.all, 'shortlisted', eventId] as const,
  shortlistStats: (eventId: string) => [...applicationsKeys.all, 'shortlist-stats', eventId] as const
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch applications for an event with optional status filter
 */
export function useApplicationsByEvent(
  eventId: string | undefined,
  statusFilter?: 'pending' | 'accepted' | 'rejected' | 'all'
) {
  const { toast } = useToast();

  return useQuery({
    queryKey: applicationsKeys.byEvent(eventId || '', statusFilter),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      return getApplicationsByEvent(eventId, statusFilter);
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
          title: 'Error loading applications',
          description: 'Failed to load applications. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch shortlisted applications for an event
 */
export function useShortlistedApplications(eventId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: applicationsKeys.shortlisted(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      return getShortlistedApplications(eventId);
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading shortlist',
          description: 'Failed to load shortlisted applications. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch shortlist statistics for an event
 */
export function useShortlistStats(eventId: string | undefined) {
  return useQuery({
    queryKey: applicationsKeys.shortlistStats(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      return getShortlistStats(eventId);
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000, // 2 minutes (stats change frequently)
    gcTime: 5 * 60 * 1000
  });
}

// ============================================================================
// APPROVAL MUTATIONS
// ============================================================================

/**
 * Approve a single application
 */
export function useApproveApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationId, eventId }: { applicationId: string; eventId: string }) =>
      approveApplication(applicationId).then(() => eventId),
    onSuccess: (eventId) => {
      // Invalidate all status views
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.byEvent(eventId)
      });
      // Invalidate shortlist stats
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlistStats(eventId)
      });
      toast({
        title: 'Application approved',
        description: 'Application has been approved successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error approving application',
        description: error.message || 'Failed to approve application. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Reject a single application
 */
export function useRejectApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      applicationId,
      eventId,
      reason
    }: {
      applicationId: string;
      eventId: string;
      reason?: string;
    }) => rejectApplication(applicationId, reason).then(() => eventId),
    onSuccess: (eventId) => {
      // Invalidate all status views
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.byEvent(eventId)
      });
      // Invalidate shortlist stats
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlistStats(eventId)
      });
      toast({
        title: 'Application rejected',
        description: 'Application has been rejected.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error rejecting application',
        description: error.message || 'Failed to reject application. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Bulk approve applications
 */
export function useBulkApproveApplications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationIds, eventId }: { applicationIds: string[]; eventId: string }) =>
      bulkApproveApplications(applicationIds).then(() => ({ count: applicationIds.length, eventId })),
    onSuccess: ({ count, eventId }) => {
      // Invalidate all status views
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.byEvent(eventId)
      });
      // Invalidate shortlist stats
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlistStats(eventId)
      });
      toast({
        title: 'Applications approved',
        description: `${count} applications have been approved successfully.`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error approving applications',
        description: error.message || 'Failed to approve applications. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Bulk reject applications
 */
export function useBulkRejectApplications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationIds, eventId }: { applicationIds: string[]; eventId: string }) =>
      bulkRejectApplications(applicationIds).then(() => ({ count: applicationIds.length, eventId })),
    onSuccess: ({ count, eventId }) => {
      // Invalidate all status views
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.byEvent(eventId)
      });
      // Invalidate shortlist stats
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlistStats(eventId)
      });
      toast({
        title: 'Applications rejected',
        description: `${count} applications have been rejected.`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error rejecting applications',
        description: error.message || 'Failed to reject applications. Please try again.'
      });
    },
    retry: 1
  });
}

// ============================================================================
// SHORTLIST MUTATIONS
// ============================================================================

/**
 * Add application to shortlist
 */
export function useAddToShortlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationId, userId, eventId }: { applicationId: string; userId: string; eventId: string }) =>
      addToShortlist(applicationId, userId).then(() => eventId),
    onMutate: async ({ applicationId, eventId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: applicationsKeys.byEvent(eventId) });

      const previousData = queryClient.getQueryData<ApplicationData[]>(
        applicationsKeys.byEvent(eventId)
      );

      if (previousData) {
        queryClient.setQueryData(
          applicationsKeys.byEvent(eventId),
          previousData.map((app) =>
            app.id === applicationId ? { ...app, is_shortlisted: true } : app
          )
        );
      }

      return { previousData };
    },
    onSuccess: (eventId) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.byEvent(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlisted(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlistStats(eventId)
      });
      toast({
        title: 'Added to shortlist',
        description: 'Application has been added to shortlist.'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(
          applicationsKeys.byEvent(variables.eventId),
          context.previousData
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error adding to shortlist',
        description: error.message || 'Failed to add to shortlist. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Remove application from shortlist
 */
export function useRemoveFromShortlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationId, eventId }: { applicationId: string; eventId: string }) =>
      removeFromShortlist(applicationId).then(() => eventId),
    onMutate: async ({ applicationId, eventId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: applicationsKeys.byEvent(eventId) });

      const previousData = queryClient.getQueryData<ApplicationData[]>(
        applicationsKeys.byEvent(eventId)
      );

      if (previousData) {
        queryClient.setQueryData(
          applicationsKeys.byEvent(eventId),
          previousData.map((app) =>
            app.id === applicationId ? { ...app, is_shortlisted: false } : app
          )
        );
      }

      return { previousData };
    },
    onSuccess: (eventId) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.byEvent(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlisted(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlistStats(eventId)
      });
      toast({
        title: 'Removed from shortlist',
        description: 'Application has been removed from shortlist.'
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(
          applicationsKeys.byEvent(variables.eventId),
          context.previousData
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error removing from shortlist',
        description: error.message || 'Failed to remove from shortlist. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Bulk add to shortlist
 */
export function useBulkAddToShortlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      applicationIds,
      userId,
      eventId
    }: {
      applicationIds: string[];
      userId: string;
      eventId: string;
    }) => bulkAddToShortlist(applicationIds, userId).then(() => ({ count: applicationIds.length, eventId })),
    onSuccess: ({ count, eventId }) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.byEvent(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlisted(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlistStats(eventId)
      });
      toast({
        title: 'Added to shortlist',
        description: `${count} applications have been added to shortlist.`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error adding to shortlist',
        description: error.message || 'Failed to add to shortlist. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Bulk remove from shortlist
 */
export function useBulkRemoveFromShortlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationIds, eventId }: { applicationIds: string[]; eventId: string }) =>
      bulkRemoveFromShortlist(applicationIds).then(() => ({ count: applicationIds.length, eventId })),
    onSuccess: ({ count, eventId }) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.byEvent(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlisted(eventId)
      });
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.shortlistStats(eventId)
      });
      toast({
        title: 'Removed from shortlist',
        description: `${count} applications have been removed from shortlist.`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error removing from shortlist',
        description: error.message || 'Failed to remove from shortlist. Please try again.'
      });
    },
    retry: 1
  });
}
