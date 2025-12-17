/**
 * EPKAlbumPicker Component
 *
 * Allows comedians to select which albums to display in their EPK Photo section.
 * Shows available albums with checkboxes and the ability to reorder selected albums.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  FolderOpen,
  Image as ImageIcon,
  Settings2,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { albumService, type AlbumWithCover } from '@/services/media/album-service';

interface EPKAlbumPickerProps {
  comedianId: string;
  directoryProfileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EPKAlbumPicker({
  comedianId,
  directoryProfileId,
  open,
  onOpenChange,
  onSuccess,
}: EPKAlbumPickerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableAlbums, setAvailableAlbums] = useState<AlbumWithCover[]>([]);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<Set<string>>(new Set());
  const [originalSelections, setOriginalSelections] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load albums and current EPK selections in parallel
      const [albums, epkAlbumIds] = await Promise.all([
        albumService.getAlbums(directoryProfileId, 'directory_profile'),
        albumService.getEPKAlbumIds(comedianId),
      ]);

      setAvailableAlbums(albums);
      const selections = new Set(epkAlbumIds);
      setSelectedAlbumIds(selections);
      setOriginalSelections(new Set(selections));
    } catch (error) {
      console.error('Failed to load EPK album data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load album data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [comedianId, directoryProfileId, toast]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const handleToggleAlbum = (albumId: string) => {
    setSelectedAlbumIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(albumId)) {
        newSet.delete(albumId);
      } else {
        newSet.add(albumId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await albumService.setEPKAlbums(comedianId, Array.from(selectedAlbumIds));
      toast({
        title: 'EPK Updated',
        description: 'Your photo album selections have been saved',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save EPK albums:', error);
      toast({
        title: 'Error',
        description: 'Failed to save album selections',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    if (selectedAlbumIds.size !== originalSelections.size) return true;
    for (const id of selectedAlbumIds) {
      if (!originalSelections.has(id)) return true;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Select Albums for EPK
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Choose which albums to display in your EPK's Photo section.
            Photos from selected albums will be shown to visitors.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableAlbums.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No albums yet</p>
                <p className="text-sm mt-1">
                  Create albums in your Media Library first
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-2">
                {availableAlbums.map((album) => (
                  <div
                    key={album.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAlbumIds.has(album.id)
                        ? 'bg-primary/5 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => handleToggleAlbum(album.id)}
                  >
                    <Checkbox
                      checked={selectedAlbumIds.has(album.id)}
                      onCheckedChange={() => handleToggleAlbum(album.id)}
                    />

                    {/* Album thumbnail */}
                    <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ImageIcon className="h-3 w-3" />
                        <span>{album.item_count || 0} photos</span>
                      </div>
                    </div>

                    {selectedAlbumIds.has(album.id) && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {selectedAlbumIds.size > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {selectedAlbumIds.size} album{selectedAlbumIds.size !== 1 ? 's' : ''} selected
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges()}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EPKAlbumPicker;
