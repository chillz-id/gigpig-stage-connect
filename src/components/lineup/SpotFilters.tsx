/**
 * SpotFilters Component (Presentational)
 *
 * Filter controls for spot list with type, payment status, assignment, and sort
 */

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface SpotFilterState {
  spotType: 'all' | 'MC' | 'Feature' | 'Headliner' | 'Guest';
  paymentStatus: 'all' | 'unpaid' | 'pending' | 'paid';
  assignment: 'all' | 'assigned' | 'unassigned';
  sort: 'time_asc' | 'time_desc' | 'payment_high' | 'payment_low';
}

interface SpotFiltersProps {
  onFilterChange: (filters: SpotFilterState) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SpotFilters({ onFilterChange }: SpotFiltersProps) {
  const [filters, setFilters] = useState<SpotFilterState>({
    spotType: 'all',
    paymentStatus: 'all',
    assignment: 'all',
    sort: 'time_asc'
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof SpotFilterState, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const defaultFilters: SpotFilterState = {
      spotType: 'all',
      paymentStatus: 'all',
      assignment: 'all',
      sort: 'time_asc'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters =
    filters.spotType !== 'all' ||
    filters.paymentStatus !== 'all' ||
    filters.assignment !== 'all' ||
    filters.sort !== 'time_asc';

  return (
    <div className="space-y-3">
      {/* Toggle Button for Mobile */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 lg:hidden"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
              !
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${
          isExpanded ? '' : 'hidden lg:grid'
        }`}
      >
        {/* Spot Type Filter */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Spot Type
          </label>
          <Select
            value={filters.spotType}
            onValueChange={(value) =>
              handleFilterChange('spotType', value as SpotFilterState['spotType'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="MC">MC</SelectItem>
              <SelectItem value="Feature">Feature</SelectItem>
              <SelectItem value="Headliner">Headliner</SelectItem>
              <SelectItem value="Guest">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment Status Filter */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Status
          </label>
          <Select
            value={filters.paymentStatus}
            onValueChange={(value) =>
              handleFilterChange('paymentStatus', value as SpotFilterState['paymentStatus'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignment Filter */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Assignment
          </label>
          <Select
            value={filters.assignment}
            onValueChange={(value) =>
              handleFilterChange('assignment', value as SpotFilterState['assignment'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All spots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Spots</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort By
          </label>
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              handleFilterChange('sort', value as SpotFilterState['sort'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time_asc">Time (Earliest First)</SelectItem>
              <SelectItem value="time_desc">Time (Latest First)</SelectItem>
              <SelectItem value="payment_high">Payment (High to Low)</SelectItem>
              <SelectItem value="payment_low">Payment (Low to High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default SpotFilters;
