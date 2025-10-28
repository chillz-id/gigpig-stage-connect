/**
 * SplitCalculator Component (Presentational)
 *
 * Interactive calculator for adjusting deal split amounts
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, DollarSign, Percent } from 'lucide-react';
import type { SplitParticipant } from '@/types/deal';

interface SplitCalculatorProps {
  totalAmount: number;
  participants: SplitParticipant[];
  onSplitChange: (participantId: string, amount: number) => void;
}

export function SplitCalculator({
  totalAmount,
  participants,
  onSplitChange
}: SplitCalculatorProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const calculatePercentage = (amount: number) => {
    if (totalAmount === 0) return 0;
    return (amount / totalAmount) * 100;
  };

  // Calculate totals
  const totalAllocated = participants.reduce((sum, p) => sum + p.split_amount, 0);
  const totalPercentage = participants.reduce((sum, p) => sum + p.split_percentage, 0);
  const remaining = totalAmount - totalAllocated;
  const isValid = Math.abs(totalAllocated - totalAmount) < 0.01; // Allow for floating point errors

  const handleAmountChange = (participantId: string, value: string) => {
    const amount = parseFloat(value) || 0;
    // Ensure amount doesn't exceed total
    const cappedAmount = Math.min(amount, totalAmount);
    onSplitChange(participantId, cappedAmount);
  };

  const handlePercentageChange = (participantId: string, percentage: number) => {
    const amount = (percentage / 100) * totalAmount;
    onSplitChange(participantId, amount);
  };

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        Add participants to calculate splits
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Amount Display */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Deal Amount
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Participant Splits */}
      <div className="space-y-4">
        {participants.map((participant) => (
          <div
            key={participant.id || participant.user_id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3"
          >
            {/* Participant Header */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={participant.user_avatar} alt={participant.user_name} />
                <AvatarFallback>{getInitials(participant.user_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {participant.user_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {participant.split_percentage.toFixed(1)}% of total
                </p>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <DollarSign className="h-4 w-4" />
                Amount
              </label>
              <Input
                type="number"
                min="0"
                max={totalAmount}
                step="0.01"
                value={participant.split_amount.toFixed(2)}
                onChange={(e) =>
                  handleAmountChange(participant.id || participant.user_id, e.target.value)
                }
                className="font-mono"
              />
            </div>

            {/* Percentage Slider */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Percentage
                </span>
                <span className="font-mono">{participant.split_percentage.toFixed(1)}%</span>
              </label>
              <Slider
                value={[participant.split_percentage]}
                onValueChange={([value]) =>
                  handlePercentageChange(participant.id || participant.user_id, value || 0)
                }
                min={0}
                max={100}
                step={0.1}
                className="py-2"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Total Allocated
          </span>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalAllocated)}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {totalPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Remaining
          </span>
          <span
            className={`font-semibold ${
              remaining > 0
                ? 'text-orange-600 dark:text-orange-400'
                : remaining < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {formatCurrency(Math.abs(remaining))}
          </span>
        </div>
      </div>

      {/* Validation Alert */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {remaining > 0
              ? `Unallocated amount: ${formatCurrency(remaining)}. Splits must add up to 100%.`
              : `Over-allocated by ${formatCurrency(Math.abs(remaining))}. Reduce split amounts.`}
          </AlertDescription>
        </Alert>
      )}

      {isValid && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <AlertDescription className="flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Splits are valid and add up to 100%
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default SplitCalculator;
