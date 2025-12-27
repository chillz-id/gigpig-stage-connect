/**
 * EditSpotDialog Component
 *
 * Dialog for editing an existing spot in the event lineup.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useToast } from '@/hooks/use-toast';
import type { SpotData } from '@/types/spot';

interface EditSpotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  spot: SpotData;
  isPaid?: boolean;
}

type SpotType = 'MC' | 'Feature' | 'Headliner' | 'Guest' | 'Open Mic' | 'Spot';

const SPOT_TYPES: SpotType[] = ['MC', 'Feature', 'Headliner', 'Guest', 'Open Mic', 'Spot'];

export function EditSpotDialog({
  open,
  onOpenChange,
  eventId,
  spot,
  isPaid: initialIsPaid = false,
}: EditSpotDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [spotName, setSpotName] = useState<SpotType>(spot.type as SpotType || 'Feature');
  const [duration, setDuration] = useState(spot.duration_minutes || 5);
  const [isPaid, setIsPaid] = useState(initialIsPaid);
  const [paymentAmount, setPaymentAmount] = useState<string>(spot.payment_amount?.toString() || '');
  const [notes, setNotes] = useState(spot.notes || '');

  // Fetch comedian's GST registration status if a comedian is assigned
  const { data: comedianProfile } = useQuery({
    queryKey: ['comedian-gst-status', spot.comedian_id],
    queryFn: async () => {
      if (!spot.comedian_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, gst_registered, abn')
        .eq('id', spot.comedian_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: open && !!spot.comedian_id
  });

  const isGstRegistered = comedianProfile?.gst_registered ?? false;
  const GST_RATE = 0.10; // 10% GST in Australia

  // Update form when spot changes
  useEffect(() => {
    if (open) {
      setSpotName(spot.type as SpotType || 'Feature');
      setDuration(spot.duration_minutes || 5);
      setIsPaid(initialIsPaid);
      setPaymentAmount(spot.payment_amount?.toString() || '');
      setNotes(spot.notes || '');
    }
  }, [open, spot, initialIsPaid]);

  // Update spot mutation
  const updateSpotMutation = useMutation({
    mutationFn: async () => {
      const baseAmount = isPaid && paymentAmount ? parseFloat(paymentAmount) : null;

      // Calculate payment_gross, payment_tax, payment_net
      // If comedian is GST registered, add 10% GST on top
      let paymentGross = baseAmount;
      let paymentTax = 0;
      let paymentNet = baseAmount;
      let taxRate = 0;

      if (baseAmount && isGstRegistered) {
        // GST is added on top of the base amount
        paymentTax = baseAmount * GST_RATE;
        paymentGross = baseAmount + paymentTax;
        paymentNet = baseAmount;
        taxRate = GST_RATE;
      }

      const updateData = {
        spot_name: spotName,
        duration_minutes: duration,
        is_paid: isPaid,
        payment_amount: baseAmount,
        payment_gross: paymentGross,
        payment_tax: paymentTax,
        payment_net: paymentNet,
        tax_rate: taxRate,
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
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      onOpenChange(false);
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

            {/* Payment Amount (conditional) */}
            {isPaid && (
              <div className="grid gap-2">
                <Label htmlFor="paymentAmount">Payment Amount ($)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                {/* GST indicator */}
                {isGstRegistered && paymentAmount && parseFloat(paymentAmount) > 0 && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                    <p className="font-medium text-green-600 dark:text-green-400">
                      GST Registered Comedian
                    </p>
                    <p>
                      Net: ${parseFloat(paymentAmount).toFixed(2)} + GST (10%): $
                      {(parseFloat(paymentAmount) * GST_RATE).toFixed(2)} =
                      <span className="font-semibold"> ${(parseFloat(paymentAmount) * (1 + GST_RATE)).toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </div>
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
