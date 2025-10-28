/**
 * SpotPaymentEditorContainer Component (Container)
 *
 * Container component that fetches spot data and handles payment updates
 */

import React from 'react';
import { useEventSpots, useUpdatePayment } from '@/hooks/useSpotPayments';
import { SpotPaymentEditor, type PaymentUpdate } from './SpotPaymentEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface SpotPaymentEditorContainerProps {
  spotId: string;
  eventId: string;
  onSuccess?: () => void;
}

export function SpotPaymentEditorContainer({
  spotId,
  eventId,
  onSuccess
}: SpotPaymentEditorContainerProps) {
  // Fetch spots for the event
  const { data: spots, isLoading, error } = useEventSpots(eventId);

  // Update payment mutation
  const updatePayment = useUpdatePayment();

  // Find the specific spot
  const spot = spots?.find((s) => s.id === spotId);

  const handleSave = async (payment: PaymentUpdate) => {
    try {
      await updatePayment.mutateAsync({
        spotId,
        payment
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error handled by mutation
      console.error('Error updating payment:', error);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load spot data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  // Spot not found
  if (!spot) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          Spot not found. It may have been deleted.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <SpotPaymentEditor
      spot={{
        id: spot.id,
        payment_amount: spot.payment_amount ?? undefined,
        tax_included: spot.tax_included ?? undefined,
        tax_rate: spot.tax_rate ?? undefined,
        payment_notes: spot.payment_notes ?? undefined,
        payment_status: (spot.payment_status as 'unpaid' | 'pending' | 'paid' | 'partially_paid' | 'refunded') ?? undefined
      }}
      onSave={handleSave}
      onCancel={handleCancel}
      isLoading={updatePayment.isPending}
    />
  );
}

export default SpotPaymentEditorContainer;
