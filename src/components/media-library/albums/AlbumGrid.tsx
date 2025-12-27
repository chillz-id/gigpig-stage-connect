/**
 * AlbumGrid Component
 *
 * Displays a grid of album cards with create functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { albumService, type AlbumWithCover, type AlbumOwnerType } from '@/services/media/album-service';
import { AlbumCard } from './AlbumCard';
import { AlbumCreateDialog } from './AlbumCreateDialog';
import { ShareDialog } from '../sharing/ShareDialog';

interface AlbumGridProps {
  ownerId: string;
  ownerType: AlbumOwnerType;
  onAlbumClick?: (album: AlbumWithCover) => void;
  onAlbumDeleted?: () => void;
  selectedAlbumId?: string;
  showCreateButton?: boolean;
  refreshKey?: number;
}

export function AlbumGrid({
  ownerId,
  ownerType,
  onAlbumClick,
  onAlbumDeleted,
  selectedAlbumId,
  showCreateButton = true,
  refreshKey,
}: AlbumGridProps) {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<AlbumWithCover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumWithCover | null>(null);
  const [sharingAlbum, setSharingAlbum] = useState<AlbumWithCover | null>(null);

  const loadAlbums = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await albumService.getAlbums(ownerId, ownerType);
      setAlbums(data);
    } catch (error) {
      console.error('Failed to load albums:', error);
      toast({
        title: 'Error',
        description: 'Failed to load albums',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, ownerType, toast]);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums, refreshKey]);

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    loadAlbums();
  };

  const handleEditSuccess = () => {
    setEditingAlbum(null);
    loadAlbums();
  };

  const handleDelete = async (album: AlbumWithCover) => {
    if (!confirm(`Delete "${album.name}"? This will remove all photos from the album but won't delete the photos themselves.`)) {
      return;
    }

    try {
      await albumService.deleteAlbum(album.id);
      toast({
        title: 'Album Deleted',
        description: `"${album.name}" has been deleted`,
      });
      loadAlbums();
      onAlbumDeleted?.();
    } catch (error) {
      console.error('Failed to delete album:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete album',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      {showCreateButton && (
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-muted-foreground">Albums</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Album
          </Button>
        </div>
      )}

      {/* Albums grid or empty state */}
      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <FolderOpen className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">No albums yet</p>
          {showCreateButton && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Album
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onClick={() => onAlbumClick?.(album)}
              onEdit={() => setEditingAlbum(album)}
              onDelete={() => handleDelete(album)}
              onShare={() => setSharingAlbum(album)}
              isSelected={selectedAlbumId === album.id}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <AlbumCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        ownerId={ownerId}
        ownerType={ownerType}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit dialog */}
      {editingAlbum && (
        <AlbumCreateDialog
          open={!!editingAlbum}
          onOpenChange={(open) => !open && setEditingAlbum(null)}
          ownerId={ownerId}
          ownerType={ownerType}
          album={editingAlbum}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Share dialog */}
      <ShareDialog
        open={!!sharingAlbum}
        onOpenChange={(open) => !open && setSharingAlbum(null)}
        albumId={sharingAlbum?.id}
        albumName={sharingAlbum?.name}
      />
    </div>
  );
}

export default AlbumGrid;
