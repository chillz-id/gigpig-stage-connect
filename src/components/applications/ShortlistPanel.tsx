/**
 * ShortlistPanel Component (Presentational)
 *
 * Sidebar panel showing shortlisted comedians with drag-and-drop reordering
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { X, GripVertical, List, CheckCircle, Star } from 'lucide-react';
import type { ApplicationData } from '@/types/application';

interface ShortlistPanelProps {
  shortlistedApplications: ApplicationData[];
  onRemove: (id: string) => void;
  onReorder?: (sourceId: string, destinationId: string) => void;
  onConfirmAll?: () => void;
  onRemoveAll?: () => void;
  isLoading?: boolean;
  totalSpots?: number;
}

export function ShortlistPanel({
  shortlistedApplications,
  onRemove,
  onReorder,
  onConfirmAll,
  onRemoveAll,
  isLoading = false,
  totalSpots
}: ShortlistPanelProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const PanelContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                className="professional-button"
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

      {/* List */}
      <ScrollArea className="flex-1 p-4">
        {shortlistedApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No comedians shortlisted yet
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Add comedians to shortlist to prioritize them
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {shortlistedApplications.map((application, index) => (
              <div
                key={application.id}
                className="group relative flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md dark:bg-gray-900"
              >
                {/* Position Number */}
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {index + 1}
                </div>

                {/* Drag Handle (for future drag-drop implementation) */}
                {onReorder && (
                  <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                )}

                {/* Avatar */}
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage
                    src={application.comedian_avatar}
                    alt={application.comedian_name}
                  />
                  <AvatarFallback>{getInitials(application.comedian_name)}</AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {application.comedian_name}
                  </p>
                  {application.comedian_experience && (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {application.comedian_experience}
                    </p>
                  )}
                  {application.spot_type && (
                    <Badge className="professional-button mt-1 text-xs">
                      {application.spot_type}
                    </Badge>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  onClick={() => onRemove(application.id)}
                  disabled={isLoading}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remove ${application.comedian_name} from shortlist`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Desktop: Fixed sidebar
  const DesktopPanel = () => (
    <div className="hidden h-full w-80 flex-col border-l bg-gray-50 dark:bg-gray-900 lg:flex">
      <PanelContent />
    </div>
  );

  // Mobile: Sheet (drawer)
  const MobilePanel = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="professional-button"
          size="sm"
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
