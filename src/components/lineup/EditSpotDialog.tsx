/**
 * EditSpotDialog Component
 *
 * Dialog for editing an existing spot in the event lineup.
 * Includes GST handling options: Excluded, Included, + GST
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import type { SpotData, GstType } from '@/types/spot';
import { GST_RATE } from '@/types/spot';
import { cn } from '@/lib/utils';

interface EditSpotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spot: SpotData;
  onSaved?: () => void;
}

type SpotType = 'MC' | 'Feature' | 'Headliner' | 'Guest' | 'Open Mic' | 'Spot';

const SPOT_TYPES: SpotType[] = ['MC', 'Feature', 'Headliner', 'Guest', 'Open Mic', 'Spot'];

/**
 * Calculate GST breakdown for display
 */
function calculateGstBreakdown(amount: number, gstType: GstType) {
  if (gstType === 'excluded') {
    return { base: amount, gst: 0, total: amount };
  } else if (gstType === 'included') {
    // GST is included in the amount: base = amount / 1.1, gst = amount - base
    const base = amount / (1 + GST_RATE);
    const gst = amount - base;
    return { base, gst, total: amount };
  } else {
    // GST is added on top: gst = amount * 0.1, total = amount + gst
    const gst = amount * GST_RATE;
    return { base: amount, gst, total: amount + gst };
  }
}

export function EditSpotDialog({
  open,
  onOpenChange,
  spot,
  onSaved,
}: EditSpotDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [spotName, setSpotName] = useState<SpotType>('Feature');
  const [duration, setDuration] = useState(5);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [gstType, setGstType] = useState<GstType>('addition');
  const [notes, setNotes] = useState('');

  // Update form when spot changes
  useEffect(() => {
    if (open && spot) {
      // Get spot type from spot_name field (DB uses spot_name)
      const rawSpot = spot as SpotData & { spot_name?: string };
      const spotType = rawSpot.spot_name || spot.type || 'Feature';
      setSpotName(spotType as SpotType);
      setDuration(spot.duration_minutes || 5);
      setIsPaid((spot.payment_amount ?? 0) > 0);
      setPaymentAmount(spot.payment_amount?.toString() || '');
      setGstType((spot.payment_gst_type as GstType) || 'addition');
      setNotes(spot.notes || '');
    }
  }, [open, spot]);

  // Calculate preview values
  const numericAmount = parseFloat(paymentAmount) || 0;
  const breakdown = calculateGstBreakdown(numericAmount, gstType);

  // Update spot mutation
  const updateSpotMutation = useMutation({
    mutationFn: async () => {
      const baseAmount = isPaid && paymentAmount ? parseFloat(paymentAmount) : null;

      // Calculate payment_gross, payment_tax, payment_net based on GST type
      let paymentGross = baseAmount;
      let paymentTax = 0;
      let paymentNet = baseAmount;

      if (baseAmount && baseAmount > 0) {
        if (gstType === 'excluded') {
          // No GST
          paymentGross = baseAmount;
          paymentTax = 0;
          paymentNet = baseAmount;
        } else if (gstType === 'included') {
          // GST is included in the amount
          const base = baseAmount / (1 + GST_RATE);
          paymentTax = baseAmount - base;
          paymentGross = baseAmount;
          paymentNet = base;
        } else {
          // GST is added on top
          paymentTax = baseAmount * GST_RATE;
          paymentGross = baseAmount + paymentTax;
          paymentNet = baseAmount;
        }
      }

      const updateData = {
        spot_name: spotName,
        duration_minutes: duration,
        is_paid: isPaid,
        payment_amount: baseAmount,
        payment_gst_type: isPaid ? gstType : null,
        payment_gross: paymentGross,
        payment_tax: paymentTax,
        payment_net: paymentNet,
        tax_rate: gstType === 'excluded' ? 0 : GST_RATE,
        payment_notes: notes || null,
      };

      const { data, error } = await supabase
        .from('event_spots')
        .update(updateData)
        .eq('id', spot.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Spot Updated',
        description: `${spotName} spot has been updated.`,
      });
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', spot.event_id] });
      queryClient.invalidateQueries({ queryKey: ['event-spots', spot.event_id] });
      queryClient.invalidateQueries({ queryKey: ['spot-line-items', spot.id] });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'spot-line-items-batch',
      });
      onOpenChange(false);
      onSaved?.();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update spot',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSpotMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Spot</DialogTitle>
            <DialogDescription>
              Update the details for this performance slot.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Spot Type */}
            <div className="grid gap-2">
              <Label htmlFor="spotType">Spot Type</Label>
              <Select value={spotName} onValueChange={(v) => setSpotName(v as SpotType)}>
                <SelectTrigger id="spotType">
                  <SelectValue placeholder="Select spot type" />
                </SelectTrigger>
                <SelectContent>
                  {SPOT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={120}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
              />
            </div>

            {/* Paid Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isPaid">Paid Spot</Label>
              <Switch
                id="isPaid"
                checked={isPaid}
                onCheckedChange={setIsPaid}
              />
            </div>

            {/* Payment Amount & GST Options (conditional) */}
            {isPaid && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="paymentAmount">Payment Amount ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="paymentAmount"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>

                {/* GST Options */}
                <div className="grid gap-2">
                  <Label>GST</Label>
                  <RadioGroup
                    value={gstType}
                    onValueChange={(value) => setGstType(value as GstType)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excluded" id="gst-excluded" />
                      <Label htmlFor="gst-excluded" className="cursor-pointer font-normal">
                        Excluded
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="included" id="gst-included" />
                      <Label htmlFor="gst-included" className="cursor-pointer font-normal">
                        Included
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="addition" id="gst-addition" />
                      <Label htmlFor="gst-addition" className="cursor-pointer font-normal">
                        + GST
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    {gstType === 'excluded' && 'No GST applies to this payment'}
                    {gstType === 'included' && 'GST is already included in the amount'}
                    {gstType === 'addition' && 'GST will be added on top (10%)'}
                  </p>
                </div>

                {/* Payment Preview */}
                {numericAmount > 0 && (
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-sm text-muted-foreground mb-2">Payment Preview:</p>
                    <div className="space-y-1 text-sm">
                      {gstType === 'excluded' ? (
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          ${numericAmount.toFixed(2)} (No GST)
                        </p>
                      ) : gstType === 'included' ? (
                        <>
                          <p className="text-green-600 dark:text-green-400 font-medium">
                            ${numericAmount.toFixed(2)} total
                          </p>
                          <p className="text-muted-foreground">
                            (${breakdown.base.toFixed(2)} + GST ${breakdown.gst.toFixed(2)})
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-green-600 dark:text-green-400 font-medium">
                            ${breakdown.total.toFixed(2)} total
                          </p>
                          <p className="text-muted-foreground">
                            (${numericAmount.toFixed(2)} + GST ${breakdown.gst.toFixed(2)})
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Notes (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateSpotMutation.isPending}>
              {updateSpotMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditSpotDialog;
