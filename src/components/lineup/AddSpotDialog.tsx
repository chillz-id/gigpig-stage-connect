/**
 * AddSpotDialog Component
 *
 * Dialog for creating a new spot in the event lineup.
 * Supports spot type selection, duration, and optional payment configuration.
 */

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

interface AddSpotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSpotCreated?: () => void;
}

type SpotType = 'MC' | 'Feature' | 'Headliner' | 'Guest' | 'Open Mic';

const SPOT_TYPES: SpotType[] = ['MC', 'Feature', 'Headliner', 'Guest', 'Open Mic'];

const DEFAULT_DURATIONS: Record<SpotType, number> = {
  MC: 15,
  Feature: 10,
  Headliner: 30,
  Guest: 5,
  'Open Mic': 5,
};

export function AddSpotDialog({
  open,
  onOpenChange,
  eventId,
  onSpotCreated,
}: AddSpotDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [spotName, setSpotName] = useState<SpotType>('Feature');
  const [duration, setDuration] = useState(DEFAULT_DURATIONS.Feature);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSpotName('Feature');
      setDuration(DEFAULT_DURATIONS.Feature);
      setIsPaid(false);
      setPaymentAmount('');
      setNotes('');
    }
    onOpenChange(isOpen);
  };

  // Handle spot type change - update duration to default
  const handleSpotTypeChange = (value: SpotType) => {
    setSpotName(value);
    setDuration(DEFAULT_DURATIONS[value]);
  };

  // Create spot mutation
  const createSpotMutation = useMutation({
    mutationFn: async () => {
      // Get the current max spot_order for this event
      const { data: existingSpots, error: fetchError } = await supabase
        .from('event_spots')
        .select('spot_order')
        .eq('event_id', eventId)
        .order('spot_order', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const nextOrder = existingSpots && existingSpots.length > 0
        ? (existingSpots[0]?.spot_order ?? 0) + 1
        : 1;

      const spotData = {
        event_id: eventId,
        spot_name: spotName,
        duration_minutes: duration,
        spot_order: nextOrder,
        is_paid: isPaid,
        payment_amount: isPaid && paymentAmount ? parseFloat(paymentAmount) : null,
        is_filled: false,
        confirmation_status: 'pending',
      };

      const { data, error } = await supabase
        .from('event_spots')
        .insert(spotData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Spot Created',
        description: `${spotName} spot has been added to the lineup.`,
      });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      onSpotCreated?.();
      handleOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create spot',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSpotMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Spot to Lineup</DialogTitle>
            <DialogDescription>
              Create a new performance slot for this event.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Spot Type */}
            <div className="grid gap-2">
              <Label htmlFor="spotType">Spot Type</Label>
              <Select value={spotName} onValueChange={(v) => handleSpotTypeChange(v as SpotType)}>
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
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSpotMutation.isPending}>
              {createSpotMutation.isPending ? 'Creating...' : 'Add Spot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddSpotDialog;
