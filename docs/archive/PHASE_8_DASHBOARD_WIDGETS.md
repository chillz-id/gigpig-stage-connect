# Phase 8: Dashboard Widget System - Design Specification

**Status:** 📋 DOCUMENTED - Ready to Implement
**Created:** January 19, 2025
**Prerequisites:** Phase 8E from Data Integration Plan

---

## 🎯 Overview

Design a flexible, customizable dashboard widget system that allows users to personalize their dashboard experience per profile type. Users can add, remove, resize, and rearrange widgets to create their ideal workspace.

**Key Features:**
- Drag-and-drop widget arrangement
- Resize widgets (small, medium, large)
- Add/remove widgets from library
- Profile-specific widget availability
- Layout persistence (localStorage + database sync)
- Mobile-responsive grid system
- Auto-refresh capabilities

---

## 🏗️ System Architecture

### Technology Stack

**Grid Layout:**
- `react-grid-layout` - Industry-standard drag-and-drop grid
- `react-resizable` - Widget resizing
- Responsive breakpoints (desktop, tablet, mobile)

**State Management:**
- React Context for widget registry
- localStorage for fast local persistence
- Supabase for cross-device sync
- TanStack Query for widget data fetching

### Component Hierarchy

```
<DashboardPage>
  └─ <WidgetGrid> (react-grid-layout wrapper)
      ├─ <WidgetContainer> (for each widget)
      │   ├─ <WidgetHeader>
      │   │   ├─ Widget title
      │   │   ├─ Refresh button
      │   │   └─ Remove button
      │   └─ <WidgetRenderer> (dynamic widget loader)
      │       └─ <SpecificWidget> (UpcomingGigs, RevenueChart, etc.)
      └─ <AddWidgetButton>
          └─ <WidgetLibrary> (modal/drawer)
```

---

## 📦 Widget Registry

### Widget Definition

```typescript
// src/types/dashboard-widgets.ts
export type WidgetType =
  // Universal widgets
  | 'profile-completion'
  | 'quick-actions'
  | 'recent-activity'
  | 'calendar-view'
  | 'notifications'
  // Comedian widgets
  | 'upcoming-gigs'
  | 'application-status'
  | 'earnings-month'
  | 'profile-views'
  // Promoter widgets
  | 'event-performance'
  | 'application-queue'
  | 'ticket-sales-chart'
  | 'revenue-breakdown'
  // Manager widgets
  | 'client-roster'
  | 'commission-tracking'
  | 'client-gigs'
  | 'contract-expirations'
  // Photographer/Videographer widgets
  | 'booking-calendar'
  | 'revenue-chart'
  | 'portfolio-stats'
  | 'equipment-utilization';

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetConfig {
  id: string; // Unique instance ID
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: { x: number; y: number; w: number; h: number };
  profileTypes: ProfileType[]; // Which profiles can use this widget
  refreshInterval?: number; // Auto-refresh in ms (0 = manual only)
  config?: Record<string, any>; // Widget-specific settings
}

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: LucideIcon;
  profileTypes: ProfileType[];
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
  defaultRefreshInterval?: number;
  component: React.ComponentType<WidgetProps>;
}
```

### Widget Registry Implementation

```typescript
// src/config/widget-registry.ts
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  Camera,
  Bell,
  CheckCircle,
  Zap,
  BarChart3,
} from 'lucide-react';

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  'upcoming-gigs': {
    type: 'upcoming-gigs',
    name: 'Upcoming Gigs',
    description: 'Your next performances at a glance',
    icon: Calendar,
    profileTypes: ['comedian', 'manager'],
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    defaultRefreshInterval: 5 * 60 * 1000, // 5 minutes
    component: lazy(() => import('@/components/widgets/UpcomingGigsWidget')),
  },

  'application-status': {
    type: 'application-status',
    name: 'Application Status',
    description: 'Track your applications in real-time',
    icon: CheckCircle,
    profileTypes: ['comedian', 'promoter'],
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    defaultRefreshInterval: 2 * 60 * 1000, // 2 minutes
    component: lazy(() => import('@/components/widgets/ApplicationStatusWidget')),
  },

  'revenue-chart': {
    type: 'revenue-chart',
    name: 'Revenue Chart',
    description: 'Visual breakdown of your earnings',
    icon: BarChart3,
    profileTypes: ['comedian', 'promoter', 'manager', 'photographer', 'videographer'],
    defaultSize: 'large',
    minSize: 'medium',
    maxSize: 'large',
    component: lazy(() => import('@/components/widgets/RevenueChartWidget')),
  },

  'client-roster': {
    type: 'client-roster',
    name: 'Client Roster',
    description: 'Manage your comedian clients',
    icon: Users,
    profileTypes: ['manager'],
    defaultSize: 'large',
    minSize: 'medium',
    maxSize: 'large',
    defaultRefreshInterval: 10 * 60 * 1000, // 10 minutes
    component: lazy(() => import('@/components/widgets/ClientRosterWidget')),
  },

  // ... (15-20 more widget definitions)
};

// Helper functions
export const getWidgetDefinition = (type: WidgetType): WidgetDefinition => {
  return WIDGET_REGISTRY[type];
};

export const getAvailableWidgets = (profileType: ProfileType): WidgetDefinition[] => {
  return Object.values(WIDGET_REGISTRY).filter(widget =>
    widget.profileTypes.includes(profileType)
  );
};
```

---

## 🎨 Grid Layout System

### Grid Configuration

```typescript
// src/components/dashboard/WidgetGrid.tsx
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Grid breakpoints and columns
const BREAKPOINTS = {
  lg: 1200, // Desktop
  md: 996,  // Tablet landscape
  sm: 768,  // Tablet portrait
  xs: 480,  // Mobile landscape
  xxs: 0,   // Mobile portrait
};

const COLS = {
  lg: 12,   // 12 columns on desktop
  md: 8,    // 8 columns on tablet
  sm: 6,    // 6 columns on tablet portrait
  xs: 4,    // 4 columns on mobile
  xxs: 2,   // 2 columns on small mobile
};

const ROW_HEIGHT = 80; // Height of each grid row in pixels

// Widget size to grid units mapping
const SIZE_MAP = {
  small: { w: 3, h: 2 },   // 3 cols x 2 rows
  medium: { w: 6, h: 3 },  // 6 cols x 3 rows
  large: { w: 12, h: 4 },  // 12 cols x 4 rows (full width)
};

export function WidgetGrid() {
  const { activeProfile } = useProfile();
  const [layout, setLayout] = useWidgetLayout(activeProfile);
  const [isEditing, setIsEditing] = useState(false);

  const handleLayoutChange = (newLayout: Layout[]) => {
    if (!isEditing) return;

    setLayout(newLayout);
  };

  const handleAddWidget = (widgetType: WidgetType) => {
    const definition = getWidgetDefinition(widgetType);
    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: definition.name,
      size: definition.defaultSize,
      position: findNextAvailablePosition(layout),
      profileTypes: definition.profileTypes,
      refreshInterval: definition.defaultRefreshInterval,
    };

    setLayout([...layout, newWidget]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setLayout(layout.filter(w => w.id !== widgetId));
  };

  return (
    <div className="relative">
      {/* Edit mode toggle */}
      <div className="flex justify-end mb-4">
        <Button
          variant={isEditing ? 'default' : 'outline'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Done Editing' : 'Customize Dashboard'}
        </Button>
      </div>

      {/* Widget grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
      >
        {layout.map(widget => (
          <div key={widget.id} data-grid={widget.position}>
            <WidgetContainer
              widget={widget}
              isEditing={isEditing}
              onRemove={() => handleRemoveWidget(widget.id)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Add widget button (shown in edit mode) */}
      {isEditing && (
        <div className="fixed bottom-4 right-4">
          <AddWidgetButton
            availableWidgets={getAvailableWidgets(activeProfile)}
            onAddWidget={handleAddWidget}
          />
        </div>
      )}
    </div>
  );
}
```

### Widget Container

```typescript
// src/components/dashboard/WidgetContainer.tsx
export function WidgetContainer({
  widget,
  isEditing,
  onRemove,
}: WidgetContainerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const definition = getWidgetDefinition(widget.type);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger data refetch
    await queryClient.invalidateQueries({ queryKey: [widget.type] });
    setIsRefreshing(false);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Widget header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditing && (
              <div className="widget-drag-handle cursor-move">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <definition.icon className="h-4 w-4" />
            <h3 className="font-semibold text-sm">{widget.title}</h3>
          </div>

          <div className="flex items-center gap-1">
            {/* Refresh button */}
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn(
                  "h-3 w-3",
                  isRefreshing && "animate-spin"
                )} />
              </Button>
            )}

            {/* Remove button (edit mode only) */}
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Widget content */}
      <CardContent className="flex-1 overflow-auto">
        <Suspense fallback={<WidgetSkeleton />}>
          <WidgetRenderer widget={widget} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
```

---

## 🔧 Widget Implementation Examples

### Example 1: Upcoming Gigs Widget

```typescript
// src/components/widgets/UpcomingGigsWidget.tsx
export function UpcomingGigsWidget({ config }: WidgetProps) {
  const { gigs, isLoading } = useGigs();

  const upcomingGigs = gigs
    ?.filter(g => new Date(g.event_date) >= new Date())
    .slice(0, 5);

  if (isLoading) return <WidgetSkeleton />;

  if (!upcomingGigs || upcomingGigs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No upcoming gigs</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcomingGigs.map(gig => (
        <div key={gig.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{gig.title}</p>
            <p className="text-xs text-muted-foreground truncate">{gig.venue}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium">
              {format(new Date(gig.event_date), 'MMM d')}
            </p>
            <Badge variant={gig.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
              {gig.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Revenue Chart Widget

```typescript
// src/components/widgets/RevenueChartWidget.tsx
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function RevenueChartWidget({ config }: WidgetProps) {
  const dateRange = config?.dateRange || 'month';
  const { data: earningsData, isLoading } = useEarningsHistory(dateRange);

  if (isLoading) return <WidgetSkeleton />;

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={earningsData}>
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
            className="text-xs"
          />
          <YAxis
            tickFormatter={(value) => `$${value}`}
            className="text-xs"
          />
          <Tooltip
            formatter={(value) => [`$${value}`, 'Revenue']}
            labelFormatter={(date) => format(new Date(date), 'MMMM d, yyyy')}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Example 3: Client Roster Widget (Manager)

```typescript
// src/components/widgets/ClientRosterWidget.tsx
export function ClientRosterWidget({ config }: WidgetProps) {
  const { data: dashboard, isLoading } = useManagerDashboard();

  if (isLoading) return <WidgetSkeleton />;

  const clients = dashboard?.clients || [];

  return (
    <div className="space-y-2">
      {clients.map(client => (
        <div key={client.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
          <Avatar className="h-8 w-8">
            <AvatarImage src={client.comedian?.avatar_url} />
            <AvatarFallback>{client.comedian?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{client.comedian?.name}</p>
            <p className="text-xs text-muted-foreground">
              {client.commission_rate}% commission
            </p>
          </div>
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
```

---

## 💾 Layout Persistence

### Hook Implementation

```typescript
// src/hooks/useWidgetLayout.ts
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useWidgetLayout = (profileType: ProfileType) => {
  const { user } = useAuth();
  const [layout, setLayout] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load layout on mount
  useEffect(() => {
    const loadLayout = async () => {
      setIsLoading(true);

      // 1. Try localStorage first (fastest)
      const localKey = `widget-layout-${profileType}`;
      const localLayout = localStorage.getItem(localKey);

      if (localLayout) {
        try {
          setLayout(JSON.parse(localLayout));
          setIsLoading(false);

          // Sync from database in background
          syncFromDatabase();
          return;
        } catch (e) {
          console.error('Failed to parse local layout:', e);
        }
      }

      // 2. Fetch from database
      await syncFromDatabase();
      setIsLoading(false);
    };

    const syncFromDatabase = async () => {
      const { data } = await supabase
        .from('dashboard_layouts')
        .select('layout')
        .eq('user_id', user?.id)
        .eq('profile_type', profileType)
        .single();

      if (data?.layout) {
        setLayout(data.layout);
        // Update localStorage
        localStorage.setItem(`widget-layout-${profileType}`, JSON.stringify(data.layout));
      } else {
        // Use default layout for this profile
        const defaultLayout = getDefaultLayout(profileType);
        setLayout(defaultLayout);
      }
    };

    loadLayout();
  }, [profileType, user?.id]);

  // Save layout changes
  const saveLayout = async (newLayout: WidgetConfig[]) => {
    setLayout(newLayout);

    // 1. Save to localStorage immediately
    const localKey = `widget-layout-${profileType}`;
    localStorage.setItem(localKey, JSON.stringify(newLayout));

    // 2. Debounced save to database
    debouncedSaveToDatabase(newLayout);
  };

  // Debounced database save (1 second)
  const debouncedSaveToDatabase = useMemo(
    () =>
      debounce(async (layoutToSave: WidgetConfig[]) => {
        await supabase.from('dashboard_layouts').upsert({
          user_id: user?.id,
          profile_type: profileType,
          layout: layoutToSave,
          updated_at: new Date().toISOString(),
        });
      }, 1000),
    [user?.id, profileType]
  );

  return [layout, saveLayout, isLoading] as const;
};

// Default layouts per profile
function getDefaultLayout(profileType: ProfileType): WidgetConfig[] {
  const defaults: Record<ProfileType, WidgetConfig[]> = {
    comedian: [
      {
        id: 'default-upcoming-gigs',
        type: 'upcoming-gigs',
        title: 'Upcoming Gigs',
        size: 'medium',
        position: { x: 0, y: 0, w: 6, h: 3 },
        profileTypes: ['comedian'],
      },
      {
        id: 'default-application-status',
        type: 'application-status',
        title: 'Application Status',
        size: 'medium',
        position: { x: 6, y: 0, w: 6, h: 3 },
        profileTypes: ['comedian'],
      },
      {
        id: 'default-earnings',
        type: 'earnings-month',
        title: 'Earnings This Month',
        size: 'small',
        position: { x: 0, y: 3, w: 3, h: 2 },
        profileTypes: ['comedian'],
      },
    ],
    promoter: [
      {
        id: 'default-event-performance',
        type: 'event-performance',
        title: 'Event Performance',
        size: 'large',
        position: { x: 0, y: 0, w: 12, h: 4 },
        profileTypes: ['promoter'],
      },
      {
        id: 'default-application-queue',
        type: 'application-queue',
        title: 'Application Queue',
        size: 'medium',
        position: { x: 0, y: 4, w: 6, h: 3 },
        profileTypes: ['promoter'],
      },
    ],
    // ... (default layouts for other profiles)
  };

  return defaults[profileType] || [];
}
```

### Database Schema

```sql
-- Dashboard Layout Persistence
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('comedian', 'promoter', 'manager', 'photographer', 'videographer')),
  layout JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_type)
);

CREATE INDEX idx_dashboard_layouts_user_profile ON public.dashboard_layouts(user_id, profile_type);

-- RLS Policies
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own layouts"
  ON public.dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own layouts"
  ON public.dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layouts"
  ON public.dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layouts"
  ON public.dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 📱 Mobile Responsiveness

### Responsive Grid Strategy

```typescript
// Mobile breakpoint handling
const MOBILE_LAYOUT_OVERRIDES = {
  xs: {
    // On mobile, force widgets to stack vertically
    cols: 1,
    rowHeight: 100,
    compactType: 'vertical',
  },
  sm: {
    // On tablets, allow 2 columns
    cols: 2,
    rowHeight: 90,
  },
};

// Automatic widget size adjustment for mobile
function getResponsiveSize(
  widget: WidgetConfig,
  breakpoint: string
): { w: number; h: number } {
  if (breakpoint === 'xs') {
    // Mobile: all widgets full width
    return { w: 1, h: 2 };
  }

  if (breakpoint === 'sm') {
    // Tablet: small/medium widgets share row, large ones full width
    return widget.size === 'large'
      ? { w: 2, h: 3 }
      : { w: 1, h: 2 };
  }

  // Desktop: use normal sizes
  return SIZE_MAP[widget.size];
}
```

---

## ⚡ Performance Optimization

### Lazy Loading Widgets

```typescript
// Widget components lazy loaded to reduce initial bundle size
const WIDGET_COMPONENTS = {
  'upcoming-gigs': lazy(() => import('@/components/widgets/UpcomingGigsWidget')),
  'revenue-chart': lazy(() => import('@/components/widgets/RevenueChartWidget')),
  // ... etc
};

// Suspense boundary with fallback
function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  const Component = WIDGET_COMPONENTS[widget.type];

  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <Component config={widget.config} />
    </Suspense>
  );
}
```

### Auto-Refresh Strategy

```typescript
// Widget auto-refresh with configurable intervals
function useWidgetAutoRefresh(widgetType: WidgetType, interval?: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!interval || interval === 0) return;

    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: [widgetType] });
    }, interval);

    return () => clearInterval(timer);
  }, [widgetType, interval, queryClient]);
}
```

---

## ✅ Implementation Checklist

### Week 1: Core Infrastructure
- [ ] Install `react-grid-layout` and `react-resizable`
- [ ] Create widget registry system
- [ ] Implement `WidgetGrid` component
- [ ] Implement `WidgetContainer` component
- [ ] Create layout persistence hook
- [ ] Apply database migration

### Week 2: Widget Development
- [ ] Create 5 universal widgets
- [ ] Create 3 comedian-specific widgets
- [ ] Create 3 promoter-specific widgets
- [ ] Create 3 manager-specific widgets
- [ ] Create 3 photographer/videographer widgets

### Week 3: Polish & Testing
- [ ] Implement add/remove widget UI
- [ ] Add mobile responsiveness
- [ ] Create widget library modal
- [ ] Add default layouts per profile
- [ ] Write E2E tests for drag-and-drop
- [ ] Performance optimization

---

## 🧪 Testing

### E2E Test Example

```typescript
// tests/e2e/dashboard-widgets.spec.ts
import { test, expect } from '@playwright/test';

test('customize dashboard layout', async ({ page }) => {
  await page.goto('/dashboard');

  // Enable edit mode
  await page.click('text=Customize Dashboard');

  // Drag a widget to new position
  const widget = page.locator('[data-widget-id="upcoming-gigs"]');
  await widget.dragTo(page.locator('[data-grid-position="6-0"]'));

  // Save changes
  await page.click('text=Done Editing');

  // Reload and verify persistence
  await page.reload();

  const movedWidget = page.locator('[data-widget-id="upcoming-gigs"]');
  await expect(movedWidget).toHaveAttribute('data-grid-x', '6');
});

test('add new widget from library', async ({ page }) => {
  await page.goto('/dashboard');

  await page.click('text=Customize Dashboard');
  await page.click('text=Add Widget');

  // Select widget from library
  await page.click('text=Revenue Chart');

  // Verify widget added
  await expect(page.locator('[data-widget-type="revenue-chart"]')).toBeVisible();
});
```

---

**Document Version:** 1.0
**Status:** Specification Complete
**Last Updated:** January 19, 2025
**Related:** PHASE_8_DATA_INTEGRATION_PLAN.md
