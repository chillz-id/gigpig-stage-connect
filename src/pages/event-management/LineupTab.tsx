import { useState, useMemo } from 'react';
import {
  Plus,
  ChevronDown,
  DoorOpen,
  Coffee,
  Sparkles,
  Send,
  Save,
  FolderOpen,
  FileStack,
  Check,
  AlertCircle,
  Download,
  List,
  Clock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ExportMenu } from '@/components/event-management/ExportMenu';
import { SaveTemplateDialog } from '@/components/lineup/SaveTemplateDialog';
import { LoadTemplateDialog } from '@/components/lineup/LoadTemplateDialog';
import { useLineupPublishStatus, usePublishLineup } from '@/hooks/usePublishLineup';
import SpotListContainer from '@/components/lineup/SpotListContainer';
import TimelineRunsheet from '@/components/lineup/TimelineRunsheet';
import { AddSpotDialog } from '@/components/lineup/AddSpotDialog';
import { AddBreakDialog } from '@/components/lineup/AddBreakDialog';
import { ShortlistPanelContainer } from '@/components/applications/ShortlistPanelContainer';
import { useLineupStats, formatDuration, formatTimeRange } from '@/hooks/useLineupStats';
import { useAssignComedianToSpot, useCreateAndAssignSpot, useReorderSpots, useEventSpots } from '@/hooks/useEventSpots';
import { formatCurrency } from '@/lib/utils';
import type { SpotCategory } from '@/types/spot';

interface LineupTabProps {
  eventId: string;
  userId: string;
}

type ViewMode = 'timeline' | 'cards';

// Type for active drag data
interface ShortlistDragData {
  type: 'shortlist-item';
  applicationId: string;
  comedianId: string;
  comedianName: string;
  comedianAvatar?: string;
}

interface SpotDragData {
  type: 'spot-item';
  spotId: string;
  eventId: string;
  spotData?: unknown;
}

type DragData = ShortlistDragData | SpotDragData;

export default function LineupTab({ eventId, userId }: LineupTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [showAddSpotDialog, setShowAddSpotDialog] = useState(false);
  const [showAddBreakDialog, setShowAddBreakDialog] = useState(false);
  const [breakType, setBreakType] = useState<SpotCategory>('intermission');
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showLoadTemplateDialog, setShowLoadTemplateDialog] = useState(false);

  // Get spots for reordering
  const { spots } = useEventSpots(eventId);

  // Mutations for drag-drop
  const assignToSpot = useAssignComedianToSpot();
  const createAndAssign = useCreateAndAssignSpot();
  const reorderSpots = useReorderSpots();

  // Publish lineup hooks
  const { data: publishStatus } = useLineupPublishStatus(eventId);
  const publishLineup = usePublishLineup();

  // DnD sensors - require 8px movement to start drag (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 }
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    console.log('🎯 Drag started:', event.active.id, event.active.data.current);
    const data = event.active.data.current as DragData | undefined;
    if (data?.type === 'shortlist-item') {
      setActiveDrag(data);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('🎯 Drag ended:', { activeId: active.id, overId: over?.id, overData: over?.data.current });
    setActiveDrag(null);

    if (!over || !active.data.current) return;

    const dragData = active.data.current as DragData;
    const overId = over.id.toString();
    const overData = over.data.current;

    // Handle spot reordering (spot-item dragged over another spot-item)
    if (dragData.type === 'spot-item') {
      const activeSpotId = active.id.toString();
      const overSpotId = overId;

      // Don't reorder if dropped on the same spot
      if (activeSpotId === overSpotId) return;

      // Find indices in the spots array
      const sortedSpots = [...spots].sort((a, b) => (a.spot_order ?? 0) - (b.spot_order ?? 0));
      const activeIndex = sortedSpots.findIndex(s => s.id === activeSpotId);
      const overIndex = sortedSpots.findIndex(s => s.id === overSpotId);

      if (activeIndex !== -1 && overIndex !== -1) {
        // Get new order using arrayMove
        const newOrder = arrayMove(sortedSpots.map(s => s.id), activeIndex, overIndex);
        console.log('🎯 Reordering spots:', { from: activeIndex, to: overIndex, newOrder });
        reorderSpots.mutate({ eventId, spotIds: newOrder });
      }
      return;
    }

    // Handle shortlist item drag
    if (dragData.type !== 'shortlist-item') return;

    // Dropped on "new-spot-zone" - create new spot and assign comedian
    if (overId === 'new-spot-zone') {
      createAndAssign.mutate({
        eventId,
        comedianId: dragData.comedianId
      });
      return;
    }

    // Dropped on an existing spot
    if (overId.startsWith('spot-') && overData?.type === 'spot') {
      const spotId = overId.replace('spot-', '');

      // Always assign - allow reassignment if spot already has comedian
      console.log('🎯 Assigning comedian to spot:', { spotId, comedianId: dragData.comedianId, isEmpty: overData.isEmpty });
      assignToSpot.mutate({
        spotId,
        comedianId: dragData.comedianId,
        eventId
      });
    }
  };

  const handleAddBreak = (type: SpotCategory) => {
    setBreakType(type);
    setShowAddBreakDialog(true);
  };

  // Fetch event details for export and time calculations
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('title, organizer_id, organization_id, start_time, event_date')
        .eq('id', eventId)
        .single();
      return data;
    },
  });

  // Combine event_date and start_time into a proper Date for time range calculation
  // If start_time is null, the time is extracted from event_date timestamp
  const eventStartDateTime = useMemo(() => {
    if (!event?.event_date) return null;
    try {
      const eventDate = new Date(event.event_date);
      // If we have a separate start_time, use it to override the time
      if (event.start_time) {
        const [hours, minutes] = event.start_time.split(':').map(Number);
        eventDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
      }
      // Otherwise, the time from event_date is used as-is
      return eventDate;
    } catch {
      return null;
    }
  }, [event?.event_date, event?.start_time]);

  // Fetch lineup statistics
  const { data: stats, isLoading: statsLoading } = useLineupStats(eventId);

  const isOwner = event?.organizer_id === userId;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Lineup</h2>
          <p className="text-sm text-muted-foreground">
            Manage spots, assign comedians, and configure payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Publish Button with Status */}
          <div className="flex items-center gap-2">
            {publishStatus?.lineupPublishedAt && !publishStatus.hasUnpublishedChanges && (
              <Badge variant="secondary" className="gap-1 text-green-600">
                <Check className="h-3 w-3" />
                Published
              </Badge>
            )}
            {publishStatus?.hasUnpublishedChanges && (
              <Badge variant="secondary" className="gap-1 text-amber-600 border-amber-300">
                <AlertCircle className="h-3 w-3" />
                Unpublished changes
              </Badge>
            )}
            <Button
              variant={publishStatus?.hasUnpublishedChanges ? 'default' : 'secondary'}
              size="sm"
              onClick={() => publishLineup.mutate(eventId)}
              disabled={publishLineup.isPending || (stats?.filledSpots || 0) === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              {publishLineup.isPending
                ? 'Publishing...'
                : publishStatus?.lineupPublishedAt
                  ? 'Republish'
                  : 'Publish Lineup'}
            </Button>
          </div>

          {/* Template Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <FileStack className="mr-2 h-4 w-4" />
                Templates
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowSaveTemplateDialog(true)}
                disabled={(spots?.length || 0) === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLoadTemplateDialog(true)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Load Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ExportMenu
            eventId={eventId}
            eventTitle={event?.title || 'Event'}
            userId={userId}
            isOwner={isOwner}
            exportType="lineup"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setViewMode(viewMode === 'timeline' ? 'cards' : 'timeline')}
            className="gap-1"
          >
            {viewMode === 'timeline' ? <List className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            {viewMode === 'timeline' ? 'Card View' : 'Timeline View'}
          </Button>

          {/* Add Break Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Break
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddBreak('doors')}>
                <DoorOpen className="mr-2 h-4 w-4" />
                Doors Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddBreak('intermission')}>
                <Coffee className="mr-2 h-4 w-4" />
                Intermission
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddBreak('custom')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Custom Break...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Spot Button */}
          <Button onClick={() => setShowAddSpotDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Spot
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          <strong>Lineup Management:</strong> Create spots for your event, assign comedians
          from applications or directly, and configure payment details. Spots can be
          reordered by dragging in list view.
        </AlertDescription>
      </Alert>

      {/* Shortlist Panel - Drag comedians from here to spots */}
      <ShortlistPanelContainer
        eventId={eventId}
        userId={userId}
        totalSpots={stats?.totalSpots}
        layout="horizontal"
      />

      {/* Lineup Display */}
      {viewMode === 'timeline' ? (
        <TimelineRunsheet eventId={eventId} eventStartTime={eventStartDateTime} />
      ) : (
        <SpotListContainer eventId={eventId} />
      )}

      {/* Lineup Statistics - Moved below lineup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Lineup Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Spots</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 bg-muted" />
              ) : (
                <p className="text-2xl font-bold">{stats?.totalSpots || 0}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Filled Spots</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 bg-muted" />
              ) : (
                <p className="text-2xl font-bold">{stats?.filledSpots || 0}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Show Duration</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-24 bg-muted" />
              ) : (
                <div>
                  <p className="text-2xl font-bold">{formatDuration(stats?.showDuration || 0)}</p>
                  {eventStartDateTime && stats?.showDuration ? (
                    <p className="text-sm text-muted-foreground">
                      {formatTimeRange(eventStartDateTime, stats.showDuration)}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>
            Overview of all payments for this event (performers and production staff)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Combined Totals */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Gross</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-xl font-bold">{formatCurrency(stats?.totalGross || 0)}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Tax (GST)</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-xl font-bold text-muted-foreground">{formatCurrency(stats?.totalTax || 0)}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Net</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-xl font-bold">{formatCurrency(stats?.totalNet || 0)}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Paid</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats?.totalPaid || 0)}</p>
              )}
            </div>
          </div>

          {/* Breakdown Accordion - only show if there are extras */}
          {!statsLoading && (stats?.performerCount || 0) + (stats?.extraCount || 0) > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="breakdown" className="border-0">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                  View Cost Breakdown
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-6 pt-2 md:grid-cols-2">
                    {/* Performer Costs */}
                    <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Performer Costs</h4>
                        <span className="text-xs text-muted-foreground">
                          ({stats?.performerCount || 0} spots)
                        </span>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross</span>
                          <span className="font-medium">{formatCurrency(stats?.performerGross || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax (GST)</span>
                          <span>{formatCurrency(stats?.performerTax || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Net</span>
                          <span className="font-medium">{formatCurrency(stats?.performerNet || 0)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Paid</span>
                          <span className="font-medium text-green-600">{formatCurrency(stats?.performerPaid || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Production Costs */}
                    <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Production Costs</h4>
                        <span className="text-xs text-muted-foreground">
                          ({stats?.extraCount || 0} extras)
                        </span>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross</span>
                          <span className="font-medium">{formatCurrency(stats?.productionGross || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax (GST)</span>
                          <span>{formatCurrency(stats?.productionTax || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Net</span>
                          <span className="font-medium">{formatCurrency(stats?.productionNet || 0)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Paid</span>
                          <span className="font-medium text-green-600">{formatCurrency(stats?.productionPaid || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Add Spot Dialog */}
      <AddSpotDialog
        open={showAddSpotDialog}
        onOpenChange={setShowAddSpotDialog}
        eventId={eventId}
        onSpotCreated={() => {
          setShowAddSpotDialog(false);
        }}
      />

      {/* Add Break Dialog */}
      <AddBreakDialog
        open={showAddBreakDialog}
        onOpenChange={setShowAddBreakDialog}
        eventId={eventId}
        breakType={breakType}
        onBreakCreated={() => {
          setShowAddBreakDialog(false);
        }}
      />

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
        spots={spots || []}
        organizationId={event?.organization_id || null}
      />

      {/* Load Template Dialog */}
      <LoadTemplateDialog
        open={showLoadTemplateDialog}
        onOpenChange={setShowLoadTemplateDialog}
        eventId={eventId}
        hasExistingSpots={(spots?.length || 0) > 0}
        organizationId={event?.organization_id || null}
      />
      </div>

      {/* Drag Overlay - Shows dragging comedian */}
      <DragOverlay>
        {activeDrag && (
          <div className="flex items-center gap-2 bg-card border rounded-lg p-2 shadow-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activeDrag.comedianAvatar} alt={activeDrag.comedianName} />
              <AvatarFallback className="text-xs">
                {activeDrag.comedianName?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{activeDrag.comedianName}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
