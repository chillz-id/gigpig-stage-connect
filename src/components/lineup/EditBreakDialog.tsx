/**
 * EditBreakDialog Component
 *
 * Dialog for editing a break item in the event lineup.
 * Supports editing label and duration for Doors, Intermission, and Custom break types.
 * For "Doors" breaks, includes a toggle for whether the break is included in show start time.
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
import type { SpotData, StartTimeMode } from '@/types/spot';

interface EditBreakDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  spot: SpotData;
}

export function EditBreakDialog({
  open,
  onOpenChange,
  eventId,
  spot,
}: EditBreakDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state - pre-populated with current values
  const [label, setLabel] = useState(spot.label || '');
  const [duration, setDuration] = useState(spot.duration_minutes || 10);
  const [startTimeMode, setStartTimeMode] = useState<StartTimeMode>(spot.start_time_mode || 'included');

  // Check if this is a doors break (for showing start time mode toggle)
  const isDoors = spot.category === 'doors';

  // Update form when spot changes or dialog opens
  useEffect(() => {
    if (open) {
      setLabel(spot.label || '');
      setDuration(spot.duration_minutes || 10);
      setStartTimeMode(spot.start_time_mode || 'included');
    }
  }, [spot, open]);

  // Update break mutation
  const updateBreakMutation = useMutation({
    mutationFn: async () => {
      const updateData: Record<string, unknown> = {
        spot_name: label,
        duration_minutes: duration,
      };

      // Only include start_time_mode for doors breaks
      if (isDoors) {
        updateData.start_time_mode = startTimeMode;
      }

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
        title: 'Break Updated',
        description: `${label} has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update break',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBreakMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Break</DialogTitle>
            <DialogDescription>
              Update the label and duration for this break.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Label */}
            <div className="grid gap-2">
              <Label htmlFor="breakLabel">Label</Label>
              <Input
                id="breakLabel"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Doors Open, Intermission"
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateBreakMutation.isPending}>
              {updateBreakMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditBreakDialog;
