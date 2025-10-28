/**
 * EventManagementHeaderContainer Component (Container)
 *
 * Fetches stats and checks revenue visibility permissions
 */

import React from 'react';
import { EventManagementHeader } from './EventManagementHeader';
import { useShortlistStats } from '@/hooks/useApplicationApproval';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface EventManagementHeaderContainerProps {
  eventId: string;
  eventName: string;
  userId: string;
  eventOwnerId: string;
  totalRevenue?: number;
}

export function EventManagementHeaderContainer({
  eventId,
  eventName,
  userId,
  eventOwnerId,
  totalRevenue
}: EventManagementHeaderContainerProps) {
  const { data: stats, isLoading, isError, error } = useShortlistStats(eventId);

  // Check if user can view financials
  // User can view financials if they are:
  // 1. Event owner
  // 2. Partner in a fully confirmed deal (all participants have confirmed)
  // Note: Deal checking requires deal data to be passed or fetched
  // For now, only event owner check is implemented
  const canViewFinancials = userId === eventOwnerId;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          {canViewFinancials && <Skeleton className="h-24" />}
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !stats) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error
            ? `Failed to load event stats: ${error.message}`
            : 'Failed to load event statistics. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <EventManagementHeader
      eventId={eventId}
      eventName={eventName}
      stats={stats}
      canViewFinancials={canViewFinancials}
      totalRevenue={totalRevenue}
    />
  );
}

export default EventManagementHeaderContainer;
