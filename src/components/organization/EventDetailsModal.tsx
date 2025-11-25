/**
 * EventDetailsModal
 *
 * Modal/Sheet component for viewing and managing event details.
 * Works for both native events and synced sessions (Humanitix/Eventbrite).
 * Can expand to full page view.
 *
 * For synced events, automatically creates a linked native event for management.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Maximize2,
  Minimize2,
  X,
  Calendar,
  MapPin,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveEventId } from '@/hooks/organization/useLinkedEvent';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';

// Import event management tabs
import EventOverviewTab from '@/pages/event-management/EventOverviewTab';
import ApplicationsTab from '@/pages/event-management/ApplicationsTab';
import LineupTab from '@/pages/event-management/LineupTab';
import DealsTab from '@/pages/event-management/DealsTab';
import PartnersTab from '@/pages/event-management/PartnersTab';
import SettlementsTab from '@/pages/event-management/SettlementsTab';

// Import financial components for synced events
import { EventFinancialSummary } from '@/components/organization/EventFinancialSummary';
import { EventOrdersList } from '@/components/organization/EventOrdersList';

import type { OrganizationEvent } from '@/hooks/organization/useOrganizationEvents';

type TabValue = 'overview' | 'lineup' | 'applications' | 'deals' | 'settlements' | 'partners';

interface EventDetailsModalProps {
  event: OrganizationEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Safely render HTML content
 */
function HtmlContent({ html, className }: { html: string; className?: string }) {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });

  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export function EventDetailsModal({
  event,
  open,
  onOpenChange,
}: EventDetailsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { isMobile: isMobileLayout, isSmallMobile } = useMobileLayout();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Get the effective event ID (handles linking for synced events)
  const { eventId: effectiveEventId, isLoading: isLinking, error: linkError, isNewlyCreated } = useEffectiveEventId(event);

  if (!event) return null;

  const eventDate = new Date(event.event_date);
  const isNativeEvent = event.source === 'native';
  const userId = user?.id || '';

  // Use combined mobile detection (either hook works)
  const showMobileLayout = isMobile || isMobileLayout;

  // Handle opening full page view
  const handleOpenFullPage = () => {
    if (effectiveEventId) {
      onOpenChange(false);
      navigate(`/events/${effectiveEventId}/manage`);
    }
  };

  // Content to render in both Sheet and Drawer
  const ModalContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn(
        "border-b",
        showMobileLayout ? "px-4 py-3" : "px-6 py-4"
      )}>
        <div className={cn(
          "flex gap-4",
          showMobileLayout ? "flex-col" : "items-start justify-between"
        )}>
          <div className="flex-1 min-w-0">
            {/* Event Image - smaller on mobile */}
            {event.event_image && (
              <div className={cn(
                "mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100",
                showMobileLayout ? "w-full" : "w-full max-w-md"
              )}>
                <img
                  src={event.event_image}
                  alt={event.event_name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Title and badges - responsive sizing */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className={cn(
                "font-bold",
                showMobileLayout ? "text-lg" : "text-xl",
                isSmallMobile && "text-base"
              )}>{event.event_name}</h2>
              {!isNativeEvent && (
                <Badge variant="secondary" className="text-xs">
                  {event.source === 'humanitix' ? 'Humanitix' : 'Eventbrite'}
                </Badge>
              )}
              {event.is_published ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Published
                </Badge>
              ) : (
                <Badge variant="secondary">Draft</Badge>
              )}
            </div>

            {/* Date and venue - stack on mobile */}
            <div className={cn(
              "text-sm text-muted-foreground",
              showMobileLayout ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-4"
            )}>
              <span className="flex items-center gap-1">
                <Calendar className={cn(showMobileLayout ? "h-5 w-5" : "h-4 w-4")} />
                {format(eventDate, showMobileLayout ? 'EEE, MMM d, h:mm a' : 'EEE, MMM d, yyyy h:mm a')}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className={cn(showMobileLayout ? "h-5 w-5" : "h-4 w-4")} />
                  {event.venue.name}
                </span>
              )}
            </div>

            {/* Newly linked notification */}
            {isNewlyCreated && (
              <Alert className="mt-3">
                <LinkIcon className="h-4 w-4" />
                <AlertDescription className={cn(showMobileLayout && "text-sm")}>
                  This {event.source === 'humanitix' ? 'Humanitix' : 'Eventbrite'} event has been linked for management.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Action buttons - full width on mobile */}
          <div className={cn(
            "flex items-center gap-2",
            showMobileLayout ? "w-full justify-between" : "flex-shrink-0"
          )}>
            <div className="flex items-center gap-2">
              {effectiveEventId && (
                <Button
                  variant="secondary"
                  size={showMobileLayout ? "default" : "sm"}
                  onClick={handleOpenFullPage}
                  title="Open full page"
                  className={cn(showMobileLayout && "touch-target-44")}
                >
                  <ExternalLink className={cn(showMobileLayout ? "h-5 w-5 mr-2" : "h-4 w-4 mr-1")} />
                  {showMobileLayout ? "Full View" : "Full Page"}
                </Button>
              )}
              {!isNativeEvent && event.ticket_link && (
                <Button
                  variant="secondary"
                  size={showMobileLayout ? "default" : "sm"}
                  asChild
                  className={cn(showMobileLayout && "touch-target-44")}
                >
                  <a href={event.ticket_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className={cn(showMobileLayout ? "h-5 w-5" : "h-4 w-4", !showMobileLayout && "mr-1")} />
                    {!showMobileLayout && (event.source === 'humanitix' ? 'Humanitix' : 'Eventbrite')}
                  </a>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!showMobileLayout && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className={cn(showMobileLayout && "touch-target-44")}
              >
                <X className={cn(showMobileLayout ? "h-5 w-5" : "h-4 w-4")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state while linking synced event */}
      {isLinking && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Linking event for management...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {linkError && (
        <div className="flex-1 flex items-center justify-center p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to link event: {linkError instanceof Error ? linkError.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main content with tabs */}
      {effectiveEventId && !isLinking && (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="flex-1 flex flex-col min-h-0"
        >
          {/* Tab navigation - horizontal scrollable on mobile */}
          <div className={cn(
            "border-b",
            showMobileLayout ? "px-2 overflow-x-auto" : "px-6"
          )}>
            <TabsList className={cn(
              "h-auto flex-wrap justify-start gap-1 bg-transparent p-0",
              showMobileLayout && "flex-nowrap whitespace-nowrap pb-1"
            )}>
              <TabsTrigger
                value="overview"
                className={cn(
                  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  showMobileLayout && "px-3 py-2 text-sm touch-target-44"
                )}
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="lineup"
                className={cn(
                  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  showMobileLayout && "px-3 py-2 text-sm touch-target-44"
                )}
              >
                Lineup
              </TabsTrigger>
              <TabsTrigger
                value="applications"
                className={cn(
                  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  showMobileLayout && "px-3 py-2 text-sm touch-target-44"
                )}
              >
                {showMobileLayout ? "Apps" : "Applications"}
              </TabsTrigger>
              <TabsTrigger
                value="deals"
                className={cn(
                  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  showMobileLayout && "px-3 py-2 text-sm touch-target-44"
                )}
              >
                Deals
              </TabsTrigger>
              <TabsTrigger
                value="settlements"
                className={cn(
                  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  showMobileLayout && "px-3 py-2 text-sm touch-target-44"
                )}
              >
                {showMobileLayout ? "Settle" : "Settlements"}
              </TabsTrigger>
              <TabsTrigger
                value="partners"
                className={cn(
                  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
                  showMobileLayout && "px-3 py-2 text-sm touch-target-44"
                )}
              >
                Partners
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className={cn(showMobileLayout ? "p-4" : "p-6")}>
              <TabsContent value="overview" className="m-0 space-y-6">
                {/* Financial Summary for synced events */}
                {!isNativeEvent && (
                  <EventFinancialSummary event={event} />
                )}

                {/* Orders List for synced events */}
                {!isNativeEvent && (
                  <EventOrdersList event={event} limit={10} />
                )}

                {/* Show description with HTML rendering for synced events */}
                {!isNativeEvent && event.event_description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <HtmlContent html={event.event_description} />
                  </div>
                )}

                {/* Standard management overview (applications, lineup progress, etc.) */}
                <EventOverviewTab eventId={effectiveEventId} userId={userId} />
              </TabsContent>

              <TabsContent value="lineup" className="m-0">
                <LineupTab eventId={effectiveEventId} userId={userId} />
              </TabsContent>

              <TabsContent value="applications" className="m-0">
                <ApplicationsTab
                  eventId={effectiveEventId}
                  userId={userId}
                  hiddenComedianIds={[]}
                  onHideComedians={() => {}}
                  inModal={true}
                />
              </TabsContent>

              <TabsContent value="deals" className="m-0">
                <DealsTab eventId={effectiveEventId} userId={userId} isOwner={true} />
              </TabsContent>

              <TabsContent value="settlements" className="m-0">
                <SettlementsTab eventId={effectiveEventId} userId={userId} />
              </TabsContent>

              <TabsContent value="partners" className="m-0">
                <PartnersTab eventId={effectiveEventId} userId={userId} isOwner={true} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      )}
    </div>
  );

  // Render Drawer on mobile, Sheet on desktop
  if (showMobileLayout) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] pb-safe">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{event.event_name}</DrawerTitle>
          </DrawerHeader>
          <ModalContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideCloseButton={true}
        className={cn(
          'p-0 flex flex-col',
          isFullscreen
            ? 'w-screen max-w-none sm:max-w-none'
            : 'w-full sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl'
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{event.event_name}</SheetTitle>
        </SheetHeader>
        <ModalContent />
      </SheetContent>
    </Sheet>
  );
}

export default EventDetailsModal;
