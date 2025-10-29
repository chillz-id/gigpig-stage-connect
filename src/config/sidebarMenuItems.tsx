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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type UserRole = 'comedian' | 'comedian_lite' | 'promoter' | 'photographer' | 'videographer' | 'manager' | 'admin' | 'agency_manager' | 'venue_manager';

export const getRoleDisplayName = (role: string): string => {
  if (role === 'comedian_lite') return 'Comedian';
  if (role === 'agency_manager') return 'Agency Manager';
  if (role === 'venue_manager') return 'Venue Manager';
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
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined, // Standalone, no section
  },

  // Shows - NEW placeholder (will be implemented later)
  {
    id: 'shows',
    label: 'Shows',
    path: '/shows',
    icon: Drama,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: undefined, // Standalone, after Dashboard
  },

  // Gigs - renamed from "Browse Shows"
  {
    id: 'gigs',
    label: 'Gigs',
    path: '/gigs',
    icon: Search,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: undefined, // Standalone, after Shows
  },

  // Profile - standalone
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: User,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined,
  },

  // Messages - standalone
  {
    id: 'messages',
    label: 'Messages',
    path: '/messages',
    icon: MessageCircle,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined,
    getBadge: (data) => {
      if (data.unreadCount && data.unreadCount > 0) {
        return { count: data.unreadCount, variant: 'destructive' };
      }
      return null;
    },
  },

  // Vouches - standalone
  {
    id: 'vouches',
    label: 'Vouches',
    path: '/vouches',
    icon: Crown,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: undefined,
  },

  // Settings - standalone
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined,
  },

  // Notification Settings - standalone
  {
    id: 'notification-settings',
    label: 'Notification Settings',
    path: '/settings?tab=notifications',
    icon: Bell,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined,
  },

  // Sidebar Customization - standalone
  {
    id: 'sidebar-customization',
    label: 'Sidebar Customization',
    path: '/settings?tab=sidebar',
    icon: Settings,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined,
  },

  // Privacy - standalone
  {
    id: 'privacy-settings',
    label: 'Privacy',
    path: '/settings?tab=privacy',
    icon: Shield,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined,
  },

  // Profile Visibility - standalone
  {
    id: 'profile-visibility',
    label: 'Profile Visibility',
    path: '/settings?tab=privacy&section=visibility',
    icon: Eye,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined,
  },

  // Data & Privacy - standalone
  {
    id: 'data-privacy',
    label: 'Data & Privacy',
    path: '/settings?tab=privacy&section=data',
    icon: Shield,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined,
  },

  // Messages Privacy - standalone
  {
    id: 'messages-privacy',
    label: 'Messages Privacy',
    path: '/settings?tab=privacy&section=messages',
    icon: MessageCircle,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined,
  },

  // Social Media Manager - external link
  {
    id: 'social-media-manager',
    label: 'Social Media Manager',
    path: 'https://social.gigpigs.app',
    icon: ExternalLink,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined, // Standalone
    external: true,
  },

  // Opportunities Section
  {
    id: 'browse-comedians',
    label: 'Browse Comedians',
    path: '/comedians',
    icon: Drama,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager'],
    section: 'opportunities',
  },
  {
    id: 'browse-photographers',
    label: 'Browse Photographers',
    path: '/photographers',
    icon: Camera,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: 'opportunities',
  },

  // My Work Section
  {
    id: 'applications',
    label: 'Applications',
    path: '/applications',
    icon: FileUser,
    roles: ['comedian', 'comedian_lite', 'photographer', 'videographer'],
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
    roles: ['comedian', 'comedian_lite', 'photographer', 'videographer'],
    section: 'work',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    path: '/tasks',
    icon: CheckSquare,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: 'work',
  },

  // Business Section
  {
    id: 'invoices',
    label: 'Invoices',
    path: '/profile?tab=invoices',
    icon: FileText,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: 'business',
  },
  {
    id: 'earnings',
    label: 'Earnings',
    path: '/profile?tab=earnings',
    icon: DollarSign,
    roles: ['comedian', 'comedian_lite', 'photographer', 'videographer'],
    section: 'business',
  },
  {
    id: 'media-library',
    label: 'Media Library',
    path: '/media-library',
    icon: Image,
    roles: ['comedian', 'comedian_lite', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: 'business',
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
    roles: ['admin', 'agency_manager', 'promoter', 'venue_manager'],
    section: 'manager',
    requiresPermission: (permissions) => permissions.hasCRMAccess,
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
    case 'comedian_lite':
      // Comedians don't need promoter-specific features by default
      return [];
    case 'promoter':
      // Promoters don't need comedian-specific features by default
      return ['applications', 'my-gigs', 'add-gig', 'earnings'];
    case 'photographer':
    case 'videographer':
      // Similar to comedians
      return [];
    case 'manager':
    case 'agency_manager':
      // Managers might want a cleaner view
      return ['applications', 'add-gig', 'earnings'];
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
  opportunities: 'Opportunities',
  work: 'My Work',
  business: 'Business',
  manager: 'Manager Features',
  admin: 'Admin',
  account: 'Account',
};
