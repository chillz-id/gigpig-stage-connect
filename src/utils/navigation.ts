/**
 * Navigation Utilities
 *
 * Provides helpers for navigation that work around React Router limitations
 * with nested routes and Outlet components.
 *
 * WHEN TO USE:
 * - forceNavigate(): When navigating between nested routes that share a parent
 *   layout but React Router's navigate() doesn't trigger a re-render
 * - Standard navigate(): For simple route changes within the same layout
 *
 * BACKGROUND:
 * React Router's navigate() can fail to re-render when:
 * 1. Navigating between sibling nested routes (same parent Outlet)
 * 2. The parent layout component doesn't remount
 * 3. Hot Module Replacement interferes with route updates
 *
 * Using window.location.href forces a full navigation, ensuring the
 * correct component renders.
 */

/**
 * Force navigation using window.location.href
 *
 * Use this when React Router's navigate() doesn't trigger a re-render,
 * particularly for cross-nested-route navigation.
 *
 * @param path - The path to navigate to (e.g., '/comedian/chillz-skinner')
 * @param options - Optional configuration
 * @param options.replace - If true, replaces current history entry (like navigate with replace: true)
 *
 * @example
 * // Navigate to EPK page from profile edit
 * forceNavigate('/comedian/chillz-skinner');
 *
 * @example
 * // Replace current history entry
 * forceNavigate('/dashboard', { replace: true });
 */
export function forceNavigate(path: string, options?: { replace?: boolean }): void {
  if (options?.replace) {
    window.location.replace(path);
  } else {
    window.location.href = path;
  }
}

/**
 * Build a profile URL for any profile type
 *
 * @param profileType - The type of profile ('comedian', 'manager', 'org', 'venue', 'photographer')
 * @param slug - The profile's URL slug
 * @param page - Optional page within the profile (e.g., 'edit', 'links', 'dashboard')
 * @returns The full URL path
 *
 * @example
 * buildProfileUrl('comedian', 'chillz-skinner') // '/comedian/chillz-skinner'
 * buildProfileUrl('comedian', 'chillz-skinner', 'edit') // '/comedian/chillz-skinner/edit'
 * buildProfileUrl('org', 'id-comedy', 'dashboard') // '/org/id-comedy/dashboard'
 */
export function buildProfileUrl(
  profileType: 'comedian' | 'manager' | 'org' | 'organization' | 'venue' | 'photographer',
  slug: string,
  page?: string
): string {
  // Normalize organization to org for URL
  const urlType = profileType === 'organization' ? 'org' : profileType;

  const basePath = `/${urlType}/${slug}`;
  return page ? `${basePath}/${page}` : basePath;
}

/**
 * Navigate to a profile page, using forceNavigate for reliability
 *
 * @param profileType - The type of profile
 * @param slug - The profile's URL slug
 * @param page - Optional page within the profile
 *
 * @example
 * navigateToProfile('comedian', 'chillz-skinner'); // Goes to EPK
 * navigateToProfile('comedian', 'chillz-skinner', 'edit'); // Goes to profile edit
 */
export function navigateToProfile(
  profileType: 'comedian' | 'manager' | 'org' | 'organization' | 'venue' | 'photographer',
  slug: string,
  page?: string
): void {
  const url = buildProfileUrl(profileType, slug, page);
  forceNavigate(url);
}
