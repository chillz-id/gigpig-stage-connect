/**
 * ApplicationFilters Component (Presentational)
 *
 * Filters and search for applications with responsive layout
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Eye, EyeOff, SlidersHorizontal } from 'lucide-react';
import type { ApplicationStatus, SpotType } from '@/types/application';

export type SortOption = 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'experience_high' | 'experience_low';

export interface FilterState {
  status: ApplicationStatus | 'all';
  spotType: SpotType | 'all';
  sort: SortOption;
}

interface ApplicationFiltersProps {
  filters: FilterState;
  showHidden: boolean;
  onFilterChange: (filters: FilterState) => void;
  onToggleShowHidden: () => void;
}

export function ApplicationFilters({
  filters,
  showHidden,
  onFilterChange,
  onToggleShowHidden
}: ApplicationFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value as ApplicationStatus | 'all'
    });
  };

  const handleSpotTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      spotType: value as SpotType | 'all'
    });
  };

  const handleSortChange = (value: string) => {
    onFilterChange({
      ...filters,
      sort: value as SortOption
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-950 md:flex-row md:items-center md:justify-between">
      {/* Left side: Filters */}
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <SlidersHorizontal className="h-4 w-4" />
          Filters:
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1 md:min-w-[140px]">
          <label htmlFor="status-filter" className="text-xs text-gray-500 dark:text-gray-400 md:sr-only">
            Status
          </label>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger id="status-filter" className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Confirmed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Spot Type Filter */}
        <div className="flex flex-col gap-1 md:min-w-[140px]">
          <label htmlFor="spot-type-filter" className="text-xs text-gray-500 dark:text-gray-400 md:sr-only">
            Spot Type
          </label>
          <Select value={filters.spotType} onValueChange={handleSpotTypeChange}>
            <SelectTrigger id="spot-type-filter" className="w-full">
              <SelectValue placeholder="Spot Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Spots</SelectItem>
              <SelectItem value="MC">MC</SelectItem>
              <SelectItem value="Feature">Feature</SelectItem>
              <SelectItem value="Headliner">Headliner</SelectItem>
              <SelectItem value="Guest">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1 md:min-w-[180px]">
          <label htmlFor="sort-filter" className="text-xs text-gray-500 dark:text-gray-400 md:sr-only">
            Sort By
          </label>
          <Select value={filters.sort} onValueChange={handleSortChange}>
            <SelectTrigger id="sort-filter" className="w-full">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="rating_high">Rating: High to Low</SelectItem>
              <SelectItem value="rating_low">Rating: Low to High</SelectItem>
              <SelectItem value="experience_high">Experience: High to Low</SelectItem>
              <SelectItem value="experience_low">Experience: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right side: Show Hidden Toggle */}
      <div className="flex items-center justify-between gap-3 border-t pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Show Hidden:
        </span>
        <Toggle
          pressed={showHidden}
          onPressedChange={onToggleShowHidden}
          aria-label="Toggle show hidden comedians"
          className="gap-2"
        >
          {showHidden ? (
            <>
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Visible</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              <span className="hidden sm:inline">Hidden</span>
            </>
          )}
        </Toggle>
      </div>
    </div>
  );
}

export default ApplicationFilters;
