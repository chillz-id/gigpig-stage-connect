/**
 * AlbumDetailView Component
 *
 * Displays album contents with ability to manage photos.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  MoreVertical,
  Star,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { albumService, type AlbumWithCover } from '@/services/media/album-service';

interface AlbumDetailViewProps {
  album: AlbumWithCover;
  onBack: () => void;
  onAlbumUpdated?: () => void;
}

interface AlbumMedia {
  id: string;
  media_id: string;
  display_order: number;
  media: {
    id: string;
    public_url: string | null;
    storage_path: string;
    file_name: string;
  };
}

export function AlbumDetailView({
  album,
  onBack,
  onAlbumUpdated,
}: AlbumDetailViewProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<AlbumMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAlbum, setCurrentAlbum] = useState(album);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await albumService.getAlbumItems(album.id);
      setItems(data as AlbumMedia[]);

      // Refresh album to get updated cover
      const updatedAlbum = await albumService.getAlbum(album.id);
      if (updatedAlbum) {
        setCurrentAlbum(updatedAlbum);
      }
    } catch (error) {
      console.error('Failed to load album items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load album photos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [album.id, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const getPhotoUrl = (media: AlbumMedia['media']) => {
    if (media.public_url) return media.public_url;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/directory-media/${media.storage_path}`;
  };

  const handleSetCover = async (mediaId: string) => {
    try {
      await albumService.setCoverPhoto(album.id, mediaId);
      toast({
        title: 'Cover Updated',
        description: 'Album cover has been updated',
      });
      loadItems();
      onAlbumUpdated?.();
    } catch (error) {
      console.error('Failed to set cover:', error);
      toast({
        title: 'Error',
        description: 'Failed to set cover photo',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePhoto = async (mediaId: string) => {
    try {
      await albumService.removePhotoFromAlbum(album.id, mediaId);
      toast({
        title: 'Photo Removed',
        description: 'Photo has been removed from album',
      });
      loadItems();
      onAlbumUpdated?.();
    } catch (error) {
      console.error('Failed to remove photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove photo from album',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{currentAlbum.name}</h2>
          {currentAlbum.description && (
            <p className="text-sm text-muted-foreground truncate">{currentAlbum.description}</p>
          )}
        </div>
        <Badge variant="secondary">
          <ImageIcon className="h-3 w-3 mr-1" />
          {items.length}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
            <p>No photos in this album</p>
            <p className="text-sm mt-1">Add photos from your library</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="group relative overflow-hidden">
                <div className="aspect-square">
                  <img
                    src={getPhotoUrl(item.media)}
                    alt={item.media.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Cover indicator */}
                {currentAlbum.cover_media_id === item.media_id && (
                  <Badge
                    className="absolute bottom-1 left-1 text-[10px] px-1 bg-yellow-500/90 text-white"
                  >
                    <Star className="h-2 w-2 mr-0.5 fill-current" />
                    Cover
                  </Badge>
                )}

                {/* Actions */}
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
                    <DropdownMenuItem onClick={() => handleSetCover(item.media_id)}>
                      <Star className="h-4 w-4 mr-2" />
                      Set as Cover
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleRemovePhoto(item.media_id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from Album
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlbumDetailView;
