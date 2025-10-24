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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type UserRole = 'comedian' | 'promoter' | 'photographer' | 'videographer' | 'manager' | 'admin' | 'agency_manager' | 'venue_manager';

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
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: undefined, // Standalone, no section
  },

  // Opportunities Section
  {
    id: 'browse-shows',
    label: 'Browse Shows',
    path: '/shows',
    icon: Search,
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: 'opportunities',
  },
  {
    id: 'browse-comedians',
    label: 'Browse Comedians',
    path: '/comedians',
    icon: Drama,
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager'],
    section: 'opportunities',
  },
  {
    id: 'browse-photographers',
    label: 'Browse Photographers',
    path: '/photographers',
    icon: Camera,
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: 'opportunities',
  },

  // My Work Section
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/profile?tab=calendar',
    icon: Calendar,
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: 'work',
    getBadge: (data) => {
      if (data.confirmedGigCount && data.confirmedGigCount > 0) {
        return { count: data.confirmedGigCount, variant: 'secondary' };
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
    id: 'gigs',
    label: 'My Gigs',
    path: '/profile?tab=gigs',
    icon: Calendar,
    roles: ['comedian', 'photographer', 'videographer'],
    section: 'work',
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
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
    section: 'work',
  },

  // Business Section
  {
    id: 'invoices',
    label: 'Invoices',
    path: '/profile?tab=invoices',
    icon: FileText,
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin'],
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

  // Account Section
  {
    id: 'messages',
    label: 'Messages',
    path: '/messages',
    icon: MessageCircle,
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: 'account',
    getBadge: (data) => {
      if (data.unreadCount && data.unreadCount > 0) {
        return { count: data.unreadCount, variant: 'destructive' };
      }
      return null;
    },
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: User,
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: 'account',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ['comedian', 'promoter', 'photographer', 'videographer', 'manager', 'admin', 'agency_manager', 'venue_manager'],
    section: 'account',
  },
];

/**
 * Get default hidden items for a specific role
 * These are items that should be hidden by default when a user first sets up their account
 */
export const getDefaultHiddenItemsForRole = (role: UserRole): string[] => {
  switch (role) {
    case 'comedian':
      // Comedians don't need promoter-specific features by default
      return [];
    case 'promoter':
      // Promoters don't need comedian-specific features by default
      return ['applications', 'gigs', 'add-gig', 'earnings'];
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
