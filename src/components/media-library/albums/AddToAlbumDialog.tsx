/**
 * AddToAlbumDialog Component
 *
 * Dialog to add selected photos to an album.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, FolderOpen, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { albumService, type AlbumWithCover, type AlbumOwnerType } from '@/services/media/album-service';

interface AddToAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
  ownerType: AlbumOwnerType;
  mediaIds: string[];
  onSuccess?: () => void;
}

export function AddToAlbumDialog({
  open,
  onOpenChange,
  ownerId,
  ownerType,
  mediaIds,
  onSuccess,
}: AddToAlbumDialogProps) {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<AlbumWithCover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // New album creation
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadAlbums = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await albumService.getAlbums(ownerId, ownerType);
      setAlbums(data);
    } catch (error) {
      console.error('Failed to load albums:', error);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, ownerType]);

  useEffect(() => {
    if (open) {
      loadAlbums();
      setSelectedAlbumId(null);
      setShowCreateNew(false);
      setNewAlbumName('');
    }
  }, [open, loadAlbums]);

  const handleCreateAndAdd = async () => {
    if (!newAlbumName.trim()) return;

    setIsCreating(true);
    try {
      const album = await albumService.createAlbum({
        ownerId,
        ownerType,
        name: newAlbumName.trim(),
      });

      await albumService.addPhotosToAlbum(album.id, mediaIds);

      toast({
        title: 'Album Created',
        description: `${mediaIds.length} ${mediaIds.length === 1 ? 'photo' : 'photos'} added to "${album.name}"`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create album:', error);
      toast({
        title: 'Error',
        description: 'Failed to create album',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToExisting = async () => {
    if (!selectedAlbumId) return;

    setIsAdding(true);
    try {
      await albumService.addPhotosToAlbum(selectedAlbumId, mediaIds);

      const album = albums.find(a => a.id === selectedAlbumId);
      toast({
        title: 'Photos Added',
        description: `${mediaIds.length} ${mediaIds.length === 1 ? 'photo' : 'photos'} added to "${album?.name}"`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to add photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to add photos to album',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {mediaIds.length} {mediaIds.length === 1 ? 'Photo' : 'Photos'} to Album
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {showCreateNew ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-album-name">New Album Name</Label>
                <Input
                  id="new-album-name"
                  placeholder="Enter album name"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCreateNew(false)}
                  disabled={isCreating}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateAndAdd}
                  disabled={isCreating || !newAlbumName.trim()}
                >
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create & Add
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Create new album option */}
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setShowCreateNew(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Album
              </Button>

              {/* Existing albums */}
              {albums.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Or add to existing album:</Label>
                  <ScrollArea className="max-h-60">
                    <div className="space-y-1">
                      {albums.map((album) => (
                        <button
                          key={album.id}
                          className={cn(
                            'w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-accent transition-colors',
                            selectedAlbumId === album.id && 'bg-accent'
                          )}
                          onClick={() => setSelectedAlbumId(album.id)}
                        >
                          {/* Album cover */}
                          <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                            {album.cover_url ? (
                              <img
                                src={album.cover_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FolderOpen className="h-5 w-5 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          {/* Album info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{album.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {album.item_count || 0} photos
                            </p>
                          </div>

                          {/* Selection indicator */}
                          {selectedAlbumId === album.id && (
                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {albums.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No existing albums. Create a new one above.
                </p>
              )}
            </div>
          )}
        </div>

        {!showCreateNew && (
          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToExisting}
              disabled={isAdding || !selectedAlbumId}
            >
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add to Album
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AddToAlbumDialog;
