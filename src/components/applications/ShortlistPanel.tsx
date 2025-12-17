/**
 * ShortlistPanel Component (Presentational)
 *
 * Sidebar panel showing confirmed and shortlisted comedians
 * - Confirmed section at top
 * - Shortlist section below
 * - Individual confirm buttons on shortlisted items
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { X, GripVertical, List, CheckCircle, Star } from 'lucide-react';
import type { ApplicationData } from '@/types/application';

interface ShortlistPanelProps {
  shortlistedApplications: ApplicationData[];
  confirmedApplications?: ApplicationData[];
  onRemove: (id: string) => void;
  onConfirmSingle?: (id: string) => void;
  onReorder?: (sourceId: string, destinationId: string) => void;
  onConfirmAll?: () => void;
  onRemoveAll?: () => void;
  isLoading?: boolean;
  totalSpots?: number;
}

export function ShortlistPanel({
  shortlistedApplications,
  confirmedApplications = [],
  onRemove,
  onConfirmSingle,
  onReorder,
  onConfirmAll,
  onRemoveAll,
  isLoading = false,
  totalSpots
}: ShortlistPanelProps) {
  const PanelContent = () => (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Confirmed Section */}
      {confirmedApplications.length > 0 && (
        <>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold text-foreground">
                Confirmed
              </h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {confirmedApplications.length}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 px-4 pb-4">
            {confirmedApplications.map((application, index) => (
              <div
                key={application.id}
                className="group relative flex items-center gap-3 rounded-lg border border-green-200 bg-card p-3 dark:border-green-800"
              >
                {/* Position Number */}
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800 dark:bg-green-900 dark:text-green-200">
                  {index + 1}
                </div>

                {/* Avatar */}
                <OptimizedAvatar
                  src={application.comedian_avatar}
                  name={application.comedian_name}
                  className="h-10 w-10 flex-shrink-0"
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {application.comedian_name}
                  </p>
                  {application.spot_type && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {application.spot_type}
                    </Badge>
                  )}
                </div>

                {/* Confirmed indicator */}
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
              </div>
            ))}
          </div>

          <Separator />
        </>
      )}

      {/* Shortlist Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <h3 className="text-lg font-semibold text-foreground">
            Shortlist
          </h3>
          {totalSpots && (
            <Badge variant="secondary">
              {shortlistedApplications.length} / {totalSpots}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Bulk Actions */}
      {shortlistedApplications.length > 0 && (onConfirmAll || onRemoveAll) && (
        <>
          <div className="flex gap-2 p-4">
            {onConfirmAll && (
              <Button
                onClick={onConfirmAll}
                disabled={isLoading}
                size="sm"
                variant="default"
                className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                aria-label="Confirm all shortlisted"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm All
              </Button>
            )}
            {onRemoveAll && (
              <Button
                onClick={onRemoveAll}
                disabled={isLoading}
                size="sm"
                variant="secondary"
                className="flex-1 gap-1"
                aria-label="Clear shortlist"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
          <Separator />
        </>
      )}

      {/* Shortlist Items */}
      <div className="flex-1 p-4">
        {shortlistedApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              No comedians shortlisted yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Add comedians to shortlist to prioritize them
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {shortlistedApplications.map((application, index) => (
              <div
                key={application.id}
                className="group relative flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-yellow-400/50"
              >
                {/* Position Number */}
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {index + 1}
                </div>

                {/* Drag Handle (for future drag-drop implementation) */}
                {onReorder && (
                  <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}

                {/* Avatar */}
                <OptimizedAvatar
                  src={application.comedian_avatar}
                  name={application.comedian_name}
                  className="h-10 w-10 flex-shrink-0"
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {application.comedian_name}
                  </p>
                  {application.comedian_experience && (
                    <p className="truncate text-xs text-muted-foreground">
                      {application.comedian_experience}
                    </p>
                  )}
                  {application.spot_type && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {application.spot_type}
                    </Badge>
                  )}
                </div>

                {/* Confirm Button */}
                {onConfirmSingle && (
                  <Button
                    onClick={() => onConfirmSingle(application.id)}
                    disabled={isLoading}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 flex-shrink-0 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900"
                    aria-label={`Confirm ${application.comedian_name}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}

                {/* Remove Button */}
                <Button
                  onClick={() => onRemove(application.id)}
                  disabled={isLoading}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${application.comedian_name} from shortlist`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Desktop: Fixed sidebar
  const DesktopPanel = () => (
    <div className="hidden h-full w-80 flex-col border-l border-border bg-muted lg:flex">
      <PanelContent />
    </div>
  );

  // Mobile: Sheet (drawer)
  const MobilePanel = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="fixed bottom-20 right-4 z-40 gap-2 shadow-lg lg:hidden"
          aria-label="Open shortlist"
        >
          <List className="h-4 w-4" />
          Shortlist
          {shortlistedApplications.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {shortlistedApplications.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="sr-only">
          <SheetTitle>Shortlisted Comedians</SheetTitle>
        </SheetHeader>
        <PanelContent />
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <DesktopPanel />
      <MobilePanel />
    </>
  );
}

export default ShortlistPanel;
