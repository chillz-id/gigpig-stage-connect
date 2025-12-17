/**
 * OrganizationEventSeries Page
 *
 * Manage events grouped by series with bulk editing capabilities.
 * Features:
 * - View all event series
 * - Create new series from existing events
 * - Add events to existing series
 * - Bulk edit series properties (title, description, tags, show type)
 *
 * Route: /organization/:slug/events/series
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

export default function OrganizationEventSeries() {
  const navigate = useNavigate();

  // Data hooks
  const { data: series, isLoading: seriesLoading, error: seriesError } = useEventSeries();
  const { data: ungroupedEvents, isLoading: ungroupedLoading } = useUngroupedEvents();

  // Mutations
  const createSeries = useCreateSeries();
  const addToSeries = useAddToSeries();
  const removeFromSeries = useRemoveFromSeries();
  const bulkUpdate = useBulkUpdateSeries();
  const deleteSeries = useDeleteSeries();

  // UI state
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addToDialogOpen, setAddToDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [targetSeriesId, setTargetSeriesId] = useState<string | null>(null);
  const [newSeriesName, setNewSeriesName] = useState('');

  // Bulk edit form state
  const [bulkEditTitle, setBulkEditTitle] = useState('');
  const [bulkEditDescription, setBulkEditDescription] = useState('');
  const [bulkEditTags, setBulkEditTags] = useState('');
  const [bulkEditShowType, setBulkEditShowType] = useState('');

  // Toggle series expansion
  const toggleSeries = (seriesId: string) => {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) {
        next.delete(seriesId);
      } else {
        next.add(seriesId);
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
    setNewSeriesName('');
  };

  // Handle create series
  const handleCreateSeries = async () => {
    if (!newSeriesName.trim() || selectedEvents.size === 0) return;

    await createSeries.mutateAsync({
      name: newSeriesName,
      eventIds: Array.from(selectedEvents),
    });

    clearSelection();
    setCreateDialogOpen(false);
  };

  // Handle add to series
  const handleAddToSeries = async () => {
    if (!targetSeriesId || selectedEvents.size === 0) return;

    await addToSeries.mutateAsync({
      seriesId: targetSeriesId,
      eventIds: Array.from(selectedEvents),
    });

    clearSelection();
    setAddToDialogOpen(false);
    setTargetSeriesId(null);
  };

  // Handle bulk edit
  const openBulkEditDialog = (seriesId: string, currentSeries: EventSeries) => {
    setTargetSeriesId(seriesId);
    setBulkEditTitle('');
    setBulkEditDescription('');
    setBulkEditTags(currentSeries.events[0]?.tags?.join(', ') || '');
    setBulkEditShowType(currentSeries.events[0]?.show_type || '');
    setBulkEditDialogOpen(true);
  };

  const handleBulkUpdate = async () => {
    if (!targetSeriesId) return;

    const updates: Record<string, unknown> = {};
    if (bulkEditTitle.trim()) updates.title = bulkEditTitle.trim();
    if (bulkEditDescription.trim()) updates.description = bulkEditDescription.trim();
    if (bulkEditTags.trim()) {
      updates.tags = bulkEditTags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (bulkEditShowType.trim()) updates.show_type = bulkEditShowType.trim();

    if (Object.keys(updates).length === 0) return;

    await bulkUpdate.mutateAsync({
      seriesId: targetSeriesId,
      updates,
    });

    setBulkEditDialogOpen(false);
    setTargetSeriesId(null);
  };

  // Handle delete series
  const handleDeleteSeries = async (seriesId: string) => {
    if (!confirm('This will remove all events from this series. The events will not be deleted. Continue?')) {
      return;
    }
    await deleteSeries.mutateAsync(seriesId);
  };

  // Handle remove from series
  const handleRemoveFromSeries = async (eventId: string) => {
    await removeFromSeries.mutateAsync(eventId);
  };

  if (seriesLoading || ungroupedLoading) {
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

  if (seriesError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {seriesError instanceof Error ? seriesError.message : 'Failed to load event series'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasSeries = series && series.length > 0;
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
            <h1 className="text-2xl font-bold">Event Series</h1>
            <p className="text-muted-foreground">
              Group events into series for bulk editing
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

            {/* Create Series Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Series
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Event Series</DialogTitle>
                  <DialogDescription>
                    Group {selectedEvents.size} selected event(s) into a new series.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="series-name">Series Name</Label>
                    <Input
                      id="series-name"
                      value={newSeriesName}
                      onChange={(e) => setNewSeriesName(e.target.value)}
                      placeholder="e.g., Magic Mic Comedy Wednesdays"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSeries}
                    disabled={!newSeriesName.trim() || createSeries.isPending}
                  >
                    {createSeries.isPending ? 'Creating...' : 'Create Series'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add to Existing Series Dialog */}
            {hasSeries && (
              <Dialog open={addToDialogOpen} onOpenChange={setAddToDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Series
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add to Existing Series</DialogTitle>
                    <DialogDescription>
                      Add {selectedEvents.size} selected event(s) to an existing series.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 py-4 max-h-[300px] overflow-auto">
                    {series?.map((s) => (
                      <Button
                        key={s.series_id}
                        variant={targetSeriesId === s.series_id ? 'default' : 'ghost'}
                        className="justify-start"
                        onClick={() => setTargetSeriesId(s.series_id)}
                      >
                        <Layers className="mr-2 h-4 w-4" />
                        {s.series_name} ({s.event_count} events)
                      </Button>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setAddToDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddToSeries}
                      disabled={!targetSeriesId || addToSeries.isPending}
                    >
                      {addToSeries.isPending ? 'Adding...' : 'Add to Series'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Series List */}
      {hasSeries && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Series</h2>
          {series?.map((s) => (
            <SeriesCard
              key={s.series_id}
              series={s}
              isExpanded={expandedSeries.has(s.series_id)}
              onToggle={() => toggleSeries(s.series_id)}
              onEdit={() => openBulkEditDialog(s.series_id, s)}
              onDelete={() => handleDeleteSeries(s.series_id)}
              onRemoveEvent={handleRemoveFromSeries}
              onNavigateToEvent={(eventId) => navigate(`/events/${eventId}/manage`)}
            />
          ))}
        </div>
      )}

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Edit Series</DialogTitle>
            <DialogDescription>
              Update properties for all events in this series. Leave fields empty to keep current values.
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
            Select events below to create a new series or add them to an existing one.
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
      {!hasSeries && !hasUngrouped && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
            <p className="text-muted-foreground max-w-md">
              Create some events first, then come back here to group them into series for
              easier bulk editing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Series Card Component
interface SeriesCardProps {
  series: EventSeries;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRemoveEvent: (eventId: string) => void;
  onNavigateToEvent: (eventId: string) => void;
}

function SeriesCard({
  series,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onRemoveEvent,
  onNavigateToEvent,
}: SeriesCardProps) {
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
                  <CardTitle className="text-lg">{series.series_name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      {series.event_count} events
                    </span>
                    {series.venue_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {series.venue_name}
                      </span>
                    )}
                    {series.next_event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Next: {format(new Date(series.next_event_date), 'MMM d, yyyy')}
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
              {series.events.map((event) => (
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
                      title="Remove from series"
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
