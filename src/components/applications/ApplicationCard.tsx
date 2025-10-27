/**
 * ApplicationCard Component (Presentational)
 *
 * Displays individual comedian application with actions
 * 4 Action Buttons: Approve, Add to Shortlist, Favourite, Hide
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { CheckCircle, Star, Heart, EyeOff } from 'lucide-react';
import type { ApplicationData } from '@/types/application';

interface ApplicationCardProps {
  application: ApplicationData;
  isFavourited: boolean;
  isHidden: boolean;
  onApprove: () => void;
  onReject?: () => void;
  onAddToShortlist: () => void;
  onFavourite: () => void;
  onUnfavourite: () => void;
  onHide: (scope: 'event' | 'global') => void;
  isLoading?: boolean;
}

export function ApplicationCard({
  application,
  isFavourited,
  isHidden,
  onApprove,
  onAddToShortlist,
  onFavourite,
  onUnfavourite,
  onHide,
  isLoading = false
}: ApplicationCardProps) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    withdrawn: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`transition-all duration-200 ${isHidden ? 'opacity-60' : ''}`}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarImage src={application.comedian_avatar} alt={application.comedian_name} />
          <AvatarFallback>{getInitials(application.comedian_name)}</AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex flex-1 flex-col space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {application.comedian_name}
            </h3>
            {isFavourited && (
              <Heart className="h-4 w-4 fill-red-500 text-red-500" aria-label="Favourited" />
            )}
          </div>

          {/* Experience and Rating */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {application.comedian_experience && <span>{application.comedian_experience}</span>}
            {application.comedian_rating && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {application.comedian_rating.toFixed(1)}
                </span>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusColors[application.status] || statusColors.pending}>
              {application.status}
            </Badge>
            {application.spot_type && (
              <Badge variant="outline">{application.spot_type}</Badge>
            )}
            {isHidden && (
              <Badge variant="secondary" className="gap-1">
                <EyeOff className="h-3 w-3" />
                Hidden
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-4">
        {/* Application Message */}
        {application.message && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {application.message}
          </p>
        )}

        {/* Applied Date */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Applied {new Date(application.applied_at).toLocaleDateString()}
        </p>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t">
        {/* Approve Button */}
        <Button
          onClick={onApprove}
          disabled={isLoading || application.status === 'accepted'}
          size="sm"
          variant="default"
          className="gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          aria-label="Approve application"
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </Button>

        {/* Add to Shortlist Button */}
        <Button
          onClick={onAddToShortlist}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="gap-1"
          aria-label="Add to shortlist"
        >
          <Star className="h-4 w-4" />
          Shortlist
        </Button>

        {/* Favourite Button (Toggle) */}
        <Button
          onClick={isFavourited ? onUnfavourite : onFavourite}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className={`gap-1 ${
            isFavourited
              ? 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
              : ''
          }`}
          aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Heart className={`h-4 w-4 ${isFavourited ? 'fill-red-500' : ''}`} />
          {isFavourited ? 'Unfavourite' : 'Favourite'}
        </Button>

        {/* Hide Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="gap-1"
              aria-label="Hide comedian"
            >
              <EyeOff className="h-4 w-4" />
              Hide
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onHide('event')}>
              Hide from this show
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHide('global')}>
              Hide from all shows
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}

export default ApplicationCard;
