/**
 * ShortlistPanelContainer Component (Container)
 *
 * Fetches shortlisted applications and handles mutations
 */

import React from 'react';
import { ShortlistPanel } from './ShortlistPanel';
import {
  useShortlistedApplications,
  useRemoveFromShortlist,
  useBulkRemoveFromShortlist,
  useBulkApproveApplications
} from '@/hooks/useApplicationApproval';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface ShortlistPanelContainerProps {
  eventId: string;
  userId: string;
  totalSpots?: number;
}

export function ShortlistPanelContainer({
  eventId,
  userId,
  totalSpots
}: ShortlistPanelContainerProps) {
  const { toast } = useToast();

  // Queries
  const {
    data: shortlistedApplications,
    isLoading
  } = useShortlistedApplications(eventId);

  // Mutations
  const { mutate: removeFromShortlist, isPending: isRemoving } = useRemoveFromShortlist();
  const { mutate: bulkRemove, isPending: isBulkRemoving } = useBulkRemoveFromShortlist();
  const { mutate: bulkApprove, isPending: isBulkApproving } = useBulkApproveApplications();

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
    if (!shortlistedApplications || shortlistedApplications.length === 0) return;

    const applicationIds = shortlistedApplications.map((app) => app.id);

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
    if (!shortlistedApplications || shortlistedApplications.length === 0) return;

    const applicationIds = shortlistedApplications.map((app) => app.id);

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

  // Placeholder for future drag-and-drop reorder implementation
  const handleReorder = (sourceId: string, destinationId: string) => {
    // TODO: Implement reorder mutation when backend support is added
    toast({
      title: 'Coming soon',
      description: 'Drag-and-drop reordering will be available in a future update'
    });
  };

  const isAnyLoading = isLoading || isRemoving || isBulkRemoving || isBulkApproving;

  // Loading state
  if (isLoading) {
    return (
      <div className="hidden h-full w-80 flex-col gap-4 border-l bg-gray-50 p-4 dark:bg-gray-900 lg:flex">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <ShortlistPanel
      shortlistedApplications={shortlistedApplications || []}
      onRemove={handleRemove}
      onReorder={handleReorder}
      onConfirmAll={handleConfirmAll}
      onRemoveAll={handleRemoveAll}
      isLoading={isAnyLoading}
      totalSpots={totalSpots}
    />
  );
}

export default ShortlistPanelContainer;
