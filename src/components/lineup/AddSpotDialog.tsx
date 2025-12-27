/**
 * AddSpotDialog Component
 *
 * Dialog for creating a new spot in the event lineup.
 * Supports both Comedian spots and Extra (production staff) spots.
 * - Comedian: Spot type, duration in minutes, optional payment
 * - Extra: Staff type, duration in hours/minutes, hourly/flat rate
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mic2, Users } from 'lucide-react';
import type { ExtraType, RateType } from '@/types/spot';
import { EXTRA_TYPE_LABELS } from '@/types/spot';

interface AddSpotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSpotCreated?: () => void;
}

type SpotType = 'MC' | 'Spot' | 'Feature' | 'Headliner' | 'Guest' | 'Open Mic';

const SPOT_TYPES: SpotType[] = ['MC', 'Spot', 'Feature', 'Headliner', 'Guest', 'Open Mic'];

const DEFAULT_DURATIONS: Record<SpotType, number> = {
  MC: 15,
  Spot: 10,
  Feature: 10,
  Headliner: 30,
  Guest: 5,
  'Open Mic': 5,
};

const EXTRA_TYPES: ExtraType[] = ['photographer', 'videographer', 'door_staff', 'audio_tech', 'lighting_tech'];

export function AddSpotDialog({
  open,
  onOpenChange,
  eventId,
  onSpotCreated,
}: AddSpotDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<'comedian' | 'extra'>('comedian');

  // Comedian form state
  const [spotName, setSpotName] = useState<SpotType>('Feature');
  const [duration, setDuration] = useState(DEFAULT_DURATIONS.Feature);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Extra form state
  const [extraType, setExtraType] = useState<ExtraType>('photographer');
  const [extraHours, setExtraHours] = useState<number>(2);
  const [extraMinutes, setExtraMinutes] = useState<number>(0);
  const [rateType, setRateType] = useState<RateType>('hourly');
  const [hourlyRate, setHourlyRate] = useState<string>('50');
  const [flatRate, setFlatRate] = useState<string>('100');
  const [extraNotes, setExtraNotes] = useState('');
  const [extraStartTime, setExtraStartTime] = useState('');

  // Calculate total payment for hourly extras
  const calculatedHourlyTotal = parseFloat(hourlyRate || '0') * (extraHours + extraMinutes / 60);

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Reset comedian form
      setActiveTab('comedian');
      setSpotName('Feature');
      setDuration(DEFAULT_DURATIONS.Feature);
      setIsPaid(false);
      setPaymentAmount('');
      setNotes('');
      // Reset extra form
      setExtraType('photographer');
      setExtraHours(2);
      setExtraMinutes(0);
      setRateType('hourly');
      setHourlyRate('50');
      setFlatRate('100');
      setExtraNotes('');
      setExtraStartTime('');
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

      if (activeTab === 'comedian') {
        // Create comedian spot
        const spotData = {
          event_id: eventId,
          spot_name: spotName,
          duration_minutes: duration,
          spot_order: nextOrder,
          is_paid: isPaid,
          payment_amount: isPaid && paymentAmount ? parseFloat(paymentAmount) : null,
          is_filled: false,
          confirmation_status: 'pending',
          spot_type: 'act' as const,
          spot_category: 'act' as const,
        };

        const { data, error } = await supabase
          .from('event_spots')
          .insert(spotData)
          .select()
          .single();

        if (error) throw error;
        return { data, type: 'comedian', label: spotName };
      } else {
        // Create extra/production staff spot
        const totalHours = extraHours + extraMinutes / 60;
        const paymentAmt = rateType === 'hourly'
          ? calculatedHourlyTotal
          : parseFloat(flatRate || '0');

        const spotData = {
          event_id: eventId,
          spot_name: EXTRA_TYPE_LABELS[extraType],
          duration_minutes: 0, // Extras don't contribute to show runtime
          spot_order: nextOrder,
          is_paid: true, // Extras are always paid
          payment_amount: paymentAmt,
          is_filled: false,
          confirmation_status: 'pending',
          spot_type: 'extra' as const,
          spot_category: 'act' as const, // Using 'act' category but 'extra' spot_type
          extra_type: extraType,
          rate_type: rateType,
          hours: totalHours,
          payment_notes: extraNotes || null,
          scheduled_start_time: extraStartTime || null,
        };

        const { data, error } = await supabase
          .from('event_spots')
          .insert(spotData)
          .select()
          .single();

        if (error) throw error;
        return { data, type: 'extra', label: EXTRA_TYPE_LABELS[extraType] };
      }
    },
    onSuccess: (result) => {
      toast({
        title: result.type === 'comedian' ? 'Spot Created' : 'Extra Added',
        description: `${result.label} has been added to the lineup.`,
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
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add to Lineup</DialogTitle>
            <DialogDescription>
              Add a performer or production staff to this event.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'comedian' | 'extra')} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comedian" className="flex items-center gap-2">
                <Mic2 className="h-4 w-4" />
                Comedian
              </TabsTrigger>
              <TabsTrigger value="extra" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Extra
              </TabsTrigger>
            </TabsList>

            {/* Comedian Tab */}
            <TabsContent value="comedian" className="space-y-4 mt-4">
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
            </TabsContent>

            {/* Extra Tab */}
            <TabsContent value="extra" className="space-y-4 mt-4">
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
                <Label htmlFor="extraStartTime">Start Time (optional)</Label>
                <Input
                  id="extraStartTime"
                  type="time"
                  value={extraStartTime}
                  onChange={(e) => setExtraStartTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to default to event start time
                </p>
              </div>

              {/* Notes (optional) */}
              <div className="grid gap-2">
                <Label htmlFor="extraNotes">Notes (optional)</Label>
                <Textarea
                  id="extraNotes"
                  placeholder="Equipment needs, special requirements..."
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSpotMutation.isPending}>
              {createSpotMutation.isPending
                ? 'Creating...'
                : activeTab === 'comedian' ? 'Add Spot' : 'Add Extra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddSpotDialog;
