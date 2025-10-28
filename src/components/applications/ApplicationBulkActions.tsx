/**
 * ApplicationBulkActions Component (Presentational)
 *
 * Sticky bar for bulk operations on selected applications
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { CheckCircle, XCircle, Star, EyeOff, X } from 'lucide-react';

interface ApplicationBulkActionsProps {
  selectedIds: string[];
  onConfirmAll: () => void;
  onRejectAll: () => void;
  onShortlistAll: () => void;
  onHideAll: (scope: 'event' | 'global') => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function ApplicationBulkActions({
  selectedIds,
  onConfirmAll,
  onRejectAll,
  onShortlistAll,
  onHideAll,
  onClearSelection,
  isLoading = false
}: ApplicationBulkActionsProps) {
  // Don't render if no selections
  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg dark:bg-gray-950 md:left-64">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
        {/* Left side: Selection count */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold">
            {selectedIds.length} selected
          </Badge>
          <Button
            onClick={onClearSelection}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="gap-1"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>

        {/* Right side: Bulk action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Confirm All */}
          <Button
            onClick={onConfirmAll}
            disabled={isLoading}
            size="sm"
            variant="default"
            className="gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            aria-label="Confirm all selected applications"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Confirm All</span>
            <span className="inline sm:hidden">Confirm</span>
          </Button>

          {/* Reject All */}
          <Button
            onClick={onRejectAll}
            disabled={isLoading}
            size="sm"
            variant="default"
            className="gap-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            aria-label="Reject all selected applications"
          >
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Reject All</span>
            <span className="inline sm:hidden">Reject</span>
          </Button>

          {/* Shortlist All */}
          <Button
            onClick={onShortlistAll}
            disabled={isLoading}
            size="sm"
            variant="default"
            className="gap-1 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800"
            aria-label="Add all selected to shortlist"
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Shortlist All</span>
            <span className="inline sm:hidden">Shortlist</span>
          </Button>

          {/* Hide All Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="gap-1"
                aria-label="Hide all selected comedians"
              >
                <EyeOff className="h-4 w-4" />
                <span className="hidden sm:inline">Hide All</span>
                <span className="inline sm:hidden">Hide</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onHideAll('event')}>
                Hide from this event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onHideAll('global')}>
                Hide from all events
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default ApplicationBulkActions;
