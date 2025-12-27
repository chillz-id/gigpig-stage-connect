import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface DealApprovalPanelProps {
  dealParticipant: {
    id: string;
    deal_id: string;
    participant_id: string;
    participant_type: string;
    split_percentage: number;
    split_type: 'percentage' | 'flat_fee' | 'door_split' | 'guaranteed_minimum';
    flat_fee_amount?: number;
    door_split_percentage?: number;
    guaranteed_minimum?: number;
    approval_status: 'pending' | 'approved' | 'declined' | 'changes_requested';
    notes?: string;
    gst_mode: 'inclusive' | 'exclusive' | 'none';
  };
  dealDetails: {
    deal_name: string;
    deal_type: string;
    total_amount?: number;
    description?: string;
  };
  managerCommission?: {
    rate: number;
    amount: number;
  };
  onApprove: () => void;
  onRequestChanges: (editNotes: string, newSplit?: number) => void;
  onDecline: (reason: string) => void;
  isLoading?: boolean;
}

// Validation schema for Request Changes form
const requestChangesSchema = z.object({
  editNotes: z.string().min(10, 'Edit notes must be at least 10 characters'),
  newSplit: z.number().min(0).max(100).optional().or(z.nan()).transform((val) => (isNaN(val) ? undefined : val)),
});

type RequestChangesFormData = z.infer<typeof requestChangesSchema>;

export function DealApprovalPanel({
  dealParticipant,
  dealDetails,
  managerCommission,
  onApprove,
  onRequestChanges,
  onDecline,
  isLoading = false,
}: DealApprovalPanelProps) {
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestChangesFormData>({
    resolver: zodResolver(requestChangesSchema),
  });

  // Calculate expected payment
  const calculateExpectedPayment = (): number => {
    let baseAmount = 0;

    if (dealParticipant.split_type === 'flat_fee' && dealParticipant.flat_fee_amount) {
      baseAmount = dealParticipant.flat_fee_amount;
    } else if (dealDetails.total_amount) {
      baseAmount = (dealDetails.total_amount * dealParticipant.split_percentage) / 100;
    }

    // Subtract manager commission if applicable
    if (managerCommission) {
      baseAmount -= managerCommission.amount;
    }

    return baseAmount;
  };

  const expectedPayment = calculateExpectedPayment();

  const handleRequestChangesSubmit = (data: RequestChangesFormData) => {
    onRequestChanges(data.editNotes, data.newSplit);
    setRequestChangesOpen(false);
    reset();
  };

  const handleDeclineConfirm = () => {
    if (declineReason.trim()) {
      onDecline(declineReason);
      setDeclineDialogOpen(false);
      setDeclineReason('');
    }
  };

  // Get status badge variant and icon
  const getStatusDisplay = () => {
    switch (dealParticipant.approval_status) {
      case 'approved':
        return {
          variant: 'default' as const,
          icon: <CheckCircle2 className="h-4 w-4" />,
          text: 'Approved',
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
        };
      case 'declined':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-4 w-4" />,
          text: 'Declined',
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
        };
      case 'changes_requested':
        return {
          variant: 'secondary' as const,
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Changes Requested',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          text: 'Pending',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const isPending = dealParticipant.approval_status === 'pending';

  // Get GST badge variant
  const getGstBadgeVariant = () => {
    switch (dealParticipant.gst_mode) {
      case 'inclusive':
        return 'default';
      case 'exclusive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{dealDetails.deal_name}</CardTitle>
            <CardDescription className="mt-1">
              {dealDetails.deal_type} • {dealParticipant.participant_type}
            </CardDescription>
          </div>
          <Badge className={statusDisplay.className}>
            <span className="flex items-center gap-1">
              {statusDisplay.icon}
              {statusDisplay.text}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Terms Display Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Your Terms</h3>

          <div className="space-y-2 rounded-lg bg-muted p-4">
            {dealParticipant.split_type === 'flat_fee' && dealParticipant.flat_fee_amount ? (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fixed Payment:</span>
                <span className="text-sm font-medium">${dealParticipant.flat_fee_amount.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Split Percentage:</span>
                <span className="text-sm font-medium">{dealParticipant.split_percentage}%</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">GST Mode:</span>
              <Badge variant={getGstBadgeVariant()} className="text-xs">
                {dealParticipant.gst_mode.toUpperCase()}
              </Badge>
            </div>

            {managerCommission && (
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">
                  Manager Commission: {managerCommission.rate}%
                </span>
                <span className="text-sm font-medium text-red-600">
                  -${managerCommission.amount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-semibold">Expected Payment:</span>
              <span className="text-sm font-bold text-green-600">
                ${expectedPayment.toFixed(2)}
              </span>
            </div>
          </div>

          {dealDetails.description && (
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">{dealDetails.description}</p>
            </div>
          )}

          {dealParticipant.notes && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm font-medium text-yellow-900">Note:</p>
              <p className="text-sm text-yellow-800">{dealParticipant.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={onApprove}
            disabled={!isPending || isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve Deal
              </>
            )}
          </Button>

          <Button
            onClick={() => setRequestChangesOpen(true)}
            disabled={!isPending || isLoading}
            variant="secondary"
            className="flex-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Request Changes
          </Button>

          <Button
            onClick={() => setDeclineDialogOpen(true)}
            disabled={!isPending || isLoading}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Decline Deal
          </Button>
        </div>

        {/* Request Changes Modal */}
        <Dialog open={requestChangesOpen} onOpenChange={setRequestChangesOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Changes</DialogTitle>
              <DialogDescription>
                Explain what changes you'd like to the deal terms. Optionally propose a new split percentage.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleRequestChangesSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editNotes">Edit Notes *</Label>
                <Textarea
                  id="editNotes"
                  placeholder="Explain what changes you'd like..."
                  {...register('editNotes')}
                  rows={4}
                />
                {errors.editNotes && (
                  <p className="text-sm text-red-600">{errors.editNotes.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newSplit">Proposed Split Percentage (Optional)</Label>
                <Input
                  id="newSplit"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g., 25"
                  {...register('newSplit', { valueAsNumber: true })}
                />
                {errors.newSplit && (
                  <p className="text-sm text-red-600">{errors.newSplit.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  className="professional-button"
                  onClick={() => {
                    setRequestChangesOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Decline Confirmation */}
        <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline Deal</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Please provide a reason for declining this deal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="declineReason">Reason for Declining *</Label>
              <Textarea
                id="declineReason"
                placeholder="Explain why you're declining..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeclineReason('')}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeclineConfirm}
                disabled={!declineReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Decline
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
