/**
 * OrganizationEventTours Page
 *
 * Manage events grouped by tours with bulk editing capabilities.
 * Features:
 * - View all event tours
 * - Create new tours from existing events
 * - Add events to existing tours
 * - Bulk edit tour properties (title, description, tags, show type)
 *
 * Route: /organization/:slug/events/tours
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderPlus,
  Layers,
  MapPin,
  Plus,
  Trash2,
  Unlink,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useEventSeries,
  useUngroupedEvents,
  useCreateSeries,
  useAddToSeries,
  useRemoveFromSeries,
  useBulkUpdateSeries,
  useDeleteSeries,
  type EventSeries,
  type EventSeriesEvent,
} from '@/hooks/organization/useEventSeries';

export default function OrganizationEventTours() {
  const navigate = useNavigate();

  // Data hooks
  const { data: tours, isLoading: toursLoading, error: toursError } = useEventSeries();
  const { data: ungroupedEvents, isLoading: ungroupedLoading } = useUngroupedEvents();

  // Mutations
  const createTour = useCreateSeries();
  const addToTour = useAddToSeries();
  const removeFromTour = useRemoveFromSeries();
  const bulkUpdate = useBulkUpdateSeries();
  const deleteTour = useDeleteSeries();

  // UI state
  const [expandedTours, setExpandedTours] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addToDialogOpen, setAddToDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [targetTourId, setTargetTourId] = useState<string | null>(null);
  const [newTourName, setNewTourName] = useState('');

  // Bulk edit form state
  const [bulkEditTitle, setBulkEditTitle] = useState('');
  const [bulkEditDescription, setBulkEditDescription] = useState('');
  const [bulkEditTags, setBulkEditTags] = useState('');
  const [bulkEditShowType, setBulkEditShowType] = useState('');

  // Toggle tour expansion
  const toggleTour = (tourId: string) => {
    setExpandedTours((prev) => {
      const next = new Set(prev);
      if (next.has(tourId)) {
        next.delete(tourId);
      } else {
        next.add(tourId);
      }
      return next;
    });
  };

  // Toggle event selection
  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedEvents(new Set());
    setNewTourName('');
  };

  // Handle create tour
  const handleCreateTour = async () => {
    if (!newTourName.trim() || selectedEvents.size === 0) return;

    await createTour.mutateAsync({
      name: newTourName,
      eventIds: Array.from(selectedEvents),
    });

    clearSelection();
    setCreateDialogOpen(false);
  };

  // Handle add to tour
  const handleAddToTour = async () => {
    if (!targetTourId || selectedEvents.size === 0) return;

    await addToTour.mutateAsync({
      seriesId: targetTourId,
      eventIds: Array.from(selectedEvents),
    });

    clearSelection();
    setAddToDialogOpen(false);
    setTargetTourId(null);
  };

  // Handle bulk edit
  const openBulkEditDialog = (tourId: string, currentTour: EventSeries) => {
    setTargetTourId(tourId);
    setBulkEditTitle('');
    setBulkEditDescription('');
    setBulkEditTags(currentTour.events[0]?.tags?.join(', ') || '');
    setBulkEditShowType(currentTour.events[0]?.show_type || '');
    setBulkEditDialogOpen(true);
  };

  const handleBulkUpdate = async () => {
    if (!targetTourId) return;

    const updates: Record<string, unknown> = {};
    if (bulkEditTitle.trim()) updates.title = bulkEditTitle.trim();
    if (bulkEditDescription.trim()) updates.description = bulkEditDescription.trim();
    if (bulkEditTags.trim()) {
      updates.tags = bulkEditTags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (bulkEditShowType.trim()) updates.show_type = bulkEditShowType.trim();

    if (Object.keys(updates).length === 0) return;

    await bulkUpdate.mutateAsync({
      seriesId: targetTourId,
      updates,
    });

    setBulkEditDialogOpen(false);
    setTargetTourId(null);
  };

  // Handle delete tour
  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('This will remove all events from this tour. The events will not be deleted. Continue?')) {
      return;
    }
    await deleteTour.mutateAsync(tourId);
  };

  // Handle remove from tour
  const handleRemoveFromTour = async (eventId: string) => {
    await removeFromTour.mutateAsync(eventId);
  };

  if (toursLoading || ungroupedLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (toursError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {toursError instanceof Error ? toursError.message : 'Failed to load event tours'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasTours = tours && tours.length > 0;
  const hasUngrouped = ungroupedEvents && ungroupedEvents.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Event Tours</h1>
            <p className="text-muted-foreground">
              Group events into tours for bulk editing
            </p>
          </div>
        </div>

        {selectedEvents.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedEvents.size} selected
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>

            {/* Create Tour Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Tour
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Event Tour</DialogTitle>
                  <DialogDescription>
                    Group {selectedEvents.size} selected event(s) into a new tour.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tour-name">Tour Name</Label>
                    <Input
                      id="tour-name"
                      value={newTourName}
                      onChange={(e) => setNewTourName(e.target.value)}
                      placeholder="e.g., Summer Comedy Tour 2025"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTour}
                    disabled={!newTourName.trim() || createTour.isPending}
                  >
                    {createTour.isPending ? 'Creating...' : 'Create Tour'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add to Existing Tour Dialog */}
            {hasTours && (
              <Dialog open={addToDialogOpen} onOpenChange={setAddToDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Tour
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add to Existing Tour</DialogTitle>
                    <DialogDescription>
                      Add {selectedEvents.size} selected event(s) to an existing tour.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 py-4 max-h-[300px] overflow-auto">
                    {tours?.map((t) => (
                      <Button
                        key={t.series_id}
                        variant={targetTourId === t.series_id ? 'default' : 'ghost'}
                        className="justify-start"
                        onClick={() => setTargetTourId(t.series_id)}
                      >
                        <Layers className="mr-2 h-4 w-4" />
                        {t.series_name} ({t.event_count} events)
                      </Button>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setAddToDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddToTour}
                      disabled={!targetTourId || addToTour.isPending}
                    >
                      {addToTour.isPending ? 'Adding...' : 'Add to Tour'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Tours List */}
      {hasTours && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Tours</h2>
          {tours?.map((t) => (
            <TourCard
              key={t.series_id}
              tour={t}
              isExpanded={expandedTours.has(t.series_id)}
              onToggle={() => toggleTour(t.series_id)}
              onEdit={() => openBulkEditDialog(t.series_id, t)}
              onDelete={() => handleDeleteTour(t.series_id)}
              onRemoveEvent={handleRemoveFromTour}
              onNavigateToEvent={(eventId) => navigate(`/events/${eventId}/manage`)}
            />
          ))}
        </div>
      )}

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Edit Tour</DialogTitle>
            <DialogDescription>
              Update properties for all events in this tour. Leave fields empty to keep current values.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-title">Title (applied to all)</Label>
              <Input
                id="bulk-title"
                value={bulkEditTitle}
                onChange={(e) => setBulkEditTitle(e.target.value)}
                placeholder="Leave empty to keep individual titles"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk-description">Description</Label>
              <Textarea
                id="bulk-description"
                value={bulkEditDescription}
                onChange={(e) => setBulkEditDescription(e.target.value)}
                placeholder="Leave empty to keep individual descriptions"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk-tags">Tags (comma-separated)</Label>
              <Input
                id="bulk-tags"
                value={bulkEditTags}
                onChange={(e) => setBulkEditTags(e.target.value)}
                placeholder="comedy, standup, open-mic"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk-show-type">Show Type</Label>
              <Input
                id="bulk-show-type"
                value={bulkEditShowType}
                onChange={(e) => setBulkEditShowType(e.target.value)}
                placeholder="e.g., Open Mic, Showcase, Headliner"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate} disabled={bulkUpdate.isPending}>
              {bulkUpdate.isPending ? 'Updating...' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ungrouped Events */}
      {hasUngrouped && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Ungrouped Events</h2>
          <p className="text-sm text-muted-foreground">
            Select events below to create a new tour or add them to an existing one.
          </p>
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-2">
                {ungroupedEvents?.slice(0, 50).map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isSelected={selectedEvents.has(event.id)}
                    onToggleSelect={() => toggleEventSelection(event.id)}
                    onNavigate={() => navigate(`/events/${event.id}/manage`)}
                  />
                ))}
                {ungroupedEvents && ungroupedEvents.length > 50 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Showing first 50 of {ungroupedEvents.length} events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!hasTours && !hasUngrouped && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
            <p className="text-muted-foreground max-w-md">
              Create some events first, then come back here to group them into tours for
              easier bulk editing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Tour Card Component
interface TourCardProps {
  tour: EventSeries;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRemoveEvent: (eventId: string) => void;
  onNavigateToEvent: (eventId: string) => void;
}

function TourCard({
  tour,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onRemoveEvent,
  onNavigateToEvent,
}: TourCardProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-lg">{tour.series_name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      {tour.event_count} events
                    </span>
                    {tour.venue_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {tour.venue_name}
                      </span>
                    )}
                    {tour.next_event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Next: {format(new Date(tour.next_event_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t">
            <div className="grid gap-2 pt-4">
              {tour.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onNavigateToEvent(event.id)}
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.event_date), 'EEE, MMM d, yyyy')}
                      {event.venue_name && ` · ${event.venue_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{event.status}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveEvent(event.id)}
                      title="Remove from tour"
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Event Row Component for Ungrouped Events
interface EventRowProps {
  event: EventSeriesEvent;
  isSelected: boolean;
  onToggleSelect: () => void;
  onNavigate: () => void;
}

function EventRow({ event, isSelected, onToggleSelect, onNavigate }: EventRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        isSelected && 'bg-primary/10 border-primary'
      )}
    >
      <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
      <div className="flex-1 cursor-pointer" onClick={onNavigate}>
        <p className="font-medium">{event.title}</p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(event.event_date), 'EEE, MMM d, yyyy')}
          {event.venue_name && ` · ${event.venue_name}`}
        </p>
      </div>
      <Badge variant="secondary">{event.source}</Badge>
    </div>
  );
}
