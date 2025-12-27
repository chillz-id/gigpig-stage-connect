/**
 * AlbumCreateDialog Component
 *
 * Dialog for creating or editing an album.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { albumService, type AlbumWithCover, type AlbumOwnerType } from '@/services/media/album-service';

interface AlbumCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
  ownerType: AlbumOwnerType;
  album?: AlbumWithCover | null;
  onSuccess?: () => void;
}

export function AlbumCreateDialog({
  open,
  onOpenChange,
  ownerId,
  ownerType,
  album,
  onSuccess,
}: AlbumCreateDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!album;

  // Reset form when dialog opens/closes or album changes
  useEffect(() => {
    if (open) {
      if (album) {
        setName(album.name);
        setDescription(album.description || '');
        setIsPublic(album.is_public);
      } else {
        setName('');
        setDescription('');
        setIsPublic(false);
      }
    }
  }, [open, album]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for the album',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && album) {
        await albumService.updateAlbum(album.id, {
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        });
        toast({
          title: 'Album Updated',
          description: `"${name}" has been updated`,
        });
      } else {
        await albumService.createAlbum({
          ownerId,
          ownerType,
          name: name.trim(),
          description: description.trim() || undefined,
          isPublic,
        });
        toast({
          title: 'Album Created',
          description: `"${name}" has been created`,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save album:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} album`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Album' : 'Create New Album'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="album-name">Album Name</Label>
            <Input
              id="album-name"
              placeholder="e.g., Headshots, Show Photos, Promo Images"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="album-description">Description (optional)</Label>
            <Textarea
              id="album-description"
              placeholder="Brief description of this album"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="album-public">Public Album</Label>
              <p className="text-xs text-muted-foreground">
                Anyone can view this album
              </p>
            </div>
            <Switch
              id="album-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Album'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AlbumCreateDialog;
