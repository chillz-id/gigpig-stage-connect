/**
 * SeriesEventsTab Component
 *
 * Lists all events in the series with metrics and navigation to event management.
 * Includes ability to create new events and add existing standalone events.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Ticket, DollarSign, Plus, Search, CheckSquare, Square, MoreHorizontal, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useNonRecurringEvents, useAddToRecurringSeries } from '@/hooks/useRecurringSeries';
import { useToast } from '@/hooks/use-toast';

interface SeriesEventsTabProps {
  seriesId: string;
}

interface SeriesEvent {
  id: string;
  event_uuid: string | null; // UUID from events table for navigation
  title: string;
  event_date: string;
  status: string;
  venue_name: string | null;
  ticket_price: number | null;
  tickets_sold?: number;
  total_revenue?: number;
  is_past?: boolean;
}

type FilterStatus = 'all' | 'upcoming' | 'past';

export default function SeriesEventsTab({ seriesId }: SeriesEventsTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Add Events Modal state
  const [showAddEventsModal, setShowAddEventsModal] = useState(false);
  const [addEventsSearchQuery, setAddEventsSearchQuery] = useState('');
  const [selectedEventsToAdd, setSelectedEventsToAdd] = useState<Set<string>>(new Set());

  // Hooks for adding events
  const { data: standaloneEvents, isLoading: standaloneLoading } = useNonRecurringEvents();
  const addToSeries = useAddToRecurringSeries();

  // Fetch events in this series - use session_series junction table + session_complete
  const { data: events, isLoading, error: eventsError } = useQuery({
    queryKey: ['series-events', seriesId],
    queryFn: async () => {
      // Step 1: Get session IDs that belong to this series from junction table
      const { data: seriesSessions, error: junctionError } = await supabase
        .from('session_series')
        .select('canonical_session_source_id')
        .eq('series_id', seriesId);

      if (junctionError) {
        console.error('Error fetching session_series:', junctionError);
        throw junctionError;
      }

      const sessionIds = (seriesSessions || []).map(s => s.canonical_session_source_id);
      console.log('=== SERIES EVENTS DEBUG ===');
      console.log('Sessions in series:', sessionIds.length);

      if (sessionIds.length === 0) {
        return [];
      }

      // Step 2: Fetch session data from session_complete
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('session_complete')
        .select(`
          canonical_session_source_id,
          event_source_id,
          session_name,
          event_name,
          session_start,
          session_start_local,
          status,
          is_past,
          venue_name,
          total_ticket_count,
          total_gross_dollars,
          total_net_dollars
        `)
        .in('canonical_session_source_id', sessionIds)
        .order('session_start', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching session_complete:', sessionsError);
        throw sessionsError;
      }

      // Step 3: Look up event UUIDs from events table
      // events.humanitix_event_id often stores the SESSION ID (canonical_session_source_id), not the parent event ID
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, canonical_session_source_id, humanitix_event_id')
        .or(`humanitix_event_id.in.(${sessionIds.join(',')}),canonical_session_source_id.in.(${sessionIds.join(',')})`);

      // Build lookup map - humanitix_event_id matching session ID is the correct link to ticket data
      const eventUuidBySessionId = new Map<string, string>();
      (eventsData || []).forEach(e => {
        // Prioritize events where humanitix_event_id matches the session ID (these have ticket data)
        if (e.humanitix_event_id && !eventUuidBySessionId.has(e.humanitix_event_id)) {
          eventUuidBySessionId.set(e.humanitix_event_id, e.id);
        }
      });
      // Fallback: canonical_session_source_id (only if not already mapped)
      (eventsData || []).forEach(e => {
        if (e.canonical_session_source_id && !eventUuidBySessionId.has(e.canonical_session_source_id)) {
          eventUuidBySessionId.set(e.canonical_session_source_id, e.id);
        }
      });

      // Transform session_complete data to SeriesEvent format
      const result = (sessionsData || []).map(session => {
        // Parse LOCAL date - extract YYYY-MM-DD from session_start_local (the source of truth for display)
        // session_start_local format: "2026-02-18 19:30:00" or "2026-02-18T19:30:00..."
        const localDateStr = session.session_start_local ? String(session.session_start_local) : '';
        const eventDate = localDateStr ? localDateStr.slice(0, 10) : ''; // Extract "YYYY-MM-DD" directly
        // Look up by canonical_session_source_id (maps to humanitix_event_id OR canonical_session_source_id)
        const eventUuid = eventUuidBySessionId.get(session.canonical_session_source_id) || null;
        return {
          id: session.canonical_session_source_id,
          event_uuid: eventUuid,
          title: session.session_name || session.event_name || 'Untitled',
          event_date: eventDate,
          status: session.status || 'open',
          ticket_price: null,
          venue_name: session.venue_name || null,
          tickets_sold: session.total_ticket_count || 0,
          total_revenue: parseFloat(String(session.total_gross_dollars || 0)),
          is_past: session.is_past ?? false,
        };
      }) as SeriesEvent[];

      const upcoming = result.filter(e => !e.is_past);
      console.log('Final: Total', result.length, '| Upcoming:', upcoming.length, '| Past:', result.length - upcoming.length);

      return result;
    },
    enabled: !!seriesId,
  });

  // Log any errors for debugging
  if (eventsError) {
    console.error('Series events query error:', eventsError);
  }

  // Filter events - use is_past (from session_complete or calculated)
  const filteredEvents = events?.filter(event => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue_name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter using is_past from session_complete
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'upcoming' && event.is_past === false) ||
      (statusFilter === 'past' && event.is_past === true);

    return matchesSearch && matchesStatus;
  });

  // Filter standalone events for the add modal
  const filteredStandaloneEvents = useMemo(() => {
    if (!standaloneEvents) return [];
    if (!addEventsSearchQuery.trim()) return standaloneEvents;

    const query = addEventsSearchQuery.toLowerCase();
    return standaloneEvents.filter((event) =>
      event.title.toLowerCase().includes(query) ||
      event.venue?.toLowerCase().includes(query)
    );
  }, [standaloneEvents, addEventsSearchQuery]);

  // Check if all filtered events are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredStandaloneEvents.length === 0) return false;
    return filteredStandaloneEvents.every((event) => selectedEventsToAdd.has(event.id));
  }, [filteredStandaloneEvents, selectedEventsToAdd]);

  // Toggle event selection for add modal
  const toggleEventSelection = (eventId: string) => {
    setSelectedEventsToAdd((prev) => {
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
    setSelectedEventsToAdd((prev) => {
      const next = new Set(prev);
      filteredStandaloneEvents.forEach((event) => next.add(event.id));
      return next;
    });
  };

  // Deselect all filtered events
  const deselectAllFiltered = () => {
    setSelectedEventsToAdd((prev) => {
      const next = new Set(prev);
      filteredStandaloneEvents.forEach((event) => next.delete(event.id));
      return next;
    });
  };

  // Handle adding selected events to series
  const handleAddEvents = async () => {
    if (selectedEventsToAdd.size === 0) return;

    await addToSeries.mutateAsync({
      seriesId,
      eventIds: Array.from(selectedEventsToAdd),
    });

    // Refresh the series events list and wait for it to complete
    await queryClient.invalidateQueries({ queryKey: ['series-events', seriesId] });
    await queryClient.refetchQueries({ queryKey: ['series-events', seriesId] });

    // Reset and close modal
    setSelectedEventsToAdd(new Set());
    setAddEventsSearchQuery('');
    setShowAddEventsModal(false);
  };

  // Remove event from series (delete from session_series junction table)
  const handleRemoveFromSeries = async (sessionId: string, eventTitle: string) => {
    try {
      const { error } = await supabase
        .from('session_series')
        .delete()
        .eq('canonical_session_source_id', sessionId)
        .eq('series_id', seriesId);

      if (error) throw error;

      toast({
        title: 'Event removed',
        description: `"${eventTitle}" has been removed from this series.`,
      });

      // Refresh the series events list
      queryClient.invalidateQueries({ queryKey: ['series-events', seriesId] });
      queryClient.invalidateQueries({ queryKey: ['recurring-series'] });
      queryClient.invalidateQueries({ queryKey: ['non-recurring-events'] });
      queryClient.invalidateQueries({ queryKey: ['series-analytics', 'series', seriesId] });
    } catch (error) {
      console.error('Error removing event from series:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove event from series. Please try again.',
      });
    }
  };

  const getStatusBadge = (isPast: boolean) => {
    if (isPast) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge className="bg-green-500 text-white">On Sale</Badge>;
  };

  const handleEventClick = (event: SeriesEvent) => {
    if (event.event_uuid) {
      navigate(`/events/${event.event_uuid}/manage`, { state: { fromSeries: seriesId } });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-sm text-muted-foreground">
            Manage events in this series
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowAddEventsModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Events
          </Button>
          <Button onClick={() => navigate('/events/create', { state: { seriesId } })}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: FilterStatus) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card >
        <CardHeader>
          <CardTitle>Series Events</CardTitle>
          <CardDescription>
            {filteredEvents?.length || 0} event{filteredEvents?.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' ? ` (${statusFilter})` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'No events match your filters.'
                : 'No events in this series yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents?.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    event.event_uuid
                      ? "cursor-pointer hover:bg-muted/50 hover:border-primary/50"
                      : "opacity-75"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{event.title}</h3>
                        {getStatusBadge(event.is_past ?? true)}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.event_date)}
                        </span>
                        {event.venue_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.venue_name}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{event.tickets_sold}</span>
                          <span className="text-muted-foreground">tickets</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatCurrency(event.total_revenue || 0)}</span>
                          <span className="text-muted-foreground">revenue</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {!event.event_uuid && (
                        <span className="text-xs text-muted-foreground">No manage page</span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRemoveFromSeries(event.id, event.title)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from Series
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Events Modal */}
      <Dialog open={showAddEventsModal} onOpenChange={setShowAddEventsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Events to Series</DialogTitle>
            <DialogDescription>
              Select standalone events to add to this series
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
            {/* Search and Select All */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={addEventsSearchQuery}
                  onChange={(e) => setAddEventsSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                {allFilteredSelected ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={deselectAllFiltered}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Deselect All
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

            {/* Events List */}
            <div className="flex-1 overflow-auto border rounded-lg">
              {standaloneLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredStandaloneEvents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {addEventsSearchQuery
                    ? 'No events match your search'
                    : 'No standalone events available to add'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredStandaloneEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors',
                        selectedEventsToAdd.has(event.id) && 'bg-primary/10'
                      )}
                      onClick={() => toggleEventSelection(event.id)}
                    >
                      <Checkbox
                        checked={selectedEventsToAdd.has(event.id)}
                        onCheckedChange={() => toggleEventSelection(event.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.event_date)}
                          {event.venue && ` · ${event.venue}`}
                        </p>
                      </div>
                      <Badge variant="secondary">{event.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selection Count */}
            {selectedEventsToAdd.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedEventsToAdd.size} event{selectedEventsToAdd.size !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddEventsModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddEvents}
              disabled={selectedEventsToAdd.size === 0 || addToSeries.isPending}
            >
              {addToSeries.isPending
                ? 'Adding...'
                : `Add ${selectedEventsToAdd.size} Event${selectedEventsToAdd.size !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
