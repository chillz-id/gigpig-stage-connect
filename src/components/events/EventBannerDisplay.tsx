import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface EventBannerDisplayProps {
  bannerUrl?: string | null;
  bannerPosition?: { x: number; y: number; scale: number } | null;
  eventName: string;
  className?: string;
  showOverlay?: boolean;
  overlayContent?: React.ReactNode;
}

export const EventBannerDisplay: React.FC<EventBannerDisplayProps> = ({
  bannerUrl,
  bannerPosition,
  eventName,
  className,
  showOverlay = false,
  overlayContent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  // Default position if none provided
  const position = bannerPosition || { x: 0, y: 0, scale: 1 };

  // Default banner image
  const defaultBanner = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=450&fit=crop';

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const containerRect = containerRef.current?.getBoundingClientRect();

    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });

    // Calculate minimum scale to ensure image covers the banner area
    // This matches the scale calculation in EventBannerImageEditor
    if (containerRect) {
      const scaleToFitWidth = containerRect.width / img.naturalWidth;
      const scaleToFitHeight = containerRect.height / img.naturalHeight;
      const calculatedScale = Math.max(scaleToFitWidth, scaleToFitHeight);
      setScale(calculatedScale);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden bg-black', className)}
    >
      <div className="relative w-full aspect-[8/3]">
        {(bannerUrl || defaultBanner) ? (
          <img
            ref={imageRef}
            src={bannerUrl || defaultBanner}
            alt={eventName}
            className="absolute block"
            style={{
              width: imageDimensions.width ? `${imageDimensions.width * (bannerPosition?.scale || scale)}px` : 'auto',
              height: imageDimensions.height ? `${imageDimensions.height * (bannerPosition?.scale || scale)}px` : 'auto',
              transform: `translate(${position.x}px, ${position.y}px)`,
              transformOrigin: 'top left',
              objectFit: 'none',
              maxWidth: 'none',
              maxHeight: 'none',
            }}
            onLoad={handleImageLoad}
          />
        ) : (
          // Fallback gradient if no banner
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        )}

        {/* Overlay content (event details, etc.) */}
        {showOverlay && overlayContent && (
          <div className="absolute inset-0">
            {overlayContent}
          </div>
        )}
      </div>
    </div>
  );
};
