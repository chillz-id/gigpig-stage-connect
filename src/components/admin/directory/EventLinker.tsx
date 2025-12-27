/**
 * EventLinker Component
 *
 * Link a photo to an event and venue.
 * Supports internal events, Humanitix, and Eventbrite events.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  MapPin,
  Search,
  Loader2,
  Link as LinkIcon,
  Unlink,
  Building2,
  Ticket,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { directoryService } from '@/services/directory';
import type {
  DirectoryMedia,
  DirectoryMediaEvent,
  DirectoryMediaEventInsert,
} from '@/types/directory';

interface EventLinkerProps {
  media: DirectoryMedia;
  onClose: () => void;
  onSaved?: () => void;
}

interface Event {
  id: string;
  title: string;
  start_time: string;
  venue_id: string | null;
  venue_name?: string;
}

interface Venue {
  id: string;
  name: string;
  city: string | null;
}

type LinkMode = 'event' | 'humanitix' | 'eventbrite' | 'manual';

export function EventLinker({ media, onClose, onSaved }: EventLinkerProps) {
  const { theme } = useTheme();
  const { toast } = useToast();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<LinkMode>('event');
  const [existingLink, setExistingLink] = useState<DirectoryMediaEvent | null>(null);

  // Data
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchEvent, setSearchEvent] = useState('');
  const [searchVenue, setSearchVenue] = useState('');

  // Selected values
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [htxEventId, setHtxEventId] = useState('');
  const [ebEventId, setEbEventId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [manualVenueName, setManualVenueName] = useState('');

  const getDialogStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-purple-900/95 border-white/20 text-white';
    }
    return 'bg-gray-900 border-gray-700 text-gray-100';
  };

  // Load existing link and data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Load existing link
        const link = await directoryService.getMediaEvent(media.id);
        setExistingLink(link);

        // Pre-populate form if link exists
        if (link) {
          if (link.event_id) {
            setMode('event');
            setSelectedEventId(link.event_id);
          } else if (link.htx_event_id) {
            setMode('humanitix');
            setHtxEventId(link.htx_event_id);
          } else if (link.eb_event_id) {
            setMode('eventbrite');
            setEbEventId(link.eb_event_id);
          } else {
            setMode('manual');
          }
          setSelectedVenueId(link.venue_id);
          setSessionDate(link.session_date?.split('T')[0] || '');
          setSessionName(link.session_name || '');
          setManualVenueName(link.venue_name || '');
        } else if (media.event_date) {
          // Pre-populate date from media
          setSessionDate(media.event_date);
        }

        // Load events (recent ones)
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, title, start_time, venue_id')
          .order('start_time', { ascending: false })
          .limit(100);

        if (eventsData) {
          setEvents(eventsData as Event[]);
        }

        // Load venues
        const { data: venuesData } = await supabase
          .from('venues')
          .select('id, name, city')
          .order('name', { ascending: true });

        if (venuesData) {
          setVenues(venuesData as Venue[]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load event data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [media.id]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!searchEvent.trim()) return events;
    const search = searchEvent.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(search)
    );
  }, [events, searchEvent]);

  // Filter venues
  const filteredVenues = useMemo(() => {
    if (!searchVenue.trim()) return venues;
    const search = searchVenue.toLowerCase();
    return venues.filter(v =>
      v.name.toLowerCase().includes(search) ||
      v.city?.toLowerCase().includes(search)
    );
  }, [venues, searchVenue]);

  // Get selected event
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  // When event is selected, auto-set venue if available
  useEffect(() => {
    if (selectedEvent?.venue_id && !selectedVenueId) {
      setSelectedVenueId(selectedEvent.venue_id);
    }
  }, [selectedEventId]);

  // Save link
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Build the insert object
      const insert: DirectoryMediaEventInsert = {
        media_id: media.id,
      };

      // Set based on mode
      switch (mode) {
        case 'event':
          if (selectedEventId) {
            insert.event_id = selectedEventId;
          }
          break;
        case 'humanitix':
          if (htxEventId.trim()) {
            insert.htx_event_id = htxEventId.trim();
          }
          break;
        case 'eventbrite':
          if (ebEventId.trim()) {
            insert.eb_event_id = ebEventId.trim();
          }
          break;
      }

      // Common fields
      if (selectedVenueId) {
        insert.venue_id = selectedVenueId;
      } else if (manualVenueName.trim()) {
        insert.venue_name = manualVenueName.trim();
      }

      if (sessionDate) {
        insert.session_date = new Date(sessionDate).toISOString();
      }

      if (sessionName.trim()) {
        insert.session_name = sessionName.trim();
      }

      // Remove existing link if present
      if (existingLink) {
        await directoryService.removeMediaEvent(media.id);
      }

      // Add new link (if we have something to link)
      const hasLink = insert.event_id || insert.htx_event_id || insert.eb_event_id ||
                      insert.venue_id || insert.venue_name || insert.session_date;

      if (hasLink) {
        await directoryService.addMediaEvent(insert);
      }

      toast({
        title: 'Event Linked',
        description: hasLink ? 'Photo has been linked to event' : 'Event link removed',
      });

      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      toast({
        title: 'Error',
        description: 'Failed to save event link',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Remove link
  const handleRemoveLink = async () => {
    if (!existingLink) return;
    setIsSaving(true);
    try {
      await directoryService.removeMediaEvent(media.id);
      toast({
        title: 'Link Removed',
        description: 'Event link has been removed from photo',
      });
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Failed to remove:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove event link',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get photo URL
  const getPhotoUrl = () => {
    if (media.public_url) return media.public_url;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/directory-media/${media.storage_path}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-hidden flex flex-col", getDialogStyles())}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link Photo to Event
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="flex gap-4 flex-1 min-h-0">
            {/* Left: Photo preview */}
            <div className="w-1/3 flex flex-col gap-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                <img
                  src={getPhotoUrl()}
                  alt={media.file_name}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-white/60 text-center truncate">
                {media.file_name}
              </p>
              {existingLink && (
                <Badge variant="secondary" className="mx-auto">
                  <LinkIcon className="h-3 w-3 mr-1" />
                  Currently linked
                </Badge>
              )}
            </div>

            {/* Right: Linking interface */}
            <div className="w-2/3 flex flex-col gap-4 min-h-0">
              <Tabs value={mode} onValueChange={(v) => setMode(v as LinkMode)}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="event">Internal Event</TabsTrigger>
                  <TabsTrigger value="humanitix">Humanitix</TabsTrigger>
                  <TabsTrigger value="eventbrite">Eventbrite</TabsTrigger>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                </TabsList>

                {/* Internal Event */}
                <TabsContent value="event" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Event</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        value={searchEvent}
                        onChange={(e) => setSearchEvent(e.target.value)}
                        placeholder="Search events..."
                        className="pl-10 bg-white/10 border-white/20"
                      />
                    </div>
                    <ScrollArea className="h-40 border border-white/10 rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredEvents.slice(0, 20).map((event) => (
                          <button
                            key={event.id}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded text-left transition-colors",
                              selectedEventId === event.id
                                ? "bg-blue-500/30 border border-blue-500/50"
                                : "hover:bg-white/10"
                            )}
                            onClick={() => setSelectedEventId(event.id)}
                          >
                            <Calendar className="h-4 w-4 text-white/40 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">
                                {event.title}
                              </p>
                              <p className="text-xs text-white/50">
                                {formatDate(event.start_time)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* Humanitix */}
                <TabsContent value="humanitix" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Humanitix Event ID</Label>
                    <Input
                      value={htxEventId}
                      onChange={(e) => setHtxEventId(e.target.value)}
                      placeholder="Enter Humanitix event ID..."
                      className="bg-white/10 border-white/20"
                    />
                    <p className="text-xs text-white/50">
                      Find this in the Humanitix event URL or dashboard
                    </p>
                  </div>
                </TabsContent>

                {/* Eventbrite */}
                <TabsContent value="eventbrite" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Eventbrite Event ID</Label>
                    <Input
                      value={ebEventId}
                      onChange={(e) => setEbEventId(e.target.value)}
                      placeholder="Enter Eventbrite event ID..."
                      className="bg-white/10 border-white/20"
                    />
                    <p className="text-xs text-white/50">
                      Find this in the Eventbrite event URL
                    </p>
                  </div>
                </TabsContent>

                {/* Manual */}
                <TabsContent value="manual" className="space-y-4 mt-4">
                  <p className="text-sm text-white/60">
                    Link to venue and date without a specific event record
                  </p>
                </TabsContent>
              </Tabs>

              {/* Common fields: Venue and Session */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                {/* Venue */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Venue
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchVenue}
                      onChange={(e) => setSearchVenue(e.target.value)}
                      placeholder={selectedVenue ? selectedVenue.name : "Search venues..."}
                      className="pl-10 bg-white/10 border-white/20"
                    />
                  </div>
                  {searchVenue.trim() && (
                    <ScrollArea className="h-32 border border-white/10 rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredVenues.slice(0, 10).map((venue) => (
                          <button
                            key={venue.id}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded text-left transition-colors",
                              selectedVenueId === venue.id
                                ? "bg-blue-500/30 border border-blue-500/50"
                                : "hover:bg-white/10"
                            )}
                            onClick={() => {
                              setSelectedVenueId(venue.id);
                              setSearchVenue('');
                            }}
                          >
                            <MapPin className="h-4 w-4 text-white/40" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{venue.name}</p>
                              {venue.city && (
                                <p className="text-xs text-white/50">{venue.city}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  {selectedVenue && !searchVenue && (
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                      <MapPin className="h-4 w-4 text-white/60" />
                      <span className="text-sm">{selectedVenue.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 ml-auto"
                        onClick={() => setSelectedVenueId(null)}
                      >
                        <Unlink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {!selectedVenueId && mode === 'manual' && (
                    <Input
                      value={manualVenueName}
                      onChange={(e) => setManualVenueName(e.target.value)}
                      placeholder="Or type venue name..."
                      className="bg-white/10 border-white/20"
                    />
                  )}
                </div>

                {/* Session Date and Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Session Date</Label>
                    <Input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Name (optional)</Label>
                    <Input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., Early Show, Late Show"
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between gap-3 pt-4 border-t border-white/10 flex-shrink-0">
          <div>
            {existingLink && (
              <Button
                variant="destructive"
                onClick={handleRemoveLink}
                disabled={isSaving}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Remove Link
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
