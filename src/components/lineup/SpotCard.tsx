/**
 * SpotCard Component (Presentational)
 *
 * Displays individual spot with comedian/staff assignment and actions
 * Supports inline editing for duration, type, and paid status
 * Handles both comedian spots and extra/production staff spots
 */

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import {
  Pencil,
  Trash2,
  UserPlus,
  GripVertical,
  Clock,
  Coffee,
  DoorOpen,
  DollarSign,
  Camera,
  Video,
  DoorClosed,
  Volume2,
  Lightbulb,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpotData, ExtraType } from '@/types/spot';
import { EXTRA_TYPE_LABELS } from '@/types/spot';

interface SpotCardProps {
  spot: SpotData;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  isLoading?: boolean;
  // Inline editing callbacks
  onUpdateDuration?: (duration: number) => void;
  onUpdateType?: (type: string) => void;
  onTogglePaid?: () => void;
  isPaid?: boolean;
  // Drag handle listeners from useSortable
  dragListeners?: React.HTMLAttributes<HTMLDivElement>;
}

// Available spot types for the dropdown
const SPOT_TYPES = ['MC', 'Feature', 'Headliner', 'Spot', 'Guest'] as const;

// Icon mapping for extra types
const EXTRA_ICONS: Record<ExtraType, React.ComponentType<{ className?: string }>> = {
  photographer: Camera,
  videographer: Video,
  door_staff: DoorClosed,
  audio_tech: Volume2,
  lighting_tech: Lightbulb,
};

// Color mapping for extra types
const EXTRA_COLORS: Record<ExtraType, string> = {
  photographer: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  videographer: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  door_staff: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  audio_tech: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  lighting_tech: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export function SpotCard({
  spot,
  onEdit,
  onDelete,
  onAssign,
  isLoading = false,
  onUpdateDuration,
  onUpdateType,
  onTogglePaid,
  isPaid = false,
  dragListeners
}: SpotCardProps) {
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationValue, setDurationValue] = useState(String(spot.duration_minutes || 5));

  const handleDurationSave = () => {
    const newDuration = parseInt(durationValue, 10);
    if (!isNaN(newDuration) && newDuration > 0 && onUpdateDuration) {
      onUpdateDuration(newDuration);
    } else {
      setDurationValue(String(spot.duration_minutes || 5));
    }
    setEditingDuration(false);
  };

  const handleDurationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDurationSave();
    } else if (e.key === 'Escape') {
      setDurationValue(String(spot.duration_minutes || 5));
      setEditingDuration(false);
    }
  };

  const typeColors: Record<string, string> = {
    MC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Feature: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Headliner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Spot: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    Guest: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };

  const statusColors: Record<string, string> = {
    available: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  const categoryColors: Record<string, string> = {
    doors: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    intermission: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    custom: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
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

  // Format scheduled time (TIME format like "20:00")
  const formatScheduledTime = (time?: string) => {
    if (!time) return null;
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return null;
    }
  };

  const formatHours = (hours?: number) => {
    if (!hours) return null;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const isBreak = spot.category !== 'act';
  const isExtra = spot.spot_type === 'extra';
  // For extras with scheduled_start_time, use that; otherwise use calculated start_time
  const formattedTime = isExtra && spot.scheduled_start_time
    ? formatScheduledTime(spot.scheduled_start_time)
    : formatTime(spot.start_time);

  // Get icon for break types
  const BreakIcon = spot.category === 'doors' ? DoorOpen : Coffee;

  // Get icon for extra types
  const ExtraIcon = isExtra && spot.extra_type
    ? EXTRA_ICONS[spot.extra_type] || Users
    : Users;

  // Get color for extra types
  const extraColor = isExtra && spot.extra_type
    ? EXTRA_COLORS[spot.extra_type] || 'bg-gray-100 text-gray-800'
    : 'bg-gray-100 text-gray-800';

  return (
    <Card className={cn(
      isBreak && 'border-dashed bg-muted/30',
      isExtra && 'border-dashed bg-gradient-to-r from-muted/20 to-muted/40'
    )}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        {/* Drag Handle */}
        <div
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none"
          {...dragListeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Position Number - hidden for breaks and extras */}
        {!isBreak && !isExtra && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold text-foreground">
            {spot.position}
          </div>
        )}

        {/* Start Time - show prominently */}
        {formattedTime && (
          <Badge variant="secondary" className="font-mono text-sm">
            <Clock className="mr-1 h-3 w-3" />
            {formattedTime}
          </Badge>
        )}

        {/* Type/Category, Status, Duration Badges */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {isBreak ? (
            <Badge className={categoryColors[spot.category] || categoryColors.custom}>
              <BreakIcon className="mr-1 h-3 w-3" />
              {spot.label || spot.category}
            </Badge>
          ) : isExtra ? (
            <>
              {/* Extra Type Badge */}
              <Badge className={extraColor}>
                <ExtraIcon className="mr-1 h-3 w-3" />
                {spot.extra_type ? EXTRA_TYPE_LABELS[spot.extra_type] : 'Extra'}
              </Badge>

              {/* Rate Type Badge */}
              {spot.rate_type && (
                <Badge variant="secondary" className="text-xs">
                  {spot.rate_type === 'hourly' ? 'Hourly' : 'Flat Rate'}
                </Badge>
              )}

              {/* Duration in Hours */}
              {spot.hours && (
                <Badge variant="secondary">
                  {formatHours(spot.hours)}
                </Badge>
              )}
            </>
          ) : (
            <>
              {/* Type Dropdown */}
              {onUpdateType ? (
                <Select
                  value={spot.type}
                  onValueChange={onUpdateType}
                >
                  <SelectTrigger className="h-6 w-auto min-w-[80px] border-0 bg-transparent p-0 hover:bg-muted">
                    <Badge className={cn(typeColors[spot.type] || typeColors.Guest, "cursor-pointer")}>
                      <SelectValue />
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {SPOT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={typeColors[spot.type] || typeColors.Guest}>
                  {spot.type}
                </Badge>
              )}
              <Badge className={statusColors[spot.status] || statusColors.available}>
                {spot.status}
              </Badge>
            </>
          )}

          {/* Editable Duration Badge - only for comedian spots, not extras */}
          {!isExtra && (
            editingDuration ? (
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
                {spot.duration_minutes || 5} min
              </Badge>
            )
          )}

          {/* Paid Indicator */}
          {isPaid && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <DollarSign className="mr-1 h-3 w-3" />
              Paid
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Assigned Comedian or Staff */}
        {isExtra ? (
          // Extra Staff Assignment
          spot.staff_id && spot.staff_name ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
              <OptimizedAvatar
                src={spot.staff_avatar}
                name={spot.staff_name}
                className="h-10 w-10"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {spot.staff_name}
                </p>
                {spot.payment_amount && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(spot.payment_amount)}
                    {spot.rate_type === 'hourly' && spot.hours && (
                      <span className="text-xs ml-1">
                        ({formatHours(spot.hours)})
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Not assigned
              </span>
            </div>
          )
        ) : (
          // Comedian Assignment
          spot.comedian_id && spot.comedian_name ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
              <OptimizedAvatar
                src={spot.comedian_avatar}
                name={spot.comedian_name}
                className="h-10 w-10"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {spot.comedian_name}
                </p>
                {spot.payment_amount && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(spot.payment_amount)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Not assigned
              </span>
            </div>
          )
        )}

        {/* Notes */}
        {spot.notes && (
          <p className="text-sm text-muted-foreground italic">
            {spot.notes}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t border-border">
        {/* Assign Button - Only show for act spots and extras, not breaks */}
        {!isBreak && (
          <Button
            onClick={onAssign}
            disabled={isLoading}
            size="sm"
            variant="default"
            className="gap-1"
            aria-label={isExtra ? "Assign staff to spot" : "Assign comedian to spot"}
          >
            {isExtra ? <Users className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isExtra
              ? (spot.staff_id ? 'Reassign' : 'Assign')
              : (spot.comedian_id ? 'Reassign' : 'Assign')
            }
          </Button>
        )}

        {/* Paid Toggle Button - Only show for comedian spots with comedian assigned */}
        {!isBreak && !isExtra && spot.comedian_id && onTogglePaid && (
          <Button
            onClick={onTogglePaid}
            disabled={isLoading}
            size="sm"
            variant={isPaid ? "default" : "secondary"}
            className={cn(
              "gap-1",
              isPaid && "bg-green-600 hover:bg-green-700 text-white"
            )}
            aria-label={isPaid ? "Mark as unpaid" : "Mark as paid"}
          >
            <DollarSign className="h-4 w-4" />
            {isPaid ? 'Paid' : 'Unpaid'}
          </Button>
        )}

        {/* Edit Button */}
        <Button
          onClick={onEdit}
          disabled={isLoading}
          size="sm"
          variant="secondary"
          className="gap-1"
          aria-label="Edit spot"
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
          aria-label="Delete spot"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

export default SpotCard;
