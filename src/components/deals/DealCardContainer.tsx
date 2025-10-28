/**
 * DealCardContainer Component (Container)
 *
 * Handles data fetching and mutation logic for DealCard
 */

import React from 'react';
import { DealCard } from './DealCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { DealData } from '@/types/deal';

interface DealCardContainerProps {
  dealId: string;
  userId: string;
  eventOwnerId: string;
  dealData?: DealData; // Allow passing deal data directly
}

export function DealCardContainer({
  dealId,
  userId,
  eventOwnerId,
  dealData
}: DealCardContainerProps) {
  // TODO: Implement hooks when available
  // const { data: deal, isLoading } = useDeal(dealId);
  // const confirmMutation = useConfirmDeal();
  // const rejectMutation = useRejectDeal();

  // Temporary mock loading state
  const isLoading = false;

  // Use passed data or mock data for now
  const deal: DealData = dealData || {
    id: dealId,
    event_id: '',
    title: 'Event Revenue Split',
    total_amount: 1000,
    status: 'pending',
    participants: [],
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Check if user is a participant
  const userParticipant = deal.participants.find((p) => p.user_id === userId);
  const canConfirm = !!userParticipant;
  const hasConfirmed = userParticipant?.status === 'confirmed';

  // Check if user has 100% confirmed deal (becomes partner)
  const hasFullyConfirmedDeal = deal.participants.some(
    (p) => p.user_id === userId && p.status === 'confirmed' && p.split_percentage === 100
  );

  // User can view financials if they are event owner OR have a 100% confirmed deal
  const canViewFinancials = userId === eventOwnerId || hasFullyConfirmedDeal;

  const handleConfirm = () => {
    // TODO: Implement confirm mutation
    // confirmMutation.mutate({ dealId, userId });
    console.log('Confirm deal:', dealId);
  };

  const handleReject = () => {
    // TODO: Implement reject mutation
    // rejectMutation.mutate({ dealId, userId });
    console.log('Reject deal:', dealId);
  };

  const handleEdit = () => {
    // TODO: Open edit deal modal
    console.log('Edit deal:', dealId);
  };

  // Show skeleton while loading
  if (isLoading && !dealData) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <DealCard
      deal={deal}
      participants={deal.participants}
      onConfirm={handleConfirm}
      onReject={handleReject}
      onEdit={handleEdit}
      canConfirm={canConfirm}
      hasConfirmed={hasConfirmed}
      canViewFinancials={canViewFinancials}
      isLoading={isLoading}
    />
  );
}

export default DealCardContainer;
