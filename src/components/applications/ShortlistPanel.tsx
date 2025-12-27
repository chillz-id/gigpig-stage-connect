/**
 * ShortlistPanel Component (Presentational)
 *
 * Sidebar panel showing confirmed and shortlisted comedians
 * - Confirmed section at top
 * - Shortlist section below
 * - Individual confirm buttons on shortlisted items
 * - Draggable items for lineup assignment
 */

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { X, GripVertical, List, CheckCircle, Star, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApplicationData } from '@/types/application';

/**
 * Draggable confirmed item for lineup assignment
 */
interface DraggableConfirmedItemProps {
  application: ApplicationData;
}

function DraggableConfirmedItem({
  application
}: DraggableConfirmedItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `confirmed-${application.id}`,
    data: {
      type: 'shortlist-item', // Use same type so drop handlers work
      applicationId: application.id,
      comedianId: application.comedian_id,
      comedianName: application.comedian_name,
      comedianAvatar: application.comedian_avatar
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col items-center",
        isDragging && "z-50"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="relative">
        <OptimizedAvatar
          src={application.comedian_avatar}
          name={application.comedian_name}
          className={cn(
            "h-12 w-12 ring-2 ring-green-500 ring-offset-2 ring-offset-background transition-all",
            isDragging ? "ring-primary scale-110" : "group-hover:ring-green-600"
          )}
        />
        <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background text-green-500" />
        {/* Drag indicator */}
        <div className={cn(
          "absolute -bottom-1 left-1/2 -translate-x-1/2 bg-muted rounded-full p-0.5 transition-opacity",
          isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-70"
        )}>
          <GripHorizontal className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      <span className="mt-1 max-w-[80px] truncate text-xs text-muted-foreground">
        {application.comedian_name?.split(' ')[0]}
      </span>
    </div>
  );
}

/**
 * Draggable shortlist item for lineup assignment
 */
interface DraggableShortlistItemProps {
  application: ApplicationData;
  onConfirmSingle?: (id: string) => void;
  onRemove: (id: string) => void;
  isLoading?: boolean;
}

function DraggableShortlistItem({
  application,
  onConfirmSingle,
  onRemove,
  isLoading = false
}: DraggableShortlistItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `shortlist-${application.id}`,
    data: {
      type: 'shortlist-item',
      applicationId: application.id,
      comedianId: application.comedian_id,
      comedianName: application.comedian_name,
      comedianAvatar: application.comedian_avatar
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col items-center",
        isDragging && "z-50"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="relative">
        <OptimizedAvatar
          src={application.comedian_avatar}
          name={application.comedian_name}
          className={cn(
            "h-12 w-12 ring-2 ring-yellow-400 ring-offset-2 ring-offset-background transition-all",
            isDragging ? "ring-primary scale-110" : "group-hover:ring-yellow-500"
          )}
        />
        {/* Drag indicator */}
        <div className={cn(
          "absolute -bottom-1 left-1/2 -translate-x-1/2 bg-muted rounded-full p-0.5 transition-opacity",
          isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-70"
        )}>
          <GripHorizontal className="h-3 w-3 text-muted-foreground" />
        </div>
        {/* Action buttons on hover (hidden during drag) */}
        {!isDragging && (
          <div className="absolute -right-1 -top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {onConfirmSingle && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirmSingle(application.id);
                }}
                disabled={isLoading}
                size="sm"
                variant="ghost"
                className="h-5 w-5 rounded-full bg-green-500 p-0 text-white hover:bg-green-600"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(application.id);
              }}
              disabled={isLoading}
              size="sm"
              variant="ghost"
              className="h-5 w-5 rounded-full bg-destructive p-0 text-destructive-foreground hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <span className="mt-1 max-w-[80px] truncate text-xs text-muted-foreground">
        {application.comedian_name?.split(' ')[0]}
      </span>
    </div>
  );
}

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
  /** Layout mode: 'sidebar' (default) or 'horizontal' for inline display */
  layout?: 'sidebar' | 'horizontal';
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
  totalSpots,
  layout = 'sidebar'
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

  // Horizontal: Inline panel with avatar chips
  const HorizontalPanel = () => {
    const allItems = [...confirmedApplications, ...shortlistedApplications];
    const hasItems = allItems.length > 0;

    return (
      <div className="rounded-lg border border-border bg-card">
        {/* Header with counts and actions */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">Shortlist</span>
              {totalSpots && (
                <Badge variant="secondary">
                  {shortlistedApplications.length} / {totalSpots}
                </Badge>
              )}
            </div>
            {confirmedApplications.length > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {confirmedApplications.length} confirmed
                </span>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {shortlistedApplications.length > 0 && (
            <div className="flex gap-2">
              {onConfirmAll && (
                <Button
                  onClick={onConfirmAll}
                  disabled={isLoading}
                  size="sm"
                  variant="default"
                  className="gap-1 bg-green-600 hover:bg-green-700"
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
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Avatar chips row */}
        <div className="p-4">
          {!hasItems ? (
            <div className="flex items-center justify-center py-4 text-center">
              <Star className="mr-2 h-5 w-5 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No comedians shortlisted yet
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {/* Confirmed items first - Also draggable for lineup assignment */}
              {confirmedApplications.map((application) => (
                <DraggableConfirmedItem
                  key={application.id}
                  application={application}
                />
              ))}

              {/* Shortlisted items - Draggable for lineup assignment */}
              {shortlistedApplications.map((application) => (
                <DraggableShortlistItem
                  key={application.id}
                  application={application}
                  onConfirmSingle={onConfirmSingle}
                  onRemove={onRemove}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render based on layout mode
  if (layout === 'horizontal') {
    // Horizontal panel is now visible on all screen sizes
    return <HorizontalPanel />;
  }

  return (
    <>
      <DesktopPanel />
      <MobilePanel />
    </>
  );
}

export default ShortlistPanel;
