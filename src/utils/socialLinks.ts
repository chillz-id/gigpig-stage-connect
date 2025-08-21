/**
 * Social Media Link Intelligence Utility
 * Converts @username or username inputs to full social media URLs
 */

export interface SocialPlatform {
  name: string;
  urlTemplate: (username: string) => string;
  usernamePrefix?: string; // Whether to include @ in the final URL
  displayName: string;
  placeholder: string;
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  instagram: {
    name: 'instagram',
    urlTemplate: (username) => `https://instagram.com/${username}`,
    displayName: 'Instagram',
    placeholder: 'Enter @username or username'
  },
  twitter: {
    name: 'twitter',
    urlTemplate: (username) => `https://twitter.com/${username}`,
    displayName: 'Twitter/X',
    placeholder: 'Enter @username or username'
  },
  tiktok: {
    name: 'tiktok',
    urlTemplate: (username) => `https://tiktok.com/@${username}`,
    usernamePrefix: '@',
    displayName: 'TikTok',
    placeholder: 'Enter @username or username'
  },
  youtube: {
    name: 'youtube',
    urlTemplate: (username) => `https://youtube.com/@${username}`,
    usernamePrefix: '@',
    displayName: 'YouTube',
    placeholder: 'Enter @username or channel name'
  },
  facebook: {
    name: 'facebook',
    urlTemplate: (username) => `https://facebook.com/${username}`,
    displayName: 'Facebook',
    placeholder: 'Enter username or page name'
  },
  linkedin: {
    name: 'linkedin',
    urlTemplate: (username) => `https://linkedin.com/in/${username}`,
    displayName: 'LinkedIn',
    placeholder: 'Enter username'
  },
  website: {
    name: 'website',
    urlTemplate: (url) => url.startsWith('http') ? url : `https://${url}`,
    displayName: 'Website',
    placeholder: 'Enter website URL'
  }
};

/**
 * Extracts a clean username from various input formats
 */
export function extractUsername(input: string): string {
  if (!input) return '';
  
  let cleaned = input.trim();
  
  // Remove @ symbol if present at the start
  if (cleaned.startsWith('@')) {
    cleaned = cleaned.substring(1);
  }
  
  // Remove common URL prefixes
  const urlPrefixes = [
    'https://instagram.com/',
    'https://www.instagram.com/',
    'https://twitter.com/',
    'https://www.twitter.com/',
    'https://tiktok.com/@',
    'https://www.tiktok.com/@',
    'https://youtube.com/@',
    'https://www.youtube.com/@',
    'https://youtube.com/channel/',
    'https://www.youtube.com/channel/',
    'https://facebook.com/',
    'https://www.facebook.com/',
    'https://linkedin.com/in/',
    'https://www.linkedin.com/in/',
    'http://instagram.com/',
    'http://www.instagram.com/',
    'http://twitter.com/',
    'http://www.twitter.com/',
    'http://tiktok.com/@',
    'http://www.tiktok.com/@',
    'http://youtube.com/@',
    'http://www.youtube.com/@',
    'http://facebook.com/',
    'http://www.facebook.com/',
    'http://linkedin.com/in/',
    'http://www.linkedin.com/in/',
  ];
  
  for (const prefix of urlPrefixes) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.substring(prefix.length);
      break;
    }
  }
  
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  
  return cleaned;
}

/**
 * Validates if a username is in a valid format
 */
export function validateUsername(username: string, platform: string = 'instagram'): {
  isValid: boolean;
  error?: string;
} {
  if (!username) {
    return { isValid: true }; // Empty is valid (optional field)
  }
  
  const cleaned = extractUsername(username);
  
  // General username validation
  if (cleaned.length < 1) {
    return { isValid: false, error: 'Username cannot be empty' };
  }
  
  if (cleaned.length > 30) {
    return { isValid: false, error: 'Username is too long (max 30 characters)' };
  }
  
  // Check for invalid characters (allow letters, numbers, dots, underscores, hyphens)
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  if (!validPattern.test(cleaned)) {
    return { isValid: false, error: 'Username contains invalid characters' };
  }
  
  // Platform-specific validation
  switch (platform) {
    case 'instagram':
    case 'twitter':
      if (cleaned.includes('..')) {
        return { isValid: false, error: 'Consecutive dots not allowed' };
      }
      break;
    case 'tiktok':
      if (cleaned.startsWith('.') || cleaned.endsWith('.')) {
        return { isValid: false, error: 'Username cannot start or end with a dot' };
      }
      break;
  }
  
  return { isValid: true };
}

/**
 * Converts user input to a full social media URL
 */
export function convertToSocialUrl(platform: string, input: string): {
  url: string;
  username: string;
  isValid: boolean;
  error?: string;
} {
  if (!input) {
    return { url: '', username: '', isValid: true };
  }
  
  // Handle website URLs differently
  if (platform === 'website') {
    const trimmed = input.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { url: trimmed, username: trimmed, isValid: true };
    } else {
      const url = `https://${trimmed}`;
      return { url, username: trimmed, isValid: true };
    }
  }
  
  // If it's already a full URL, extract username and reconstruct
  const username = extractUsername(input);
  const validation = validateUsername(username, platform);
  
  if (!validation.isValid) {
    return { 
      url: input, 
      username, 
      isValid: false, 
      error: validation.error 
    };
  }
  
  const platformConfig = SOCIAL_PLATFORMS[platform];
  if (!platformConfig) {
    return { url: input, username, isValid: false, error: 'Unknown platform' };
  }
  
  const url = platformConfig.urlTemplate(username);
  
  return { url, username, isValid: true };
}

/**
 * Gets the display name for a platform
 */
export function getPlatformDisplayName(platform: string): string {
  return SOCIAL_PLATFORMS[platform]?.displayName || platform;
}

/**
 * Gets the placeholder text for a platform
 */
export function getPlatformPlaceholder(platform: string): string {
  return SOCIAL_PLATFORMS[platform]?.placeholder || 'Enter username';
}

/**
 * Formats a username for display (adds @ if needed for certain platforms)
 */
export function formatUsernameDisplay(username: string, platform: string): string {
  if (!username) return '';
  
  const platformConfig = SOCIAL_PLATFORMS[platform];
  if (platformConfig?.usernamePrefix) {
    return `${platformConfig.usernamePrefix}${username}`;
  }
  
  return username;
}