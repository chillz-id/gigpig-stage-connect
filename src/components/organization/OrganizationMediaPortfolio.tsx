import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Video,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Youtube,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useOrganizationMedia, OrganizationMediaItem } from '@/hooks/useOrganizationMedia';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OrganizationMediaPortfolioProps {
  organizationId: string;
  isEditable?: boolean;
}

// Sortable media card component
const SortableMediaCard: React.FC<{
  item: OrganizationMediaItem;
  isEditable: boolean;
  onEdit: (item: OrganizationMediaItem) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (item: OrganizationMediaItem) => void;
  getThumbnailUrl: (item: OrganizationMediaItem) => string;
  getEmbedUrl: (item: OrganizationMediaItem) => string | null;
}> = ({ item, isEditable, onEdit, onDelete, onToggleVisibility, getThumbnailUrl, getEmbedUrl }) => {
  const [showVideo, setShowVideo] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !isEditable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const embedUrl = getEmbedUrl(item);
  const thumbnailUrl = getThumbnailUrl(item);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg overflow-hidden border border-slate-700 bg-slate-800/50",
        "hover:border-purple-500/50 transition-all",
        isDragging && "shadow-xl ring-2 ring-purple-500"
      )}
    >
      {/* Media Display */}
      <div className="aspect-video relative">
        {item.media_type === 'video' && showVideo && embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={thumbnailUrl}
              alt={item.title || 'Media'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
              }}
            />
            {item.media_type === 'video' && (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                  <Video className="w-8 h-8 text-white ml-1" />
                </div>
              </button>
            )}
          </>
        )}

        {/* Type badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-xs"
        >
          {item.media_type === 'video' ? (
            <>
              <Youtube className="w-3 h-3 mr-1" />
              Video
            </>
          ) : (
            <>
              <ImageIcon className="w-3 h-3 mr-1" />
              Photo
            </>
          )}
        </Badge>

        {/* Visibility badge */}
        {!item.show_in_epk && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 text-xs bg-black/50"
          >
            <EyeOff className="w-3 h-3 mr-1" />
            Hidden
          </Badge>
        )}
      </div>

      {/* Info bar */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditable && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white p-1 float-left mr-2"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            <h4 className="text-sm font-medium text-white truncate">
              {item.title || 'Untitled'}
            </h4>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {isEditable && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onToggleVisibility(item)}
                title={item.show_in_epk ? 'Hide from profile' : 'Show on profile'}
              >
                {item.show_in_epk ? (
                  <Eye className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(item)}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400 hover:text-red-300"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const OrganizationMediaPortfolio: React.FC<OrganizationMediaPortfolioProps> = ({
  organizationId,
  isEditable = true,
}) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<'photo' | 'video'>('video');
  const [editingItem, setEditingItem] = useState<OrganizationMediaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    file: null as File | null,
  });

  const {
    media,
    loading,
    error,
    addMedia,
    updateMedia,
    deleteMedia,
    reorderMedia,
    getThumbnailUrl,
    getEmbedUrl,
    extractYouTubeId,
  } = useOrganizationMedia({ organizationId });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = media.findIndex(item => item.id === active.id);
    const newIndex = media.findIndex(item => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(media, oldIndex, newIndex);
      reorderMedia(reorderedItems);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      file: null,
    });
  };

  const handleOpenAddDialog = (type: 'photo' | 'video') => {
    setAddType(type);
    setEditingItem(null);
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: OrganizationMediaItem) => {
    setEditingItem(item);
    setAddType(item.media_type);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      youtubeUrl: item.external_url || '',
      file: null,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this media item?')) {
      await deleteMedia(id);
    }
  };

  const handleToggleVisibility = async (item: OrganizationMediaItem) => {
    await updateMedia(item.id, { show_in_epk: !item.show_in_epk });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async () => {
    if (editingItem) {
      // Update existing
      await updateMedia(editingItem.id, {
        title: formData.title,
        description: formData.description,
      });
      setIsAddDialogOpen(false);
      resetForm();
      setEditingItem(null);
      return;
    }

    // Add new
    if (addType === 'video') {
      if (!formData.youtubeUrl) {
        toast({
          title: 'URL Required',
          description: 'Please enter a YouTube URL.',
          variant: 'destructive',
        });
        return;
      }

      const videoId = extractYouTubeId(formData.youtubeUrl);
      if (!videoId) {
        toast({
          title: 'Invalid URL',
          description: 'Please enter a valid YouTube URL.',
          variant: 'destructive',
        });
        return;
      }

      await addMedia({
        media_type: 'video',
        title: formData.title || 'YouTube Video',
        description: formData.description,
        external_url: formData.youtubeUrl,
        external_type: 'youtube',
        external_id: videoId,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      });
    } else {
      // Photo upload
      if (!formData.file) {
        toast({
          title: 'File Required',
          description: 'Please select an image to upload.',
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);
      try {
        const filename = `${Date.now()}-${formData.file.name}`;
        const filePath = `organizations/${organizationId}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(filePath, formData.file, {
            contentType: formData.file.type,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('media-library')
          .getPublicUrl(filePath);

        await addMedia({
          media_type: 'photo',
          title: formData.title || formData.file.name,
          description: formData.description,
          file_url: urlData.publicUrl,
          file_size: formData.file.size,
          file_type: formData.file.type.split('/')[1],
          mime_type: formData.file.type,
        });
      } catch (err) {
        console.error('Upload error:', err);
        toast({
          title: 'Upload Failed',
          description: 'There was an error uploading the image.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        Error loading media: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      {isEditable && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showcase your videos and photos
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleOpenAddDialog('video')}
              className="professional-button"
              size="sm"
            >
              <Youtube className="w-4 h-4 mr-2" />
              Add Video
            </Button>
            <Button
              onClick={() => handleOpenAddDialog('photo')}
              className="professional-button"
              size="sm"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
          </div>
        </div>
      )}

      {/* Media grid */}
      {media.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No media uploaded yet</p>
          {isEditable && (
            <p className="text-sm text-muted-foreground">
              Add YouTube videos and photos to showcase your organization
            </p>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={media.map(item => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map(item => (
                <SortableMediaCard
                  key={item.id}
                  item={item}
                  isEditable={isEditable}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                  getThumbnailUrl={getThumbnailUrl}
                  getEmbedUrl={getEmbedUrl}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? `Edit ${addType === 'video' ? 'Video' : 'Photo'}`
                : `Add ${addType === 'video' ? 'YouTube Video' : 'Photo'}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {addType === 'video' && !editingItem && (
              <div>
                <Label htmlFor="youtube-url">YouTube URL *</Label>
                <Input
                  id="youtube-url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports youtube.com/watch, youtu.be, and shorts URLs
                </p>
              </div>
            )}

            {addType === 'photo' && !editingItem && (
              <div>
                <Label htmlFor="photo-file">Image *</Label>
                <Input
                  id="photo-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
            )}

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give this media a title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingItem(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
              className="professional-button"
            >
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? 'Save Changes' : 'Add Media'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationMediaPortfolio;
