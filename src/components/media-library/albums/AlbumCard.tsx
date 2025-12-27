/**
 * AlbumCard Component
 *
 * Displays a single album as a card with cover thumbnail, name, and photo count.
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, MoreVertical, Edit, Trash2, Image as ImageIcon, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlbumWithCover } from '@/services/media/album-service';

interface AlbumCardProps {
  album: AlbumWithCover;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  isSelected?: boolean;
}

export function AlbumCard({
  album,
  onClick,
  onEdit,
  onDelete,
  onShare,
  isSelected,
}: AlbumCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="aspect-square bg-muted relative">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt={album.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Photo count badge */}
        <Badge
          variant="secondary"
          className="absolute bottom-2 left-2 bg-black/70 text-white text-xs"
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          {album.item_count || 0}
        </Badge>

        {/* Actions dropdown */}
        {(onEdit || onDelete || onShare) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onShare && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Album
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Album
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Album
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Album info */}
      <div className="p-2">
        <p className="font-medium text-sm truncate">{album.name}</p>
        {album.description && (
          <p className="text-xs text-muted-foreground truncate">{album.description}</p>
        )}
      </div>
    </Card>
  );
}

export default AlbumCard;
