/**
 * SpotCard Component (Presentational)
 *
 * Displays individual spot with comedian assignment and actions
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Pencil, Trash2, UserPlus, GripVertical, Clock, Coffee, DoorOpen } from 'lucide-react';
import type { SpotData } from '@/types/spot';

interface SpotCardProps {
  spot: SpotData;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  isLoading?: boolean;
}

export function SpotCard({
  spot,
  onEdit,
  onDelete,
  onAssign,
  isLoading = false
}: SpotCardProps) {
  const typeColors: Record<string, string> = {
    MC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Feature: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Headliner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
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

  const isBreak = spot.category !== 'act';
  const formattedTime = formatTime(spot.start_time);

  // Get icon for break types
  const BreakIcon = spot.category === 'doors' ? DoorOpen : Coffee;

  return (
    <Card className={isBreak ? 'border-dashed bg-muted/30' : undefined}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        {/* Drag Handle */}
        <div className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Position Number */}
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold text-foreground">
          {spot.position}
        </div>

        {/* Start Time */}
        {formattedTime && (
          <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formattedTime}
          </div>
        )}

        {/* Type/Category, Status, Duration Badges */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {isBreak ? (
            <Badge className={categoryColors[spot.category] || categoryColors.custom}>
              <BreakIcon className="mr-1 h-3 w-3" />
              {spot.label || spot.category}
            </Badge>
          ) : (
            <>
              <Badge className={typeColors[spot.type] || typeColors.Guest}>
                {spot.type}
              </Badge>
              <Badge className={statusColors[spot.status] || statusColors.available}>
                {spot.status}
              </Badge>
            </>
          )}
          {spot.duration_minutes && (
            <Badge variant="secondary">{spot.duration_minutes} min</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Assigned Comedian */}
        {spot.comedian_id && spot.comedian_name ? (
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
        )}

        {/* Notes */}
        {spot.notes && (
          <p className="text-sm text-muted-foreground italic">
            {spot.notes}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t border-border">
        {/* Assign Comedian Button - Only show for act spots, not breaks */}
        {!isBreak && (
          <Button
            onClick={onAssign}
            disabled={isLoading}
            size="sm"
            variant="default"
            className="gap-1"
            aria-label="Assign comedian to spot"
          >
            <UserPlus className="h-4 w-4" />
            {spot.comedian_id ? 'Reassign' : 'Assign'}
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
