/**
 * Tours Page
 *
 * Manage tours - group events across different venues/cities.
 * Features:
 * - View all tours with their events
 * - Create new tours
 * - Add events to existing tours
 * - Remove events from tours
 * - Delete tours
 *
 * Route: /tours
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
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  Layers,
  MapPin,
  Plus,
  Trash2,
  Unlink,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useTours,
  useUnassignedEvents,
  useGroupedUnassignedEvents,
  useCreateTour,
  useAddEventsToTour,
  useRemoveEventFromTour,
  useDeleteTour,
  type TourWithEvents,
  type TourEvent,
  type TourEventWithSeries,
  type TourRecurringSeries,
} from '@/hooks/useTours';

export default function Tours() {
  const navigate = useNavigate();

  // Data hooks
  const { data: tours, isLoading: toursLoading, error: toursError } = useTours();
  const { data: unassignedEvents, isLoading: unassignedLoading } = useUnassignedEvents();

  // Group unassigned events by recurring series
  const { recurringSeries, standaloneEvents } = useGroupedUnassignedEvents(unassignedEvents);

  // Mutations
  const createTour = useCreateTour();
  const addToTour = useAddEventsToTour();
  const removeFromTour = useRemoveEventFromTour();
  const deleteTour = useDeleteTour();

  // UI state
  const [expandedTours, setExpandedTours] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addToDialogOpen, setAddToDialogOpen] = useState(false);
  const [targetTourId, setTargetTourId] = useState<string | null>(null);
  const [addEventsModalOpen, setAddEventsModalOpen] = useState(false);
  const [addEventsTargetTour, setAddEventsTargetTour] = useState<TourWithEvents | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [modalSelectedEvents, setModalSelectedEvents] = useState<Set<string>>(new Set());
  const [expandedModalSeries, setExpandedModalSeries] = useState<Set<string>>(new Set());

  // Create tour form state
  const [newTourName, setNewTourName] = useState('');
  const [newTourDescription, setNewTourDescription] = useState('');
  const [newTourStartDate, setNewTourStartDate] = useState('');
  const [newTourEndDate, setNewTourEndDate] = useState('');

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

  // Clear selection and form
  const clearSelection = () => {
    setSelectedEvents(new Set());
    setNewTourName('');
    setNewTourDescription('');
    setNewTourStartDate('');
    setNewTourEndDate('');
  };

  // Handle create tour
  const handleCreateTour = async () => {
    if (!newTourName.trim()) return;

    await createTour.mutateAsync({
      name: newTourName,
      description: newTourDescription || undefined,
      start_date: newTourStartDate || undefined,
      end_date: newTourEndDate || undefined,
      eventIds: selectedEvents.size > 0 ? Array.from(selectedEvents) : undefined,
    });

    clearSelection();
    setCreateDialogOpen(false);
  };

  // Handle add to tour
  const handleAddToTour = async () => {
    if (!targetTourId || selectedEvents.size === 0) return;

    await addToTour.mutateAsync({
      tourId: targetTourId,
      eventIds: Array.from(selectedEvents),
    });

    clearSelection();
    setAddToDialogOpen(false);
    setTargetTourId(null);
  };

  // Handle delete tour
  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('This will delete the tour. Events will be unassigned but not deleted. Continue?')) {
      return;
    }
    await deleteTour.mutateAsync(tourId);
  };

  // Handle remove from tour
  const handleRemoveFromTour = async (eventId: string) => {
    await removeFromTour.mutateAsync(eventId);
  };

  // Open add events modal for a specific tour
  const handleOpenAddEventsModal = (tour: TourWithEvents) => {
    setAddEventsTargetTour(tour);
    setModalSelectedEvents(new Set());
    setEventSearchQuery('');
    setExpandedModalSeries(new Set());
    setAddEventsModalOpen(true);
  };

  // Toggle modal event selection
  const toggleModalEventSelection = (eventId: string) => {
    setModalSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Toggle modal series expansion
  const toggleModalSeriesExpansion = (seriesId: string) => {
    setExpandedModalSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) {
        next.delete(seriesId);
      } else {
        next.add(seriesId);
      }
      return next;
    });
  };

  // Select all events in a series
  const toggleSeriesSelection = (series: TourRecurringSeries) => {
    const allSelected = series.events.every(e => modalSelectedEvents.has(e.id));
    setModalSelectedEvents((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // Deselect all in series
        series.events.forEach(e => next.delete(e.id));
      } else {
        // Select all in series
        series.events.forEach(e => next.add(e.id));
      }
      return next;
    });
  };

  // Handle add events from modal
  const handleAddEventsFromModal = async () => {
    if (!addEventsTargetTour || modalSelectedEvents.size === 0) return;

    await addToTour.mutateAsync({
      tourId: addEventsTargetTour.id,
      eventIds: Array.from(modalSelectedEvents),
    });

    setAddEventsModalOpen(false);
    setAddEventsTargetTour(null);
    setModalSelectedEvents(new Set());
    setEventSearchQuery('');
  };

  // Filter events for modal search
  const filterEvent = (event: TourEventWithSeries, query: string) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      event.title.toLowerCase().includes(q) ||
      event.venue?.toLowerCase().includes(q) ||
      event.address?.toLowerCase().includes(q)
    );
  };

  const filteredRecurringSeries = recurringSeries
    ?.map((series) => ({
      ...series,
      events: series.events.filter((e) => filterEvent(e, eventSearchQuery)),
    }))
    .filter((series) => {
      // Show series if name matches or has matching events
      if (!eventSearchQuery.trim()) return true;
      const q = eventSearchQuery.toLowerCase();
      return series.series_name.toLowerCase().includes(q) || series.events.length > 0;
    });

  const filteredStandaloneEvents = standaloneEvents?.filter((event) =>
    filterEvent(event, eventSearchQuery)
  );

  if (toursLoading || unassignedLoading) {
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
            {toursError instanceof Error ? toursError.message : 'Failed to load tours'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasTours = tours && tours.length > 0;
  const hasUnassigned = unassignedEvents && unassignedEvents.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Tours
          </h1>
          <p className="text-muted-foreground">
            Group events across different venues into tours
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedEvents.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedEvents.size} selected
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </>
          )}

          {/* Create Tour Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tour
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Tour</DialogTitle>
                <DialogDescription>
                  Create a tour to group events across different venues.
                  {selectedEvents.size > 0 && ` ${selectedEvents.size} event(s) will be added.`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tour-name">Tour Name *</Label>
                  <Input
                    id="tour-name"
                    value={newTourName}
                    onChange={(e) => setNewTourName(e.target.value)}
                    placeholder="e.g., National Comedy Tour 2025"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tour-description">Description</Label>
                  <Textarea
                    id="tour-description"
                    value={newTourDescription}
                    onChange={(e) => setNewTourDescription(e.target.value)}
                    placeholder="Optional tour description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tour-start-date">Start Date</Label>
                    <Input
                      id="tour-start-date"
                      type="date"
                      value={newTourStartDate}
                      onChange={(e) => setNewTourStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tour-end-date">End Date</Label>
                    <Input
                      id="tour-end-date"
                      type="date"
                      value={newTourEndDate}
                      onChange={(e) => setNewTourEndDate(e.target.value)}
                    />
                  </div>
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
          {hasTours && selectedEvents.size > 0 && (
            <Dialog open={addToDialogOpen} onOpenChange={setAddToDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
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
                      key={t.id}
                      variant={targetTourId === t.id ? 'default' : 'ghost'}
                      className="justify-start"
                      onClick={() => setTargetTourId(t.id)}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      {t.name} ({t.event_count} events)
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
      </div>

      {/* Add Events to Tour Modal */}
      <Dialog open={addEventsModalOpen} onOpenChange={setAddEventsModalOpen}>
        <DialogContent className="max-w-lg w-full overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Events to {addEventsTargetTour?.name}</DialogTitle>
            <DialogDescription>
              Select events to add to this tour. Click on a recurring series to expand and see all shows.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 w-full overflow-hidden">
            <Input
              className="w-full"
              placeholder="Search events by title, venue, or series name..."
              value={eventSearchQuery}
              onChange={(e) => setEventSearchQuery(e.target.value)}
            />
            <div className="max-h-[400px] overflow-auto border rounded-md w-full">
              {(filteredRecurringSeries?.length === 0 && filteredStandaloneEvents?.length === 0) ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  {eventSearchQuery ? 'No events match your search.' : 'No available events to add.'}
                </p>
              ) : (
                <div className="divide-y">
                  {/* Recurring Series - Grouped */}
                  {filteredRecurringSeries?.map((series) => {
                    const isExpanded = expandedModalSeries.has(series.series_id);
                    const selectedCount = series.events.filter(e => modalSelectedEvents.has(e.id)).length;
                    const allSelected = selectedCount === series.events.length && series.events.length > 0;
                    const someSelected = selectedCount > 0 && selectedCount < series.events.length;

                    return (
                      <div key={series.series_id} className="bg-muted/30">
                        {/* Series Header */}
                        <div
                          className={cn(
                            'flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50',
                            allSelected && 'bg-primary/10'
                          )}
                        >
                          <Checkbox
                            checked={allSelected}
                            className={someSelected ? 'data-[state=checked]:bg-muted-foreground' : ''}
                            onCheckedChange={() => toggleSeriesSelection(series)}
                          />
                          <div
                            className="flex-1 min-w-0 flex items-center gap-2"
                            onClick={() => toggleModalSeriesExpansion(series.series_id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate flex items-center gap-2">
                                {series.series_name}
                                <Badge variant="secondary" className="text-xs">
                                  {series.event_count} shows
                                </Badge>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selectedCount > 0 && `${selectedCount} selected`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Events */}
                        {isExpanded && (
                          <div className="pl-8 border-l-2 border-muted ml-4">
                            {series.events.map((event) => (
                              <div
                                key={event.id}
                                className={cn(
                                  'flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer',
                                  modalSelectedEvents.has(event.id) && 'bg-primary/10'
                                )}
                                onClick={() => toggleModalEventSelection(event.id)}
                              >
                                <Checkbox
                                  checked={modalSelectedEvents.has(event.id)}
                                  onCheckedChange={() => toggleModalEventSelection(event.id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{event.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(event.event_date), 'EEE, MMM d, yyyy')}
                                    {event.venue && ` · ${event.venue}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Standalone Events */}
                  {filteredStandaloneEvents?.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer',
                        modalSelectedEvents.has(event.id) && 'bg-primary/10'
                      )}
                      onClick={() => toggleModalEventSelection(event.id)}
                    >
                      <Checkbox
                        checked={modalSelectedEvents.has(event.id)}
                        onCheckedChange={() => toggleModalEventSelection(event.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), 'EEE, MMM d, yyyy')}
                          {event.venue && ` · ${event.venue}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {modalSelectedEvents.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {modalSelectedEvents.size} event(s) selected
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddEventsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddEventsFromModal}
              disabled={modalSelectedEvents.size === 0 || addToTour.isPending}
            >
              {addToTour.isPending ? 'Adding...' : `Add ${modalSelectedEvents.size} Event(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tours List */}
      {hasTours && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Tours</h2>
          {tours?.map((tour) => (
            <TourCard
              key={tour.id}
              tour={tour}
              isExpanded={expandedTours.has(tour.id)}
              onToggle={() => toggleTour(tour.id)}
              onDelete={() => handleDeleteTour(tour.id)}
              onAddEvents={() => handleOpenAddEventsModal(tour)}
              onEdit={() => {
                // TODO: Implement edit tour modal
                alert('Edit tour coming soon');
              }}
              onRemoveEvent={handleRemoveFromTour}
              onNavigateToEvent={(eventId) => navigate(`/events/${eventId}/manage`)}
            />
          ))}
        </div>
      )}

      {/* Unassigned Events */}
      {hasUnassigned && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Available Events</h2>
          <p className="text-sm text-muted-foreground">
            Select events below to add them to a tour.
          </p>
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-2">
                {unassignedEvents?.slice(0, 50).map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isSelected={selectedEvents.has(event.id)}
                    onToggleSelect={() => toggleEventSelection(event.id)}
                    onNavigate={() => navigate(`/events/${event.id}/manage`)}
                  />
                ))}
                {unassignedEvents && unassignedEvents.length > 50 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Showing first 50 of {unassignedEvents.length} events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!hasTours && !hasUnassigned && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tours Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Create events first, then group them into tours for multi-venue shows across different cities.
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

// Tour Card Component
interface TourCardProps {
  tour: TourWithEvents;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddEvents: () => void;
  onEdit: () => void;
  onRemoveEvent: (eventId: string) => void;
  onNavigateToEvent: (eventId: string) => void;
}

function TourCard({
  tour,
  isExpanded,
  onToggle,
  onDelete,
  onAddEvents,
  onEdit,
  onRemoveEvent,
  onNavigateToEvent,
}: TourCardProps) {
  // Get unique venues from events
  const venues = [...new Set(tour.events.map(e => e.venue).filter(Boolean))];
  const dateRange = tour.start_date && tour.end_date
    ? `${format(new Date(tour.start_date), 'MMM d')} - ${format(new Date(tour.end_date), 'MMM d, yyyy')}`
    : tour.next_event_date
    ? `Next: ${format(new Date(tour.next_event_date), 'MMM d, yyyy')}`
    : null;

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
                  <CardTitle className="text-lg flex items-center gap-2">
                    {tour.name}
                    {tour.status && (
                      <Badge variant="secondary" className="ml-2">
                        {tour.status}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      {tour.event_count} shows
                    </span>
                    {venues.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {venues.slice(0, 3).join(', ')}{venues.length > 3 && ` +${venues.length - 3}`}
                      </span>
                    )}
                    {dateRange && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {dateRange}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={onAddEvents} title="Add events to tour">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onEdit} title="Edit tour">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete} title="Delete tour">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t">
            {tour.description && (
              <p className="text-sm text-muted-foreground mb-4 pt-4">{tour.description}</p>
            )}
            <div className="grid gap-2 pt-2">
              {tour.events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No events added to this tour yet.
                </p>
              ) : (
                tour.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onNavigateToEvent(event.id)}
                    >
                      <p className="font-medium">{event.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.event_date), 'EEE, MMM d, yyyy')}
                        </span>
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.venue}
                          </span>
                        )}
                        {event.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.start_time}
                          </span>
                        )}
                      </div>
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
                ))
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Event Row Component for Unassigned Events
interface EventRowProps {
  event: TourEvent;
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
