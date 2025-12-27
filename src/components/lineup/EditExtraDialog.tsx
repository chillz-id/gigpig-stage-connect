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
import { useToast } from '@/hooks/use-toast';
import type { SpotData, ExtraType, RateType } from '@/types/spot';
import { EXTRA_TYPE_LABELS } from '@/types/spot';

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

  // Update spot mutation
  const updateSpotMutation = useMutation({
    mutationFn: async () => {
      const totalHours = extraHours + extraMinutes / 60;
      const paymentAmt = rateType === 'hourly'
        ? calculatedHourlyTotal
        : parseFloat(flatRate || '0');

      const updateData = {
        spot_name: EXTRA_TYPE_LABELS[extraType],
        extra_type: extraType,
        hours: totalHours,
        rate_type: rateType,
        payment_amount: paymentAmt,
        payment_gross: paymentAmt,
        payment_tax: 0,
        payment_net: paymentAmt,
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
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
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
                  Total: ${calculatedHourlyTotal.toFixed(2)} ({extraHours}h {extraMinutes}m @ ${hourlyRate}/hr)
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
