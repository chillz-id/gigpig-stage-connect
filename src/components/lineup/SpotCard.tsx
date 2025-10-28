/**
 * SpotCard Component (Presentational)
 *
 * Displays individual spot with comedian assignment and actions
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Pencil, Trash2, UserPlus, Clock } from 'lucide-react';
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (time: string) => {
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
        {/* Position Badge */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-lg font-bold text-white">
          {spot.position}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatTime(spot.time)}
              </span>
            </div>
          </div>

          {/* Type and Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={typeColors[spot.type] || typeColors.Guest}>
              {spot.type}
            </Badge>
            <Badge className={statusColors[spot.status] || statusColors.available}>
              {spot.status}
            </Badge>
            {spot.duration_minutes && (
              <Badge variant="outline">{spot.duration_minutes} min</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Assigned Comedian */}
        {spot.comedian_id && spot.comedian_name ? (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={spot.comedian_avatar} alt={spot.comedian_name} />
              <AvatarFallback>{getInitials(spot.comedian_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {spot.comedian_name}
              </p>
              {spot.payment_amount && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatCurrency(spot.payment_amount)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 p-3 text-center">
            <UserPlus className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Not assigned
            </span>
          </div>
        )}

        {/* Notes */}
        {spot.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-300 italic">
            {spot.notes}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t">
        {/* Assign Comedian Button */}
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

        {/* Edit Button */}
        <Button
          onClick={onEdit}
          disabled={isLoading}
          size="sm"
          variant="outline"
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
          variant="outline"
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
