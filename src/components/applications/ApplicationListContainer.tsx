/**
 * ApplicationListContainer Component (Container)
 *
 * Fetches applications and maps them to ApplicationCardContainer components
 * Supports multi-select and filtering hidden applications
 */

import React, { useState, useMemo } from 'react';
import { ApplicationList } from './ApplicationList';
import { ApplicationCardContainer } from './ApplicationCardContainer';
import { useApplicationsByEvent } from '@/hooks/useApplicationApproval';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ApplicationData } from '@/types/application';

interface ApplicationListContainerProps {
  eventId: string;
  userId: string;
  statusFilter?: 'pending' | 'accepted' | 'rejected' | 'all';
  showHidden?: boolean;
  hiddenComedianIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function ApplicationListContainer({
  eventId,
  userId,
  statusFilter = 'all',
  showHidden = false,
  hiddenComedianIds = [],
  onSelectionChange
}: ApplicationListContainerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const {
    data: applications,
    isLoading,
    isError,
    error,
    refetch
  } = useApplicationsByEvent(eventId, statusFilter);

  // Filter hidden applications unless showHidden is true
  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    if (showHidden) return applications;

    return applications.filter(
      (app) => !hiddenComedianIds.includes(app.comedian_id)
    );
  }, [applications, showHidden, hiddenComedianIds]);

  // Handle selection changes
  const handleSelectionChange = (applicationId: string, isSelected: boolean) => {
    const newSelectedIds = isSelected
      ? [...selectedIds, applicationId]
      : selectedIds.filter((id) => id !== applicationId);

    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  const handleSelectAll = () => {
    const allIds = filteredApplications.map((app) => app.id);
    setSelectedIds(allIds);
    onSelectionChange?.(allIds);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    onSelectionChange?.([]);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {error instanceof Error
              ? `Failed to load applications: ${error.message}`
              : 'Failed to load applications. Please try again.'}
          </span>
          <Button onClick={() => refetch()} className="professional-button" size="sm">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Render application cards with selection checkbox
  const renderCard = (application: ApplicationData) => {
    const isSelected = selectedIds.includes(application.id);

    return (
      <div key={application.id} className="relative">
        {/* Selection checkbox (only if onSelectionChange provided) */}
        {onSelectionChange && (
          <div className="absolute left-2 top-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                handleSelectionChange(application.id, checked as boolean)
              }
              aria-label={`Select ${application.comedian_name}`}
              className="bg-white shadow-sm dark:bg-gray-800"
            />
          </div>
        )}

        <ApplicationCardContainer
          application={application}
          userId={userId}
          eventId={eventId}
        />
      </div>
    );
  };

  // Get appropriate empty message based on filter
  const getEmptyMessage = () => {
    if (!showHidden && hiddenComedianIds.length > 0 && filteredApplications.length === 0) {
      return 'All applications are hidden. Toggle "Show Hidden" to view them.';
    }

    switch (statusFilter) {
      case 'pending':
        return 'No pending applications found';
      case 'accepted':
        return 'No accepted applications found';
      case 'rejected':
        return 'No rejected applications found';
      default:
        return 'No applications found for this event';
    }
  };

  return (
    <div className="space-y-4">
      {/* Select All / Clear All (only if multi-select enabled) */}
      {onSelectionChange && filteredApplications.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3 dark:bg-gray-900">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedIds.length} of {filteredApplications.length} selected
          </span>
          <div className="flex gap-2">
            <Button
              onClick={handleSelectAll}
              className="professional-button"
              size="sm"
              disabled={selectedIds.length === filteredApplications.length}
            >
              Select All
            </Button>
            <Button
              onClick={handleClearSelection}
              className="professional-button"
              size="sm"
              disabled={selectedIds.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <ApplicationList
        applications={filteredApplications}
        renderCard={renderCard}
        emptyMessage={getEmptyMessage()}
      />
    </div>
  );
}

export default ApplicationListContainer;
