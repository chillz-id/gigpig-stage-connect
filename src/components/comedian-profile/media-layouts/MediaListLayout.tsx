import React, { useState } from 'react';
import { Play, Download, Trash2, ExternalLink, Edit2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditMediaTitleDialog } from '../EditMediaTitleDialog';

import { ComedianMediaItem } from '@/hooks/useComedianMedia';

interface MediaListLayoutProps {
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

export const MediaListLayout: React.FC<MediaListLayoutProps> = ({
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

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-12">
      {/* Videos Section */}
      {videos.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Videos</h3>
          <div className="space-y-8">
            {videos.map((video) => (
              <div
                key={video.id}
                className="relative group"
                onMouseEnter={() => setHoveredItem(video.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Video Card */}
                <div className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Video Thumbnail */}
                    <div
                      className="relative md:w-1/2 aspect-video cursor-pointer bg-gray-900"
                      onClick={() => handleVideoClick(video)}
                    >
                      <OptimizedImage
                        src={getThumbnailUrl(video)}
                        alt={video.title || 'Video'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        imageSize="large"
                      />

                      {/* Play Overlay */}
                      <div
                        className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
                          hoveredItem === video.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:bg-white/30">
                          <Play className="w-10 h-10 text-white fill-white" />
                        </div>
                      </div>

                      {/* Gradient */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h4 className="text-xl font-semibold line-clamp-2">
                            {video.title || 'Untitled Video'}
                          </h4>
                          <Badge variant="secondary" className="shrink-0">Video</Badge>
                        </div>

                        {video.description && (
                          <p className="text-muted-foreground line-clamp-3 mb-4">
                            {video.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleVideoClick(video)}
                          className="professional-button"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Watch
                        </Button>

                        {video.external_url && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openExternalLink(video.external_url!)}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {video.external_type === 'youtube' ? 'YouTube' : 'Watch'}
                          </Button>
                        )}

                        {isOwnProfile && onDelete && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(video.id)}
                            className="ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos Section */}
      {photos.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Photos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group"
                onMouseEnter={() => setHoveredItem(photo.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Photo Card */}
                <div className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <div
                    className="relative aspect-[4/3] cursor-pointer"
                    onClick={() => handlePhotoClick(photo)}
                  >
                    <OptimizedImage
                      src={getMediaUrl(photo)}
                      alt={photo.title || 'Photo'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      imageSize="large"
                      blur
                    />

                    {/* Hover Overlay */}
                    <div
                      className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-3 transition-opacity duration-300 ${
                        hoveredItem === photo.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {onDownload && (
                        <Button
                          size="lg"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(getMediaUrl(photo), photo.title || 'photo.jpg');
                          }}
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download
                        </Button>
                      )}

                      {/* Edit Title Button (Own Profile Only) */}
                      {isOwnProfile && onUpdateTitle && (
                        <Button
                          size="lg"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMedia(photo);
                          }}
                        >
                          <Edit2 className="w-5 h-5 mr-2" />
                          Edit
                        </Button>
                      )}

                      {isOwnProfile && onDelete && (
                        <Button
                          size="lg"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(photo.id);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Photo Info */}
                  {photo.title && (
                    <div className="p-4">
                      <p className="font-medium line-clamp-1">{photo.title}</p>
                      {photo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {photo.description}
                        </p>
                      )}
                    </div>
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
