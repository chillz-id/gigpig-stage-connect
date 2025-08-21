/**
 * Utilities for optimizing images for social media sharing
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}

/**
 * Generate optimized image URL for social sharing
 * Uses Supabase's image transformation API
 */
export const getOptimizedImageUrl = (
  originalUrl: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string => {
  if (!originalUrl) {
    return '/og-default.jpg';
  }
  
  // If it's already a full URL, return as is
  if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
    return originalUrl;
  }
  
  // Default options for social media sharing
  const {
    width = 1200,
    height = 630,
    quality = 90,
    format = 'jpg'
  } = options;
  
  // If it's a Supabase storage URL, apply transformations
  if (originalUrl.includes('supabase')) {
    const url = new URL(originalUrl);
    url.searchParams.set('width', width.toString());
    url.searchParams.set('height', height.toString());
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('format', format);
    return url.toString();
  }
  
  // For local images, return with base URL
  const baseUrl = window.location.origin;
  return `${baseUrl}${originalUrl}`;
};

/**
 * Generate multiple image sizes for responsive social media cards
 */
export const generateImageSizes = (originalUrl: string | null | undefined) => {
  return {
    og: getOptimizedImageUrl(originalUrl, { width: 1200, height: 630 }),
    twitter: getOptimizedImageUrl(originalUrl, { width: 1200, height: 600 }),
    facebook: getOptimizedImageUrl(originalUrl, { width: 1200, height: 630 }),
    instagram: getOptimizedImageUrl(originalUrl, { width: 1080, height: 1080 }),
    thumbnail: getOptimizedImageUrl(originalUrl, { width: 400, height: 400, quality: 80 })
  };
};

/**
 * Get the best available image for a comedian profile
 */
export const getComedianProfileImage = (comedian: {
  avatar_url?: string | null;
  profile_picture?: string | null;
  name?: string;
  stage_name?: string;
}): string => {
  // Priority: avatar_url > profile_picture > default
  const imageUrl = comedian.avatar_url || comedian.profile_picture;
  
  if (imageUrl) {
    return getOptimizedImageUrl(imageUrl);
  }
  
  // Generate a placeholder with initials
  const name = comedian.stage_name || comedian.name || 'Comedian';
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Use a placeholder service
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=1200&background=9333ea&color=ffffff&bold=true`;
};