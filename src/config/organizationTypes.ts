import { Calendar, Users, MapPin, LucideIcon } from 'lucide-react';

/**
 * Organization Types Configuration
 *
 * Defines the available organization types, their labels, default features,
 * and other metadata for the Stand Up Sydney platform.
 */

export const ORG_TYPES = {
  EVENT_PROMOTER: 'event_promoter',
  ARTIST_AGENCY: 'artist_agency',
  VENUE: 'venue',
} as const;

export type OrgType = typeof ORG_TYPES[keyof typeof ORG_TYPES];

export interface OrgTypeConfig {
  label: string;
  defaultFeatures: string[];
  description: string;
  icon: LucideIcon;
}

/**
 * Organization Type Features Configuration
 *
 * Each organization type has:
 * - label: Display name shown in UI
 * - defaultFeatures: Features enabled by default when org is created
 * - description: Help text shown during type selection
 * - icon: Lucide icon component for visual identification
 */
export const ORG_TYPE_FEATURES: Record<OrgType, OrgTypeConfig> = {
  [ORG_TYPES.EVENT_PROMOTER]: {
    label: 'Event Promoter',
    defaultFeatures: ['events', 'analytics', 'media', 'invoices', 'ticketing'],
    description: 'Organizations that run comedy events and shows',
    icon: Calendar,
  },
  [ORG_TYPES.ARTIST_AGENCY]: {
    label: 'Artist Agency',
    defaultFeatures: ['roster', 'bookings', 'deals', 'invoices', 'analytics'],
    description: 'Manages comedians and books them for gigs',
    icon: Users,
  },
  [ORG_TYPES.VENUE]: {
    label: 'Venue',
    defaultFeatures: ['events', 'bookings', 'media', 'calendar'],
    description: 'Physical locations that host comedy events',
    icon: MapPin,
  },
};

/**
 * All available features across all organization types
 *
 * Organizations can enable/disable any of these features regardless of their type.
 * The defaultFeatures above determine which are enabled on creation.
 */
export const ALL_ORG_FEATURES = [
  'events',      // Event management and creation
  'roster',      // Artist/comedian roster management
  'bookings',    // Booking management system
  'deals',       // Deal/contract management
  'analytics',   // Analytics and reporting
  'media',       // Media library
  'invoices',    // Invoice generation and management
  'ticketing',   // Ticket sales integration
  'calendar',    // Calendar and scheduling
  'social',      // Social media integration
  'notifications', // Notification system
] as const;

export type OrgFeature = typeof ALL_ORG_FEATURES[number];

/**
 * Venue Subtypes
 *
 * Used to categorize venues when organization_type includes 'venue'
 */
export const VENUE_SUBTYPES = {
  COMEDY_CLUB: 'comedy_club',
  PUB: 'pub',
  THEATRE: 'theatre',
  BAR: 'bar',
  HOTEL: 'hotel',
  CAFE: 'cafe',
  RESTAURANT: 'restaurant',
  FUNCTION_CENTRE: 'function_centre',
  ARTS_CENTRE: 'arts_centre',
  OTHER: 'other',
} as const;

export type VenueSubtype = typeof VENUE_SUBTYPES[keyof typeof VENUE_SUBTYPES];

/**
 * Venue Subtype Labels for UI Display
 */
export const VENUE_SUBTYPE_LABELS: Record<VenueSubtype, string> = {
  comedy_club: 'Comedy Club',
  pub: 'Pub',
  theatre: 'Theatre',
  bar: 'Bar',
  hotel: 'Hotel',
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  function_centre: 'Function Centre',
  arts_centre: 'Arts Centre',
  other: 'Other',
};

/**
 * Venue Subtype Descriptions for Help Text
 */
export const VENUE_SUBTYPE_DESCRIPTIONS: Record<VenueSubtype, string> = {
  comedy_club: 'Dedicated comedy venue with regular shows',
  pub: 'Traditional pub with occasional comedy nights',
  theatre: 'Performing arts theatre hosting comedy shows',
  bar: 'Bar or lounge with comedy performances',
  hotel: 'Hotel with function rooms for comedy events',
  cafe: 'Cafe hosting intimate comedy performances',
  restaurant: 'Restaurant with comedy dinner shows',
  function_centre: 'Function or event centre for comedy shows',
  arts_centre: 'Arts and cultural centre with comedy programming',
  other: 'Other type of venue',
};

/**
 * Feature Labels for UI Display
 */
export const FEATURE_LABELS: Record<OrgFeature, string> = {
  events: 'Event Management',
  roster: 'Artist Roster',
  bookings: 'Bookings',
  deals: 'Deals & Contracts',
  analytics: 'Analytics',
  media: 'Media Library',
  invoices: 'Invoicing',
  ticketing: 'Ticket Sales',
  calendar: 'Calendar',
  social: 'Social Media',
  notifications: 'Notifications',
};

/**
 * Feature Descriptions for Help Text
 */
export const FEATURE_DESCRIPTIONS: Record<OrgFeature, string> = {
  events: 'Create and manage comedy events and shows',
  roster: 'Manage your roster of comedians and performers',
  bookings: 'Handle booking requests and confirmations',
  deals: 'Manage deals, contracts, and agreements',
  analytics: 'View performance metrics and insights',
  media: 'Store and organize photos, videos, and other media',
  invoices: 'Generate and track invoices',
  ticketing: 'Integrate with ticketing platforms (Humanitix, Eventbrite)',
  calendar: 'Sync with Google Calendar and manage schedules',
  social: 'Connect and manage social media accounts',
  notifications: 'Receive email and push notifications',
};

/**
 * Helper function to get default features for organization types
 * Handles multi-type organizations by merging default features
 */
export function getDefaultFeaturesForTypes(types: OrgType[]): string[] {
  const featuresSet = new Set<string>();

  types.forEach(type => {
    const config = ORG_TYPE_FEATURES[type];
    if (config) {
      config.defaultFeatures.forEach(feature => featuresSet.add(feature));
    }
  });

  return Array.from(featuresSet);
}

/**
 * Helper function to check if a feature is enabled in the features object
 */
export function isFeatureEnabled(
  enabledFeatures: Record<string, boolean> | null | undefined,
  feature: OrgFeature
): boolean {
  if (!enabledFeatures) return false;
  return enabledFeatures[feature] === true;
}

/**
 * Helper function to get organization type label(s) for display
 */
export function getOrgTypeLabels(types: OrgType[]): string {
  if (!types || types.length === 0) return 'Unknown';

  const labels = types.map(type => ORG_TYPE_FEATURES[type]?.label || type);

  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return labels.join(' & ');

  // For 3+ types: "Type 1, Type 2 & Type 3"
  const last = labels.pop();
  return `${labels.join(', ')} & ${last}`;
}
