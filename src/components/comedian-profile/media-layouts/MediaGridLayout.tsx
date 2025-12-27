import React, { useState } from 'react';
import { Play, Download, Trash2, Edit2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditMediaTitleDialog } from '../EditMediaTitleDialog';

import { ComedianMediaItem } from '@/hooks/useComedianMedia';

interface MediaGridLayoutProps {
  photos: ComedianMediaItem[];
  videos: ComedianMediaItem[];
  isOwnProfile: boolean;
  onDelete?: (id: string) => void;
  onDownload?: (url: string, filename: string) => void;
  onVideoClick?: (video: ComedianMediaItem) => void;
  onUpdateTitle?: (id: string, newTitle: string) => void;
  getMediaUrl: (item: ComedianMediaItem) => string;
  getThumbnailUrl: (item: ComedianMediaItem) => string;
  getEmbedUrl: (item: ComedianMediaItem) => string | null;
}

export const MediaGridLayout: React.FC<MediaGridLayoutProps> = ({
  photos,
  videos,
  isOwnProfile,
  onDelete,
  onDownload,
  onVideoClick,
  onUpdateTitle,
  getMediaUrl,
  getThumbnailUrl,
  getEmbedUrl,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ComedianMediaItem | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ComedianMediaItem | null>(null);
  const [editingMedia, setEditingMedia] = useState<ComedianMediaItem | null>(null);

  const handleVideoClick = (video: ComedianMediaItem) => {
    setSelectedVideo(video);
    if (onVideoClick) onVideoClick(video);
  };

  const handlePhotoClick = (photo: ComedianMediaItem) => {
    setSelectedPhoto(photo);
  };

  return (
    <div className="space-y-8">
      {/* Videos Section */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Videos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 cursor-pointer group"
                onMouseEnter={() => setHoveredItem(video.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleVideoClick(video)}
              >
                {/* Thumbnail */}
                <OptimizedImage
                  src={getThumbnailUrl(video)}
                  alt={video.title || 'Video'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  imageSize="large"
                />

                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity duration-300 ${
                    hoveredItem === video.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Play Button */}
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 transform transition-transform duration-300 hover:scale-110">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>

                  {/* Title */}
                  {video.title && (
                    <p className="text-white text-sm font-medium px-4 text-center line-clamp-2">
                      {video.title}
                    </p>
                  )}

                  {/* Delete Button (Own Profile Only) */}
                  {isOwnProfile && onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(video.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Gradient Overlay at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos Section */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative rounded-lg overflow-hidden bg-gray-200 group cursor-pointer"
                onMouseEnter={() => setHoveredItem(photo.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handlePhotoClick(photo)}
              >
                {/* Photo - maintains aspect ratio */}
                <OptimizedImage
                  src={getMediaUrl(photo)}
                  alt={photo.title || 'Headshot'}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  imageSize="medium"
                  blur
                />

                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-300 ${
                    hoveredItem === photo.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Download Button */}
                  {onDownload && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(getMediaUrl(photo), photo.title || 'photo.jpg');
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Edit Title Button (Own Profile Only) */}
                  {isOwnProfile && onUpdateTitle && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMedia(photo);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Delete Button (Own Profile Only) */}
                  {isOwnProfile && onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(photo.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Player Dialog */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl">
            <div className="aspect-video">
              {getEmbedUrl(selectedVideo) ? (
                <iframe
                  src={getEmbedUrl(selectedVideo)!}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={getMediaUrl(selectedVideo)}
                  controls
                  autoPlay
                  className="w-full h-full rounded-lg"
                />
              )}
            </div>
            {selectedVideo.title && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                {selectedVideo.description && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedVideo.description}</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Photo Viewer Dialog */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-7xl max-h-[90vh] p-0">
            <div className="relative w-full h-full flex items-center justify-center bg-black/95 rounded-lg overflow-hidden">
              <img
                src={getMediaUrl(selectedPhoto)}
                alt={selectedPhoto.title || 'Photo'}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
              />
            </div>
            {selectedPhoto.title && (
              <div className="px-6 pb-6">
                <h3 className="text-lg font-semibold">{selectedPhoto.title}</h3>
                {selectedPhoto.description && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedPhoto.description}</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Title Dialog */}
      {editingMedia && onUpdateTitle && (
        <EditMediaTitleDialog
          isOpen={!!editingMedia}
          onClose={() => setEditingMedia(null)}
          onSave={(newTitle) => onUpdateTitle(editingMedia.id, newTitle)}
          currentTitle={editingMedia.title || ''}
          mediaType={editingMedia.media_type}
        />
      )}
    </div>
  );
};
