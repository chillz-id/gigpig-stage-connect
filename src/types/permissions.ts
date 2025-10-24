/**
 * Organization Team Permissions System
 *
 * Defines permission scopes, actions, and manager types for organization team members.
 * Supports both template-based permissions and custom overrides.
 */

/**
 * Permission scopes define different areas of the organization
 */
export type PermissionScope =
  | 'financial'    // Financial data, invoices, payments
  | 'team'         // Team member management
  | 'events'       // Event creation and management
  | 'media'        // Media library and assets
  | 'social'       // Social media scheduling and analytics
  | 'tasks'        // Task management
  | 'messages'     // Organization messaging
  | 'bookings'     // Comedian bookings and deals
  | 'analytics';   // Analytics and reporting

/**
 * Actions that can be performed within each scope
 */
export type PermissionAction = 'view' | 'edit' | 'delete';

/**
 * Permission set for a single scope
 */
export interface PermissionSet {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

/**
 * Complete permissions object with all scopes
 */
export type OrganizationPermissions = Record<PermissionScope, PermissionSet>;

/**
 * Manager types with specialized permission templates
 */
export type ManagerType =
  | 'general'            // General manager - broad access
  | 'comedian_manager'   // Manages comedians - bookings, events, messages
  | 'social_media'       // Social media manager - media, social, analytics
  | 'tour_manager'       // Tour manager - events, bookings, tasks
  | 'booking_manager'    // Booking manager - bookings, events, messages
  | 'content_manager'    // Content manager - media, social, events
  | 'financial_manager'; // Financial manager - full financial access

/**
 * Organization team member role
 */
export type OrganizationRole = 'admin' | 'manager' | 'member';

/**
 * Extended team member with permissions
 */
export interface TeamMemberWithPermissions {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  manager_type: ManagerType | null;
  custom_permissions: OrganizationPermissions | null;
  joined_at: string;
  // User profile fields
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

/**
 * Effective permissions (combines default template + custom overrides)
 */
export interface EffectivePermissions {
  permissions: OrganizationPermissions;
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
  managerType: ManagerType | null;
  hasCustomPermissions: boolean;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Manager type configuration
 */
export interface ManagerTypeConfig {
  type: ManagerType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  defaultPermissions: OrganizationPermissions;
}

/**
 * Permission scope configuration
 */
export interface PermissionScopeConfig {
  scope: PermissionScope;
  label: string;
  description: string;
  icon: string; // Lucide icon name
}

/**
 * Helper type for permission updates
 */
export interface PermissionUpdate {
  organizationId: string;
  userId: string;
  updates: {
    role?: OrganizationRole;
    managerType?: ManagerType | null;
    customPermissions?: Partial<OrganizationPermissions> | null;
  };
}

/**
 * User preference for blended view
 */
export interface OrgViewPreference {
  userId: string;
  showOrgInPersonalView: boolean;
}

/**
 * Constants for permission templates
 */

export const PERMISSION_ACTIONS: PermissionAction[] = ['view', 'edit', 'delete'];

export const PERMISSION_SCOPES: PermissionScope[] = [
  'financial',
  'team',
  'events',
  'media',
  'social',
  'tasks',
  'messages',
  'bookings',
  'analytics',
];

export const MANAGER_TYPES: ManagerType[] = [
  'general',
  'comedian_manager',
  'social_media',
  'tour_manager',
  'booking_manager',
  'content_manager',
  'financial_manager',
];

/**
 * Permission scope configurations with metadata
 */
export const SCOPE_CONFIGS: Record<PermissionScope, PermissionScopeConfig> = {
  financial: {
    scope: 'financial',
    label: 'Financial Data',
    description: 'Invoices, payments, and financial reporting',
    icon: 'DollarSign',
  },
  team: {
    scope: 'team',
    label: 'Team Management',
    description: 'Add, remove, and manage team members',
    icon: 'Users',
  },
  events: {
    scope: 'events',
    label: 'Events',
    description: 'Create and manage organization events',
    icon: 'Calendar',
  },
  media: {
    scope: 'media',
    label: 'Media Library',
    description: 'Upload and manage media assets',
    icon: 'Image',
  },
  social: {
    scope: 'social',
    label: 'Social Media',
    description: 'Social media scheduling and analytics',
    icon: 'Share2',
  },
  tasks: {
    scope: 'tasks',
    label: 'Tasks',
    description: 'Create and assign team tasks',
    icon: 'CheckSquare',
  },
  messages: {
    scope: 'messages',
    label: 'Messages',
    description: 'Organization messaging and communications',
    icon: 'MessageCircle',
  },
  bookings: {
    scope: 'bookings',
    label: 'Bookings',
    description: 'Comedian bookings and deal management',
    icon: 'Handshake',
  },
  analytics: {
    scope: 'analytics',
    label: 'Analytics',
    description: 'View and export analytics data',
    icon: 'BarChart3',
  },
};

/**
 * Manager type configurations with metadata
 */
export const MANAGER_TYPE_CONFIGS: Record<ManagerType, Omit<ManagerTypeConfig, 'defaultPermissions'>> = {
  general: {
    type: 'general',
    label: 'General Manager',
    description: 'Broad access to most organization features',
    icon: 'Briefcase',
  },
  comedian_manager: {
    type: 'comedian_manager',
    label: 'Comedian Manager',
    description: 'Manages comedians, bookings, and events',
    icon: 'Mic',
  },
  social_media: {
    type: 'social_media',
    label: 'Social Media Manager',
    description: 'Handles media library, social posts, and analytics',
    icon: 'Share2',
  },
  tour_manager: {
    type: 'tour_manager',
    label: 'Tour Manager',
    description: 'Manages tours, events, and bookings',
    icon: 'Route',
  },
  booking_manager: {
    type: 'booking_manager',
    label: 'Booking Manager',
    description: 'Handles bookings, events, and communications',
    icon: 'Handshake',
  },
  content_manager: {
    type: 'content_manager',
    label: 'Content Manager',
    description: 'Creates and manages content, media, and social',
    icon: 'FileText',
  },
  financial_manager: {
    type: 'financial_manager',
    label: 'Financial Manager',
    description: 'Full access to financial data and analytics',
    icon: 'DollarSign',
  },
};

/**
 * Helper to create a full permission set
 */
export const createPermissionSet = (
  view: boolean,
  edit: boolean,
  deletePermission: boolean
): PermissionSet => ({
  view,
  edit,
  delete: deletePermission,
});

/**
 * Helper to create no-access permission set
 */
export const noAccess = (): PermissionSet => createPermissionSet(false, false, false);

/**
 * Helper to create view-only permission set
 */
export const viewOnly = (): PermissionSet => createPermissionSet(true, false, false);

/**
 * Helper to create view-edit permission set
 */
export const viewEdit = (): PermissionSet => createPermissionSet(true, true, false);

/**
 * Helper to create full-access permission set
 */
export const fullAccess = (): PermissionSet => createPermissionSet(true, true, true);

/**
 * Default permissions for each manager type
 * These match the SQL function get_default_permissions()
 */
export const DEFAULT_PERMISSIONS: Record<ManagerType, OrganizationPermissions> = {
  general: {
    financial: viewOnly(),
    team: viewEdit(),
    events: viewEdit(),
    media: viewEdit(),
    social: viewEdit(),
    tasks: fullAccess(),
    messages: fullAccess(),
    bookings: viewEdit(),
    analytics: viewOnly(),
  },
  comedian_manager: {
    financial: viewOnly(),
    team: viewOnly(),
    events: viewEdit(),
    media: viewEdit(),
    social: viewOnly(),
    tasks: viewEdit(),
    messages: fullAccess(),
    bookings: fullAccess(),
    analytics: viewOnly(),
  },
  social_media: {
    financial: noAccess(),
    team: viewOnly(),
    events: viewOnly(),
    media: fullAccess(),
    social: fullAccess(),
    tasks: viewEdit(),
    messages: viewEdit(),
    bookings: viewOnly(),
    analytics: viewEdit(),
  },
  tour_manager: {
    financial: viewOnly(),
    team: viewOnly(),
    events: fullAccess(),
    media: viewEdit(),
    social: viewOnly(),
    tasks: fullAccess(),
    messages: viewEdit(),
    bookings: fullAccess(),
    analytics: viewOnly(),
  },
  booking_manager: {
    financial: viewOnly(),
    team: viewOnly(),
    events: viewEdit(),
    media: viewOnly(),
    social: noAccess(),
    tasks: viewEdit(),
    messages: fullAccess(),
    bookings: fullAccess(),
    analytics: viewOnly(),
  },
  content_manager: {
    financial: noAccess(),
    team: viewOnly(),
    events: viewEdit(),
    media: fullAccess(),
    social: fullAccess(),
    tasks: viewEdit(),
    messages: viewOnly(),
    bookings: viewOnly(),
    analytics: viewEdit(),
  },
  financial_manager: {
    financial: fullAccess(),
    team: viewOnly(),
    events: viewOnly(),
    media: noAccess(),
    social: noAccess(),
    tasks: viewEdit(),
    messages: viewOnly(),
    bookings: viewOnly(),
    analytics: fullAccess(),
  },
};

/**
 * Full admin permissions (used for admins)
 */
export const ADMIN_PERMISSIONS: OrganizationPermissions = {
  financial: viewEdit(),
  team: fullAccess(),
  events: fullAccess(),
  media: fullAccess(),
  social: fullAccess(),
  tasks: fullAccess(),
  messages: fullAccess(),
  bookings: fullAccess(),
  analytics: fullAccess(),
};

/**
 * Owner permissions (full access to everything)
 */
export const OWNER_PERMISSIONS: OrganizationPermissions = {
  financial: fullAccess(),
  team: fullAccess(),
  events: fullAccess(),
  media: fullAccess(),
  social: fullAccess(),
  tasks: fullAccess(),
  messages: fullAccess(),
  bookings: fullAccess(),
  analytics: fullAccess(),
};

/**
 * Member permissions (minimal access)
 */
export const MEMBER_PERMISSIONS: OrganizationPermissions = {
  financial: noAccess(),
  team: viewOnly(),
  events: viewOnly(),
  media: viewOnly(),
  social: noAccess(),
  tasks: viewOnly(),
  messages: viewOnly(),
  bookings: noAccess(),
  analytics: noAccess(),
};
