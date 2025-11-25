import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generateSignedCDNUrl } from '@/utils/imageOptimization';
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
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate fallback initials
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Resolve signed URL for Supabase storage images
  useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      return;
    }

    // Check if it's a Supabase URL that needs signing
    if (src.includes('supabase')) {
      setIsLoading(true);
      generateSignedCDNUrl(src)
        .then((signedUrl) => {
          setResolvedSrc(signedUrl);
        })
        .catch((err) => {
          console.warn('[OptimizedAvatar] Failed to get signed URL:', err);
          // Fallback to original URL (might fail but worth trying)
          setResolvedSrc(src);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Non-Supabase URLs can be used directly
      setResolvedSrc(src);
    }
  }, [src]);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {resolvedSrc && !isLoading && (
        <AvatarImage
          src={resolvedSrc}
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