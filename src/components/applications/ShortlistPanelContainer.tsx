/**
 * ShortlistPanelContainer Component (Container)
 *
 * Fetches shortlisted and confirmed applications and handles mutations
 */

import React, { useMemo } from 'react';
import { ShortlistPanel } from './ShortlistPanel';
import {
  useShortlistedApplications,
  useApplicationsByEvent,
  useRemoveFromShortlist,
  useBulkRemoveFromShortlist,
  useBulkApproveApplications,
  useApproveApplication
} from '@/hooks/useApplicationApproval';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface ShortlistPanelContainerProps {
  eventId: string;
  userId: string;
  totalSpots?: number;
  /** Layout mode: 'sidebar' (default) or 'horizontal' for inline display */
  layout?: 'sidebar' | 'horizontal';
}

export function ShortlistPanelContainer({
  eventId,
  userId,
  totalSpots,
  layout = 'sidebar'
}: ShortlistPanelContainerProps) {
  const { toast } = useToast();

  // Queries
  const {
    data: shortlistedApplications,
    isLoading: isLoadingShortlist
  } = useShortlistedApplications(eventId);

  // Fetch confirmed applications (status = 'accepted')
  const {
    data: confirmedApplications,
    isLoading: isLoadingConfirmed
  } = useApplicationsByEvent(eventId, 'accepted');

  // Filter shortlist to exclude already-confirmed applications
  // (Confirmed comedians move from shortlist to confirmed section)
  const filteredShortlist = useMemo(() => {
    if (!shortlistedApplications) return [];
    const confirmedIds = new Set((confirmedApplications || []).map(app => app.id));
    return shortlistedApplications.filter(app => !confirmedIds.has(app.id));
  }, [shortlistedApplications, confirmedApplications]);

  // Mutations
  const { mutate: removeFromShortlist, isPending: isRemoving } = useRemoveFromShortlist();
  const { mutate: bulkRemove, isPending: isBulkRemoving } = useBulkRemoveFromShortlist();
  const { mutate: bulkApprove, isPending: isBulkApproving } = useBulkApproveApplications();
  const { mutate: approveSingle, isPending: isApprovingSingle } = useApproveApplication();

  const handleRemove = (applicationId: string) => {
    removeFromShortlist(
      { applicationId, eventId },
      {
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to remove from shortlist'
          });
        }
      }
    );
  };

  const handleRemoveAll = () => {
    if (!filteredShortlist || filteredShortlist.length === 0) return;

    const applicationIds = filteredShortlist.map((app) => app.id);

    bulkRemove(
      { applicationIds, eventId },
      {
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to clear shortlist'
          });
        }
      }
    );
  };

  const handleConfirmAll = () => {
    if (!filteredShortlist || filteredShortlist.length === 0) return;

    const applicationIds = filteredShortlist.map((app) => app.id);

    bulkApprove(
      { applicationIds, eventId },
      {
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to confirm all shortlisted applications'
          });
        }
      }
    );
  };

  // Handle single application confirmation from shortlist
  const handleConfirmSingle = (applicationId: string) => {
    approveSingle(
      { applicationId, eventId },
      {
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to confirm application'
          });
        }
      }
    );
  };

  // Placeholder for future drag-and-drop reorder implementation
  const handleReorder = (sourceId: string, destinationId: string) => {
    // TODO: Implement reorder mutation when backend support is added
    toast({
      title: 'Coming soon',
      description: 'Drag-and-drop reordering will be available in a future update'
    });
  };

  const isLoading = isLoadingShortlist || isLoadingConfirmed;
  const isAnyMutating = isRemoving || isBulkRemoving || isBulkApproving || isApprovingSingle;

  // Loading state
  if (isLoading) {
    if (layout === 'horizontal') {
      return (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="mt-4 flex gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>
      );
    }
    return (
      <div className="hidden h-full w-80 flex-col gap-4 border-l border-border bg-muted p-4 lg:flex">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <ShortlistPanel
      shortlistedApplications={filteredShortlist}
      confirmedApplications={confirmedApplications || []}
      onRemove={handleRemove}
      onConfirmSingle={handleConfirmSingle}
      onReorder={handleReorder}
      onConfirmAll={handleConfirmAll}
      onRemoveAll={handleRemoveAll}
      isLoading={isAnyMutating}
      totalSpots={totalSpots}
      layout={layout}
    />
  );
}

export default ShortlistPanelContainer;
