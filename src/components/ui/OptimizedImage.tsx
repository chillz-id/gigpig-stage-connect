import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { 
  generateCDNUrl, 
  generateSrcSet, 
  generatePlaceholder,
  supportsWebP,
  supportsAvif,
  preloadImage,
  ImageSize,
  IMAGE_SIZES
} from '@/utils/imageOptimization';

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
  aspectRatio?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  imageSize?: ImageSize;
  lazy?: boolean;
  blur?: boolean;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  sizes = '100vw',
  priority = false,
  fallbackSrc,
  aspectRatio,
  objectFit = 'cover',
  quality = 90,
  imageSize = 'medium',
  lazy = true,
  blur = true,
  className,
  onLoadComplete,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized URLs
  const imageConfig = IMAGE_SIZES[imageSize];
  const optimizedSrc = generateCDNUrl(src, { ...imageConfig, quality });
  const srcSet = generateSrcSet(src);
  
  // Generate WebP and AVIF sources
  const webpSrc = supportsWebP() ? generateCDNUrl(src, { ...imageConfig, format: 'webp', quality }) : null;
  const avifSrc = supportsAvif() ? generateCDNUrl(src, { ...imageConfig, format: 'avif', quality }) : null;

  // Setup Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) {
      setCurrentSrc(optimizedSrc);
      if (priority) {
        preloadImage(optimizedSrc);
      }
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCurrentSrc(optimizedSrc);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [src, optimizedSrc, lazy, priority]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.(new Error(`Failed to load image: ${src}`));
    }
  };

  const containerStyle = aspectRatio
    ? { paddingBottom: `${(1 / aspectRatio) * 100}%` }
    : undefined;

  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        aspectRatio && 'w-full h-0',
        className
      )}
      style={containerStyle}
    >
      {/* Placeholder/Loading state */}
      {isLoading && blur && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 dark:bg-gray-800',
            'animate-pulse'
          )}
          aria-hidden="true"
        >
          <img
            src={generatePlaceholder(imageConfig.width, imageConfig.height)}
            alt=""
            className="w-full h-full object-cover blur-lg opacity-50"
          />
        </div>
      )}

      {/* Picture element for format support */}
      <picture>
        {avifSrc && (
          <source 
            srcSet={generateSrcSet(src, ['small', 'medium', 'large'])} 
            type="image/avif"
          />
        )}
        {webpSrc && (
          <source 
            srcSet={generateSrcSet(src, ['small', 'medium', 'large'])} 
            type="image/webp"
          />
        )}
        
        <img
          ref={imgRef}
          src={currentSrc || generatePlaceholder()}
          srcSet={currentSrc ? srcSet : undefined}
          sizes={sizes}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy && !priority ? 'lazy' : undefined}
          className={cn(
            'transition-opacity duration-300',
            aspectRatio && 'absolute inset-0 w-full h-full',
            isLoading ? 'opacity-0' : 'opacity-100',
            `object-${objectFit}`,
            props.className
          )}
          {...props}
        />
      </picture>

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400'
        )}>
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">{alt}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton loader component for consistent loading states
export const ImageSkeleton: React.FC<{
  className?: string;
  aspectRatio?: number;
}> = ({ className, aspectRatio }) => {
  const containerStyle = aspectRatio
    ? { paddingBottom: `${(1 / aspectRatio) * 100}%` }
    : undefined;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-200 dark:bg-gray-800',
        'animate-pulse rounded',
        aspectRatio && 'w-full h-0',
        className
      )}
      style={containerStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent skeleton-shimmer" />
    </div>
  );
};