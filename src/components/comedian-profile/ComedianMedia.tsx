import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Image as ImageIcon, Play, Download, Plus, Edit, Trash2, ExternalLink, LayoutGrid, GalleryHorizontal, Settings2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useComedianMedia } from '@/hooks/useComedianMedia';
import { EPKMediaPicker } from './EPKMediaPicker';
import { EPKAlbumPicker } from './EPKAlbumPicker';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { MediaMasonicLayout } from './media-layouts/MediaMasonicLayout';
import { MediaSliderLayout } from './media-layouts/MediaSliderLayout';
import { ImageEditorModal } from '@/components/ui/ImageEditorModal';
import { AddToAlbumDialog } from '@/components/media-library/albums';
import { supabase } from '@/integrations/supabase/client';
import type { ComedianMediaItem } from '@/hooks/useComedianMedia';

interface ComedianMediaProps {
  comedianId: string;
  directoryProfileId?: string;
  isOwnProfile?: boolean;
  trackInteraction?: (action: string, details?: any) => void;
  mediaLayout?: 'slider' | 'masonic';
}

const ComedianMedia: React.FC<ComedianMediaProps> = ({
  comedianId,
  directoryProfileId,
  isOwnProfile = false,
  trackInteraction,
  mediaLayout: initialMediaLayout = 'slider'
}) => {
  const [currentLayout, setCurrentLayout] = useState<'slider' | 'masonic'>(initialMediaLayout === 'slider' || initialMediaLayout === 'masonic' ? initialMediaLayout : 'slider');
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const { user } = useAuth();

  // Save layout preference to database
  const saveLayoutPreference = useCallback(async (layout: 'slider' | 'masonic') => {
    if (!user?.id || !isOwnProfile) return;

    try {
      await supabase
        .from('profiles')
        .update({ media_layout: layout })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to save layout preference:', error);
    }
  }, [user?.id, isOwnProfile]);

  // Handle layout change and save preference
  const handleLayoutChange = useCallback((layout: 'slider' | 'masonic') => {
    setCurrentLayout(layout);
    saveLayoutPreference(layout);
  }, [saveLayoutPreference]);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingType, setUploadingType] = useState<'photo' | 'video'>('photo');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'photos'>('videos');

  // Photo menu dialogs
  const [imageEditorPhoto, setImageEditorPhoto] = useState<ComedianMediaItem | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<ComedianMediaItem | null>(null);
  const [editMetadataPhoto, setEditMetadataPhoto] = useState<ComedianMediaItem | null>(null);
  const [editMetadataTitle, setEditMetadataTitle] = useState('');
  const [addToAlbumPhoto, setAddToAlbumPhoto] = useState<ComedianMediaItem | null>(null);

  const {
    photos,
    videos,
    loading,
    error,
    deleteMedia,
    updateMedia,
    fetchMedia,
    getThumbnailUrl,
    getEmbedUrl,
    getMediaUrl
  } = useComedianMedia({
    userId: comedianId,
    epkOnly: !isOwnProfile // Only show EPK-tagged media for public view
  });

  const handleUploadClick = (type: 'photo' | 'video') => {
    setUploadingType(type);
    setActiveTab(type === 'photo' ? 'photos' : 'videos');
    setShowUploadDialog(true);
  };

  const handleMediaAdded = () => {
    setShowUploadDialog(false);
    fetchMedia(); // Refresh the media list
  };

  const handleDelete = async (mediaId: string) => {
    if (confirm('Are you sure you want to delete this media item?')) {
      await deleteMedia(mediaId);
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'headshot.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleVideoClick = (video: any) => {
    if (trackInteraction) {
      trackInteraction('video_play', { videoId: video.id, videoTitle: video.title });
    }
  };

  const handleUpdateTitle = async (mediaId: string, newTitle: string) => {
    await updateMedia(mediaId, { title: newTitle });
  };

  // Photo menu handlers
  const handleEditPhoto = (photo: ComedianMediaItem) => {
    setImageEditorPhoto(photo);
  };

  const handleViewDetails = (photo: ComedianMediaItem) => {
    setViewingPhoto(photo);
  };

  const handleEditMetadata = (photo: ComedianMediaItem) => {
    setEditMetadataPhoto(photo);
    setEditMetadataTitle(photo.title || '');
  };

  const handleAddToAlbum = (photo: ComedianMediaItem) => {
    setAddToAlbumPhoto(photo);
  };

  const handleSaveMetadata = async () => {
    if (editMetadataPhoto) {
      await updateMedia(editMetadataPhoto.id, { title: editMetadataTitle });
      setEditMetadataPhoto(null);
      setEditMetadataTitle('');
      fetchMedia();
    }
  };

  const handleImageEditorSave = async (blob: Blob) => {
    if (!imageEditorPhoto) return;

    try {
      // Create new filename for edited image
      const filename = `edited-${Date.now()}.jpg`;
      const filePath = `${comedianId}/${filename}`;

      // Upload edited image to storage
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media-library')
        .getPublicUrl(filePath);

      // Update the media record with new URL
      await updateMedia(imageEditorPhoto.id, {
        storage_path: filePath,
        public_url: urlData.publicUrl
      });

      setImageEditorPhoto(null);
      fetchMedia();
    } catch (error) {
      console.error('Failed to save edited image:', error);
    }
  };

  // Render the appropriate layout component
  const renderLayout = () => {
    const layoutProps = {
      photos,
      videos,
      isOwnProfile,
      onDelete: handleDelete,
      onDownload: downloadImage,
      onVideoClick: handleVideoClick,
      onUpdateTitle: handleUpdateTitle,
      onUpdateMedia: updateMedia,
      getMediaUrl,
      getThumbnailUrl,
      getEmbedUrl,
      // New photo menu callbacks
      onEditPhoto: handleEditPhoto,
      onEditMetadata: handleEditMetadata,
      onAddToAlbum: handleAddToAlbum,
      onViewDetails: handleViewDetails,
    };

    switch (currentLayout) {
      case 'masonic':
        return <MediaMasonicLayout {...layoutProps} />;
      case 'slider':
      default:
        return <MediaSliderLayout {...layoutProps} />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Error loading media: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // For public view, render layout directly without card wrapper
  if (!isOwnProfile) {
    return (
      <div className="space-y-6">
        {/* Layout Switcher */}
        {(photos.length > 0 || videos.length > 0) && (
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={currentLayout === 'slider' ? 'default' : 'ghost'}
                onClick={() => handleLayoutChange('slider')}
                className="px-3"
                title="Slider view"
              >
                <GalleryHorizontal className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={currentLayout === 'masonic' ? 'default' : 'ghost'}
                onClick={() => handleLayoutChange('masonic')}
                className="px-3"
                title="Masonry view"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {(photos.length > 0 || videos.length > 0) ? (
          renderLayout()
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No media available yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // For own profile, show upload buttons at top and use same layout as public view
  return (
    <div className="space-y-6">
      {/* Upload buttons and Layout Switcher for own profile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2">
        {/* Layout Switcher */}
        {(photos.length > 0 || videos.length > 0) && (
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 self-center sm:self-auto">
            <Button
              size="sm"
              variant={currentLayout === 'slider' ? 'default' : 'ghost'}
              onClick={() => handleLayoutChange('slider')}
              className="px-3"
              title="Slider view"
            >
              <GalleryHorizontal className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={currentLayout === 'masonic' ? 'default' : 'ghost'}
              onClick={() => handleLayoutChange('masonic')}
              className="px-3"
              title="Masonry view"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Upload buttons */}
        <div className="flex items-center justify-center sm:justify-end gap-2">
          {directoryProfileId && (
            <Button
              onClick={() => setShowAlbumPicker(true)}
              size="sm"
              variant="secondary"
              className="text-xs sm:text-sm"
              title="Select albums to display in EPK"
            >
              <Settings2 className="w-4 h-4 mr-1 sm:mr-2" />
              Albums
            </Button>
          )}
          <Button
            onClick={() => handleUploadClick('photo')}
            size="sm"
            className="professional-button text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            Add Photo
          </Button>
          <Button
            onClick={() => handleUploadClick('video')}
            size="sm"
            className="professional-button text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            Add Video
          </Button>
        </div>
      </div>

      {/* Render media using same layout as public view */}
      {(photos.length > 0 || videos.length > 0) ? (
        renderLayout()
      ) : (
        <div className="text-center py-8 sm:py-12 bg-muted/20 rounded-lg px-4">
          <Video className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">No media uploaded yet</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => handleUploadClick('photo')} className="professional-button text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
            <Button onClick={() => handleUploadClick('video')} className="professional-button text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Upload Videos
            </Button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{uploadingType === 'video' ? 'Add Video to EPK' : 'Add Photos to EPK'}</DialogTitle>
            <DialogDescription>
              {uploadingType === 'video'
                ? 'Add a YouTube video to your EPK or select from your library.'
                : 'Upload new photos or select existing ones from your library.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-0">
            <EPKMediaPicker
              mediaType={uploadingType}
              onMediaAdded={handleMediaAdded}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* EPK Album Picker */}
      {directoryProfileId && (
        <EPKAlbumPicker
          comedianId={comedianId}
          directoryProfileId={directoryProfileId}
          open={showAlbumPicker}
          onOpenChange={setShowAlbumPicker}
          onSuccess={() => fetchMedia()}
        />
      )}

      {/* Image Editor Modal */}
      {imageEditorPhoto && (
        <ImageEditorModal
          imageUrl={getMediaUrl(imageEditorPhoto)}
          isOpen={!!imageEditorPhoto}
          onClose={() => setImageEditorPhoto(null)}
          onSave={handleImageEditorSave}
        />
      )}

      {/* View Details Dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingPhoto?.title || 'Photo Details'}</DialogTitle>
          </DialogHeader>
          {viewingPhoto && (
            <div className="space-y-4">
              <img
                src={getMediaUrl(viewingPhoto)}
                alt={viewingPhoto.title || 'Photo'}
                className="w-full rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Title:</div>
                <div>{viewingPhoto.title || 'Untitled'}</div>
                <div className="text-muted-foreground">Type:</div>
                <div>{viewingPhoto.media_type || 'photo'}</div>
                {viewingPhoto.created_at && (
                  <>
                    <div className="text-muted-foreground">Added:</div>
                    <div>{new Date(viewingPhoto.created_at).toLocaleDateString()}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Metadata Dialog */}
      <Dialog open={!!editMetadataPhoto} onOpenChange={() => setEditMetadataPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Photo Metadata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="photo-title">Title</Label>
              <Input
                id="photo-title"
                value={editMetadataTitle}
                onChange={(e) => setEditMetadataTitle(e.target.value)}
                placeholder="Enter photo title..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditMetadataPhoto(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMetadata}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Album Dialog */}
      {addToAlbumPhoto && user?.id && (
        <AddToAlbumDialog
          open={!!addToAlbumPhoto}
          onOpenChange={() => setAddToAlbumPhoto(null)}
          userId={user.id}
          mediaIds={[addToAlbumPhoto.id]}
          onSuccess={() => {
            setAddToAlbumPhoto(null);
            fetchMedia();
          }}
        />
      )}
    </div>
  );
};

export default ComedianMedia;