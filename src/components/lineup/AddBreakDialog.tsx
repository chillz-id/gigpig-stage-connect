/**
 * AddBreakDialog Component
 *
 * Dialog for creating a break item in the event lineup.
 * Supports Doors, Intermission, and Custom break types.
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SpotCategory, StartTimeMode } from '@/types/spot';

interface AddBreakDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  breakType: SpotCategory;
  onBreakCreated?: () => void;
}

const BREAK_LABELS: Record<SpotCategory, string> = {
  doors: 'Doors Open',
  intermission: 'Intermission',
  custom: 'Break',
  act: 'Act', // Not used but needed for type
};

const DEFAULT_DURATIONS: Record<SpotCategory, number> = {
  doors: 30,
  intermission: 15,
  custom: 10,
  act: 10,
};

export function AddBreakDialog({
  open,
  onOpenChange,
  eventId,
  breakType,
  onBreakCreated,
}: AddBreakDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [label, setLabel] = useState(BREAK_LABELS[breakType]);
  const [duration, setDuration] = useState(DEFAULT_DURATIONS[breakType]);
  const [startTimeMode, setStartTimeMode] = useState<StartTimeMode>('included');

  // Check if this is a doors break (for showing start time mode toggle)
  const isDoors = breakType === 'doors';

  // Update defaults when breakType changes
  useEffect(() => {
    if (open) {
      setLabel(BREAK_LABELS[breakType]);
      setDuration(DEFAULT_DURATIONS[breakType]);
      setStartTimeMode('included');
    }
  }, [breakType, open]);

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setLabel(BREAK_LABELS[breakType]);
      setDuration(DEFAULT_DURATIONS[breakType]);
      setStartTimeMode('included');
    }
    onOpenChange(isOpen);
  };

  // Create break mutation
  const createBreakMutation = useMutation({
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

      const breakData: Record<string, unknown> = {
        event_id: eventId,
        spot_name: label,
        spot_category: breakType,
        duration_minutes: duration,
        spot_order: nextOrder,
        is_paid: false,
        is_filled: false,
        confirmation_status: null,
      };

      // Only include start_time_mode for doors breaks
      if (isDoors) {
        breakData.start_time_mode = startTimeMode;
      }

      const { data, error } = await supabase
        .from('event_spots')
        .insert(breakData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Break Added',
        description: `${label} (${duration} min) has been added to the lineup.`,
      });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      onBreakCreated?.();
      handleOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add break',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBreakMutation.mutate();
  };

  const dialogTitle = breakType === 'custom' ? 'Add Custom Break' : `Add ${BREAK_LABELS[breakType]}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              Add a {breakType === 'custom' ? 'custom' : breakType} break to the lineup.
              This will be inserted at the end and can be reordered.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Label (editable for custom, pre-filled for others) */}
            <div className="grid gap-2">
              <Label htmlFor="breakLabel">Label</Label>
              <Input
                id="breakLabel"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={breakType === 'custom' ? 'e.g., Raffle Draw' : BREAK_LABELS[breakType]}
              />
            </div>

            {/* Duration */}
            <div className="grid gap-2">
              <Label htmlFor="breakDuration">Duration (minutes)</Label>
              <Input
                id="breakDuration"
                type="number"
                min={1}
                max={120}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
              />
            </div>

            {/* Start Time Mode Toggle - only for doors */}
            {isDoors && (
              <div className="grid gap-2">
                <Label>Event Start Time</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Does this event's listed start time include doors open, or does comedy start at the listed time?
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={startTimeMode === 'included' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setStartTimeMode('included')}
                    className="flex-1"
                  >
                    Included
                  </Button>
                  <Button
                    type="button"
                    variant={startTimeMode === 'before' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setStartTimeMode('before')}
                    className={cn(
                      "flex-1",
                      startTimeMode === 'before' && "bg-amber-600 hover:bg-amber-700"
                    )}
                  >
                    Before
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {startTimeMode === 'included'
                    ? "Doors open is the event start - comedy starts after doors."
                    : "Doors open before the listed start time - comedy starts at the listed time."}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createBreakMutation.isPending}>
              {createBreakMutation.isPending ? 'Adding...' : 'Add Break'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddBreakDialog;
