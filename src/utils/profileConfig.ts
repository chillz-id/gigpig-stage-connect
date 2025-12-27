/**
 * Universal Profile Configuration
 *
 * Central configuration defining sections, labels, tables, and field visibility
 * for all profile types. This enables ONE profile editor to work across:
 * - Comedian
 * - Organization
 * - Photographer
 * - Videographer
 * - Manager
 *
 * Usage:
 * ```tsx
 * const config = getProfileConfig('comedian');
 * const label = config.labels.highlights; // "Career Highlights"
 * ```
 */

import type { ProfileConfigMap, ProfileType, ProfileConfig } from '@/types/universalProfile';

/**
 * Complete profile configuration for all types
 */
export const profileConfig: ProfileConfigMap = {
  // ============================================
  // COMEDIAN PROFILE
  // ============================================
  comedian: {
    sections: ['personal', 'media', 'contact', 'financial', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Personal Information',
      media: 'Media Portfolio',
      contact: 'Contact Information',
      financial: 'Financial Information',
      highlights: 'Career Highlights',
      reviews: 'Press Reviews',
      links: 'Custom Links',
      image: 'Profile Picture',
      primaryName: 'First Name',
      secondaryName: 'Stage Name',
      bio: 'Biography',
    },
    tables: {
      main: 'profiles',
      media: 'comedian_media',
      accomplishments: 'comedian_accomplishments',
      reviews: 'comedian_press_reviews',
      links: 'comedian_custom_links',
    },
    fields: {
      hasSecondaryName: true,     // Show stage_name field
      hasExperience: true,         // Show years_active field
      hasFinancial: true,          // Show financial section
      hasRates: false,             // No hourly rates
      hasMedia: true,              // Show media portfolio
    },
  },

  // ============================================
  // ORGANIZATION PROFILE
  // ============================================
  organization: {
    sections: ['personal', 'media', 'contact', 'financial', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Business Information',
      media: 'Media Portfolio',
      contact: 'Contact Information',
      financial: 'Financial Information',
      highlights: 'Company Highlights',
      reviews: 'Press Reviews',
      links: 'Custom Links',
      image: 'Logo',
      primaryName: 'Organization Name',
      secondaryName: 'Legal Name',
      bio: 'Company Description',
      // Organization-specific labels
      highlightsButton: '+ Company Highlights',
      highlightsEmpty: 'No company highlights yet. Add your notable accomplishments, awards, and company milestones',
      publicContact: 'Public Contact',
      platformContact: 'Platform Only',
    },
    tables: {
      main: 'organization_profiles',
      media: 'organization_media',
      accomplishments: 'organization_accomplishments',
      reviews: 'organization_press_reviews',
      links: 'organization_custom_links',
    },
    fields: {
      hasSecondaryName: true,     // Show legal_name field
      hasExperience: false,        // No years_active for orgs
      hasFinancial: true,          // Show financial section
      hasRates: false,             // No hourly rates
      hasMedia: true,              // Show media portfolio
      hasLastName: false,          // Hide last name for organizations
      hasLinkedIn: true,           // Show LinkedIn field
      hasStateDropdown: true,      // Use Australian states dropdown instead of text input
    },
  },

  // ============================================
  // PHOTOGRAPHER PROFILE
  // ============================================
  photographer: {
    sections: ['personal', 'media', 'contact', 'financial', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Personal Information',
      media: 'Portfolio',
      contact: 'Contact Information',
      financial: 'Rates & Availability',
      highlights: 'Experience Highlights',
      reviews: 'Client Reviews',
      links: 'Custom Links',
      image: 'Profile Picture',
      primaryName: 'First Name',
      bio: 'About Me',
    },
    tables: {
      main: 'profiles',
      media: 'photographer_portfolio_items',
      accomplishments: 'photographer_accomplishments',
      reviews: 'photographer_press_reviews',
      links: 'photographer_custom_links',
    },
    fields: {
      hasSecondaryName: false,    // No stage_name
      hasExperience: true,        // Show years_active
      hasFinancial: true,         // Show financial section
      hasRates: true,             // Show hourly rates
      hasMedia: true,             // Show portfolio
    },
  },

  // ============================================
  // VIDEOGRAPHER PROFILE
  // ============================================
  videographer: {
    sections: ['personal', 'media', 'contact', 'financial', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Personal Information',
      media: 'Portfolio & Reels',
      contact: 'Contact Information',
      financial: 'Rates & Availability',
      highlights: 'Experience Highlights',
      reviews: 'Client Reviews',
      links: 'Custom Links',
      image: 'Profile Picture',
      primaryName: 'First Name',
      bio: 'About Me',
    },
    tables: {
      main: 'profiles',
      media: 'videographer_portfolio_items',
      accomplishments: 'videographer_accomplishments',
      reviews: 'videographer_press_reviews',
      links: 'videographer_custom_links',
    },
    fields: {
      hasSecondaryName: false,    // No stage_name
      hasExperience: true,        // Show years_active
      hasFinancial: true,         // Show financial section
      hasRates: true,             // Show hourly rates
      hasMedia: true,             // Show portfolio & reels
    },
  },

  // ============================================
  // MANAGER PROFILE
  // ============================================
  manager: {
    sections: ['personal', 'contact', 'highlights', 'reviews', 'links'],
    labels: {
      personal: 'Personal Information',
      contact: 'Contact Information',
      highlights: 'Career Highlights',
      reviews: 'Testimonials',
      links: 'Custom Links',
      image: 'Profile Picture',
      primaryName: 'First Name',
      bio: 'About Me',
    },
    tables: {
      main: 'comedy_manager_profiles',
      accomplishments: 'manager_accomplishments',
      reviews: 'manager_press_reviews',
      links: 'manager_custom_links',
    },
    fields: {
      hasSecondaryName: false,    // No stage_name
      hasExperience: true,        // Show years_active
      hasFinancial: false,        // No financial section
      hasRates: false,            // No hourly rates
      hasMedia: false,            // No media portfolio
    },
  },
};

/**
 * Get configuration for a specific profile type
 *
 * @param type - The profile type
 * @returns Configuration object for that type
 *
 * @example
 * ```tsx
 * const config = getProfileConfig('organization');
 * console.log(config.labels.highlights); // "Company Highlights"
 * ```
 */
export function getProfileConfig(type: ProfileType): ProfileConfig {
  return profileConfig[type];
}

/**
 * Get dynamic label for a profile type
 *
 * @param type - The profile type
 * @param labelKey - The label key to retrieve
 * @returns The label text for that profile type
 *
 * @example
 * ```tsx
 * const label = getProfileLabel('organization', 'highlights');
 * console.log(label); // "Company Highlights"
 * ```
 */
export function getProfileLabel(
  type: ProfileType,
  labelKey: keyof ProfileConfig['labels']
): string {
  return profileConfig[type].labels[labelKey] || labelKey;
}

/**
 * Get table name for a profile type
 *
 * @param type - The profile type
 * @param tableKey - The table key to retrieve
 * @returns The table name for that profile type
 *
 * @example
 * ```tsx
 * const table = getProfileTable('photographer', 'accomplishments');
 * console.log(table); // "photographer_accomplishments"
 * ```
 */
export function getProfileTable(
  type: ProfileType,
  tableKey: keyof ProfileConfig['tables']
): string | undefined {
  return profileConfig[type].tables[tableKey];
}

/**
 * Check if a section is visible for a profile type
 *
 * @param type - The profile type
 * @param section - The section to check
 * @returns True if section should be displayed
 *
 * @example
 * ```tsx
 * const showFinancial = isSectionVisible('manager', 'financial');
 * console.log(showFinancial); // false (managers don't have financial section)
 * ```
 */
export function isSectionVisible(
  type: ProfileType,
  section: ProfileConfig['sections'][number]
): boolean {
  return profileConfig[type].sections.includes(section);
}

/**
 * Check if a field should be shown for a profile type
 *
 * @param type - The profile type
 * @param fieldKey - The field key to check
 * @returns True if field should be displayed
 *
 * @example
 * ```tsx
 * const showRates = isFieldVisible('photographer', 'hasRates');
 * console.log(showRates); // true
 * ```
 */
export function isFieldVisible(
  type: ProfileType,
  fieldKey: keyof ProfileConfig['fields']
): boolean {
  return profileConfig[type].fields[fieldKey] ?? false;
}
