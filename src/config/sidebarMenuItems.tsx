import {
  LayoutDashboard,
  Search,
  Drama,
  Camera,
  FileUser,
  Calendar,
  Plus,
  FileText,
  DollarSign,
  Building2,
  Users,
  BarChart3,
  User,
  MessageCircle,
  Settings,
  CheckSquare,
  Video,
  Image,
  Crown,
  ExternalLink,
  Bell,
  Eye,
  Shield,
  Lightbulb,
  AlertTriangle,
  BookUser,
  Repeat,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// User roles from auth system (src/types/auth.ts)
export type UserRole = 'member' | 'comedian' | 'comedian_lite' | 'co_promoter' | 'admin' | 'photographer' | 'videographer';

export const getRoleDisplayName = (role: string): string => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[]; // Which roles can see this item
  section?: 'opportunities' | 'work' | 'business' | 'manager' | 'admin' | 'account';
  requiresPermission?: (permissions: {
    hasAdminAccess: boolean;
    hasCRMAccess: boolean;
    hasManagerAccess: boolean;
    hasAgencyAccess: boolean;
  }) => boolean;
  getBadge?: (data: {
    unreadCount?: number;
    pendingConfirmations?: number;
    confirmedGigCount?: number;
  }) => { count: number; variant: 'default' | 'destructive' | 'secondary' } | null;
  children?: MenuItem[]; // Nested menu items
  external?: boolean; // External link (opens in new tab)
}

/**
 * Complete sidebar menu configuration
 * Maps to IDs in SidebarCustomization component
 */
export const MENU_ITEMS: MenuItem[] = [
  // Dashboard - visible to all
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['member', 'comedian', 'comedian_lite', 'co_promoter', 'admin', 'photographer', 'videographer'],
    section: undefined, // Standalone, no section
  },

  // Shows - NEW placeholder (will be implemented later)
  {
    id: 'shows',
    label: 'Shows',
    path: '/shows',
    icon: Drama,
    roles: ['comedian', 'photographer', 'videographer', 'co_promoter', 'admin'],
    section: undefined, // Standalone, after Dashboard
  },

  // Gigs - renamed from "Browse Shows"
  {
    id: 'gigs',
    label: 'Gigs',
    path: '/gigs',
    icon: Search,
    roles: ['comedian', 'comedian_lite', 'photographer', 'videographer', 'admin'],
    section: undefined, // Standalone, after Shows
  },

  // Profile - standalone
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: User,
    roles: ['member', 'comedian', 'comedian_lite', 'co_promoter', 'admin', 'photographer', 'videographer'],
    section: undefined,
  },

  // Messages - standalone (comedian_lite removed - not accessible)
  {
    id: 'messages',
    label: 'Messages',
    path: '/messages',
    icon: MessageCircle,
    roles: ['comedian', 'photographer', 'videographer', 'co_promoter', 'admin'],
    section: undefined,
    getBadge: (data) => {
      if (data.unreadCount && data.unreadCount > 0) {
        return { count: data.unreadCount, variant: 'destructive' };
      }
      return null;
    },
  },

  // Vouches - profile tab
  {
    id: 'vouches',
    label: 'Vouches',
    path: '/profile?tab=vouches',
    icon: Crown,
    roles: ['comedian', 'comedian_lite', 'photographer', 'videographer', 'admin'],
    section: undefined,
  },

  // Notifications - standalone (above Settings)
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    roles: ['member', 'comedian', 'comedian_lite', 'co_promoter', 'admin', 'photographer', 'videographer'],
    section: undefined,
  },

  // Settings - profile tab
  {
    id: 'settings',
    label: 'Settings',
    path: '/profile?tab=settings',
    icon: Settings,
    roles: ['member', 'comedian', 'comedian_lite', 'co_promoter', 'admin', 'photographer', 'videographer'],
    section: undefined,
  },

  // Social Media Manager - internal route
  {
    id: 'social-media-manager',
    label: 'Social Media Manager',
    path: '/social-media',
    icon: ExternalLink,
    roles: ['comedian', 'photographer', 'videographer', 'co_promoter', 'admin'],
    section: undefined, // Standalone
  },

  // Opportunities Section
  {
    id: 'browse-comedians',
    label: 'Browse Comedians',
    path: '/comedians',
    icon: Drama,
    roles: ['comedian', 'photographer', 'videographer', 'co_promoter', 'admin'],
    section: 'opportunities',
  },
  {
    id: 'browse-photographers',
    label: 'Browse Photographers',
    path: '/photographers',
    icon: Camera,
    roles: ['comedian', 'photographer', 'videographer', 'admin'],
    section: 'opportunities',
  },

  // My Work Section (now "Events")
  // Note: "My Events" for organizations - path transformed by UnifiedSidebar based on active org
  {
    id: 'my-events',
    label: 'My Events',
    path: '/my-events', // Transformed to /org/{slug}/events when org is active
    icon: Calendar,
    roles: ['member', 'comedian', 'comedian_lite', 'co_promoter', 'admin', 'photographer', 'videographer'], // Shown when org context is active
    section: 'work',
  },
  {
    id: 'tours',
    label: 'Tours',
    path: '/tours', // Transformed to /org/{slug}/events/tours when org is active
    icon: Layers,
    roles: ['comedian', 'comedian_lite', 'co_promoter', 'admin', 'photographer', 'videographer'],
    section: 'work',
  },
  {
    id: 'recurring',
    label: 'Recurring',
    path: '/recurring', // Transformed to /org/{slug}/events/recurring when org is active
    icon: Repeat,
    roles: ['comedian', 'comedian_lite', 'co_promoter', 'admin', 'photographer', 'videographer'],
    section: 'work',
  },
  {
    id: 'my-gigs-lite',
    label: 'My Gigs',
    path: '/profile?tab=calendar',
    icon: Calendar,
    roles: ['comedian_lite'], // Comedian Lite sees calendar tab
    section: 'work',
    getBadge: (data) => {
      if (data.confirmedGigCount && data.confirmedGigCount > 0) {
        return { count: data.confirmedGigCount, variant: 'default' };
      }
      return null;
    },
  },
  {
    id: 'applications',
    label: 'Applications',
    path: '/applications',
    icon: FileUser,
    roles: ['comedian', 'photographer', 'videographer'],
    section: 'work',
    getBadge: (data) => {
      if (data.pendingConfirmations && data.pendingConfirmations > 0) {
        return { count: data.pendingConfirmations, variant: 'destructive' };
      }
      return null;
    },
  },
  {
    id: 'add-gig',
    label: 'Add Gig',
    path: '/dashboard/gigs/add',
    icon: Plus,
    roles: ['comedian', 'photographer', 'videographer'],
    section: 'work',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    path: '/tasks',
    icon: CheckSquare,
    roles: ['comedian', 'photographer', 'videographer', 'admin'],
    section: 'business',
  },

  // Business Section
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/profile?tab=calendar',
    icon: Calendar,
    roles: ['comedian', 'photographer', 'videographer', 'co_promoter', 'admin'], // comedian_lite uses My Gigs instead
    section: 'business',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    path: '/profile?tab=invoices',
    icon: FileText,
    roles: ['comedian', 'photographer', 'videographer', 'admin'],
    section: 'business',
  },
  {
    id: 'earnings',
    label: 'Earnings',
    path: '/profile?tab=earnings',
    icon: DollarSign,
    roles: ['comedian', 'photographer', 'videographer'],
    section: 'business',
  },
  {
    id: 'epk',
    label: 'Press Kit',
    path: '/profile?tab=EPK',
    icon: ExternalLink,
    roles: ['comedian', 'comedian_lite', 'photographer', 'videographer', 'admin'],
    section: 'business',
  },
  {
    id: 'media-library',
    label: 'Media Library',
    path: '/media-library',
    icon: Image,
    roles: ['comedian', 'comedian_lite', 'photographer', 'videographer', 'admin'],
    section: 'business',
  },
  {
    id: 'roadmap',
    label: 'Feature Roadmap',
    path: '/roadmap',
    icon: Lightbulb,
    roles: ['comedian', 'comedian_lite', 'photographer', 'videographer', 'co_promoter', 'admin'],
    section: 'account',
  },
  {
    id: 'bugs',
    label: 'Bug Tracker',
    path: '/bugs',
    icon: AlertTriangle,
    roles: ['comedian', 'comedian_lite', 'photographer', 'videographer', 'co_promoter', 'admin'],
    section: 'account',
  },

  // Manager Features Section
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/admin?tab=analytics',
    icon: BarChart3,
    roles: ['admin'],
    section: 'manager',
    requiresPermission: (permissions) => permissions.hasAdminAccess,
  },
  {
    id: 'crm',
    label: 'CRM',
    path: '/crm',
    icon: Users,
    roles: ['admin', 'agency_manager', 'venue_manager'],
    section: 'manager',
    requiresPermission: (permissions) => permissions.hasCRMAccess,
  },
  {
    id: 'directory',
    label: 'Directory',
    path: '/admin/directory',
    icon: BookUser,
    roles: ['admin'],
    section: 'admin',
    requiresPermission: (permissions) => permissions.hasAdminAccess,
  },
  {
    id: 'users',
    label: 'Users',
    path: '/admin?tab=users',
    icon: Users,
    roles: ['admin'],
    section: 'admin',
    requiresPermission: (permissions) => permissions.hasAdminAccess,
  },
  {
    id: 'web-app-settings',
    label: 'Web App Settings',
    path: '/admin?tab=settings',
    icon: Settings,
    roles: ['admin'],
    section: 'admin',
    requiresPermission: (permissions) => permissions.hasAdminAccess,
  },
];

/**
 * Get default hidden items for a specific role
 * These are items that should be hidden by default when a user first sets up their account
 */
export const getDefaultHiddenItemsForRole = (role: UserRole): string[] => {
  switch (role) {
    case 'comedian':
      // Comedians see most features
      return [];
    case 'comedian_lite':
      return [
        'shows',
        'messages',           // comedian_lite has no access to Messages
        'applications',       // comedian_lite has no access to Applications
        'browse-comedians',
        'browse-photographers',
        'add-gig',
        'tasks',
        'invoices',
        'earnings',
        'social-media-manager',
        'calendar'            // comedian_lite uses My Gigs which points to calendar
      ];
    case 'photographer':
    case 'videographer':
      // Similar to comedians
      return [];
    case 'co_promoter':
      // Co-promoters manage events, hide performer-specific items
      return ['applications', 'add-gig', 'my-gigs-lite', 'earnings', 'vouches'];
    case 'member':
      // Members have limited access
      return ['applications', 'add-gig', 'my-gigs-lite', 'earnings', 'invoices', 'vouches', 'social-media-manager', 'calendar'];
    case 'admin':
      // Admins see everything by default
      return [];
    default:
      return [];
  }
};

/**
 * Section labels for grouping menu items
 */
export const SECTION_LABELS: Record<string, string> = {
  opportunities: 'Talent',
  work: 'Events',
  business: 'Business',
  manager: 'Manager Features',
  admin: 'Admin',
  account: 'Platform',
};
