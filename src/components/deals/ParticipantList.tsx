/**
 * ParticipantList Component (Presentational)
 *
 * Displays list of deal participants with split amounts and approval status
 */

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Lock } from 'lucide-react';
import type { ParticipantData } from '@/types/deal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface ParticipantListProps {
  participants: ParticipantData[];
  dealAmount: number;
  canViewFinancials: boolean;
}

export function ParticipantList({
  participants,
  dealAmount,
  canViewFinancials
}: ParticipantListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    if (!canViewFinancials) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-gray-400">
                <Lock className="h-3 w-3" />
                ****
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Confirm a deal to view financials</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  if (participants.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        No participants added yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3"
        >
          {/* Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarImage src={participant.user_avatar} alt={participant.user_name} />
            <AvatarFallback>{getInitials(participant.user_name)}</AvatarFallback>
          </Avatar>

          {/* Name and Split */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {participant.user_name}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">
                {formatCurrency(participant.split_amount)}
              </span>
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <span>{formatPercentage(participant.split_percentage)}</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {participant.status === 'confirmed' ? (
              <Badge
                variant="secondary"
                className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                <CheckCircle className="h-3 w-3" />
                Confirmed
              </Badge>
            ) : participant.status === 'rejected' ? (
              <Badge
                variant="secondary"
                className="gap-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              >
                Rejected
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              >
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
            )}
          </div>
        </div>
      ))}

      {/* Total Validation */}
      {canViewFinancials && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(
                participants.reduce((sum, p) => sum + p.split_amount, 0)
              )}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatPercentage(
                participants.reduce((sum, p) => sum + p.split_percentage, 0)
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipantList;
