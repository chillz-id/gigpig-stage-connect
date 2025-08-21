/**
 * CDN Configuration for optimized media delivery
 */

export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  cacheDuration: number;
  transformations: {
    quality: number;
    format: 'auto' | 'webp' | 'avif' | 'jpg';
    progressive: boolean;
  };
}

// CDN configuration for different environments
export const cdnConfig: Record<string, CDNConfig> = {
  production: {
    enabled: true,
    baseUrl: import.meta.env.VITE_CDN_URL || '',
    cacheDuration: 31536000, // 1 year in seconds
    transformations: {
      quality: 85,
      format: 'auto',
      progressive: true
    }
  },
  development: {
    enabled: false,
    baseUrl: '',
    cacheDuration: 0,
    transformations: {
      quality: 90,
      format: 'auto',
      progressive: true
    }
  }
};

/**
 * Get current CDN configuration based on environment
 */
export function getCDNConfig(): CDNConfig {
  const env = import.meta.env.MODE || 'development';
  return cdnConfig[env] || cdnConfig.development;
}

/**
 * Build CDN URL with cache busting
 */
export function buildCDNUrl(path: string, version?: string): string {
  const config = getCDNConfig();
  
  if (!config.enabled || !config.baseUrl) {
    return path;
  }
  
  const url = new URL(path, config.baseUrl);
  
  // Add cache control headers
  if (config.cacheDuration > 0) {
    url.searchParams.set('cache', config.cacheDuration.toString());
  }
  
  // Add version for cache busting
  if (version) {
    url.searchParams.set('v', version);
  }
  
  return url.toString();
}

/**
 * Generate responsive image URLs with CDN
 */
export function generateCDNImageSet(
  path: string,
  sizes: { width: number; height?: number }[]
): { [key: string]: string } {
  const config = getCDNConfig();
  const imageSet: { [key: string]: string } = {};
  
  sizes.forEach(({ width, height }) => {
    const url = new URL(path, config.baseUrl || window.location.origin);
    
    // Add transformation parameters
    url.searchParams.set('w', width.toString());
    if (height) {
      url.searchParams.set('h', height.toString());
    }
    url.searchParams.set('q', config.transformations.quality.toString());
    url.searchParams.set('fm', config.transformations.format);
    
    if (config.transformations.progressive) {
      url.searchParams.set('progressive', 'true');
    }
    
    const key = height ? `${width}x${height}` : `${width}w`;
    imageSet[key] = url.toString();
  });
  
  return imageSet;
}

/**
 * Preconnect to CDN for better performance
 */
export function preconnectCDN(): void {
  const config = getCDNConfig();
  
  if (!config.enabled || !config.baseUrl) {
    return;
  }
  
  try {
    const url = new URL(config.baseUrl);
    const origin = url.origin;
    
    // Add preconnect link
    const preconnectLink = document.createElement('link');
    preconnectLink.rel = 'preconnect';
    preconnectLink.href = origin;
    document.head.appendChild(preconnectLink);
    
    // Add dns-prefetch as fallback
    const dnsPrefetchLink = document.createElement('link');
    dnsPrefetchLink.rel = 'dns-prefetch';
    dnsPrefetchLink.href = origin;
    document.head.appendChild(dnsPrefetchLink);
  } catch (error) {
    console.error('Failed to preconnect to CDN:', error);
  }
}

/**
 * Initialize CDN optimizations
 */
export function initializeCDN(): void {
  // Preconnect to CDN
  preconnectCDN();
  
  // Add resource hints for critical images
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    // Adjust quality based on connection speed
    if (connection && connection.effectiveType) {
      const config = getCDNConfig();
      
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          config.transformations.quality = 60;
          break;
        case '3g':
          config.transformations.quality = 70;
          break;
        case '4g':
        default:
          config.transformations.quality = 85;
          break;
      }
    }
  }
}