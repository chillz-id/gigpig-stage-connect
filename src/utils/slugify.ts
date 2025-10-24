/**
 * Convert an arbitrary string into a URL-friendly slug.
 * Collapses whitespace and punctuation into hyphens and strips leading/trailing separators.
 */
export const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

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
