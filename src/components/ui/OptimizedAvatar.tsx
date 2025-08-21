import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generateCDNUrl, IMAGE_SIZES } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';

export interface OptimizedAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  src,
  alt,
  name = 'User',
  size = 'md',
  className,
  fallbackClassName,
  priority = false
}) => {
  // Generate optimized URL based on size
  const imageSize = size === 'xl' ? 'avatarLarge' : 'avatar';
  const optimizedSrc = src ? generateCDNUrl(src, IMAGE_SIZES[imageSize]) : null;
  
  // Generate fallback initials
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {optimizedSrc && (
        <AvatarImage
          src={optimizedSrc}
          alt={alt || name}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      <AvatarFallback 
        className={cn(
          textSizeClasses[size],
          'bg-primary text-primary-foreground font-medium',
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};