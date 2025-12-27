/**
 * PhotoUploadDialog Component
 *
 * Upload photos with optional event, venue, and photographer linking.
 * Streamlines the workflow of uploading and tagging in one step.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Upload,
  Calendar,
  MapPin,
  Search,
  Loader2,
  Camera,
  Image as ImageIcon,
  X,
  Building2,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { directoryService } from '@/services/directory';
import type { DirectoryProfile, DirectoryMediaEventInsert } from '@/types/directory';

interface PhotoUploadDialogProps {
  profileId: string;
  onClose: () => void;
  onUploaded?: () => void;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string | null;
}

interface Venue {
  id: string;
  name: string;
  city: string | null;
}

export function PhotoUploadDialog({
  profileId,
  onClose,
  onUploaded,
}: PhotoUploadDialogProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Data
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [photographers, setPhotographers] = useState<DirectoryProfile[]>([]);

  // Search terms
  const [searchEvent, setSearchEvent] = useState('');
  const [searchVenue, setSearchVenue] = useState('');
  const [searchPhotographer, setSearchPhotographer] = useState('');

  // Selected values
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedPhotographerId, setSelectedPhotographerId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState('');
  const [manualVenueName, setManualVenueName] = useState('');

  const getDialogStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-purple-900/95 border-white/20 text-white';
    }
    return 'bg-gray-900 border-gray-700 text-gray-100';
  };

  // Load data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Load events (past events for tagging photos)
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, title, event_date, venue')
          .not('event_date', 'is', null)
          .order('event_date', { ascending: false })
          .limit(200);

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

        // Load photographers from directory_profiles
        const { profiles } = await directoryService.searchProfiles(
          { profile_type: 'photographer' },
          100,
          0
        );
        setPhotographers(profiles);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Clear file
  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Filter functions
  const filteredEvents = useMemo(() => {
    if (!searchEvent.trim()) return events.slice(0, 20);
    const search = searchEvent.toLowerCase();
    return events
      .filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          e.venue?.toLowerCase().includes(search)
      )
      .slice(0, 20);
  }, [events, searchEvent]);

  const filteredVenues = useMemo(() => {
    if (!searchVenue.trim()) return venues.slice(0, 10);
    const search = searchVenue.toLowerCase();
    return venues
      .filter(
        (v) =>
          v.name.toLowerCase().includes(search) ||
          v.city?.toLowerCase().includes(search)
      )
      .slice(0, 10);
  }, [venues, searchVenue]);

  const filteredPhotographers = useMemo(() => {
    if (!searchPhotographer.trim()) return photographers.slice(0, 10);
    const search = searchPhotographer.toLowerCase();
    return photographers
      .filter((p) => p.stage_name.toLowerCase().includes(search))
      .slice(0, 10);
  }, [photographers, searchPhotographer]);

  // Get selected items
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);
  const selectedPhotographer = photographers.find(
    (p) => p.id === selectedPhotographerId
  );

  // Auto-fill venue from event
  useEffect(() => {
    if (selectedEvent?.venue && !selectedVenueId && !manualVenueName) {
      setManualVenueName(selectedEvent.venue);
    }
    if (selectedEvent?.event_date && !sessionDate) {
      // Extract date part
      const date = new Date(selectedEvent.event_date);
      setSessionDate(date.toISOString().split('T')[0]);
    }
  }, [selectedEventId]);

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an image to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload the photo
      const media = await directoryService.uploadPhoto(profileId, selectedFile, {
        isHeadshot: false,
      });

      // 2. Link to event/venue if selected
      const hasEventLink =
        selectedEventId || selectedVenueId || manualVenueName || sessionDate;
      if (hasEventLink) {
        const eventInsert: DirectoryMediaEventInsert = {
          media_id: media.id,
        };

        if (selectedEventId) {
          eventInsert.event_id = selectedEventId;
        }
        if (selectedVenueId) {
          eventInsert.venue_id = selectedVenueId;
        } else if (manualVenueName.trim()) {
          eventInsert.venue_name = manualVenueName.trim();
        }
        if (sessionDate) {
          eventInsert.session_date = new Date(sessionDate).toISOString();
        }

        await directoryService.addMediaEvent(eventInsert);
      }

      // 3. Link photographer if selected
      if (selectedPhotographerId) {
        await directoryService.addMediaProfile({
          media_id: media.id,
          profile_id: selectedPhotographerId,
          role: 'photographer',
          is_primary_subject: false,
          approval_status: 'approved', // Photographer credit auto-approved
        });
      }

      toast({
        title: 'Photo Uploaded',
        description: 'Photo has been uploaded and linked successfully',
      });

      onUploaded?.();
      onClose();
    } catch (error) {
      console.error('Failed to upload:', error);
      toast({
        title: 'Upload Failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent
        className={cn(
          'max-w-4xl max-h-[90vh] overflow-hidden flex flex-col',
          getDialogStyles()
        )}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Photo
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Left: File upload */}
            <div className="w-1/3 flex flex-col gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {!selectedFile ? (
                <div
                  className={cn(
                    'flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
                    'border-white/20 hover:border-white/40 hover:bg-white/5'
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <ImageIcon className="h-12 w-12 text-white/40 mb-4" />
                  <p className="text-sm text-white/60 text-center px-4">
                    Click or drag & drop to upload
                  </p>
                  <p className="text-xs text-white/40 mt-2">
                    JPG, PNG, WebP supported
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                    <img
                      src={previewUrl || ''}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={handleClearFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-white/60 text-center truncate">
                    {selectedFile.name}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Metadata fields */}
            <ScrollArea className="w-2/3 pr-4">
              <div className="space-y-6">
                {/* Event Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Event (optional)
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchEvent}
                      onChange={(e) => setSearchEvent(e.target.value)}
                      placeholder={
                        selectedEvent ? selectedEvent.title : 'Search events...'
                      }
                      className="pl-10 bg-white/10 border-white/20"
                    />
                  </div>
                  {(searchEvent.trim() || !selectedEventId) && (
                    <ScrollArea className="h-32 border border-white/10 rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredEvents.map((event) => (
                          <button
                            key={event.id}
                            className={cn(
                              'w-full flex items-center gap-3 p-2 rounded text-left transition-colors',
                              selectedEventId === event.id
                                ? 'bg-blue-500/30 border border-blue-500/50'
                                : 'hover:bg-white/10'
                            )}
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setSearchEvent('');
                            }}
                          >
                            <Calendar className="h-4 w-4 text-white/40 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">
                                {event.title}
                              </p>
                              <p className="text-xs text-white/50">
                                {formatDate(event.event_date)}
                                {event.venue && ` @ ${event.venue}`}
                              </p>
                            </div>
                          </button>
                        ))}
                        {filteredEvents.length === 0 && (
                          <p className="text-sm text-white/50 text-center py-4">
                            No events found
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                  {selectedEvent && !searchEvent && (
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                      <Calendar className="h-4 w-4 text-white/60" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {selectedEvent.title}
                        </p>
                        <p className="text-xs text-white/50">
                          {formatDate(selectedEvent.event_date)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={() => setSelectedEventId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Venue Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Venue (optional)
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchVenue}
                      onChange={(e) => setSearchVenue(e.target.value)}
                      placeholder={
                        selectedVenue ? selectedVenue.name : 'Search venues...'
                      }
                      className="pl-10 bg-white/10 border-white/20"
                    />
                  </div>
                  {searchVenue.trim() && (
                    <ScrollArea className="h-32 border border-white/10 rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredVenues.map((venue) => (
                          <button
                            key={venue.id}
                            className={cn(
                              'w-full flex items-center gap-3 p-2 rounded text-left transition-colors',
                              selectedVenueId === venue.id
                                ? 'bg-blue-500/30 border border-blue-500/50'
                                : 'hover:bg-white/10'
                            )}
                            onClick={() => {
                              setSelectedVenueId(venue.id);
                              setManualVenueName('');
                              setSearchVenue('');
                            }}
                          >
                            <MapPin className="h-4 w-4 text-white/40" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">
                                {venue.name}
                              </p>
                              {venue.city && (
                                <p className="text-xs text-white/50">
                                  {venue.city}
                                </p>
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
                      <span className="text-sm flex-1">{selectedVenue.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={() => setSelectedVenueId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {!selectedVenueId && (
                    <Input
                      value={manualVenueName}
                      onChange={(e) => setManualVenueName(e.target.value)}
                      placeholder="Or type venue name..."
                      className="bg-white/10 border-white/20"
                    />
                  )}
                </div>

                {/* Session Date */}
                <div className="space-y-2">
                  <Label>Photo Date (optional)</Label>
                  <Input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="bg-white/10 border-white/20"
                  />
                </div>

                {/* Photographer Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Photographer Credit (optional)
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchPhotographer}
                      onChange={(e) => setSearchPhotographer(e.target.value)}
                      placeholder={
                        selectedPhotographer
                          ? selectedPhotographer.stage_name
                          : 'Search photographers...'
                      }
                      className="pl-10 bg-white/10 border-white/20"
                    />
                  </div>
                  {(searchPhotographer.trim() || !selectedPhotographerId) && (
                    <ScrollArea className="h-32 border border-white/10 rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredPhotographers.map((photographer) => (
                          <button
                            key={photographer.id}
                            className={cn(
                              'w-full flex items-center gap-3 p-2 rounded text-left transition-colors',
                              selectedPhotographerId === photographer.id
                                ? 'bg-blue-500/30 border border-blue-500/50'
                                : 'hover:bg-white/10'
                            )}
                            onClick={() => {
                              setSelectedPhotographerId(photographer.id);
                              setSearchPhotographer('');
                            }}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={photographer.primary_headshot_url || ''} />
                              <AvatarFallback>
                                <Camera className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">
                                {photographer.stage_name}
                              </p>
                            </div>
                          </button>
                        ))}
                        {photographers.length === 0 && (
                          <p className="text-sm text-white/50 text-center py-4">
                            No photographers in directory
                          </p>
                        )}
                        {filteredPhotographers.length === 0 &&
                          photographers.length > 0 && (
                            <p className="text-sm text-white/50 text-center py-4">
                              No matching photographers
                            </p>
                          )}
                      </div>
                    </ScrollArea>
                  )}
                  {selectedPhotographer && !searchPhotographer && (
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={selectedPhotographer.primary_headshot_url || ''}
                        />
                        <AvatarFallback>
                          <Camera className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1">
                        {selectedPhotographer.stage_name}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={() => setSelectedPhotographerId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10 flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || isLoading}
          >
            {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
