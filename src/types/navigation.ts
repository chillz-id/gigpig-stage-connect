export type NavigationTabType = 
  | 'shows'
  | 'calendar'
  | 'dashboard'
  | 'invoices'
  | 'vouches'
  | 'settings'
  | 'profile'
  | 'signout'
  | 'applications'
  | 'messages'
  | 'notifications'
  | 'create-event'
  | 'admin'
  | 'comedians'
  | 'photographers';

export interface NavigationPreferences {
  tab_order: NavigationTabType[];
  visible_tabs: NavigationTabType[];
  mandatory_tabs: NavigationTabType[];
  dashboard_quick_links: DashboardQuickLink[];
}

export interface DashboardQuickLink {
  id: string;
  label: string;
  path: string;
  icon: string;
  order: number;
}

export interface NavigationItem {
  id: NavigationTabType;
  path: string;
  icon: any;
  label: string;
  show: boolean;
  badge?: number;
  isProfile?: boolean;
  roleRequired?: ('comedian' | 'promoter' | 'admin' | 'photographer')[];
  mandatory?: boolean;
}

export interface NavigationCustomizationSettings {
  availableTabs: NavigationItem[];
  currentPreferences: NavigationPreferences;
  onUpdatePreferences: (preferences: NavigationPreferences) => Promise<void>;
  userRole: 'comedian' | 'promoter' | 'admin' | 'photographer' | 'member';
}

export const DEFAULT_NAVIGATION_PREFERENCES: NavigationPreferences = {
  tab_order: ['shows', 'calendar', 'dashboard', 'invoices', 'vouches', 'settings', 'profile', 'signout'],
  visible_tabs: ['shows', 'calendar', 'dashboard', 'invoices', 'vouches', 'settings', 'profile', 'signout'],
  mandatory_tabs: ['settings', 'profile', 'signout'],
  dashboard_quick_links: []
};

export const COMEDIAN_DEFAULT_NAVIGATION: NavigationPreferences = {
  tab_order: ['shows', 'calendar', 'dashboard', 'invoices', 'vouches', 'settings', 'profile', 'signout'],
  visible_tabs: ['shows', 'calendar', 'dashboard', 'invoices', 'vouches', 'settings', 'profile', 'signout'],
  mandatory_tabs: ['settings', 'profile', 'signout'],
  dashboard_quick_links: []
};

export const AVAILABLE_DASHBOARD_PAGES: Array<{
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
}> = [
  {
    id: 'shows',
    label: 'Shows',
    path: '/shows',
    icon: 'Calendar1',
    description: 'Browse available shows'
  },
  {
    id: 'applications',
    label: 'Applications',
    path: '/applications',
    icon: 'FileUser',
    description: 'View your applications'
  },
  {
    id: 'messages',
    label: 'Messages',
    path: '/messages',
    icon: 'MessageCircle',
    description: 'Your messages'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: 'Bell',
    description: 'Your notifications'
  },
  {
    id: 'create-event',
    label: 'Create Event',
    path: '/create-event',
    icon: 'Plus',
    description: 'Create a new event'
  },
  {
    id: 'comedians',
    label: 'Comedians',
    path: '/comedians',
    icon: 'Drama',
    description: 'Browse comedians'
  },
  {
    id: 'photographers',
    label: 'Photographers',
    path: '/photographers',
    icon: 'Camera',
    description: 'Browse photographers'
  }
];