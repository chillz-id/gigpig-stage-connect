/**
 * UserPhotoGallery Component
 *
 * Shows the user's directory photos with ability to:
 * - Upload photos with metadata (event/venue/photographer/date)
 * - Edit metadata on existing photos
 * - View photo details including linked events and people
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Image as ImageIcon,
  MoreVertical,
  Calendar,
  MapPin,
  Camera,
  Users,
  Loader2,
  X,
  Edit,
  Info,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  FolderPlus,
  Trash2,
  CheckSquare,
  Square,
  Wand2,
  Download,
  User,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { directoryService } from '@/services/directory';
import { supabase } from '@/integrations/supabase/client';
import type { DirectoryProfile, DirectoryMedia, DirectoryMediaEvent, DirectoryMediaProfile } from '@/types/directory';
import { AddToAlbumDialog, AlbumCreateDialog } from '@/components/media-library/albums';
import { BulkEditMetadataDialog } from '@/components/media-library/BulkEditMetadataDialog';
import { ImageEditorModal } from '@/components/ui/ImageEditorModal';

interface PhotoMetadata {
  event?: {
    id: string;
    name: string;
  };
  venue?: {
    id?: string;
    name: string;
  };
  photographer?: {
    id: string;
    name: string;
  };
  sessionDate?: string;
  taggedProfiles?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

interface PhotoWithMetadata extends DirectoryMedia {
  metadata?: PhotoMetadata;
}

export function UserPhotoGallery() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [directoryProfile, setDirectoryProfile] = useState<DirectoryProfile | null>(null);
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Upload dialog - supports multiple files
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Metadata edit dialog
  const [editingPhoto, setEditingPhoto] = useState<PhotoWithMetadata | null>(null);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  // Photo detail dialog
  const [viewingPhoto, setViewingPhoto] = useState<PhotoWithMetadata | null>(null);

  // Add to album dialog
  const [addToAlbumMediaIds, setAddToAlbumMediaIds] = useState<string[]>([]);
  const [showAddToAlbum, setShowAddToAlbum] = useState(false);

  // Create album dialog
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);

  // Selection mode state
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Bulk edit metadata dialog
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [bulkEditMediaIds, setBulkEditMediaIds] = useState<string[]>([]);

  // Image editor dialog
  const [imageEditorPhoto, setImageEditorPhoto] = useState<PhotoWithMetadata | null>(null);
  const [isSavingEditedImage, setIsSavingEditedImage] = useState(false);

  // Metadata form state (shared between upload and edit)
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [manualVenueName, setManualVenueName] = useState('');
  const [selectedPhotographerId, setSelectedPhotographerId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [selectedTaggedProfiles, setSelectedTaggedProfiles] = useState<Array<{ id: string; name: string }>>([]);

  // Search options
  const [events, setEvents] = useState<Array<{ id: string; name: string; start_time?: string }>>([]);
  const [venues, setVenues] = useState<Array<{ id: string; stage_name: string }>>([]);
  const [photographers, setPhotographers] = useState<Array<{ id: string; stage_name: string }>>([]);
  const [comedians, setComedians] = useState<Array<{ id: string; stage_name: string }>>([]);
  const [organizations, setOrganizations] = useState<Array<{ id: string; stage_name: string }>>([]);

  // Load user's directory profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await directoryService.getDirectoryProfileByUserId(user.id);
        setDirectoryProfile(profile);
        // If no profile found, stop loading (user has no photos to show)
        if (!profile) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load directory profile:', error);
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  // Load photos from media_files table (works for any authenticated user)
  const loadPhotos = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load from media_files table (personal uploads)
      const { data: mediaFiles, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('file_type', 'image')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to PhotoWithMetadata format
      const photosWithMetadata: PhotoWithMetadata[] = (mediaFiles || []).map((file) => ({
        id: file.id,
        directory_profile_id: null,
        storage_path: file.storage_path,
        public_url: file.public_url,
        file_name: file.file_name,
        file_type: file.file_type,
        file_size: file.file_size,
        image_width: file.image_width,
        image_height: file.image_height,
        aspect_ratio: file.aspect_ratio ? Number(file.aspect_ratio) : null,
        media_type: 'photo' as const,
        is_headshot: file.is_headshot || false,
        is_primary: file.is_primary_headshot || false,
        display_order: 0,
        tags: file.tags || [],
        alt_text: null,
        external_url: file.external_url,
        external_type: file.external_type as any,
        external_id: file.external_id,
        import_batch_id: null,
        source_filename: null,
        title: file.file_name,
        uploaded_by: user.id,
        event_date: null,
        photographer_credit: null,
        created_at: file.created_at,
        updated_at: file.updated_at,
        metadata: {},
      }));

      setPhotos(photosWithMetadata);
    } catch (error) {
      console.error('Failed to load photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load photos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user?.id) {
      loadPhotos();
    }
  }, [user?.id, loadPhotos]);

  // Load search options
  useEffect(() => {
    const loadOptions = async () => {
      // Load events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, name, start_time')
        .order('start_time', { ascending: false })
        .limit(100);
      if (eventsData) setEvents(eventsData);

      // Load venues
      const venueProfiles = await directoryService.searchProfiles('', { profileType: 'venue' });
      setVenues(Array.isArray(venueProfiles) ? venueProfiles : []);

      // Load photographers
      const photographerProfiles = await directoryService.searchProfiles('', { profileType: 'photographer' });
      setPhotographers(Array.isArray(photographerProfiles) ? photographerProfiles : []);

      // Load comedians for tagging
      const comedianProfiles = await directoryService.searchProfiles('', { profileType: 'comedian' });
      setComedians(Array.isArray(comedianProfiles) ? comedianProfiles : []);

      // Load organizations from organization_profiles table
      const { data: orgData } = await supabase
        .from('organization_profiles')
        .select('id, organization_name')
        .order('organization_name')
        .limit(100);
      if (orgData) {
        setOrganizations(orgData.map(org => ({ id: org.id, stage_name: org.organization_name })));
      }
    };

    loadOptions();
  }, []);

  // Handle file selection - supports multiple files
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploadFiles(fileArray);

    // Set default title from first filename (without extension)
    const firstFile = fileArray[0];
    if (firstFile) {
      const defaultTitle = firstFile.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(defaultTitle);
    }

    // Create previews for all files
    const previews: string[] = [];
    let loadedCount = 0;

    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        previews[index] = reader.result as string;
        loadedCount++;
        if (loadedCount === fileArray.length) {
          setUploadPreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setShowUploadDialog(true);
  };

  // Remove a file from upload queue
  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setUploadPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Reset form
  const resetForm = () => {
    setSelectedEventId('');
    setSelectedVenueId('');
    setManualVenueName('');
    setSelectedPhotographerId('');
    setSessionDate('');
    setUploadTitle('');
    setSelectedTaggedProfiles([]);
    setUploadFiles([]);
    setUploadPreviews([]);
    setUploadProgress({ current: 0, total: 0 });
  };

  // Handle upload - supports batch upload with progress
  // Works for any authenticated user - uploads to media_files table
  const handleUpload = async () => {
    console.log('handleUpload called', { userId: user?.id, uploadFilesLength: uploadFiles.length });

    if (!user?.id || uploadFiles.length === 0) {
      console.log('Early return: missing user or files', { userId: user?.id, uploadFilesLength: uploadFiles.length });
      return;
    }

    console.log('Starting upload...');
    setIsUploading(true);
    setUploadProgress({ current: 0, total: uploadFiles.length });

    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        if (!file) continue;

        setUploadProgress({ current: i + 1, total: uploadFiles.length });

        try {
          // Create safe filename
          const timestamp = Date.now();
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `${user.id}/${timestamp}-${safeFileName}`;

          console.log('Uploading file:', file.name, 'to path:', storagePath);

          // Upload to media-library bucket
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('media-library')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Storage upload failed: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('media-library')
            .getPublicUrl(storagePath);

          // Create record in media_files table
          const { data: mediaRecord, error: insertError } = await supabase
            .from('media_files')
            .insert({
              user_id: user.id,
              storage_path: storagePath,
              public_url: urlData?.publicUrl || null,
              file_name: uploadTitle || file.name,
              file_type: 'image',
              file_size: file.size,
              tags: [],
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(`Database insert failed: ${insertError.message}`);
          }

          console.log('Upload successful:', mediaRecord);
          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failCount++;
        }
      }

      // Show summary toast
      if (failCount === 0) {
        toast({
          title: successCount === 1 ? 'Photo Uploaded' : 'Photos Uploaded',
          description: successCount === 1
            ? 'Your photo has been uploaded successfully'
            : `${successCount} photos uploaded successfully`,
        });
      } else {
        toast({
          title: 'Upload Complete',
          description: `${successCount} uploaded, ${failCount} failed`,
          variant: failCount > 0 ? 'destructive' : 'default',
        });
      }

      setShowUploadDialog(false);
      resetForm();
      loadPhotos();
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

  // Open edit metadata dialog
  const openEditDialog = (photo: PhotoWithMetadata) => {
    setEditingPhoto(photo);

    // Pre-fill form with existing metadata
    setUploadTitle(photo.title || photo.file_name || '');
    setSelectedEventId(photo.metadata?.event?.id || '');
    setSelectedVenueId(photo.metadata?.venue?.id || '');
    setManualVenueName(photo.metadata?.venue?.id ? '' : photo.metadata?.venue?.name || '');
    setSelectedPhotographerId(photo.metadata?.photographer?.id || '');
    setSessionDate(photo.metadata?.sessionDate || '');
  };

  // Handle save metadata
  const handleSaveMetadata = async () => {
    if (!editingPhoto) return;

    setIsSavingMetadata(true);
    try {
      // Update the media_files record with new title
      if (uploadTitle && uploadTitle !== editingPhoto.file_name) {
        await supabase
          .from('media_files')
          .update({ file_name: uploadTitle })
          .eq('id', editingPhoto.id);
      }

      // Remove existing event/venue links
      await supabase
        .from('directory_media_events')
        .delete()
        .eq('media_id', editingPhoto.id);

      // Add new event/venue link
      if (selectedEventId || selectedVenueId || manualVenueName || sessionDate) {
        await directoryService.addMediaEvent(editingPhoto.id, {
          eventId: selectedEventId || undefined,
          venueId: selectedVenueId || undefined,
          venueName: !selectedVenueId && manualVenueName ? manualVenueName : undefined,
          sessionDate: sessionDate || undefined,
        });
      }

      // Handle photographer
      // First remove existing photographer link
      await supabase
        .from('directory_media_profiles')
        .delete()
        .eq('media_id', editingPhoto.id)
        .eq('role', 'photographer');

      // Add new photographer if selected
      if (selectedPhotographerId) {
        await directoryService.addMediaProfile({
          media_id: editingPhoto.id,
          profile_id: selectedPhotographerId,
          role: 'photographer',
          is_primary_subject: false,
          approval_status: 'approved',
        });
      }

      toast({
        title: 'Metadata Updated',
        description: 'Photo metadata has been updated',
      });

      setEditingPhoto(null);
      resetForm();
      loadPhotos();
    } catch (error) {
      console.error('Failed to save metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to update metadata',
        variant: 'destructive',
      });
    } finally {
      setIsSavingMetadata(false);
    }
  };

  // Get photo URL (works for both media_files and directory_media)
  const getPhotoUrl = (photo: DirectoryMedia) => {
    if (photo.public_url) return photo.public_url;
    // Detect bucket from storage_path or directory_profile_id
    // Photos imported for directory profiles use directory-media bucket
    // User uploads use media-library bucket
    const bucket = photo.directory_profile_id ? 'directory-media' : 'media-library';
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${photo.storage_path}`;
  };

  // Handle saving edited image from image editor
  const handleSaveEditedImage = async (imageDataUrl: string, blob?: Blob) => {
    if (!imageEditorPhoto || !user?.id || !blob) {
      toast({
        title: 'Error',
        description: 'Failed to save edited image',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingEditedImage(true);
    try {
      // Create new storage path for edited image
      const timestamp = Date.now();
      const originalName = imageEditorPhoto.file_name || 'edited';
      const extension = imageEditorPhoto.file_type?.includes('png') ? 'png' : 'jpg';
      const newStoragePath = `${user.id}/${timestamp}-${originalName.replace(/\.[^/.]+$/, '')}-edited.${extension}`;

      // Upload the edited image
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(newStoragePath, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get new public URL
      const { data: urlData } = supabase.storage
        .from('media-library')
        .getPublicUrl(newStoragePath);

      // Delete old image from storage (if different path)
      if (imageEditorPhoto.storage_path && imageEditorPhoto.storage_path !== newStoragePath) {
        await supabase.storage.from('media-library').remove([imageEditorPhoto.storage_path]);
      }

      // Update the database record
      const { error: updateError } = await supabase
        .from('media_files')
        .update({
          storage_path: newStoragePath,
          public_url: urlData?.publicUrl || null,
          file_size: blob.size,
        })
        .eq('id', imageEditorPhoto.id);

      if (updateError) throw updateError;

      toast({
        title: 'Image Saved',
        description: 'Your edited image has been saved',
      });

      setImageEditorPhoto(null);
      loadPhotos();
    } catch (error) {
      console.error('Failed to save edited image:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save the edited image',
        variant: 'destructive',
      });
    } finally {
      setIsSavingEditedImage(false);
    }
  };

  // Toggle photo selection
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  // Select all photos
  const selectAllPhotos = () => {
    setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPhotoIds(new Set());
    setIsSelectionMode(false);
  };

  // Handle bulk add to album
  const handleBulkAddToAlbum = () => {
    setAddToAlbumMediaIds(Array.from(selectedPhotoIds));
    setShowAddToAlbum(true);
  };

  // Handle bulk edit metadata
  const handleBulkEditMetadata = () => {
    setBulkEditMediaIds(Array.from(selectedPhotoIds));
    setShowBulkEditDialog(true);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedPhotoIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPhotoIds.size} photo${selectedPhotoIds.size > 1 ? 's' : ''}? This cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeletingBulk(true);
    let deleteCount = 0;
    let failCount = 0;

    try {
      for (const photoId of selectedPhotoIds) {
        try {
          // Find the photo to get storage path
          const photo = photos.find((p) => p.id === photoId);
          if (!photo) continue;

          // Delete from storage
          if (photo.storage_path) {
            await supabase.storage.from('media-library').remove([photo.storage_path]);
          }

          // Delete from database
          const { error } = await supabase
            .from('media_files')
            .delete()
            .eq('id', photoId);

          if (error) throw error;
          deleteCount++;
        } catch (error) {
          console.error(`Failed to delete photo ${photoId}:`, error);
          failCount++;
        }
      }

      toast({
        title: 'Photos Deleted',
        description: failCount > 0
          ? `Deleted ${deleteCount} photos. ${failCount} failed.`
          : `Successfully deleted ${deleteCount} photo${deleteCount > 1 ? 's' : ''}.`,
        variant: failCount > 0 ? 'destructive' : 'default',
      });

      clearSelection();
      loadPhotos();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete photos',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Set photo as profile picture
  const handleSetProfilePic = async (photo: PhotoWithMetadata) => {
    try {
      const url = getPhotoUrl(photo);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile Picture Updated',
        description: 'Your profile picture has been set.',
      });
    } catch (error) {
      console.error('Failed to set profile picture:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to set profile picture',
        variant: 'destructive',
      });
    }
  };

  // Set photo as banner
  const handleSetBanner = async (photo: PhotoWithMetadata) => {
    try {
      const url = getPhotoUrl(photo);
      const { error } = await supabase
        .from('profiles')
        .update({ banner_url: url })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Banner Updated',
        description: 'Your banner image has been set.',
      });
    } catch (error) {
      console.error('Failed to set banner:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to set banner image',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Please sign in to view your photos
      </div>
    );
  }

  // Don't block on directory profile - any authenticated user can use media library

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">My Photos</h2>
          <Badge variant="secondary">{photos.length} photos</Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Selection mode toggle */}
          {photos.length > 0 && (
            <Button
              variant={isSelectionMode ? 'secondary' : 'secondary'}
              size="sm"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) {
                  setSelectedPhotoIds(new Set());
                }
              }}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {isSelectionMode ? 'Cancel' : 'Select'}
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={loadPhotos} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>

          <Button variant="secondary" onClick={() => setShowCreateAlbum(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Album
          </Button>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
            <p>No photos yet</p>
            <Button variant="secondary" className="mt-4" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload your first photos
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <Card
                key={photo.id}
                className={cn(
                  'group relative overflow-hidden transition-all',
                  isSelectionMode && selectedPhotoIds.has(photo.id) && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                <div
                  className="aspect-square cursor-pointer"
                  onClick={() => {
                    if (isSelectionMode) {
                      togglePhotoSelection(photo.id);
                    } else {
                      setViewingPhoto(photo);
                    }
                  }}
                >
                  <img
                    src={getPhotoUrl(photo)}
                    alt={photo.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Selection checkbox */}
                {isSelectionMode && (
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePhotoSelection(photo.id);
                    }}
                  >
                    <div
                      className={cn(
                        'h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors',
                        selectedPhotoIds.has(photo.id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-white/90 border-gray-400 hover:border-primary'
                      )}
                    >
                      {selectedPhotoIds.has(photo.id) && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10.28 2.28L4 8.56 1.72 6.28a1 1 0 00-1.44 1.44l3 3a1 1 0 001.44 0l7-7a1 1 0 00-1.44-1.44z" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata indicators */}
                <div className="absolute bottom-1 left-1 flex gap-1">
                  {photo.metadata?.event && (
                    <Badge variant="secondary" className="text-[10px] px-1 bg-black/70 text-white">
                      <Calendar className="h-2 w-2 mr-0.5" />
                    </Badge>
                  )}
                  {photo.metadata?.venue && (
                    <Badge variant="secondary" className="text-[10px] px-1 bg-black/70 text-white">
                      <MapPin className="h-2 w-2 mr-0.5" />
                    </Badge>
                  )}
                  {photo.metadata?.photographer && (
                    <Badge variant="secondary" className="text-[10px] px-1 bg-black/70 text-white">
                      <Camera className="h-2 w-2 mr-0.5" />
                    </Badge>
                  )}
                  {photo.metadata?.taggedProfiles && photo.metadata.taggedProfiles.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 bg-black/70 text-white">
                      <Users className="h-2 w-2 mr-0.5" />
                      {photo.metadata.taggedProfiles.length}
                    </Badge>
                  )}
                </div>

                {/* Actions - hide in selection mode */}
                {!isSelectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/70 text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingPhoto(photo)}>
                        <Info className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const url = getPhotoUrl(photo);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = photo.file_name || 'photo.jpg';
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setImageEditorPhoto(photo)}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Edit Photo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(photo)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Metadata
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setAddToAlbumMediaIds([photo.id]);
                        setShowAddToAlbum(true);
                      }}>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Add to Album
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSetProfilePic(photo)}>
                        <User className="h-4 w-4 mr-2" />
                        Set as Profile Pic
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSetBanner(photo)}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Set as Banner
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={async () => {
                          const confirmed = window.confirm('Are you sure you want to delete this photo? This cannot be undone.');
                          if (!confirmed) return;
                          try {
                            if (photo.storage_path) {
                              await supabase.storage.from('media-library').remove([photo.storage_path]);
                            }
                            await supabase.from('media_files').delete().eq('id', photo.id);
                            toast({ title: 'Photo Deleted', description: 'The photo has been deleted.' });
                            loadPhotos();
                          } catch (error) {
                            console.error('Delete failed:', error);
                            toast({ title: 'Delete Failed', description: 'Failed to delete photo', variant: 'destructive' });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </Card>
            ))}
          </div>
        ) : (
          /* List View - Table Layout */
          <div className="space-y-1">
            {/* Header row */}
            <div className={cn(
              'grid gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b',
              isSelectionMode
                ? 'grid-cols-[24px_auto_1fr_80px_100px_100px_40px]'
                : 'grid-cols-[auto_1fr_80px_100px_100px_40px]'
            )}>
              {isSelectionMode && <div />}
              <div className="w-12" />
              <div>Name</div>
              <div>Size</div>
              <div>Dimensions</div>
              <div>Uploaded</div>
              <div />
            </div>

            {/* Photo rows */}
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={cn(
                  'group grid gap-4 items-center px-3 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors',
                  isSelectionMode
                    ? 'grid-cols-[24px_auto_1fr_80px_100px_100px_40px]'
                    : 'grid-cols-[auto_1fr_80px_100px_100px_40px]',
                  isSelectionMode && selectedPhotoIds.has(photo.id) && 'bg-primary/10 ring-1 ring-primary'
                )}
                onClick={() => {
                  if (isSelectionMode) {
                    togglePhotoSelection(photo.id);
                  } else {
                    setViewingPhoto(photo);
                  }
                }}
              >
                {/* Selection checkbox */}
                {isSelectionMode && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePhotoSelection(photo.id);
                    }}
                  >
                    <div
                      className={cn(
                        'h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors',
                        selectedPhotoIds.has(photo.id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-white border-gray-400 hover:border-primary'
                      )}
                    >
                      {selectedPhotoIds.has(photo.id) && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10.28 2.28L4 8.56 1.72 6.28a1 1 0 00-1.44 1.44l3 3a1 1 0 001.44 0l7-7a1 1 0 00-1.44-1.44z" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                  <img
                    src={getPhotoUrl(photo)}
                    alt={photo.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* File name */}
                <div className="min-w-0">
                  <p className="font-medium truncate" title={photo.file_name}>{photo.file_name}</p>
                  {/* Metadata badges below name */}
                  {(photo.metadata?.event || photo.metadata?.venue || photo.metadata?.photographer) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {photo.metadata?.event && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          <Calendar className="h-2.5 w-2.5 mr-0.5" />
                          {photo.metadata.event.name}
                        </Badge>
                      )}
                      {photo.metadata?.venue && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          <MapPin className="h-2.5 w-2.5 mr-0.5" />
                          {photo.metadata.venue.name}
                        </Badge>
                      )}
                      {photo.metadata?.photographer && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          <Camera className="h-2.5 w-2.5 mr-0.5" />
                          {photo.metadata.photographer.name}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Size */}
                <div className="text-sm text-muted-foreground">
                  {photo.file_size ? `${(photo.file_size / 1024).toFixed(0)} KB` : '—'}
                </div>

                {/* Dimensions */}
                <div className="text-sm text-muted-foreground">
                  {photo.image_width && photo.image_height
                    ? `${photo.image_width}×${photo.image_height}`
                    : '—'}
                </div>

                {/* Date */}
                <div className="text-sm text-muted-foreground">
                  {new Date(photo.created_at).toLocaleDateString()}
                </div>

                {/* Action menu */}
                {!isSelectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingPhoto(photo)}>
                        <Info className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const url = getPhotoUrl(photo);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = photo.file_name || 'photo.jpg';
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setImageEditorPhoto(photo)}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Edit Photo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(photo)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Metadata
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setAddToAlbumMediaIds([photo.id]);
                        setShowAddToAlbum(true);
                      }}>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Add to Album
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSetProfilePic(photo)}>
                        <User className="h-4 w-4 mr-2" />
                        Set as Profile Pic
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSetBanner(photo)}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Set as Banner
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={async () => {
                          const confirmed = window.confirm('Are you sure you want to delete this photo? This cannot be undone.');
                          if (!confirmed) return;
                          try {
                            if (photo.storage_path) {
                              await supabase.storage.from('media-library').remove([photo.storage_path]);
                            }
                            await supabase.from('media_files').delete().eq('id', photo.id);
                            toast({ title: 'Photo Deleted', description: 'The photo has been deleted.' });
                            loadPhotos();
                          } catch (error) {
                            console.error('Delete failed:', error);
                            toast({ title: 'Delete Failed', description: 'Failed to delete photo', variant: 'destructive' });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedPhotoIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 z-50">
          <span className="text-sm font-medium px-2">
            {selectedPhotoIds.size} selected
          </span>
          <Separator orientation="vertical" className="h-6" />
          <Button
            size="sm"
            variant="ghost"
            onClick={selectAllPhotos}
            disabled={selectedPhotoIds.size === photos.length}
          >
            Select All
          </Button>
          <Button size="sm" variant="secondary" onClick={handleBulkAddToAlbum}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Add to Album
          </Button>
          <Button size="sm" variant="secondary" onClick={handleBulkEditMetadata}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              const selectedPhotos = photos.filter(p => selectedPhotoIds.has(p.id));
              for (const photo of selectedPhotos) {
                const url = getPhotoUrl(photo);
                const link = document.createElement('a');
                link.href = url;
                link.download = photo.file_name || `photo-${photo.id}.jpg`;
                link.click();
                // Stagger downloads to avoid overwhelming the browser
                await new Promise(r => setTimeout(r, 300));
              }
              toast({ title: 'Downloads Started', description: `Downloading ${selectedPhotos.length} photos.` });
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={isDeletingBulk}
          >
            {isDeletingBulk ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        if (!open && !isUploading) {
          setShowUploadDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {uploadFiles.length === 1 ? 'Upload Photo' : `Upload ${uploadFiles.length} Photos`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview Grid */}
            {uploadPreviews.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Selected Photos</Label>
                  <span className="text-sm text-muted-foreground">
                    {uploadFiles.length} {uploadFiles.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
                <ScrollArea className="max-h-48">
                  <div className="grid grid-cols-4 gap-2 p-1">
                    {uploadPreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-square rounded-md overflow-hidden bg-muted">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {!isUploading && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeUploadFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        {/* Show checkmark for completed uploads during batch */}
                        {isUploading && uploadProgress.current > index + 1 && (
                          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                        {/* Show spinner for current upload */}
                        {isUploading && uploadProgress.current === index + 1 && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Progress indicator */}
            {isUploading && uploadProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress.current} of {uploadProgress.total}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Metadata form */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {uploadFiles.length > 1
                  ? 'Metadata below will be applied to all selected photos.'
                  : 'Add optional metadata to your photo.'}
              </p>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Enter a title for the photo(s)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Defaults to the filename. You can change it to something more descriptive.
                </p>
              </div>

              {/* Event */}
              <div className="space-y-2">
                <Label>Event (optional)</Label>
                <Select value={selectedEventId || '_none'} onValueChange={(val) => setSelectedEventId(val === '_none' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                        {event.start_time && (
                          <span className="text-muted-foreground ml-2">
                            {new Date(event.start_time).toLocaleDateString()}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <Label>Venue (optional)</Label>
                <Select value={selectedVenueId || '_none'} onValueChange={(val) => {
                  const actualVal = val === '_none' ? '' : val;
                  setSelectedVenueId(actualVal);
                  if (actualVal) setManualVenueName('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None / Enter manually</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.stage_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedVenueId && (
                  <Input
                    placeholder="Or type venue name..."
                    value={manualVenueName}
                    onChange={(e) => setManualVenueName(e.target.value)}
                  />
                )}
              </div>

              {/* Photographer */}
              <div className="space-y-2">
                <Label>Photographer Credit (optional)</Label>
                <Select value={selectedPhotographerId || '_none'} onValueChange={(val) => setSelectedPhotographerId(val === '_none' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a photographer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {photographers.map((photographer) => (
                      <SelectItem key={photographer.id} value={photographer.id}>
                        {photographer.stage_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date Taken (optional)</Label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>

              {/* Tag People */}
              <div className="space-y-2">
                <Label>Tag People (optional)</Label>
                <Select
                  value="_add"
                  onValueChange={(val) => {
                    if (val === '_add' || val === '_none') return;
                    // Check if already selected
                    if (selectedTaggedProfiles.some(p => p.id === val)) return;
                    // Find the profile
                    const comedian = comedians.find(c => c.id === val);
                    const org = organizations.find(o => o.id === val);
                    const profile = comedian || org;
                    if (profile) {
                      setSelectedTaggedProfiles(prev => [...prev, { id: profile.id, name: profile.stage_name }]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select comedians or organizations to tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_add">Select to add...</SelectItem>
                    {comedians.length > 0 && (
                      <>
                        <SelectItem value="_comedians_label" disabled className="font-semibold text-xs text-muted-foreground">
                          — Comedians —
                        </SelectItem>
                        {comedians.map((comedian) => (
                          <SelectItem
                            key={comedian.id}
                            value={comedian.id}
                            disabled={selectedTaggedProfiles.some(p => p.id === comedian.id)}
                          >
                            {comedian.stage_name}
                            {selectedTaggedProfiles.some(p => p.id === comedian.id) && ' ✓'}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {organizations.length > 0 && (
                      <>
                        <SelectItem value="_orgs_label" disabled className="font-semibold text-xs text-muted-foreground">
                          — Organizations —
                        </SelectItem>
                        {organizations.map((org) => (
                          <SelectItem
                            key={org.id}
                            value={org.id}
                            disabled={selectedTaggedProfiles.some(p => p.id === org.id)}
                          >
                            {org.stage_name}
                            {selectedTaggedProfiles.some(p => p.id === org.id) && ' ✓'}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {selectedTaggedProfiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTaggedProfiles.map((profile) => (
                      <Badge
                        key={profile.id}
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/20"
                        onClick={() => setSelectedTaggedProfiles(prev => prev.filter(p => p.id !== profile.id))}
                      >
                        {profile.name}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Tagged people will be notified and can approve the tag.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => {
              setShowUploadDialog(false);
              resetForm();
            }} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || uploadFiles.length === 0}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading {uploadProgress.current}/{uploadProgress.total}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {uploadFiles.length === 1 ? 'Photo' : `${uploadFiles.length} Photos`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Metadata Dialog */}
      <Dialog open={!!editingPhoto} onOpenChange={(open) => {
        if (!open) {
          setEditingPhoto(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Photo Metadata</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            {editingPhoto && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={getPhotoUrl(editingPhoto)}
                  alt={editingPhoto.file_name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <Separator />

            {/* Metadata form */}
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Photo title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </div>

              {/* Event */}
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={selectedEventId || '_none'} onValueChange={(val) => setSelectedEventId(val === '_none' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <Label>Venue</Label>
                <Select value={selectedVenueId || '_none'} onValueChange={(val) => {
                  const actualVal = val === '_none' ? '' : val;
                  setSelectedVenueId(actualVal);
                  if (actualVal) setManualVenueName('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None / Enter manually</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.stage_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedVenueId && (
                  <Input
                    placeholder="Or type venue name..."
                    value={manualVenueName}
                    onChange={(e) => setManualVenueName(e.target.value)}
                  />
                )}
              </div>

              {/* Photographer */}
              <div className="space-y-2">
                <Label>Photographer Credit</Label>
                <Select value={selectedPhotographerId || '_none'} onValueChange={(val) => setSelectedPhotographerId(val === '_none' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a photographer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {photographers.map((photographer) => (
                      <SelectItem key={photographer.id} value={photographer.id}>
                        {photographer.stage_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date Taken</Label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => {
              setEditingPhoto(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveMetadata} disabled={isSavingMetadata}>
              {isSavingMetadata && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Detail Dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={(open) => !open && setViewingPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewingPhoto?.file_name}</DialogTitle>
          </DialogHeader>

          {viewingPhoto && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={getPhotoUrl(viewingPhoto)}
                  alt={viewingPhoto.file_name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Photo Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Filename:</strong> {viewingPhoto.file_name}</p>
                    <p><strong>Uploaded:</strong> {new Date(viewingPhoto.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {viewingPhoto.metadata && Object.keys(viewingPhoto.metadata).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h4>
                      <div className="space-y-2">
                        {viewingPhoto.metadata.event && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{viewingPhoto.metadata.event.name}</span>
                          </div>
                        )}
                        {viewingPhoto.metadata.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{viewingPhoto.metadata.venue.name}</span>
                          </div>
                        )}
                        {viewingPhoto.metadata.photographer && (
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4 text-muted-foreground" />
                            <span>{viewingPhoto.metadata.photographer.name}</span>
                          </div>
                        )}
                        {viewingPhoto.metadata.sessionDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(viewingPhoto.metadata.sessionDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {viewingPhoto.metadata.taggedProfiles && viewingPhoto.metadata.taggedProfiles.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>Tagged People</span>
                            </div>
                            <div className="flex flex-wrap gap-1 ml-6">
                              {viewingPhoto.metadata.taggedProfiles.map((person) => (
                                <Badge key={person.id} variant="secondary">
                                  {person.name}
                                  <span className="text-muted-foreground ml-1">({person.role})</span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <Button onClick={() => {
                  setViewingPhoto(null);
                  openEditDialog(viewingPhoto);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Metadata
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Album Dialog */}
      {user?.id && (
        <AddToAlbumDialog
          open={showAddToAlbum}
          onOpenChange={setShowAddToAlbum}
          ownerId={user.id}
          ownerType="user"
          mediaIds={addToAlbumMediaIds}
          onSuccess={() => {
            setShowAddToAlbum(false);
            setAddToAlbumMediaIds([]);
            // Clear selection after bulk add
            if (isSelectionMode) {
              clearSelection();
            }
          }}
        />
      )}

      {/* Create Album Dialog */}
      {user?.id && (
        <AlbumCreateDialog
          open={showCreateAlbum}
          onOpenChange={setShowCreateAlbum}
          ownerId={user.id}
          ownerType="user"
          onSuccess={() => {
            setShowCreateAlbum(false);
            // Optionally refresh albums list if we had one
          }}
        />
      )}

      {/* Bulk Edit Metadata Dialog */}
      <BulkEditMetadataDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        mediaIds={bulkEditMediaIds}
        onSuccess={() => {
          setShowBulkEditDialog(false);
          setBulkEditMediaIds([]);
          clearSelection();
          loadPhotos();
        }}
      />

      {/* Image Editor Modal */}
      {imageEditorPhoto && (
        <ImageEditorModal
          isOpen={!!imageEditorPhoto}
          onClose={() => setImageEditorPhoto(null)}
          onSave={handleSaveEditedImage}
          imageUrl={getPhotoUrl(imageEditorPhoto)}
          title="Edit Photo"
          aspectRatio="free"
        />
      )}
    </div>
  );
}
