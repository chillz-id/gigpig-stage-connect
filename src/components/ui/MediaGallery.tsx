import React, { useState } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MediaItem {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  type?: 'image' | 'video';
}

export interface MediaGalleryProps {
  items: MediaItem[];
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  imageClassName?: string;
  showCaptions?: boolean;
  enableLightbox?: boolean;
  aspectRatio?: number;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6'
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
};

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  items,
  columns = 3,
  gap = 'md',
  className,
  imageClassName,
  showCaptions = false,
  enableLightbox = true,
  aspectRatio = 1
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openLightbox = (index: number) => {
    if (enableLightbox) {
      setSelectedIndex(index);
      setIsLoading(true);
    }
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    
    const newIndex = direction === 'next'
      ? (selectedIndex + 1) % items.length
      : (selectedIndex - 1 + items.length) % items.length;
    
    setSelectedIndex(newIndex);
    setIsLoading(true);
  };

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <>
      <div
        className={cn(
          'grid',
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'group relative overflow-hidden rounded-lg',
              enableLightbox && 'cursor-pointer'
            )}
            onClick={() => openLightbox(index)}
          >
            <OptimizedImage
              src={item.src}
              alt={item.alt}
              aspectRatio={aspectRatio}
              className={cn(
                'w-full transition-transform duration-300',
                enableLightbox && 'group-hover:scale-105',
                imageClassName
              )}
              imageSize="medium"
            />
            
            {showCaptions && item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-sm">{item.caption}</p>
              </div>
            )}
            
            {enableLightbox && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {enableLightbox && selectedItem && (
        <Dialog open={selectedIndex !== null} onOpenChange={() => closeLightbox()}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
                onClick={closeLightbox}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation buttons */}
              {items.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox('prev');
                    }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox('next');
                    }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}

              {/* Image */}
              <div className="relative max-w-full max-h-full">
                <OptimizedImage
                  src={selectedItem.src}
                  alt={selectedItem.alt}
                  className="max-w-full max-h-[85vh] object-contain"
                  imageSize="large"
                  quality={95}
                  onLoadComplete={() => setIsLoading(false)}
                  priority
                />
                
                {/* Caption */}
                {selectedItem.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <p className="text-white text-center">{selectedItem.caption}</p>
                  </div>
                )}
              </div>

              {/* Image counter */}
              {items.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  {selectedIndex! + 1} / {items.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};