/**
 * ApplicationCardContainer Component (Container)
 *
 * Handles data fetching and mutation logic for ApplicationCard
 */

import React from 'react';
import { ApplicationCard } from './ApplicationCard';
import { useApproveApplication, useAddToShortlist } from '@/hooks/useApplicationApproval';
import {
  useFavouriteComedian,
  useUnfavouriteComedian,
  useHideComedian,
  useIsFavourited,
  useIsHidden
} from '@/hooks/useUserPreferences';
import type { ApplicationData } from '@/types/application';
import { Skeleton } from '@/components/ui/skeleton';

interface ApplicationCardContainerProps {
  application: ApplicationData;
  userId: string;
  eventId: string;
}

export function ApplicationCardContainer({
  application,
  userId,
  eventId
}: ApplicationCardContainerProps) {
  // Fetch favourite and hidden status
  const { data: isFavourited = false, isLoading: isFavouritedLoading } = useIsFavourited(
    userId,
    application.comedian_id
  );
  const { data: isHidden = false, isLoading: isHiddenLoading } = useIsHidden(
    userId,
    application.comedian_id,
    eventId
  );

  // Mutations
  const approveMutation = useApproveApplication();
  const shortlistMutation = useAddToShortlist();
  const favouriteMutation = useFavouriteComedian();
  const unfavouriteMutation = useUnfavouriteComedian();
  const hideMutation = useHideComedian();

  // Check if any mutation is in progress
  const isLoading =
    isFavouritedLoading ||
    isHiddenLoading ||
    approveMutation.isPending ||
    shortlistMutation.isPending ||
    favouriteMutation.isPending ||
    unfavouriteMutation.isPending ||
    hideMutation.isPending;

  const handleApprove = () => {
    approveMutation.mutate({
      applicationId: application.id,
      eventId: eventId
    });
  };

  const handleAddToShortlist = () => {
    shortlistMutation.mutate({
      applicationId: application.id,
      userId: userId,
      eventId: eventId
    });
  };

  const handleFavourite = () => {
    favouriteMutation.mutate({
      userId: userId,
      comedianId: application.comedian_id
    });
  };

  const handleUnfavourite = () => {
    unfavouriteMutation.mutate({
      userId: userId,
      comedianId: application.comedian_id
    });
  };

  const handleHide = (scope: 'event' | 'global') => {
    hideMutation.mutate({
      userId: userId,
      comedianId: application.comedian_id,
      scope: scope,
      eventId: scope === 'event' ? eventId : undefined
    });
  };

  // Show skeleton while initial data loads
  if (isFavouritedLoading || isHiddenLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <ApplicationCard
      application={application}
      isFavourited={isFavourited}
      isHidden={isHidden}
      onApprove={handleApprove}
      onAddToShortlist={handleAddToShortlist}
      onFavourite={handleFavourite}
      onUnfavourite={handleUnfavourite}
      onHide={handleHide}
      isLoading={isLoading}
    />
  );
}

export default ApplicationCardContainer;
