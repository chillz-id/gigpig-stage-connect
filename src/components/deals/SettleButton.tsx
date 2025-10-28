/**
 * SettleButton Component (Presentational)
 *
 * Button to settle a deal with confirmation dialog
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SettleButtonProps {
  dealId: string;
  canSettle: boolean;
  onSettle: () => void;
  isLoading?: boolean;
  disabledReason?: string;
}

export function SettleButton({
  dealId,
  canSettle,
  onSettle,
  isLoading = false,
  disabledReason = 'This deal cannot be settled yet. Ensure all participants have confirmed and revenue is set.'
}: SettleButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleConfirm = () => {
    setShowConfirmation(false);
    onSettle();
  };

  const button = (
    <Button
      onClick={() => setShowConfirmation(true)}
      disabled={!canSettle || isLoading}
      className="gap-2"
      variant="default"
    >
      <CheckCircle className="h-4 w-4" />
      {isLoading ? 'Settling...' : 'Settle Deal'}
    </Button>
  );

  return (
    <>
      {/* Button with optional tooltip */}
      {!canSettle ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{disabledReason}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Settle Deal?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                This will finalize the deal and trigger invoice generation for all participants.
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                This action cannot be undone.
              </p>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>What happens next:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  <li>• Invoices will be generated for each participant</li>
                  <li>• Payment processing will be initiated</li>
                  <li>• Deal status will be marked as "Settled"</li>
                  <li>• No further changes can be made to this deal</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              Settle Deal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SettleButton;
