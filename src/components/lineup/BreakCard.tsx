/**
 * BreakCard Component
 *
 * Displays a break/intermission spot in the lineup.
 * Simpler than SpotCard - no assignment UI needed.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pencil,
  Trash2,
  GripVertical,
  Clock,
  Coffee,
  DoorOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpotData, StartTimeMode } from '@/types/spot';

interface BreakCardProps {
  spot: SpotData;
  onEdit: () => void;
  onDelete: () => void;
  isLoading?: boolean;
  onUpdateDuration?: (duration: number) => void;
  dragListeners?: React.HTMLAttributes<HTMLDivElement>;
}

const BREAK_LABELS: Record<string, string> = {
  doors: 'Doors Open',
  intermission: 'Intermission',
  custom: 'Break',
};

export function BreakCard({
  spot,
  onEdit,
  onDelete,
  isLoading = false,
  onUpdateDuration,
  dragListeners
}: BreakCardProps) {
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationValue, setDurationValue] = useState(String(spot.duration_minutes || 15));

  const handleDurationSave = () => {
    const newDuration = parseInt(durationValue, 10);
    if (!isNaN(newDuration) && newDuration > 0 && onUpdateDuration) {
      onUpdateDuration(newDuration);
    } else {
      setDurationValue(String(spot.duration_minutes || 15));
    }
    setEditingDuration(false);
  };

  const handleDurationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDurationSave();
    } else if (e.key === 'Escape') {
      setDurationValue(String(spot.duration_minutes || 15));
      setEditingDuration(false);
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return null;
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return null;
    }
  };

  const categoryColors: Record<string, string> = {
    doors: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    intermission: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    custom: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  };

  const formattedTime = formatTime(spot.start_time);
  const BreakIcon = spot.category === 'doors' ? DoorOpen : Coffee;
  const breakLabel = spot.label || BREAK_LABELS[spot.category] || 'Break';
  const startTimeMode = spot.start_time_mode || 'included';
  const isDoors = spot.category === 'doors';

  return (
    <Card className="border-dashed bg-muted/30">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        {/* Drag Handle */}
        <div
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none"
          {...dragListeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Start Time - show prominently */}
        {formattedTime && (
          <Badge variant="secondary" className="font-mono text-sm">
            <Clock className="mr-1 h-3 w-3" />
            {formattedTime}
          </Badge>
        )}

        {/* Break Type Badge */}
        <Badge className={categoryColors[spot.category] || categoryColors.custom}>
          <BreakIcon className="mr-1 h-3 w-3" />
          {breakLabel}
        </Badge>

        {/* Start Time Mode Badge - only for doors */}
        {isDoors && (
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              startTimeMode === 'before' && "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
            )}
          >
            {startTimeMode === 'included' ? 'Included in Start' : 'Before Start'}
          </Badge>
        )}

        {/* Editable Duration Badge */}
        {editingDuration ? (
          <Input
            type="number"
            value={durationValue}
            onChange={(e) => setDurationValue(e.target.value)}
            onBlur={handleDurationSave}
            onKeyDown={handleDurationKeyDown}
            className="h-6 w-16 text-xs"
            min={1}
            autoFocus
          />
        ) : (
          <Badge
            variant="secondary"
            className={cn(
              onUpdateDuration && "cursor-pointer hover:bg-secondary/80"
            )}
            onClick={() => onUpdateDuration && setEditingDuration(true)}
          >
            {spot.duration_minutes || 15} min
          </Badge>
        )}
      </CardHeader>

      {/* Notes - only show if present */}
      {spot.notes && (
        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground italic">
            {spot.notes}
          </p>
        </CardContent>
      )}

      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t border-border">
        {/* Edit Button */}
        <Button
          onClick={onEdit}
          disabled={isLoading}
          size="sm"
          variant="secondary"
          className="gap-1"
          aria-label="Edit break"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        {/* Delete Button */}
        <Button
          onClick={onDelete}
          disabled={isLoading}
          size="sm"
          variant="ghost"
          className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
          aria-label="Delete break"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

export default BreakCard;
