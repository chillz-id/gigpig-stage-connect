import { supabase } from '@/integrations/supabase/client';

// Image size presets for different use cases
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 300, height: 300, quality: 85 },
  medium: { width: 600, height: 600, quality: 90 },
  large: { width: 1200, height: 1200, quality: 95 },
  hero: { width: 1920, height: 1080, quality: 95 },
  og: { width: 1200, height: 630, quality: 90 },
  avatar: { width: 200, height: 200, quality: 90 },
  avatarLarge: { width: 400, height: 400, quality: 95 }
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ResponsiveImageUrls {
  original: string;
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  webp?: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
  };
  avif?: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
  };
}

/**
 * Generate CDN URL with image transformations
 * Supports Supabase Storage transformations and fallback CDN options
 */
export function generateCDNUrl(
  path: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!path) return '';

  // If already a full URL, check if it's a Supabase URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const url = new URL(path);
    
    // Apply transformations to Supabase URLs
    if (url.hostname.includes('supabase')) {
      const { width, height, quality = 90, format = 'webp' } = options;
      
      // Supabase image transformation API
      if (width) url.searchParams.set('width', width.toString());
      if (height) url.searchParams.set('height', height.toString());
      url.searchParams.set('quality', quality.toString());
      url.searchParams.set('format', format);
      
      return url.toString();
    }
    
    return path;
  }

  // For relative paths, construct full Supabase URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(path);

  return generateCDNUrl(publicUrl, options);
}

/**
 * Generate multiple optimized URLs for responsive images
 */
export function generateResponsiveUrls(path: string): ResponsiveImageUrls {
  const original = generateCDNUrl(path);
  
  return {
    original,
    thumbnail: generateCDNUrl(path, { ...IMAGE_SIZES.thumbnail, format: 'jpg' }),
    small: generateCDNUrl(path, { ...IMAGE_SIZES.small, format: 'jpg' }),
    medium: generateCDNUrl(path, { ...IMAGE_SIZES.medium, format: 'jpg' }),
    large: generateCDNUrl(path, { ...IMAGE_SIZES.large, format: 'jpg' }),
    webp: {
      thumbnail: generateCDNUrl(path, { ...IMAGE_SIZES.thumbnail, format: 'webp' }),
      small: generateCDNUrl(path, { ...IMAGE_SIZES.small, format: 'webp' }),
      medium: generateCDNUrl(path, { ...IMAGE_SIZES.medium, format: 'webp' }),
      large: generateCDNUrl(path, { ...IMAGE_SIZES.large, format: 'webp' })
    },
    avif: supportsAvif() ? {
      thumbnail: generateCDNUrl(path, { ...IMAGE_SIZES.thumbnail, format: 'avif' }),
      small: generateCDNUrl(path, { ...IMAGE_SIZES.small, format: 'avif' }),
      medium: generateCDNUrl(path, { ...IMAGE_SIZES.medium, format: 'avif' }),
      large: generateCDNUrl(path, { ...IMAGE_SIZES.large, format: 'avif' })
    } : undefined
  };
}

/**
 * Generate srcset string for responsive images
 */
export function generateSrcSet(path: string, sizes: ImageSize[] = ['small', 'medium', 'large']): string {
  return sizes
    .map(size => {
      const config = IMAGE_SIZES[size];
      const url = generateCDNUrl(path, config);
      return `${url} ${config.width}w`;
    })
    .join(', ');
}

/**
 * Check if browser supports AVIF format
 */
export function supportsAvif(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.toDataURL('image/avif').startsWith('data:image/avif');
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Preload critical images for better performance
 */
export function preloadImage(url: string, as: 'image' | 'fetch' = 'image'): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = url;
  
  // Add format hint for modern formats
  if (url.includes('.webp')) {
    link.type = 'image/webp';
  } else if (url.includes('.avif')) {
    link.type = 'image/avif';
  }
  
  document.head.appendChild(link);
}

/**
 * Generate placeholder data URL for lazy loading
 */
export function generatePlaceholder(width: number = 40, height: number = 40): string {
  // Simple SVG placeholder with loading animation
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </rect>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Calculate optimal image dimensions maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Process and optimize uploaded image
 */
export async function processUploadedImage(
  file: File,
  userId: string
): Promise<{ path: string; urls: ResponsiveImageUrls }> {
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `${timestamp}.${extension}`;
  const path = `${userId}/${filename}`;
  
  // Upload original image
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    throw uploadError;
  }
  
  // Generate responsive URLs
  const urls = generateResponsiveUrls(path);
  
  return { path, urls };
}

/**
 * Get optimized comedian profile image with fallback
 */
export function getComedianProfileImage(
  comedian: {
    avatar_url?: string | null;
    profile_picture?: string | null;
    name?: string;
    stage_name?: string;
  },
  size: ImageSize = 'medium'
): string {
  const imageUrl = comedian.avatar_url || comedian.profile_picture;
  
  if (imageUrl) {
    return generateCDNUrl(imageUrl, IMAGE_SIZES[size]);
  }
  
  // Generate placeholder with initials
  const name = comedian.stage_name || comedian.name || 'Comedian';
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const { width } = IMAGE_SIZES[size];
  
  // Use UI Avatars service as fallback
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${width}&background=9333ea&color=ffffff&bold=true`;
}