/**
 * Reserved slugs that cannot be used for profile URLs
 * These match static routes in the application
 */
export const RESERVED_SLUGS = [
  'dashboard',
  'settings',
  'admin',
  'api',
  'auth',
  'create-event',
  'messages',
  'notifications',
  'profile',
  'shows',
  'gigs',
  'comedians',
  'organizations',
  'venues',
  'managers',
  'about',
  'contact',
  'privacy',
  'terms',
  'applications',
  'invoices',
  'earnings',
  'tasks',
  'crm',
  'media-library',
  'vouches',
];

/**
 * Convert text to URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Validate slug format and restrictions
 */
export function validateSlug(
  slug: string
): { valid: boolean; error?: string } {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: 'URL slug is required' };
  }

  if (slug.length < 3) {
    return {
      valid: false,
      error: 'URL slug must be at least 3 characters long',
    };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      valid: false,
      error: 'URL slug can only contain lowercase letters, numbers, and hyphens',
    };
  }

  if (isReservedSlug(slug)) {
    return {
      valid: false,
      error: 'This URL slug is reserved and cannot be used',
    };
  }

  return { valid: true };
}

/**
 * Ensure a slug candidate is not empty by falling back to a timestamp-based suffix when needed.
 */
export const ensureSlug = (value: string): string => {
  const base = slugify(value);
  if (base.length > 0) {
    return base;
  }
  return `segment-${Date.now()}`;
};
