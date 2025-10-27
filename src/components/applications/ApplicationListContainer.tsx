/**
 * ApplicationListContainer Component (Container)
 *
 * Fetches applications and maps them to ApplicationCardContainer components
 */

import React from 'react';
import { ApplicationList } from './ApplicationList';
import { ApplicationCardContainer } from './ApplicationCardContainer';
import { useApplicationsByEvent } from '@/hooks/useApplicationApproval';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApplicationListContainerProps {
  eventId: string;
  userId: string;
  statusFilter?: 'pending' | 'accepted' | 'rejected' | 'all';
}

export function ApplicationListContainer({
  eventId,
  userId,
  statusFilter = 'all'
}: ApplicationListContainerProps) {
  const {
    data: applications,
    isLoading,
    isError,
    error,
    refetch
  } = useApplicationsByEvent(eventId, statusFilter);

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
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Render application cards
  const renderCard = (application: any) => (
    <ApplicationCardContainer
      key={application.id}
      application={application}
      userId={userId}
      eventId={eventId}
    />
  );

  // Get appropriate empty message based on filter
  const getEmptyMessage = () => {
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
    <ApplicationList
      applications={applications || []}
      renderCard={renderCard}
      emptyMessage={getEmptyMessage()}
    />
  );
}

export default ApplicationListContainer;
