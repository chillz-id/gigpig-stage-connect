import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Filter,
  TrendingUp,
  FileUp,
  Handshake,
  MessageSquare,
  ClipboardList,
  Calendar,
  CheckSquare,
  Network,
  Briefcase,
  Building2,
  Store,
  Landmark,
  Users2,
  BarChart3,
  PieChart,
  DollarSign,
  Activity,
} from 'lucide-react';

export const CRM_BASE_PATH = '/crm';

export interface CRMNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  matchPaths?: string[];
  description?: string;
}

export interface CRMNavSection {
  label: string;
  items: CRMNavItem[];
}

export type CRMRouteComponentKey =
  | 'customer-list'
  | 'customer-detail'
  | 'deal-pipeline'
  | 'deal-detail'
  | 'task-manager'
  | 'task-detail'
  | 'relationships'
  | 'analytics';

export interface CRMRouteConfig {
  path: string;
  component: CRMRouteComponentKey;
  navItemId?: string;
  note?: string;
}

export const CRM_NAV_SECTIONS: CRMNavSection[] = [
  {
    label: 'Customers',
    items: [
      {
        id: 'crm.customers.all',
        label: 'All Customers',
        path: 'customers',
        icon: Users,
        matchPaths: ['customers', 'customers/:id'],
      },
      {
        id: 'crm.customers.segments',
        label: 'Segments',
        path: 'segments',
        icon: Filter,
      },
      {
        id: 'crm.customers.analytics',
        label: 'Customer Analytics',
        path: 'customer-analytics',
        icon: TrendingUp,
        matchPaths: ['customer-analytics'],
      },
      {
        id: 'crm.customers.import',
        label: 'Import / Export',
        path: 'import-export',
        icon: FileUp,
      },
    ],
  },
  {
    label: 'Deals & Negotiations',
    items: [
      {
        id: 'crm.deals.active',
        label: 'Active Deals',
        path: 'deals',
        icon: Handshake,
        matchPaths: ['deals', 'deals/:dealId'],
      },
      {
        id: 'crm.deals.negotiations',
        label: 'Negotiations',
        path: 'negotiations',
        icon: MessageSquare,
      },
      {
        id: 'crm.deals.bookingRequests',
        label: 'Booking Requests',
        path: 'booking-requests',
        icon: ClipboardList,
      },
      {
        id: 'crm.deals.contactRequests',
        label: 'Contact Requests',
        path: 'contact-requests',
        icon: Calendar,
      },
    ],
  },
  {
    label: 'Tasks & Reminders',
    items: [
      {
        id: 'crm.tasks.board',
        label: 'Task Board',
        path: 'tasks',
        icon: CheckSquare,
        matchPaths: ['tasks', 'tasks/:id'],
      },
      {
        id: 'crm.tasks.mine',
        label: 'My Tasks',
        path: 'my-tasks',
        icon: Network,
      },
      {
        id: 'crm.tasks.templates',
        label: 'Task Templates',
        path: 'task-templates',
        icon: Briefcase,
      },
    ],
  },
  {
    label: 'Relationships',
    items: [
      {
        id: 'crm.relationships.overview',
        label: 'Relationship Hub',
        path: 'relationships',
        icon: Building2,
      },
      {
        id: 'crm.relationships.organizers',
        label: 'Organizers',
        path: 'organizers',
        icon: Users2,
      },
      {
        id: 'crm.relationships.venues',
        label: 'Venues',
        path: 'venues',
        icon: Store,
      },
      {
        id: 'crm.relationships.sponsors',
        label: 'Sponsors',
        path: 'sponsors',
        icon: Landmark,
      },
      {
        id: 'crm.relationships.agencies',
        label: 'Agencies',
        path: 'agencies',
        icon: Handshake,
      },
    ],
  },
  {
    label: 'Reports & Analytics',
    items: [
      {
        id: 'crm.analytics.overview',
        label: 'Reporting Hub',
        path: 'analytics',
        icon: BarChart3,
      },
      {
        id: 'crm.analytics.customerInsights',
        label: 'Customer Insights',
        path: 'customer-insights',
        icon: PieChart,
      },
      {
        id: 'crm.analytics.dealPerformance',
        label: 'Deal Performance',
        path: 'deal-performance',
        icon: DollarSign,
      },
      {
        id: 'crm.analytics.engagement',
        label: 'Engagement Metrics',
        path: 'engagement-metrics',
        icon: Activity,
      },
    ],
  },
];

export const CRM_ROUTE_CONFIG: CRMRouteConfig[] = [
  {
    path: 'customers',
    component: 'customer-list',
    navItemId: 'crm.customers.all',
  },
  {
    path: 'customers/:id',
    component: 'customer-detail',
  },
  {
    path: 'segments',
    component: 'customer-list',
    navItemId: 'crm.customers.segments',
    note: 'Placeholder: segments share the customer list implementation pending dedicated UI.',
  },
  {
    path: 'customer-analytics',
    component: 'customer-list',
    navItemId: 'crm.customers.analytics',
    note: 'Placeholder: analytics links to customer list until analytics view is delivered.',
  },
  {
    path: 'import-export',
    component: 'customer-list',
    navItemId: 'crm.customers.import',
    note: 'Placeholder: import/export routes pending dedicated UI.',
  },
  {
    path: 'deals',
    component: 'deal-pipeline',
    navItemId: 'crm.deals.active',
  },
  {
    path: 'deals/:dealId',
    component: 'deal-detail',
  },
  {
    path: 'negotiations',
    component: 'deal-pipeline',
    navItemId: 'crm.deals.negotiations',
  },
  {
    path: 'booking-requests',
    component: 'deal-pipeline',
    navItemId: 'crm.deals.bookingRequests',
  },
  {
    path: 'contact-requests',
    component: 'deal-pipeline',
    navItemId: 'crm.deals.contactRequests',
  },
  {
    path: 'tasks',
    component: 'task-manager',
    navItemId: 'crm.tasks.board',
  },
  {
    path: 'tasks/:id',
    component: 'task-detail',
  },
  {
    path: 'my-tasks',
    component: 'task-manager',
    navItemId: 'crm.tasks.mine',
  },
  {
    path: 'task-templates',
    component: 'task-manager',
    navItemId: 'crm.tasks.templates',
  },
  {
    path: 'relationships',
    component: 'relationships',
    navItemId: 'crm.relationships.overview',
  },
  {
    path: 'organizers',
    component: 'relationships',
    navItemId: 'crm.relationships.organizers',
    note: 'Organizers currently re-use the relationships overview list.',
  },
  {
    path: 'venues',
    component: 'relationships',
    navItemId: 'crm.relationships.venues',
  },
  {
    path: 'sponsors',
    component: 'relationships',
    navItemId: 'crm.relationships.sponsors',
  },
  {
    path: 'agencies',
    component: 'relationships',
    navItemId: 'crm.relationships.agencies',
  },
  {
    path: 'analytics',
    component: 'analytics',
    navItemId: 'crm.analytics.overview',
  },
  {
    path: 'customer-insights',
    component: 'analytics',
    navItemId: 'crm.analytics.customerInsights',
  },
  {
    path: 'deal-performance',
    component: 'analytics',
    navItemId: 'crm.analytics.dealPerformance',
  },
  {
    path: 'engagement-metrics',
    component: 'analytics',
    navItemId: 'crm.analytics.engagement',
  },
];
