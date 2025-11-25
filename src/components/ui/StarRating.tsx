import React, { useState, useRef, useCallback } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showValue?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  readonly = false,
  size = 'md',
  className,
  showValue = false,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const currentRating = hoverRating !== null ? hoverRating : rating;

  const calculateRating = useCallback((e: React.MouseEvent | MouseEvent): number => {
    if (!containerRef.current) return 0;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, x / width));

    // Calculate rating in 0.5 increments (0 to 5)
    const rawRating = percentage * 5;
    const roundedRating = Math.round(rawRating * 2) / 2;

    return Math.max(0, Math.min(5, roundedRating));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readonly || !onChange) return;

    setIsDragging(true);
    const newRating = calculateRating(e);
    onChange(newRating);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || readonly || !onChange) return;

    const newRating = calculateRating(e);
    onChange(newRating);
  }, [isDragging, readonly, onChange, calculateRating]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (readonly || !onChange) return;
    const newRating = calculateRating(e);
    setHoverRating(newRating);
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      setHoverRating(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (readonly || !onChange) return;
    const newRating = calculateRating(e);
    onChange(newRating);
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fillPercentage = Math.max(0, Math.min(1, currentRating - index));

    let fillClass = '';
    if (fillPercentage >= 1) {
      fillClass = 'text-yellow-400 fill-yellow-400';
    } else if (fillPercentage >= 0.5) {
      fillClass = 'text-yellow-400';
    } else {
      fillClass = 'text-gray-300';
    }

    return (
      <div key={index} className="relative inline-block">
        {fillPercentage > 0 && fillPercentage < 1 ? (
          <>
            {/* Background star (empty) */}
            <Star className={cn(sizeClasses[size], 'text-gray-300')} />

            {/* Foreground star (half-filled) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercentage * 100}%` }}
            >
              <Star className={cn(sizeClasses[size], 'text-yellow-400 fill-yellow-400')} />
            </div>
          </>
        ) : (
          <Star className={cn(sizeClasses[size], fillClass)} />
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        ref={containerRef}
        className={cn(
          'flex items-center gap-1',
          !readonly && onChange && 'cursor-pointer select-none'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>

      {showValue && (
        <span className="ml-2 text-sm text-muted-foreground">
          {currentRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
