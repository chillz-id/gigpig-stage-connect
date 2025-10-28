/**
 * DealListContainer Component (Container)
 *
 * Handles data fetching and orchestration for DealList
 */

import React from 'react';
import { DealList } from './DealList';
import { DealCardContainer } from './DealCardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import type { DealData } from '@/types/deal';

interface DealListContainerProps {
  eventId: string;
  userId: string;
  eventOwnerId: string;
  dealsData?: DealData[]; // Allow passing deals directly
}

export function DealListContainer({
  eventId,
  userId,
  eventOwnerId,
  dealsData
}: DealListContainerProps) {
  // TODO: Implement hooks when available
  // const { data: deals = [], isLoading } = useEventDeals(eventId);

  // Temporary mock loading state
  const isLoading = false;

  // Sort deals by created date (newest first)
  const sortedDeals = React.useMemo(() => {
    const deals: DealData[] = dealsData || [];
    return [...deals].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [dealsData]);

  // Show skeleton while loading
  if (isLoading && !dealsData) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <DealList
      deals={sortedDeals}
      renderCard={(deal) => (
        <DealCardContainer
          key={deal.id}
          dealId={deal.id}
          userId={userId}
          eventOwnerId={eventOwnerId}
          dealData={deal}
        />
      )}
    />
  );
}

export default DealListContainer;
