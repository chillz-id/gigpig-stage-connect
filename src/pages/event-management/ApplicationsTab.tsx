/**
 * ApplicationsTab Component
 *
 * Full page assembly for Applications Tab with all features:
 * - Header, Filters, List, Shortlist Panel, Bulk Actions
 * - Multi-select, hide/show toggle, filtering, sorting
 */

import React, { useState } from 'react';
import { EventManagementHeaderContainer } from '@/components/event-management/EventManagementHeaderContainer';
import { ApplicationFilters, type FilterState } from '@/components/applications/ApplicationFilters';
import { ApplicationListContainer } from '@/components/applications/ApplicationListContainer';
import { ShortlistPanelContainer } from '@/components/applications/ShortlistPanelContainer';
import { ApplicationBulkActions } from '@/components/applications/ApplicationBulkActions';
import {
  useBulkApproveApplications,
  useBulkRejectApplications,
  useBulkAddToShortlist
} from '@/hooks/useApplicationApproval';
import { useToast } from '@/hooks/use-toast';

interface ApplicationsTabProps {
  eventId: string;
  userId: string;
  totalSpots?: number;
  hiddenComedianIds?: string[];
  onHideComedians?: (comedianIds: string[], scope: 'event' | 'global') => void;
}

export default function ApplicationsTab({
  eventId,
  userId,
  totalSpots,
  hiddenComedianIds = [],
  onHideComedians
}: ApplicationsTabPageProps) {
  const { toast } = useToast();

  // State
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    spotType: 'all',
    sort: 'newest'
  });
  const [showHidden, setShowHidden] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mutations
  const { mutate: bulkApprove, isPending: isApproving } = useBulkApproveApplications();
  const { mutate: bulkReject, isPending: isRejecting } = useBulkRejectApplications();
  const { mutate: bulkShortlist, isPending: isShortlisting } = useBulkAddToShortlist();

  const isAnyLoading = isApproving || isRejecting || isShortlisting;

  // Handlers
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleToggleShowHidden = () => {
    setShowHidden(!showHidden);
  };

  const handleSelectionChange = (newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds);
  };

  const handleConfirmAll = () => {
    if (selectedIds.length === 0) return;

    bulkApprove(
      { applicationIds: selectedIds, eventId },
      {
        onSuccess: () => {
          setSelectedIds([]);
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to confirm applications'
          });
        }
      }
    );
  };

  const handleRejectAll = () => {
    if (selectedIds.length === 0) return;

    bulkReject(
      { applicationIds: selectedIds, eventId },
      {
        onSuccess: () => {
          setSelectedIds([]);
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to reject applications'
          });
        }
      }
    );
  };

  const handleShortlistAll = () => {
    if (selectedIds.length === 0) return;

    bulkShortlist(
      { applicationIds: selectedIds, userId, eventId },
      {
        onSuccess: () => {
          setSelectedIds([]);
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to add to shortlist'
          });
        }
      }
    );
  };

  const handleHideAll = (scope: 'event' | 'global') => {
    if (selectedIds.length === 0 || !onHideComedians) return;

    // Extract comedian IDs from selected applications
    // Note: This requires fetching application data to get comedian_ids
    // For now, we'll pass the application IDs and let parent handle it
    onHideComedians(selectedIds, scope);
    setSelectedIds([]);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Get status filter for API
  const statusFilter = filters.status === 'all' ? undefined : filters.status;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <EventManagementHeaderContainer
        eventId={eventId}
        userId={userId}
        currentTab="applications"
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Applications List */}
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          {/* Filters */}
          <ApplicationFilters
            filters={filters}
            showHidden={showHidden}
            onFilterChange={handleFilterChange}
            onToggleShowHidden={handleToggleShowHidden}
          />

          {/* Applications List with Multi-Select */}
          <ApplicationListContainer
            eventId={eventId}
            userId={userId}
            statusFilter={statusFilter}
            showHidden={showHidden}
            hiddenComedianIds={hiddenComedianIds}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        {/* Right: Shortlist Panel (sidebar on desktop, sheet on mobile) */}
        <ShortlistPanelContainer
          eventId={eventId}
          userId={userId}
          totalSpots={totalSpots}
        />
      </div>

      {/* Bulk Actions Bar (sticky bottom, only visible when items selected) */}
      <ApplicationBulkActions
        selectedIds={selectedIds}
        onConfirmAll={handleConfirmAll}
        onRejectAll={handleRejectAll}
        onShortlistAll={handleShortlistAll}
        onHideAll={handleHideAll}
        onClearSelection={handleClearSelection}
        isLoading={isAnyLoading}
      />
    </div>
  );
}
