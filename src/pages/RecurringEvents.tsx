/**
 * RecurringEvents Page
 *
 * Manage recurring event series with bulk editing capabilities.
 * Features:
 * - View all recurring event series
 * - Create new series from existing events
 * - Add events to existing series
 * - Bulk edit series properties (title, description, times, pricing)
 * - Edit individual events within a series
 * - Search and select all standalone events
 *
 * Route: /recurring
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Archive,
  Calendar,
  CheckSquare,
  Eye,
  EyeOff,
  FolderPlus,
  Layers,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Square,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useRecurringSeries,
  useNonRecurringEvents,
  useCreateRecurringSeries,
  useAddToRecurringSeries,
  useBulkUpdateRecurringSeries,
  useDeleteRecurringSeries,
  type RecurringSeries,
  type RecurringSeriesEvent,
} from '@/hooks/useRecurringSeries';

export default function RecurringEvents() {
  const navigate = useNavigate();

  // Data hooks
  const { data: series, isLoading: seriesLoading, error: seriesError } = useRecurringSeries();
  const { data: standaloneEvents, isLoading: standaloneLoading } = useNonRecurringEvents();

  // Mutations
  const createSeries = useCreateRecurringSeries();
  const addToSeries = useAddToRecurringSeries();
  const bulkUpdate = useBulkUpdateRecurringSeries();
  const deleteSeries = useDeleteRecurringSeries();

  // UI state
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addToDialogOpen, setAddToDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [targetSeriesId, setTargetSeriesId] = useState<string | null>(null);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk edit form state
  const [bulkEditTitle, setBulkEditTitle] = useState('');
  const [bulkEditDescription, setBulkEditDescription] = useState('');
  const [bulkEditShowType, setBulkEditShowType] = useState('__keep__');
  const [bulkEditShowLevel, setBulkEditShowLevel] = useState('__keep__');
  const [bulkEditStartTime, setBulkEditStartTime] = useState('');
  const [bulkEditEndTime, setBulkEditEndTime] = useState('');
  const [bulkEditTicketPrice, setBulkEditTicketPrice] = useState('');
  const [applyToFutureOnly, setApplyToFutureOnly] = useState(true);

  // Filter standalone events by search query
  const filteredStandaloneEvents = useMemo(() => {
    if (!standaloneEvents) return [];
    if (!searchQuery.trim()) return standaloneEvents;

    const query = searchQuery.toLowerCase();
    return standaloneEvents.filter((event) =>
      event.title.toLowerCase().includes(query) ||
      event.venue?.toLowerCase().includes(query)
    );
  }, [standaloneEvents, searchQuery]);

  // Check if all filtered events are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredStandaloneEvents.length === 0) return false;
    return filteredStandaloneEvents.every((event) => selectedEvents.has(event.id));
  }, [filteredStandaloneEvents, selectedEvents]);

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

  // Select all filtered events
  const selectAllFiltered = () => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      filteredStandaloneEvents.forEach((event) => next.add(event.id));
      return next;
    });
  };

  // Deselect all filtered events
  const deselectAllFiltered = () => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      filteredStandaloneEvents.forEach((event) => next.delete(event.id));
      return next;
    });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedEvents(new Set());
    setNewSeriesName('');
  };

  // Handle create series (can be empty)
  const handleCreateSeries = async () => {
    if (!newSeriesName.trim()) return;

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
  const openBulkEditDialog = (seriesId: string, currentSeries: RecurringSeries) => {
    setTargetSeriesId(seriesId);
    setBulkEditTitle('');
    setBulkEditDescription('');
    setBulkEditShowType(currentSeries.events[0]?.show_type || '__keep__');
    setBulkEditShowLevel(currentSeries.events[0]?.show_level || '__keep__');
    setBulkEditStartTime(currentSeries.events[0]?.start_time || '');
    setBulkEditEndTime(currentSeries.events[0]?.end_time || '');
    setBulkEditTicketPrice(currentSeries.events[0]?.ticket_price?.toString() || '');
    setApplyToFutureOnly(true);
    setBulkEditDialogOpen(true);
  };

  const handleBulkUpdate = async () => {
    if (!targetSeriesId) return;

    const updates: Record<string, unknown> = {};
    if (bulkEditTitle.trim()) updates.title = bulkEditTitle.trim();
    if (bulkEditDescription.trim()) updates.description = bulkEditDescription.trim();
    if (bulkEditShowType && bulkEditShowType !== '__keep__') updates.show_type = bulkEditShowType;
    if (bulkEditShowLevel && bulkEditShowLevel !== '__keep__') updates.show_level = bulkEditShowLevel;
    if (bulkEditStartTime) updates.start_time = bulkEditStartTime;
    if (bulkEditEndTime) updates.end_time = bulkEditEndTime;
    if (bulkEditTicketPrice) updates.ticket_price = parseFloat(bulkEditTicketPrice);

    if (Object.keys(updates).length === 0) return;

    await bulkUpdate.mutateAsync({
      seriesId: targetSeriesId,
      updates: updates as any,
      applyToFutureOnly,
    });

    setBulkEditDialogOpen(false);
    setTargetSeriesId(null);
  };

  // Handle delete series
  const handleDeleteSeries = async (seriesId: string) => {
    if (!confirm('This will ungroup all events from this recurring series. The events will not be deleted. Continue?')) {
      return;
    }
    await deleteSeries.mutateAsync(seriesId);
  };

  if (seriesLoading || standaloneLoading) {
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
            {seriesError instanceof Error ? seriesError.message : 'Failed to load recurring events'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasSeries = series && series.length > 0;
  const hasStandalone = standaloneEvents && standaloneEvents.length > 0;

  // Map series with counts (now pre-calculated from session_series + session_complete)
  const filteredSeries = series?.map((s) => ({
    ...s,
    upcomingCount: s.upcoming_count ?? 0,
    totalCount: s.event_count,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Recurring Events
          </h1>
          <p className="text-muted-foreground">
            Manage recurring event series and bulk edit all events at once
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Series Button - Always enabled */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Series
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Recurring Series</DialogTitle>
                <DialogDescription>
                  {selectedEvents.size > 0
                    ? `Create a new series with ${selectedEvents.size} selected event(s).`
                    : 'Create a new empty series. You can add events later.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="series-name">Series Name</Label>
                  <Input
                    id="series-name"
                    value={newSeriesName}
                    onChange={(e) => setNewSeriesName(e.target.value)}
                    placeholder="e.g., Off The Record - Comedy Club"
                  />
                </div>
                {selectedEvents.size > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedEvents.size} event(s) will be added to this series.
                  </p>
                )}
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

          {/* Show Past Toggle */}
          <Button
            variant={showPastEvents ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowPastEvents(!showPastEvents)}
          >
            {showPastEvents ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Past
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Past
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selection Actions Bar */}
      {selectedEvents.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedEvents.size} selected
          </span>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>

          {/* Add to Existing Series Button */}
          {hasSeries && (
            <Button size="sm" variant="secondary" onClick={() => setAddToDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add to Series
            </Button>
          )}
        </div>
      )}

      {/* Add to Series Dialog (shared by selection bar and series card) */}
      <Dialog open={addToDialogOpen} onOpenChange={(open) => {
        setAddToDialogOpen(open);
        if (!open) setTargetSeriesId(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {targetSeriesId
                ? `Add Events to ${series?.find(s => s.series_id === targetSeriesId)?.series_name || 'Series'}`
                : 'Add to Existing Series'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvents.size > 0
                ? `Add ${selectedEvents.size} selected event(s) to this series.`
                : 'Select events from the standalone events list below, then come back here to add them.'}
            </DialogDescription>
          </DialogHeader>
          {!targetSeriesId && (
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
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddToDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToSeries}
              disabled={!targetSeriesId || selectedEvents.size === 0 || addToSeries.isPending}
            >
              {addToSeries.isPending ? 'Adding...' : 'Add to Series'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Series List */}
      {hasSeries && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Recurring Series</h2>
          {filteredSeries?.map((s) => (
            <SeriesCard
              key={s.series_id}
              series={s}
              upcomingCount={s.upcomingCount}
              totalCount={s.totalCount}
              showPastEvents={showPastEvents}
              onEdit={() => openBulkEditDialog(s.series_id, s)}
              onDelete={() => handleDeleteSeries(s.series_id)}
              onAddEvents={() => {
                setTargetSeriesId(s.series_id);
                setAddToDialogOpen(true);
              }}
              onViewSeries={() => navigate(`/series/${s.series_id}`)}
            />
          ))}
        </div>
      )}

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Edit Recurring Series</DialogTitle>
            <DialogDescription>
              Update properties for events in this series. Leave fields empty to keep current values.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-auto">
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="future-only"
                checked={applyToFutureOnly}
                onCheckedChange={(checked) => setApplyToFutureOnly(checked === true)}
              />
              <Label htmlFor="future-only" className="text-sm font-normal">
                Apply to future events only
              </Label>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Show Level</Label>
                <Select value={bulkEditShowLevel} onValueChange={setBulkEditShowLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__keep__">Keep current</SelectItem>
                    <SelectItem value="open-mic">Open Mic</SelectItem>
                    <SelectItem value="semi-pro">Semi-Pro</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Event Type</Label>
                <Select value={bulkEditShowType} onValueChange={setBulkEditShowType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__keep__">Keep current</SelectItem>
                    <SelectItem value="showcase">Showcase</SelectItem>
                    <SelectItem value="solo-show">Solo Show</SelectItem>
                    <SelectItem value="open-mic">Open Mic</SelectItem>
                    <SelectItem value="live-podcast">Live Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bulk-start-time">Start Time</Label>
                <Input
                  id="bulk-start-time"
                  type="time"
                  value={bulkEditStartTime}
                  onChange={(e) => setBulkEditStartTime(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bulk-end-time">End Time</Label>
                <Input
                  id="bulk-end-time"
                  type="time"
                  value={bulkEditEndTime}
                  onChange={(e) => setBulkEditEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-ticket-price">Ticket Price ($)</Label>
              <Input
                id="bulk-ticket-price"
                type="number"
                step="0.01"
                min="0"
                value={bulkEditTicketPrice}
                onChange={(e) => setBulkEditTicketPrice(e.target.value)}
                placeholder="Leave empty to keep current"
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

      {/* Standalone Events */}
      {hasStandalone && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Standalone Events</h2>
              <p className="text-sm text-muted-foreground">
                Select events below to create a new recurring series or add them to an existing one.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Select All / Deselect All Buttons */}
                <div className="flex items-center gap-2">
                  {allFilteredSelected ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={deselectAllFiltered}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Deselect All ({filteredStandaloneEvents.length})
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={selectAllFiltered}
                      disabled={filteredStandaloneEvents.length === 0}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Select All ({filteredStandaloneEvents.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-2">
                {filteredStandaloneEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchQuery ? 'No events match your search' : 'No standalone events'}
                  </p>
                ) : (
                  <>
                    {filteredStandaloneEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        isSelected={selectedEvents.has(event.id)}
                        onToggleSelect={() => toggleEventSelection(event.id)}
                        onNavigate={() => navigate(`/events/${event.id}/manage`)}
                      />
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!hasSeries && !hasStandalone && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
            <p className="text-muted-foreground max-w-md">
              Create some events first, then come back here to group them into recurring series for
              easier bulk editing.
            </p>
            <Button className="mt-4" onClick={() => navigate('/events/create')}>
              Create Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Series Card Component
interface SeriesCardProps {
  series: RecurringSeries;
  upcomingCount: number;
  totalCount: number;
  showPastEvents: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddEvents: () => void;
  onViewSeries: () => void;
}

function SeriesCard({
  series,
  upcomingCount,
  totalCount,
  showPastEvents,
  onEdit,
  onDelete,
  onAddEvents,
  onViewSeries,
}: SeriesCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors"
      onClick={onViewSeries}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {series.series_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {totalCount} events
                {!showPastEvents && upcomingCount < totalCount && (
                  <span className="text-xs">({upcomingCount} upcoming)</span>
                )}
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
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddEvents}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Series
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Series
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// Event Row Component for Standalone Events
interface EventRowProps {
  event: RecurringSeriesEvent;
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
          {event.venue && ` · ${event.venue}`}
        </p>
      </div>
      <Badge variant="secondary">{event.status}</Badge>
    </div>
  );
}
