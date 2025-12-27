/**
 * EditExtraDialog Component
 *
 * Dialog for editing an existing extra/production staff spot.
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import type { SpotData, ExtraType, RateType, GstType } from '@/types/spot';
import { EXTRA_TYPE_LABELS, GST_RATE } from '@/types/spot';

/**
 * Calculate GST breakdown for display
 */
function calculateGstBreakdown(amount: number, gstType: GstType) {
  if (gstType === 'excluded') {
    return { base: amount, gst: 0, total: amount };
  } else if (gstType === 'included') {
    const base = amount / (1 + GST_RATE);
    const gst = amount - base;
    return { base, gst, total: amount };
  } else {
    const gst = amount * GST_RATE;
    return { base: amount, gst, total: amount + gst };
  }
}

interface EditExtraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  spot: SpotData;
}

const EXTRA_TYPES: ExtraType[] = ['photographer', 'videographer', 'door_staff', 'audio_tech', 'lighting_tech'];

export function EditExtraDialog({
  open,
  onOpenChange,
  eventId,
  spot,
}: EditExtraDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse hours from spot.hours
  const initialHours = spot.hours ? Math.floor(spot.hours) : 2;
  const initialMinutes = spot.hours ? Math.round((spot.hours - initialHours) * 60) : 0;

  // Form state
  const [extraType, setExtraType] = useState<ExtraType>(spot.extra_type || 'photographer');
  const [extraHours, setExtraHours] = useState<number>(initialHours);
  const [extraMinutes, setExtraMinutes] = useState<number>(initialMinutes);
  const [rateType, setRateType] = useState<RateType>(spot.rate_type || 'hourly');
  const [hourlyRate, setHourlyRate] = useState<string>('50');
  const [flatRate, setFlatRate] = useState<string>(spot.payment_amount?.toString() || '100');
  const [gstType, setGstType] = useState<GstType>((spot.payment_gst_type as GstType) || 'addition');
  const [notes, setNotes] = useState(spot.notes || '');
  const [startTime, setStartTime] = useState(spot.scheduled_start_time || '');

  // Calculate hourly rate from stored data
  useEffect(() => {
    if (spot.rate_type === 'hourly' && spot.payment_amount && spot.hours) {
      const calculatedRate = spot.payment_amount / spot.hours;
      setHourlyRate(calculatedRate.toFixed(2));
    }
  }, [spot]);

  // Calculate total payment for hourly extras
  const calculatedHourlyTotal = parseFloat(hourlyRate || '0') * (extraHours + extraMinutes / 60);

  // Update form when spot changes
  useEffect(() => {
    if (open) {
      const hrs = spot.hours ? Math.floor(spot.hours) : 2;
      const mins = spot.hours ? Math.round((spot.hours - hrs) * 60) : 0;

      setExtraType(spot.extra_type || 'photographer');
      setExtraHours(hrs);
      setExtraMinutes(mins);
      setRateType(spot.rate_type || 'hourly');
      setGstType((spot.payment_gst_type as GstType) || 'addition');
      setNotes(spot.notes || '');
      setStartTime(spot.scheduled_start_time || '');

      if (spot.rate_type === 'flat') {
        setFlatRate(spot.payment_amount?.toString() || '100');
      } else if (spot.payment_amount && spot.hours) {
        const calculatedRate = spot.payment_amount / spot.hours;
        setHourlyRate(calculatedRate.toFixed(2));
      }
    }
  }, [open, spot]);

  // Calculate payment with GST for preview
  const basePaymentAmount = rateType === 'hourly' ? calculatedHourlyTotal : parseFloat(flatRate || '0');
  const gstBreakdown = calculateGstBreakdown(basePaymentAmount, gstType);

  // Update spot mutation
  const updateSpotMutation = useMutation({
    mutationFn: async () => {
      const totalHours = extraHours + extraMinutes / 60;
      const paymentAmt = rateType === 'hourly'
        ? calculatedHourlyTotal
        : parseFloat(flatRate || '0');

      // Calculate payment_gross, payment_tax, payment_net based on GST type
      let paymentGross = paymentAmt;
      let paymentTax = 0;
      let paymentNet = paymentAmt;

      if (paymentAmt > 0) {
        if (gstType === 'excluded') {
          paymentGross = paymentAmt;
          paymentTax = 0;
          paymentNet = paymentAmt;
        } else if (gstType === 'included') {
          const base = paymentAmt / (1 + GST_RATE);
          paymentTax = paymentAmt - base;
          paymentGross = paymentAmt;
          paymentNet = base;
        } else {
          paymentTax = paymentAmt * GST_RATE;
          paymentGross = paymentAmt + paymentTax;
          paymentNet = paymentAmt;
        }
      }

      const updateData = {
        spot_name: EXTRA_TYPE_LABELS[extraType],
        extra_type: extraType,
        hours: totalHours,
        rate_type: rateType,
        payment_amount: paymentAmt,
        payment_gst_type: gstType,
        payment_gross: paymentGross,
        payment_tax: paymentTax,
        payment_net: paymentNet,
        tax_rate: gstType === 'excluded' ? 0 : GST_RATE,
        payment_notes: notes || null,
        scheduled_start_time: startTime || null,
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
        title: 'Extra Updated',
        description: `${EXTRA_TYPE_LABELS[extraType]} has been updated.`,
      });
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['spot-line-items', spot.id] });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'spot-line-items-batch',
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update extra',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSpotMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Extra Staff</DialogTitle>
            <DialogDescription>
              Update the details for this production staff position.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Extra Type */}
            <div className="grid gap-2">
              <Label htmlFor="extraType">Staff Type</Label>
              <Select value={extraType} onValueChange={(v) => setExtraType(v as ExtraType)}>
                <SelectTrigger id="extraType">
                  <SelectValue placeholder="Select staff type" />
                </SelectTrigger>
                <SelectContent>
                  {EXTRA_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EXTRA_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration - Hours & Minutes */}
            <div className="grid gap-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      id="extraHours"
                      type="number"
                      min={0}
                      max={24}
                      value={extraHours}
                      onChange={(e) => setExtraHours(parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">hours</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      id="extraMinutes"
                      type="number"
                      min={0}
                      max={59}
                      step={15}
                      value={extraMinutes}
                      onChange={(e) => setExtraMinutes(parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Type Toggle */}
            <div className="grid gap-2">
              <Label>Rate Type</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant={rateType === 'hourly' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setRateType('hourly')}
                  className="flex-1"
                >
                  Hourly
                </Button>
                <Button
                  type="button"
                  variant={rateType === 'flat' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setRateType('flat')}
                  className="flex-1"
                >
                  Flat Rate
                </Button>
              </div>
            </div>

            {/* Payment Amount */}
            {rateType === 'hourly' ? (
              <div className="grid gap-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="50.00"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Base: ${calculatedHourlyTotal.toFixed(2)} ({extraHours}h {extraMinutes}m @ ${hourlyRate}/hr)
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="flatRate">Flat Rate ($)</Label>
                <Input
                  id="flatRate"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="100.00"
                  value={flatRate}
                  onChange={(e) => setFlatRate(e.target.value)}
                />
              </div>
            )}

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
            {basePaymentAmount > 0 && (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground mb-2">Payment Preview:</p>
                <div className="space-y-1 text-sm">
                  {gstType === 'excluded' ? (
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      ${basePaymentAmount.toFixed(2)} (No GST)
                    </p>
                  ) : gstType === 'included' ? (
                    <>
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        ${basePaymentAmount.toFixed(2)} total
                      </p>
                      <p className="text-muted-foreground">
                        (${gstBreakdown.base.toFixed(2)} + GST ${gstBreakdown.gst.toFixed(2)})
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        ${gstBreakdown.total.toFixed(2)} total
                      </p>
                      <p className="text-muted-foreground">
                        (${basePaymentAmount.toFixed(2)} + GST ${gstBreakdown.gst.toFixed(2)})
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Start Time (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time (optional)</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to default to event start time
              </p>
            </div>

            {/* Notes (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Equipment needs, special requirements..."
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

export default EditExtraDialog;
