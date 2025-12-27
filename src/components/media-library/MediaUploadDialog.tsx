/**
 * MediaUploadDialog Component
 *
 * Upload photos with cross-entity tagging support.
 * Links media to events, photographers, venues, organizations, and comedians.
 * Photos become visible in the media library of ALL linked entities.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Mic,
  FolderOpen,
  Users,
  Plus,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { directoryService } from '@/services/directory';
import {
  mediaLinkingService,
  type MediaSourceType,
  type EntityType,
  type LinkRole,
  type MediaFolder,
} from '@/services/media';
import type { DirectoryProfile } from '@/types/directory';

// ============================================================================
// Types
// ============================================================================

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Organization ID if uploading as an organization */
  organizationId?: string;
  /** Folder to upload to (optional) */
  defaultFolderId?: string;
  /** Callback when upload completes */
  onUploaded?: () => void;
}

interface Event {
  id: string;
  name: string;
  event_date: string | null;
  venue_name: string | null;
}

interface Venue {
  id: string;
  name: string;
  city: string | null;
}

interface Organization {
  id: string;
  organization_name: string;
  display_name: string | null;
}

interface SelectedEntity {
  id: string;
  name: string;
  type: EntityType;
  role?: LinkRole;
}

// ============================================================================
// Component
// ============================================================================

export function MediaUploadDialog({
  open,
  onOpenChange,
  organizationId,
  defaultFolderId,
  onUploaded,
}: MediaUploadDialogProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // File state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Data for dropdowns
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [photographers, setPhotographers] = useState<DirectoryProfile[]>([]);
  const [comedians, setComedians] = useState<DirectoryProfile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);

  // Search terms
  const [searchEvent, setSearchEvent] = useState('');
  const [searchVenue, setSearchVenue] = useState('');
  const [searchPhotographer, setSearchPhotographer] = useState('');
  const [searchComedian, setSearchComedian] = useState('');

  // Selected values
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntity[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(defaultFolderId || null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(organizationId || null);

  // Dialog styles
  const getDialogStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-purple-900/95 border-white/20 text-white';
    }
    return 'bg-gray-900 border-gray-700 text-gray-100';
  };

  // Load data on mount
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load events (recent 200)
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, name, event_date, venue_name')
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

        // Load photographers
        const { profiles: photographerProfiles } = await directoryService.searchProfiles(
          { profile_type: 'photographer' },
          100,
          0
        );
        if (Array.isArray(photographerProfiles)) {
          setPhotographers(photographerProfiles);
        }

        // Load comedians
        const { profiles: comedianProfiles } = await directoryService.searchProfiles(
          { profile_type: 'comedian' },
          200,
          0
        );
        if (Array.isArray(comedianProfiles)) {
          setComedians(comedianProfiles);
        }

        // Load user's organizations
        if (user?.id) {
          const { data: orgsData } = await supabase
            .from('organization_team_members')
            .select('organization:organization_profiles(id, organization_name, display_name)')
            .eq('user_id', user.id);

          if (orgsData) {
            const orgs = orgsData
              .map((m) => m.organization)
              .filter((o): o is Organization => o !== null);
            setOrganizations(orgs);
          }

          // Load folders (user's + org's if selected)
          await loadFolders();
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, user?.id]);

  // Load folders when org selection changes
  const loadFolders = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: userFolders } = await supabase
        .from('media_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      let orgFolders: MediaFolder[] = [];
      if (selectedOrgId) {
        orgFolders = await mediaLinkingService.getOrganizationFolders(selectedOrgId);
      }

      setFolders([...(userFolders || []), ...orgFolders] as MediaFolder[]);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, [user?.id, selectedOrgId]);

  useEffect(() => {
    if (open) {
      loadFolders();
    }
  }, [open, selectedOrgId, loadFolders]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast({
        title: 'Invalid files',
        description: 'Please select image files only',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles]);

    // Create previews
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrls((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Remove file
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearFiles = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Entity selection helpers
  const addEntity = (entity: SelectedEntity) => {
    // Prevent duplicates
    if (selectedEntities.some((e) => e.id === entity.id && e.type === entity.type)) {
      return;
    }
    setSelectedEntities((prev) => [...prev, entity]);
  };

  const removeEntity = (id: string, type: EntityType) => {
    setSelectedEntities((prev) => prev.filter((e) => !(e.id === id && e.type === type)));
  };

  // Filter functions
  const filteredEvents = useMemo(() => {
    if (!searchEvent.trim()) return events.slice(0, 15);
    const search = searchEvent.toLowerCase();
    return events
      .filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          e.venue_name?.toLowerCase().includes(search)
      )
      .slice(0, 15);
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

  const filteredComedians = useMemo(() => {
    if (!searchComedian.trim()) return comedians.slice(0, 10);
    const search = searchComedian.toLowerCase();
    return comedians
      .filter((c) => c.stage_name.toLowerCase().includes(search))
      .slice(0, 10);
  }, [comedians, searchComedian]);

  // Format date helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle upload
  const handleUpload = async () => {
    console.log('MediaUploadDialog handleUpload called', { userId: user?.id, filesCount: selectedFiles.length });

    if (!user?.id || selectedFiles.length === 0) {
      console.log('Early return - no user or files');
      toast({
        title: 'No files selected',
        description: 'Please select at least one image to upload',
        variant: 'destructive',
      });
      return;
    }

    console.log('Starting upload process...');
    setIsUploading(true);
    try {
      const uploadedMediaIds: { id: string; sourceType: MediaSourceType }[] = [];

      // Upload each file
      for (const file of selectedFiles) {
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        if (selectedOrgId) {
          // Upload as organization media
          const storagePath = `${selectedOrgId}/${timestamp}-${safeFileName}`;

          const { error: uploadError } = await supabase.storage
            .from('organization-media')
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from('organization-media')
            .getPublicUrl(storagePath);

          // Create organization_media record
          const { data: mediaRecord, error: insertError } = await supabase
            .from('organization_media')
            .insert({
              organization_id: selectedOrgId,
              file_url: urlData.publicUrl,
              file_type: file.type.startsWith('image/') ? 'image' : 'other',
              file_size: file.size,
              mime_type: file.type,
              title: file.name,
              uploaded_by: user.id,
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(`Failed to create media record: ${insertError.message}`);
          }

          uploadedMediaIds.push({
            id: mediaRecord.id,
            sourceType: 'organization_media',
          });
        } else {
          // Upload as user media_files (use media-library bucket)
          // Storage policy requires first folder to be auth.uid()
          const storagePath = `${user.id}/${timestamp}-${safeFileName}`;

          console.log('Uploading to media-library bucket:', storagePath);

          const { error: uploadError } = await supabase.storage
            .from('media-library')
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          console.log('Upload successful, getting public URL');

          const { data: urlData } = supabase.storage
            .from('media-library')
            .getPublicUrl(storagePath);

          console.log('Public URL:', urlData.publicUrl);

          // Create media_files record
          const insertPayload = {
            user_id: user.id,
            folder_id: selectedFolderId,
            storage_path: storagePath,
            file_name: file.name,
            file_type: file.type.startsWith('image/') ? 'image' : 'other',
            file_size: file.size,
            public_url: urlData.publicUrl,
          };
          console.log('Inserting media_files record:', insertPayload);

          const { data: mediaRecord, error: insertError } = await supabase
            .from('media_files')
            .insert(insertPayload)
            .select()
            .single();

          if (insertError) {
            console.error('Database insert error:', insertError);
            throw new Error(`Failed to create media record: ${insertError.message}`);
          }

          console.log('Media record created:', mediaRecord.id);

          uploadedMediaIds.push({
            id: mediaRecord.id,
            sourceType: 'media_file',
          });
        }
      }

      // Create entity links for each uploaded file
      for (const media of uploadedMediaIds) {
        for (const entity of selectedEntities) {
          try {
            await mediaLinkingService.linkMediaToEntity({
              sourceType: media.sourceType,
              sourceId: media.id,
              entityType: entity.type,
              entityId: entity.id,
              role: entity.role,
            });
          } catch (linkError) {
            console.error('Failed to create link:', linkError);
            // Continue with other links even if one fails
          }
        }

        // If uploading as org, also link to the organization
        if (selectedOrgId && !selectedEntities.some((e) => e.type === 'organization' && e.id === selectedOrgId)) {
          try {
            await mediaLinkingService.linkMediaToEntity({
              sourceType: media.sourceType,
              sourceId: media.id,
              entityType: 'organization',
              entityId: selectedOrgId,
              role: 'organizer',
            });
          } catch {
            // Ignore if link already exists
          }
        }
      }

      toast({
        title: 'Upload Complete',
        description: `${selectedFiles.length} photo(s) uploaded and linked to ${selectedEntities.length} entities`,
      });

      // Reset state
      clearFiles();
      setSelectedEntities([]);
      onUploaded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload photos',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Get entity icon
  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-3 w-3" />;
      case 'venue':
        return <MapPin className="h-3 w-3" />;
      case 'organization':
        return <Building2 className="h-3 w-3" />;
      case 'photographer':
        return <Camera className="h-3 w-3" />;
      case 'comedian':
        return <Mic className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-5xl max-h-[90vh] overflow-hidden flex flex-col',
          getDialogStyles()
        )}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Photos
            {selectedOrgId && (
              <Badge variant="secondary" className="ml-2">
                <Building2 className="h-3 w-3 mr-1" />
                Organization
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Left: File Upload & Preview */}
            <div className="w-1/3 flex flex-col gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {selectedFiles.length === 0 ? (
                <div
                  className={cn(
                    'flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[200px]',
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
                    Multiple files supported
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">
                      {selectedFiles.length} file(s) selected
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearFiles}
                      className="h-6 px-2 text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="grid grid-cols-2 gap-2">
                      {previewUrls.map((url, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden bg-white/5"
                        >
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-5 w-5"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <div
                        className="aspect-square border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-white/40 hover:bg-white/5"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus className="h-6 w-6 text-white/40" />
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Folder Selection */}
              {folders.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <FolderOpen className="h-4 w-4" />
                    Folder
                  </Label>
                  <Select
                    value={selectedFolderId || ''}
                    onValueChange={(v) => setSelectedFolderId(v || null)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20">
                      <SelectValue placeholder="No folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No folder</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Organization Selection */}
              {organizations.length > 0 && !organizationId && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4" />
                    Upload as
                  </Label>
                  <Select
                    value={selectedOrgId || 'personal'}
                    onValueChange={(v) => setSelectedOrgId(v === 'personal' ? null : v)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Account</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.display_name || org.organization_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Right: Entity Tagging */}
            <ScrollArea className="w-2/3 pr-4">
              <div className="space-y-5">
                {/* Selected Entities */}
                {selectedEntities.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Tagged Entities</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntities.map((entity) => (
                        <Badge
                          key={`${entity.type}-${entity.id}`}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {getEntityIcon(entity.type)}
                          <span className="max-w-[120px] truncate">{entity.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 ml-1 hover:bg-white/20"
                            onClick={() => removeEntity(entity.id, entity.type)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Event
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchEvent}
                      onChange={(e) => setSearchEvent(e.target.value)}
                      placeholder="Search events..."
                      className="pl-10 bg-white/10 border-white/20"
                    />
                  </div>
                  {searchEvent.trim() && (
                    <ScrollArea className="h-28 border border-white/10 rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredEvents.map((event) => (
                          <button
                            key={event.id}
                            className="w-full flex items-center gap-3 p-2 rounded text-left transition-colors hover:bg-white/10"
                            onClick={() => {
                              addEntity({
                                id: event.id,
                                name: event.name,
                                type: 'event',
                                role: 'featured',
                              });
                              setSearchEvent('');
                            }}
                          >
                            <Calendar className="h-4 w-4 text-white/40 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{event.name}</p>
                              <p className="text-xs text-white/50">
                                {formatDate(event.event_date)}
                                {event.venue_name && ` @ ${event.venue_name}`}
                              </p>
                            </div>
                          </button>
                        ))}
                        {filteredEvents.length === 0 && (
                          <p className="text-sm text-white/50 text-center py-2">
                            No events found
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Venue Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    Venue
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchVenue}
                      onChange={(e) => setSearchVenue(e.target.value)}
                      placeholder="Search venues..."
                      className="pl-10 bg-white/10 border-white/20"
                    />
                  </div>
                  {searchVenue.trim() && (
                    <ScrollArea className="h-28 border border-white/10 rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredVenues.map((venue) => (
                          <button
                            key={venue.id}
                            className="w-full flex items-center gap-3 p-2 rounded text-left transition-colors hover:bg-white/10"
                            onClick={() => {
                              addEntity({
                                id: venue.id,
                                name: venue.name,
                                type: 'venue',
                                role: 'venue',
                              });
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
                        {filteredVenues.length === 0 && (
                          <p className="text-sm text-white/50 text-center py-2">
                            No venues found
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Photographer Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Camera className="h-4 w-4" />
                    Photographer
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchPhotographer}
                      onChange={(e) => setSearchPhotographer(e.target.value)}
                      placeholder="Search photographers..."
                      className="pl-10 bg-white/10 border-white/20"
                    />
                  </div>
                  {searchPhotographer.trim() && (
                    <ScrollArea className="h-28 border border-white/10 rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredPhotographers.map((photographer) => (
                          <button
                            key={photographer.id}
                            className="w-full flex items-center gap-3 p-2 rounded text-left transition-colors hover:bg-white/10"
                            onClick={() => {
                              addEntity({
                                id: photographer.id,
                                name: photographer.stage_name,
                                type: 'photographer',
                                role: 'photographer',
                              });
                              setSearchPhotographer('');
                            }}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={photographer.primary_headshot_url || ''} />
                              <AvatarFallback>
                                <Camera className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm truncate">
                              {photographer.stage_name}
                            </span>
                          </button>
                        ))}
                        {filteredPhotographers.length === 0 && (
                          <p className="text-sm text-white/50 text-center py-2">
                            No photographers found
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Comedians Selection (Multi) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Mic className="h-4 w-4" />
                    Tag Comedians
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={searchComedian}
                      onChange={(e) => setSearchComedian(e.target.value)}
                      placeholder="Search comedians..."
                      className="pl-10 bg-white/10 border-white/20"
                    />
                  </div>
                  {searchComedian.trim() && (
                    <ScrollArea className="h-28 border border-white/10 rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredComedians.map((comedian) => {
                          const isSelected = selectedEntities.some(
                            (e) => e.id === comedian.id && e.type === 'comedian'
                          );
                          return (
                            <button
                              key={comedian.id}
                              className={cn(
                                'w-full flex items-center gap-3 p-2 rounded text-left transition-colors',
                                isSelected
                                  ? 'bg-blue-500/30 border border-blue-500/50'
                                  : 'hover:bg-white/10'
                              )}
                              onClick={() => {
                                if (isSelected) {
                                  removeEntity(comedian.id, 'comedian');
                                } else {
                                  addEntity({
                                    id: comedian.id,
                                    name: comedian.stage_name,
                                    type: 'comedian',
                                    role: 'performer',
                                  });
                                }
                              }}
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={comedian.primary_headshot_url || ''} />
                                <AvatarFallback>
                                  <Mic className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm truncate">
                                {comedian.stage_name}
                              </span>
                              {isSelected && (
                                <Badge className="ml-auto" variant="secondary">
                                  Selected
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                        {filteredComedians.length === 0 && (
                          <p className="text-sm text-white/50 text-center py-2">
                            No comedians found
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-white/10 flex-shrink-0">
          <p className="text-xs text-white/50">
            {selectedFiles.length > 0 && (
              <>
                {selectedFiles.length} file(s)
                {selectedEntities.length > 0 && ` → ${selectedEntities.length} entities`}
              </>
            )}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0 || isLoading}
            >
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Upload className="h-4 w-4 mr-2" />
              Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MediaUploadDialog;
