import React, { useState } from 'react';
import { Play, Download, Trash2, Edit2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditMediaTitleDialog } from '../EditMediaTitleDialog';

import { ComedianMediaItem } from '@/hooks/useComedianMedia';

interface MediaMasonicLayoutProps {
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

export const MediaMasonicLayout: React.FC<MediaMasonicLayoutProps> = ({
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

  // Combine videos and photos for masonic layout, videos first
  const allMedia = [
    ...videos.map(v => ({ ...v, isVideo: true })),
    ...photos.map(p => ({ ...p, isVideo: false }))
  ];

  return (
    <>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {allMedia.map((item) => (
          <div
            key={item.id}
            className="break-inside-avoid mb-4"
          >
            <div
              className={`relative rounded-lg overflow-hidden ${
                item.isVideo ? 'bg-gray-900' : 'bg-gray-200'
              } group cursor-pointer`}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => item.isVideo ? handleVideoClick(item) : handlePhotoClick(item)}
            >
              {/* Media Content */}
              {item.isVideo ? (
                <div className="relative aspect-video">
                  <OptimizedImage
                    src={getThumbnailUrl(item)}
                    alt={item.title || 'Video'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    imageSize="large"
                  />

                  {/* Video Play Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity duration-300 ${
                      hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform transition-transform duration-300 hover:scale-110">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                    {item.title && (
                      <p className="text-white text-sm font-medium px-4 text-center mt-4 line-clamp-2">
                        {item.title}
                      </p>
                    )}
                  </div>

                  {/* Gradient at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="relative">
                  <OptimizedImage
                    src={getMediaUrl(item)}
                    alt={item.title || 'Photo'}
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    imageSize="medium"
                    blur
                  />

                  {/* Photo Hover Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-300 ${
                      hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {onDownload && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(getMediaUrl(item), item.title || 'photo.jpg');
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
                          setEditingMedia(item);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}

                    {isOwnProfile && onDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Delete Button for Videos (Own Profile Only) */}
              {item.isVideo && isOwnProfile && onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

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
    </>
  );
};
