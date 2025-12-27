/**
 * Universal Profile Type System
 *
 * Defines types for the universal profile editor that works across
 * all profile types (comedian, organization, photographer, videographer, manager)
 * with dynamic labels and conditional sections.
 */

/**
 * All supported profile types
 */
export type ProfileType =
  | 'comedian'
  | 'organization'
  | 'photographer'
  | 'videographer'
  | 'manager';

/**
 * Available profile sections
 */
export type ProfileSection =
  | 'personal'    // Personal/Business Information
  | 'media'       // Media Portfolio / Portfolio & Reels
  | 'contact'     // Contact Information
  | 'financial'   // Financial Information / Rates & Availability
  | 'highlights'  // Career/Company/Experience Highlights
  | 'reviews'     // Press Reviews
  | 'links';      // Custom Links

/**
 * Dynamic label keys that change based on profile type
 */
export interface ProfileLabels {
  // Section headers
  personal?: string;        // "Personal Information" | "Business Information"
  media?: string;           // "Media Portfolio" | "Portfolio & Reels"
  contact?: string;         // "Contact Information"
  financial?: string;       // "Financial Information" | "Rates & Availability"
  highlights?: string;      // "Career Highlights" | "Company Highlights" | "Experience Highlights"
  reviews?: string;         // "Press Reviews"
  links?: string;           // "Custom Links"

  // Field labels
  image?: string;           // "Profile Picture" | "Logo"
  primaryName?: string;     // "First Name" | "Organization Name"
  secondaryName?: string;   // "Stage Name" | "Legal Name"
  bio?: string;             // "Biography" | "Company Description"
}

/**
 * Database table names for each profile type
 */
export interface ProfileTables {
  main: string;                    // Main profile table (profiles | organization_profiles | comedy_manager_profiles)
  media?: string;                  // Media/portfolio table
  accomplishments: string;         // Accomplishments/highlights table
  reviews: string;                 // Press reviews/testimonials table
  links: string;                   // Custom links table
}

/**
 * Conditional field visibility flags
 */
export interface ProfileFields {
  hasSecondaryName: boolean;       // Show stage_name/legal_name field
  hasExperience: boolean;          // Show experience/years active field
  hasFinancial: boolean;           // Show financial information section
  hasRates: boolean;               // Show rates & availability (photographers/videographers)
  hasMedia?: boolean;              // Show media portfolio section
}

/**
 * Complete configuration for a profile type
 */
export interface ProfileConfig {
  sections: ProfileSection[];      // Which sections to display
  labels: ProfileLabels;            // Dynamic text labels
  tables: ProfileTables;            // Database table mappings
  fields: ProfileFields;            // Field visibility flags
}

/**
 * Type-safe profile configuration object
 */
export type ProfileConfigMap = {
  [K in ProfileType]: ProfileConfig;
};

/**
 * Props for profile-aware components
 */
export interface ProfileAwareProps {
  profileType: ProfileType;
  config: ProfileConfig;
}

/**
 * Props for table-based manager components
 */
export interface TableAwareProps {
  tableName: string;
  userId?: string;              // For user-based profiles
  organizationId?: string;      // For organization profiles
}

/**
 * Accordion item structure for dynamic rendering
 */
export interface ProfileAccordionItem {
  value: ProfileSection;
  title: string;
  component: React.ComponentType<ProfileAwareProps>;
  visible: boolean;
}
