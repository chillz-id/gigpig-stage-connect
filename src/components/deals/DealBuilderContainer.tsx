/**
 * DealBuilderContainer Component (Container)
 *
 * Container for DealBuilder that handles deal creation with validation
 */

import React from 'react';
import { useCreateDeal } from '@/hooks/useEventDeals';
import { DealBuilder, type DealInput } from './DealBuilder';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DealBuilderContainerProps {
  eventId: string;
  onSuccess?: (dealId: string) => void;
  onCancel?: () => void;
}

export function DealBuilderContainer({
  eventId,
  onSuccess,
  onCancel
}: DealBuilderContainerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createDeal = useCreateDeal();

  const handleComplete = async (dealInput: DealInput) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to create a deal.'
      });
      return;
    }

    // Validate splits total 100%
    const totalPercentage = dealInput.participants.reduce(
      (sum, p) =>
        sum + (p.split_type === 'percentage' ? (p.split_percentage || 0) : 0),
      0
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast({
        variant: 'destructive',
        title: 'Invalid split configuration',
        description: 'Percentage splits must total exactly 100%.'
      });
      return;
    }

    if (dealInput.participants.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No participants',
        description: 'You must add at least one participant to the deal.'
      });
      return;
    }

    try {
      // Map DealInput to CreateDealInput format expected by the service
      const createInput = {
        event_id: eventId,
        deal_name: dealInput.deal_name,
        deal_type: dealInput.deal_type as any, // Type mapping
        description: dealInput.description,
        guaranteed_minimum: dealInput.total_amount
      };

      const result = await createDeal.mutateAsync({
        input: createInput,
        userId: user.id
      });

      if (onSuccess) {
        onSuccess(result.id);
      }
    } catch (error) {
      // Error handled by mutation
      console.error('Error creating deal:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <DealBuilder
      onComplete={handleComplete}
      onCancel={handleCancel}
      isLoading={createDeal.isPending}
    />
  );
}

export default DealBuilderContainer;
