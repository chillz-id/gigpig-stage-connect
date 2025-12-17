/**
 * ApplicationCardContainer Component (Container)
 *
 * Handles mutation logic for ApplicationCard
 * Note: Favourited/hidden status is passed from parent to avoid N+1 queries
 */

import React from 'react';
import { ApplicationCard } from './ApplicationCard';
import { useApproveApplication, useAddToShortlist } from '@/hooks/useApplicationApproval';
import {
  useFavouriteComedian,
  useUnfavouriteComedian,
  useHideComedian
} from '@/hooks/useUserPreferences';
import type { ApplicationData } from '@/types/application';

interface ApplicationCardContainerProps {
  application: ApplicationData;
  userId: string;
  eventId: string;
  /** Pre-fetched from parent to avoid N+1 queries */
  isFavourited?: boolean;
  /** Pre-fetched from parent to avoid N+1 queries */
  isHidden?: boolean;
}

export function ApplicationCardContainer({
  application,
  userId,
  eventId,
  isFavourited = false,
  isHidden = false
}: ApplicationCardContainerProps) {
  // Mutations only - no queries per card
  const approveMutation = useApproveApplication();
  const shortlistMutation = useAddToShortlist();
  const favouriteMutation = useFavouriteComedian();
  const unfavouriteMutation = useUnfavouriteComedian();
  const hideMutation = useHideComedian();

  // Check if any mutation is in progress
  const isLoading =
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
