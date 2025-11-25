import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Image as ImageIcon, Play, Download, Plus, Edit, Trash2, ExternalLink, Grid3x3, LayoutGrid, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useComedianMedia } from '@/hooks/useComedianMedia';
import { MediaUpload } from '@/components/profile/MediaUpload';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { MediaGridLayout } from './media-layouts/MediaGridLayout';
import { MediaMasonicLayout } from './media-layouts/MediaMasonicLayout';
import { MediaListLayout } from './media-layouts/MediaListLayout';

interface ComedianMediaProps {
  comedianId: string;
  isOwnProfile?: boolean;
  trackInteraction?: (action: string, details?: any) => void;
  mediaLayout?: 'grid' | 'masonic' | 'list';
}

const ComedianMedia: React.FC<ComedianMediaProps> = ({
  comedianId,
  isOwnProfile = false,
  trackInteraction,
  mediaLayout: initialMediaLayout = 'masonic'
}) => {
  const [currentLayout, setCurrentLayout] = useState<'grid' | 'masonic' | 'list'>(initialMediaLayout);
  const { user } = useAuth();
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingType, setUploadingType] = useState<'photo' | 'video'>('photo');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'photos'>('videos');

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
  } = useComedianMedia({ userId: comedianId });

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
      getMediaUrl,
      getThumbnailUrl,
      getEmbedUrl,
    };

    switch (currentLayout) {
      case 'masonic':
        return <MediaMasonicLayout {...layoutProps} />;
      case 'list':
        return <MediaListLayout {...layoutProps} />;
      case 'grid':
      default:
        return <MediaGridLayout {...layoutProps} />;
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
                variant={currentLayout === 'grid' ? 'default' : 'ghost'}
                onClick={() => setCurrentLayout('grid')}
                className="px-3"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={currentLayout === 'masonic' ? 'default' : 'ghost'}
                onClick={() => setCurrentLayout('masonic')}
                className="px-3"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={currentLayout === 'list' ? 'default' : 'ghost'}
                onClick={() => setCurrentLayout('list')}
                className="px-3"
              >
                <List className="w-4 h-4" />
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
      <div className="flex items-center justify-between gap-2">
        {/* Layout Switcher */}
        {(photos.length > 0 || videos.length > 0) && (
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              size="sm"
              variant={currentLayout === 'grid' ? 'default' : 'ghost'}
              onClick={() => setCurrentLayout('grid')}
              className="px-3"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={currentLayout === 'masonic' ? 'default' : 'ghost'}
              onClick={() => setCurrentLayout('masonic')}
              className="px-3"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={currentLayout === 'list' ? 'default' : 'ghost'}
              onClick={() => setCurrentLayout('list')}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Upload buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleUploadClick('photo')}
            size="sm"
            className="professional-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
          <Button
            onClick={() => handleUploadClick('video')}
            size="sm"
            className="professional-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </div>
      </div>

      {/* Render media using same layout as public view */}
      {(photos.length > 0 || videos.length > 0) ? (
        renderLayout()
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No media uploaded yet</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => handleUploadClick('photo')} className="professional-button">
              <Plus className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
            <Button onClick={() => handleUploadClick('video')} className="professional-button">
              <Plus className="w-4 h-4 mr-2" />
              Upload Videos
            </Button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className={uploadingType === 'video' ? 'sm:max-w-lg' : 'max-w-2xl'}>
          <DialogHeader>
            <DialogTitle>{uploadingType === 'video' ? 'Add Video' : 'Add Headshots'}</DialogTitle>
          </DialogHeader>
          <MediaUpload
            mediaType={uploadingType}
            onMediaAdded={handleMediaAdded}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComedianMedia;