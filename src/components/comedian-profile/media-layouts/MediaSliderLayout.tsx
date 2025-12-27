import React, { useState, useEffect, useRef } from 'react';
import { Play, Download, Trash2, Edit, ChevronLeft, ChevronRight, MoreVertical, Info, Wand2, FolderPlus, Globe, Users, Lock } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditMediaTitleDialog } from '../EditMediaTitleDialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Marquee } from '@/components/ui/marquee';
import { ComedianMediaItem, MediaVisibility } from '@/hooks/useComedianMedia';
import { cn } from '@/lib/utils';

// Visibility badge component
const VisibilityBadge: React.FC<{ visibility: MediaVisibility; className?: string }> = ({ visibility, className }) => {
  const config = {
    public: { icon: Globe, label: 'Public', color: 'bg-green-500/80' },
    promoters: { icon: Users, label: 'Industry', color: 'bg-blue-500/80' },
    private: { icon: Lock, label: 'Private', color: 'bg-orange-500/80' },
  };

  const { icon: Icon, label, color } = config[visibility];

  return (
    <Badge className={cn('flex items-center gap-1 text-xs px-1.5 py-0.5', color, className)}>
      <Icon className="w-3 h-3" />
      <span className="hidden sm:inline">{label}</span>
    </Badge>
  );
};

interface MediaSliderLayoutProps {
  photos: ComedianMediaItem[];
  videos: ComedianMediaItem[];
  isOwnProfile: boolean;
  onDelete?: (id: string) => void;
  onDownload?: (url: string, filename: string) => void;
  onVideoClick?: (video: ComedianMediaItem) => void;
  onUpdateTitle?: (id: string, newTitle: string) => void;
  onUpdateMedia?: (id: string, updates: Partial<ComedianMediaItem>) => Promise<boolean>;
  onEditPhoto?: (photo: ComedianMediaItem) => void;
  onEditMetadata?: (photo: ComedianMediaItem) => void;
  onAddToAlbum?: (photo: ComedianMediaItem) => void;
  onViewDetails?: (photo: ComedianMediaItem) => void;
  getMediaUrl: (item: ComedianMediaItem) => string;
  getThumbnailUrl: (item: ComedianMediaItem) => string;
  getEmbedUrl: (item: ComedianMediaItem) => string | null;
}

export const MediaSliderLayout: React.FC<MediaSliderLayoutProps> = ({
  photos,
  videos,
  isOwnProfile,
  onDelete,
  onDownload,
  onVideoClick,
  onUpdateTitle,
  onUpdateMedia,
  onEditPhoto,
  onEditMetadata,
  onAddToAlbum,
  onViewDetails,
  getMediaUrl,
  getThumbnailUrl,
  getEmbedUrl,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ComedianMediaItem | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ComedianMediaItem | null>(null);
  const [editingMedia, setEditingMedia] = useState<ComedianMediaItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoApi, setVideoApi] = useState<CarouselApi>();
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [canScrollVideoPrev, setCanScrollVideoPrev] = useState(false);
  const [canScrollVideoNext, setCanScrollVideoNext] = useState(false);

  // Autoplay plugin ref - persists across renders
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  // Setup video carousel scroll state
  useEffect(() => {
    if (!videoApi) return;

    const onSelect = () => {
      setCanScrollVideoPrev(videoApi.canScrollPrev());
      setCanScrollVideoNext(videoApi.canScrollNext());
    };

    onSelect();
    videoApi.on('select', onSelect);
    videoApi.on('reInit', onSelect);

    return () => {
      videoApi.off('select', onSelect);
    };
  }, [videoApi]);

  const handleVideoClick = (video: ComedianMediaItem) => {
    setSelectedVideo(video);
    if (onVideoClick) onVideoClick(video);
  };

  const handlePhotoClick = (photo: ComedianMediaItem, index: number) => {
    setLightboxIndex(index);
    setSelectedPhoto(photo);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    const newIndex = direction === 'prev'
      ? (lightboxIndex - 1 + photos.length) % photos.length
      : (lightboxIndex + 1) % photos.length;
    setLightboxIndex(newIndex);
    const photoAtIndex = photos[newIndex];
    if (photoAtIndex) {
      setSelectedPhoto(photoAtIndex);
    }
  };

  // Custom arrow button component
  const SliderArrow = ({
    direction,
    onClick,
    disabled,
    isVisible
  }: {
    direction: 'prev' | 'next';
    onClick: () => void;
    disabled: boolean;
    isVisible: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full",
        "bg-black/50 hover:bg-black/70 text-white",
        "flex items-center justify-center",
        "transition-all duration-300",
        direction === 'prev' ? 'left-2' : 'right-2',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {direction === 'prev' ? (
        <ChevronLeft className="w-6 h-6" />
      ) : (
        <ChevronRight className="w-6 h-6" />
      )}
    </button>
  );

  // Video needs sliding only if more than 2
  const videoNeedsSliding = videos.length > 2;

  return (
    <div className="space-y-8">
      {/* Videos Section - Single video prominent, 2+ in marquee */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Videos</h3>

          {/* Single video - prominent display */}
          {videos.length === 1 && videos[0] && (
            <div className="max-w-2xl mx-auto">
              <div
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 cursor-pointer group"
                onMouseEnter={() => setHoveredItem(videos[0]!.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleVideoClick(videos[0]!)}
              >
                <OptimizedImage
                  src={getThumbnailUrl(videos[0]!)}
                  alt={videos[0]!.title || 'Video'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  imageSize="large"
                />
                {/* Play button overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity duration-300",
                    hoveredItem === videos[0]!.id ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 transform transition-transform duration-300 hover:scale-110">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                  {videos[0]!.title && (
                    <p className="text-white text-sm font-medium px-4 text-center line-clamp-2">
                      {videos[0]!.title}
                    </p>
                  )}
                  {isOwnProfile && onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(videos[0]!.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {/* Visibility badge for owner view */}
                {isOwnProfile && videos[0]!.visibility !== 'public' && (
                  <VisibilityBadge visibility={videos[0]!.visibility} className="absolute top-2 left-2" />
                )}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              </div>
            </div>
          )}

          {/* Multiple videos - fast auto-advancing carousel */}
          {videos.length >= 2 && (
            <div
              className="relative"
              onMouseEnter={() => setIsVideoHovered(true)}
              onMouseLeave={() => setIsVideoHovered(false)}
            >
              <Carousel
                setApi={setVideoApi}
                opts={{
                  align: 'center',
                  loop: true,
                }}
                plugins={[autoplayPlugin.current]}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {videos.map((video) => (
                    <CarouselItem key={video.id} className="pl-4 basis-full">
                      <div
                        className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 cursor-pointer group"
                        onMouseEnter={() => setHoveredItem(video.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => handleVideoClick(video)}
                      >
                        <OptimizedImage
                          src={getThumbnailUrl(video)}
                          alt={video.title || 'Video'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          imageSize="large"
                        />
                        {/* Play button overlay */}
                        <div
                          className={cn(
                            "absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity duration-300",
                            hoveredItem === video.id ? 'opacity-100' : 'opacity-0'
                          )}
                        >
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 transform transition-transform duration-300 hover:scale-110">
                            <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-white" />
                          </div>
                          {video.title && (
                            <p className="text-white text-xs md:text-sm font-medium px-3 text-center line-clamp-2">
                              {video.title}
                            </p>
                          )}
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
                        {/* Visibility badge for owner view */}
                        {isOwnProfile && video.visibility !== 'public' && (
                          <VisibilityBadge visibility={video.visibility} className="absolute top-2 left-2 z-10" />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Navigation arrows - show on hover */}
              <SliderArrow
                direction="prev"
                onClick={() => videoApi?.scrollPrev()}
                disabled={!canScrollVideoPrev}
                isVisible={isVideoHovered}
              />
              <SliderArrow
                direction="next"
                onClick={() => videoApi?.scrollNext()}
                disabled={!canScrollVideoNext}
                isVisible={isVideoHovered}
              />
            </div>
          )}
        </div>
      )}

      {/* Photos Section - Continuous marquee scroll like Vouches */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Photos</h3>
          <div className="relative overflow-hidden">
            <Marquee pauseOnHover className="[--duration:30s] [--gap:0.5rem]" repeat={photos.length > 3 ? 2 : 4}>
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative h-48 md:h-64 rounded-lg overflow-hidden bg-gray-900 group cursor-pointer shrink-0"
                  onMouseEnter={() => setHoveredItem(photo.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handlePhotoClick(photo, index)}
                >
                  <img
                    src={getMediaUrl(photo)}
                    alt={photo.title || 'Photo'}
                    className="h-full w-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Visibility badge for owner view */}
                  {isOwnProfile && photo.visibility !== 'public' && (
                    <VisibilityBadge visibility={photo.visibility} className="absolute top-2 left-2 z-10" />
                  )}

                  {/* Headshot indicator - gold "HS" bottom left, reveals "Headshot" on hover (edit mode only) */}
                  {isOwnProfile && photo.is_headshot && (
                    <div className="absolute bottom-2 left-2 group/hs">
                      <span className="text-amber-400 font-bold text-sm drop-shadow-lg group-hover/hs:hidden">
                        HS
                      </span>
                      <span className="hidden group-hover/hs:block bg-black/70 text-amber-400 text-xs font-medium px-2 py-1 rounded">
                        Headshot
                      </span>
                    </div>
                  )}

                  {/* 3-Dot Action Menu */}
                  {(isOwnProfile || onDownload) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white z-10",
                            "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* View Details */}
                        {onViewDetails && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetails(photo);
                            }}
                          >
                            <Info className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {/* Download */}
                        {onDownload && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(getMediaUrl(photo), photo.title || 'photo.jpg');
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        )}
                        {/* Edit Photo & Edit Metadata */}
                        {isOwnProfile && (onEditPhoto || onEditMetadata) && (
                          <>
                            <DropdownMenuSeparator />
                            {onEditPhoto && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditPhoto(photo);
                                }}
                              >
                                <Wand2 className="h-4 w-4 mr-2" />
                                Edit Photo
                              </DropdownMenuItem>
                            )}
                            {onEditMetadata && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditMetadata(photo);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Metadata
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        {/* Add to Album */}
                        {isOwnProfile && onAddToAlbum && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToAlbum(photo);
                              }}
                            >
                              <FolderPlus className="h-4 w-4 mr-2" />
                              Add to Album
                            </DropdownMenuItem>
                          </>
                        )}
                        {/* Delete */}
                        {isOwnProfile && onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(photo.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      )}

      {/* Video Player Dialog */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl">
            <VisuallyHidden>
              <DialogTitle>{selectedVideo.title || 'Video'}</DialogTitle>
              <DialogDescription>Video player</DialogDescription>
            </VisuallyHidden>
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

      {/* Photo Lightbox Dialog with Navigation */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-7xl max-h-[90vh] p-0">
            <VisuallyHidden>
              <DialogTitle>{selectedPhoto.title || 'Photo'}</DialogTitle>
              <DialogDescription>Photo viewer</DialogDescription>
            </VisuallyHidden>
            <div className="relative w-full h-full flex items-center justify-center bg-black/95 rounded-lg overflow-hidden">
              {/* Previous Button */}
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('prev');
                  }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}

              <img
                src={getMediaUrl(selectedPhoto)}
                alt={selectedPhoto.title || 'Photo'}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
              />

              {/* Next Button */}
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('next');
                  }}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              )}
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
