import React, { useState, useRef } from 'react';
import { Move, Upload, Check, X } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/button';

interface BannerImageProps {
  banner_url: string | null;
  banner_position?: { x: number; y: number; scale: number } | null;
  isOwnProfile: boolean;
  onEditClick: () => void;
  onRepositionSave?: (position: { x: number; y: number; scale: number }) => void;
}

export const BannerImage: React.FC<BannerImageProps> = ({
  banner_url,
  banner_position,
  isOwnProfile,
  onEditClick,
  onRepositionSave,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Default position if none provided
  const initialPosition = banner_position || { x: 0, y: 0, scale: 1 };
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(1); // Locked to minScale, no zoom allowed
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Calculate bounds for repositioning (constrain to viewport)
  const calculateBounds = () => {
    if (!containerRef.current || imageDimensions.width === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;

    // Calculate valid range for x and y
    // If image is larger than container, allow negative positioning up to the overflow
    // If image is smaller, keep it at 0
    const minX = scaledWidth > containerRect.width ? -(scaledWidth - containerRect.width) : 0;
    const maxX = 0;
    const minY = scaledHeight > containerRect.height ? -(scaledHeight - containerRect.height) : 0;
    const maxY = 0;

    return { minX, maxX, minY, maxY };
  };

  // Clamp position within bounds
  const clampPosition = (pos: { x: number; y: number }) => {
    const bounds = calculateBounds();
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, pos.x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, pos.y)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isRepositioning) return;
    const newPosition = {
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    };
    setPosition(clampPosition(newPosition));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeaveContainer = () => {
    setIsHovered(false);
    setIsDragging(false);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const containerRect = containerRef.current?.getBoundingClientRect();

    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });

    // Calculate minimum scale to ensure image always covers the banner
    // Scale is LOCKED to this minimum - no zoom in or out allowed
    if (containerRect) {
      const scaleToFitWidth = containerRect.width / img.naturalWidth;
      const scaleToFitHeight = containerRect.height / img.naturalHeight;
      const calculatedMinScale = Math.max(scaleToFitWidth, scaleToFitHeight);

      // Lock scale to minimum - this ensures all banners are the same size
      setScale(calculatedMinScale);

      // Reclamp position with new scale
      setPosition(prev => clampPosition(prev));
    }
  };

  const handleRepositionClick = () => {
    setIsRepositioning(true);
  };

  const handleSave = () => {
    if (onRepositionSave) {
      onRepositionSave({
        x: position.x,
        y: position.y,
        scale: scale,
      });
    }
    setIsRepositioning(false);
  };

  const handleCancel = () => {
    setPosition(initialPosition);
    // Scale stays locked at minimum, don't reset it
    setIsRepositioning(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeaveContainer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {banner_url ? (
        <img
          src={banner_url}
          alt="Profile banner"
          className={`absolute block flex-shrink-0 ${isRepositioning ? 'cursor-move' : ''}`}
          style={{
            width: imageDimensions.width ? `${imageDimensions.width * scale}px` : 'auto',
            height: imageDimensions.height ? `${imageDimensions.height * scale}px` : 'auto',
            transform: `translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'top left',
            objectFit: 'none',
            maxWidth: 'none',
            maxHeight: 'none',
          }}
          onLoad={handleImageLoad}
        />
      ) : (
        // Fallback gradient if no banner image
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      )}

      {/* Repositioning overlay with instructions */}
      {isRepositioning && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white text-center">
            <p className="text-sm font-medium">Drag to reposition banner</p>
            <p className="text-xs text-white/70 mt-1">Image is locked to cover full banner area</p>
          </div>
        </div>
      )}

      {/* No hover overlay when not repositioning - icons are always visible in corner */}

      {/* Icon buttons - only visible for own profile */}
      {isOwnProfile && (
        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
          {isRepositioning ? (
            <>
              <button
                onClick={handleCancel}
                className="bg-red-600/90 hover:bg-red-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110"
                aria-label="Cancel repositioning"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600/90 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110"
                aria-label="Save position"
              >
                <Check className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              {banner_url && onRepositionSave && (
                <button
                  onClick={handleRepositionClick}
                  className="bg-blue-600/90 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110"
                  aria-label="Reposition banner"
                >
                  <Move className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onEditClick}
                className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110"
                aria-label="Upload banner"
              >
                <Upload className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
