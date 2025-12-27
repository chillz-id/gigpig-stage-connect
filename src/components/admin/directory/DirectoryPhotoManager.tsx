/**
 * DirectoryPhotoManager Component
 *
 * Manage photos for a directory profile - view gallery, edit tags,
 * set primary headshot, delete photos.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  X,
  MoreVertical,
  Star,
  Trash2,
  Tag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Image as ImageIcon,
  Check,
  User,
  Users,
  Images,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { directoryService } from '@/services/directory';
import type { DirectoryProfile, DirectoryMedia } from '@/types/directory';
import { PhotoTagger } from './PhotoTagger';

interface DirectoryPhotoManagerProps {
  profile: DirectoryProfile;
  onClose: () => void;
}

export function DirectoryPhotoManager({
  profile,
  onClose,
}: DirectoryPhotoManagerProps) {
  const { theme } = useTheme();
  const { toast } = useToast();

  const [photos, setPhotos] = useState<DirectoryMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<DirectoryMedia | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DirectoryMedia | null>(null);
  const [taggingPhoto, setTaggingPhoto] = useState<DirectoryMedia | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tag editing state
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState('');

  const getDialogStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-purple-900/95 border-white/20 text-white';
    }
    return 'bg-gray-900 border-gray-700 text-gray-100';
  };

  // Load photos
  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const media = await directoryService.getMedia(profile.id);
      setPhotos(media);
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
  };

  useEffect(() => {
    loadPhotos();
  }, [profile.id]);

  // Get public URL for a photo
  const getPhotoUrl = (photo: DirectoryMedia) => {
    if (photo.public_url) return photo.public_url;
    // Fallback to constructing URL from storage path
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/directory-media/${photo.storage_path}`;
  };

  // Set primary headshot
  const handleSetPrimary = async (photo: DirectoryMedia) => {
    setIsSaving(true);
    try {
      await directoryService.setPrimaryHeadshot(profile.id, photo.id);
      toast({
        title: 'Primary Headshot Set',
        description: `${photo.file_name} is now the primary headshot and profile avatar`,
      });
      loadPhotos();
    } catch (error) {
      console.error('Failed to set primary:', error);
      toast({
        title: 'Error',
        description: 'Failed to set primary headshot',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle headshot status
  const handleToggleHeadshot = async (photo: DirectoryMedia) => {
    setIsSaving(true);
    try {
      await directoryService.updateMedia(photo.id, { is_headshot: !photo.is_headshot });
      toast({
        title: photo.is_headshot ? 'Moved to Gallery' : 'Marked as Headshot',
        description: `${photo.file_name} ${photo.is_headshot ? 'is now a gallery photo' : 'is now a headshot'}`,
      });
      loadPhotos();
    } catch (error) {
      console.error('Failed to toggle headshot:', error);
      toast({
        title: 'Error',
        description: 'Failed to update photo',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk mark as headshots
  const bulkMarkAsHeadshots = async (isHeadshot: boolean) => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);
    try {
      const updates = Array.from(selectedIds).map(id =>
        directoryService.updateMedia(id, { is_headshot: isHeadshot })
      );
      await Promise.all(updates);
      toast({
        title: isHeadshot ? 'Marked as Headshots' : 'Moved to Gallery',
        description: `${selectedIds.size} photos updated`,
      });
      setSelectedIds(new Set());
      loadPhotos();
    } catch (error) {
      console.error('Failed to bulk update:', error);
      toast({
        title: 'Error',
        description: 'Failed to update photos',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete photo
  const handleDelete = async (photo: DirectoryMedia) => {
    setIsSaving(true);
    try {
      await directoryService.deleteMedia(photo.id);
      toast({
        title: 'Photo Deleted',
        description: `${photo.file_name} has been removed`,
      });
      setDeleteConfirm(null);
      loadPhotos();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Start editing tags for a photo
  const startEditingTags = (photo: DirectoryMedia) => {
    setEditingTags(photo.id);
    setCurrentTags([...photo.tags]);
    setTagInput('');
  };

  // Add tag to current photo
  const addTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !currentTags.includes(newTag)) {
      setCurrentTags([...currentTags, newTag]);
    }
    setTagInput('');
  };

  // Remove tag from current photo
  const removeTag = (tag: string) => {
    setCurrentTags(currentTags.filter(t => t !== tag));
  };

  // Save tags
  const saveTags = async () => {
    if (!editingTags) return;
    setIsSaving(true);
    try {
      await directoryService.updateMedia(editingTags, { tags: currentTags });
      toast({
        title: 'Tags Updated',
        description: 'Photo tags have been saved',
      });
      setEditingTags(null);
      loadPhotos();
    } catch (error) {
      console.error('Failed to save tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to save tags',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk tag operations
  const addBulkTag = async () => {
    const newTag = bulkTagInput.trim().toLowerCase();
    if (!newTag || selectedIds.size === 0) return;

    setIsSaving(true);
    try {
      const updates = Array.from(selectedIds).map(async (id) => {
        const photo = photos.find(p => p.id === id);
        if (photo && !photo.tags.includes(newTag)) {
          await directoryService.updateMedia(id, {
            tags: [...photo.tags, newTag],
          });
        }
      });
      await Promise.all(updates);
      toast({
        title: 'Tags Added',
        description: `Added "${newTag}" to ${selectedIds.size} photos`,
      });
      setBulkTagInput('');
      loadPhotos();
    } catch (error) {
      console.error('Failed to add bulk tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tags',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle photo selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Select all
  const selectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map(p => p.id)));
    }
  };

  // Lightbox navigation
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === null) return;
    const newIndex = direction === 'prev'
      ? (lightboxIndex - 1 + photos.length) % photos.length
      : (lightboxIndex + 1) % photos.length;
    setLightboxIndex(newIndex);
  };

  return (
    <>
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className={cn("max-w-5xl max-h-[90vh] overflow-hidden flex flex-col", getDialogStyles())}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {profile.stage_name} - Photos ({photos.length})
            </DialogTitle>
          </DialogHeader>

          {/* Bulk actions toolbar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg flex-shrink-0">
              <span className="text-sm">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2 flex-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => bulkMarkAsHeadshots(true)}
                  disabled={isSaving}
                >
                  <User className="h-4 w-4 mr-1" />
                  Mark as Headshots
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => bulkMarkAsHeadshots(false)}
                  disabled={isSaving}
                >
                  <Images className="h-4 w-4 mr-1" />
                  Move to Gallery
                </Button>
                <div className="h-4 border-l border-white/20 mx-1" />
                <Input
                  value={bulkTagInput}
                  onChange={(e) => setBulkTagInput(e.target.value)}
                  placeholder="Add tag..."
                  className="max-w-[150px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  onKeyDown={(e) => e.key === 'Enter' && addBulkTag()}
                />
                <Button
                  size="sm"
                  onClick={addBulkTag}
                  disabled={!bulkTagInput.trim() || isSaving}
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Add Tag
                </Button>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Photo grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/50">
                <ImageIcon className="h-12 w-12 mb-4" />
                <p>No photos uploaded yet</p>
              </div>
            ) : (
              <>
                {/* Select all */}
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    checked={selectedIds.size === photos.length && photos.length > 0}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-sm text-white/60">Select all</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className={cn(
                        "group relative aspect-square rounded-lg overflow-hidden bg-white/5 border-2 transition-all",
                        selectedIds.has(photo.id)
                          ? "border-blue-500"
                          : "border-transparent hover:border-white/20"
                      )}
                    >
                      {/* Selection checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedIds.has(photo.id)}
                          onCheckedChange={() => toggleSelection(photo.id)}
                          className="bg-black/50"
                        />
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                        {photo.is_primary && (
                          <Badge className="bg-yellow-500 text-black">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                        {photo.is_headshot && !photo.is_primary && (
                          <Badge className="bg-blue-500 text-white">
                            <User className="h-3 w-3 mr-1" />
                            Headshot
                          </Badge>
                        )}
                      </div>

                      {/* Image - click to open lightbox */}
                      <img
                        src={getPhotoUrl(photo)}
                        alt={photo.file_name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setLightboxIndex(index)}
                        loading="lazy"
                      />

                      {/* Action menu - always visible in corner */}
                      <div className="absolute bottom-2 right-2 z-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white border-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!photo.is_primary && (
                              <DropdownMenuItem onClick={() => handleSetPrimary(photo)}>
                                <Star className="h-4 w-4 mr-2" />
                                Set as Profile Avatar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleToggleHeadshot(photo)}>
                              {photo.is_headshot ? (
                                <>
                                  <Images className="h-4 w-4 mr-2" />
                                  Move to Gallery
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 mr-2" />
                                  Mark as Headshot
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => startEditingTags(photo)}>
                              <Tag className="h-4 w-4 mr-2" />
                              Edit Tags
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTaggingPhoto(photo)}>
                              <Users className="h-4 w-4 mr-2" />
                              Tag People
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => setDeleteConfirm(photo)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag editor dialog */}
      {editingTags && (
        <Dialog open onOpenChange={() => setEditingTags(null)}>
          <DialogContent className={cn("max-w-md", getDialogStyles())}>
            <DialogHeader>
              <DialogTitle>Edit Tags</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {currentTags.length === 0 && (
                  <span className="text-white/50 text-sm">No tags</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="secondary">
                  Add
                </Button>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button variant="ghost" onClick={() => setEditingTags(null)}>
                  Cancel
                </Button>
                <Button onClick={saveTags} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Tags
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <Dialog open onOpenChange={() => setLightboxIndex(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:hidden">
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              {/* Close button */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setLightboxIndex(null)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={() => navigateLightbox('prev')}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={() => navigateLightbox('next')}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              {/* Image */}
              <img
                src={getPhotoUrl(photos[lightboxIndex])}
                alt={photos[lightboxIndex].file_name}
                className="max-w-full max-h-full object-contain"
              />

              {/* Info bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="font-medium">{photos[lightboxIndex].file_name}</p>
                    <div className="flex gap-1 mt-1">
                      {photos[lightboxIndex].tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-white/60">
                    {lightboxIndex + 1} / {photos.length}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteConfirm?.file_name}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo Tagger */}
      {taggingPhoto && (
        <PhotoTagger
          media={taggingPhoto}
          onClose={() => setTaggingPhoto(null)}
          onSaved={loadPhotos}
        />
      )}
    </>
  );
}
