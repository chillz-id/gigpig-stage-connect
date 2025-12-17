/**
 * ParticipantCard Component (Presentational)
 *
 * Displays deal participant with split details and approval status
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Pencil, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type ParticipantApprovalStatus = 'pending' | 'confirmed' | 'declined';

export interface ParticipantData {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_avatar?: string;
  participant_type: string; // 'comedian', 'manager', 'venue', etc.
  split_type: 'percentage' | 'fixed_amount';
  split_percentage?: number;
  split_amount?: number;
  calculated_amount?: number;
  approval_status: ParticipantApprovalStatus;
}

interface ParticipantCardProps {
  participant: ParticipantData;
  dealAmount?: number;
  showActions?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ParticipantCard({
  participant,
  dealAmount,
  showActions = false,
  onEdit,
  onRemove
}: ParticipantCardProps) {
  const statusConfig: Record<
    ParticipantApprovalStatus,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    pending: {
      icon: <Clock className="h-3 w-3" />,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      label: 'Pending'
    },
    confirmed: {
      icon: <CheckCircle className="h-3 w-3" />,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      label: 'Confirmed'
    },
    declined: {
      icon: <XCircle className="h-3 w-3" />,
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      label: 'Declined'
    }
  };

  const status = statusConfig[participant.approval_status];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  // Calculate display amount
  const displayAmount = () => {
    if (participant.split_type === 'fixed_amount' && participant.split_amount) {
      return formatCurrency(participant.split_amount);
    }

    if (participant.calculated_amount) {
      return formatCurrency(participant.calculated_amount);
    }

    if (
      participant.split_type === 'percentage' &&
      participant.split_percentage &&
      dealAmount
    ) {
      const calculated = (dealAmount * participant.split_percentage) / 100;
      return formatCurrency(calculated);
    }

    return 'TBD';
  };

  const displaySplit = () => {
    if (participant.split_type === 'percentage' && participant.split_percentage) {
      return formatPercentage(participant.split_percentage);
    }

    if (participant.split_type === 'fixed_amount' && participant.split_amount) {
      return formatCurrency(participant.split_amount);
    }

    return 'Not set';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Avatar and Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <OptimizedAvatar
              src={participant.participant_avatar}
              name={participant.participant_name}
              className="h-10 w-10 flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {participant.participant_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {participant.participant_type}
              </p>
            </div>
          </div>

          {/* Center: Split Details */}
          <div className="hidden sm:flex flex-col items-end gap-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {displaySplit()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {displayAmount()}
            </p>
          </div>

          {/* Right: Status Badge & Actions */}
          <div className="flex items-center gap-2">
            <Badge className={`${status.color} gap-1 text-xs`}>
              {status.icon}
              <span className="hidden sm:inline">{status.label}</span>
            </Badge>

            {showActions && (
              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-8 w-8 p-0"
                    aria-label="Edit participant"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    aria-label="Remove participant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Split Details */}
        <div className="sm:hidden mt-3 flex justify-between text-sm border-t pt-3">
          <div>
            <p className="text-xs text-gray-500">Split</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{displaySplit()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Amount</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{displayAmount()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ParticipantCard;
