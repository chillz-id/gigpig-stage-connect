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

  // Resolve URL for images
  useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      return;
    }

    // Check if it's a marker URL that needs async resolution
    if (src.startsWith('supabase-storage://')) {
      setIsLoading(true);
      generateSignedCDNUrl(src)
        .then((signedUrl) => {
          setResolvedSrc(signedUrl || null);
        })
        .catch((err) => {
          console.warn('[OptimizedAvatar] Failed to resolve marker URL:', err);
          setResolvedSrc(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (src.includes('/object/public/')) {
      // Public Supabase URLs can be used directly - no signing needed
      setResolvedSrc(src);
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
      // Other external URLs can be used directly
      setResolvedSrc(src);
    } else {
      // Relative path - try to construct a public URL
      // Assume profile-images bucket for backwards compatibility
      const publicUrl = `https://${import.meta.env.VITE_SUPABASE_URL?.replace('https://', '')}/storage/v1/object/public/profile-images/${src}`;
      setResolvedSrc(publicUrl);
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