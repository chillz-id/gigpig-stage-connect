/**
 * DealCard Component (Presentational)
 *
 * Displays individual deal with participants and approval actions
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Pencil, Lock } from 'lucide-react';
import type { DealData, ParticipantData } from '@/types/deal';
import { ParticipantList } from './ParticipantList';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface DealCardProps {
  deal: DealData;
  participants: ParticipantData[];
  onConfirm: () => void;
  onReject: () => void;
  onEdit: () => void;
  canConfirm: boolean;
  hasConfirmed: boolean;
  canViewFinancials: boolean;
  isLoading?: boolean;
}

export function DealCard({
  deal,
  participants,
  onConfirm,
  onReject,
  onEdit,
  canConfirm,
  hasConfirmed,
  canViewFinancials,
  isLoading = false
}: DealCardProps) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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

  const confirmedCount = participants.filter((p) => p.status === 'confirmed').length;
  const totalCount = participants.length;
  const approvalProgress = (confirmedCount / totalCount) * 100;

  return (
    <Card>
      <CardHeader className="space-y-3 pb-4">
        {/* Title and Status */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {deal.title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(deal.total_amount)}
            </p>
          </div>
          <Badge className={statusColors[deal.status] || statusColors.pending}>
            {deal.status}
          </Badge>
        </div>

        {/* Approval Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Confirmations
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {confirmedCount}/{totalCount}
            </span>
          </div>
          <Progress value={approvalProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Participants List */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Split Breakdown
          </h4>
          <ParticipantList
            participants={participants}
            dealAmount={deal.total_amount}
            canViewFinancials={canViewFinancials}
          />
        </div>

        {/* Confirmed/Rejected Timestamp */}
        {deal.confirmed_at && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Confirmed {new Date(deal.confirmed_at).toLocaleDateString()}
          </p>
        )}
        {deal.rejected_at && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Rejected {new Date(deal.rejected_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t">
        {/* Show action buttons only if user is a participant and hasn't confirmed yet */}
        {canConfirm && !hasConfirmed && deal.status === 'pending' && (
          <>
            {/* Confirm Button */}
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              size="sm"
              variant="default"
              className="gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              aria-label="Confirm deal"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Deal
            </Button>

            {/* Reject Button */}
            <Button
              onClick={onReject}
              disabled={isLoading}
              size="sm"
              className="professional-button"
              className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
              aria-label="Reject deal"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </>
        )}

        {/* Already confirmed message */}
        {hasConfirmed && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>You confirmed this deal</span>
          </div>
        )}

        {/* Edit button (only for deal creator) */}
        {deal.status === 'pending' && (
          <Button
            onClick={onEdit}
            disabled={isLoading}
            size="sm"
            className="professional-button"
            className="gap-1 ml-auto"
            aria-label="Edit deal"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default DealCard;
