# Phase 8: Profile Notifications & Backend Query Optimization

**Status:** 📋 DOCUMENTED - Ready to Implement
**Created:** January 19, 2025
**Prerequisites:** Phase 8C & 8D from Data Integration Plan

---

## Part 1: Profile-Specific Notification System

### 🎯 Overview

Create a comprehensive notification system that delivers relevant, timely alerts tailored to each profile type. Notifications should be contextual, actionable, and respect user preferences per profile.

---

### 📋 Notification Types by Profile

#### Comedian Notifications

**Booking & Opportunities:**
- 🎭 New gig offer received
- ✅ Application accepted
- ❌ Application rejected
- 📅 Event lineup confirmed
- ⏰ Gig starting soon (24h, 2h, 30min warnings)

**Financial:**
- 💰 Payment received for gig
- 📄 Invoice sent
- ⚠️ Payment overdue

**Engagement:**
- 📊 Profile view milestone (100, 500, 1000 views)
- ⭐ New rating/review received
- 👥 New follower

#### Promoter Notifications

**Applications & Talent:**
- 📝 New application received
- ✅ Comedian confirmed spot
- ❌ Comedian declined spot
- ⏰ Application deadline approaching

**Event Management:**
- 🎟️ Ticket sales milestone (25%, 50%, 75%, 100% sold)
- 📉 Low ticket sales warning (7 days before event)
- 📸 Media coverage confirmed (photographer/videographer)
- 👥 Event capacity reached
- 📅 Event starting soon (24h, 2h warnings)

**Business:**
- 💰 Payment received from ticket sales
- 📊 Weekly event performance summary

#### Manager Notifications

**Client Management:**
- 🤝 New client booking request
- 💼 Contract expiring soon (30, 14, 7 days)
- ⚠️ Client application rejected (needs attention)
- 📅 Client gig confirmed
- 📈 Client milestone (10, 25, 50 gigs)

**Financial:**
- 💰 Commission payment received
- 📄 Commission calculation ready
- 💵 Client payment pending

#### Photographer/Videographer Notifications

**Bookings:**
- 📷 New event booking request
- ✅ Booking confirmed by promoter
- ❌ Booking declined
- 📅 Shoot reminder (24h, 2h before event)
- 📸 Equipment checklist reminder (day before)

**Business:**
- 💰 Payment received
- ⭐ New review received
- 📊 Portfolio view milestone

---

### 🗄️ Database Schema

```sql
-- Notification Settings Table
CREATE TABLE IF NOT EXISTS public.profile_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('comedian', 'promoter', 'manager', 'photographer', 'videographer')),
  notification_type TEXT NOT NULL,
  enabled_in_app BOOLEAN DEFAULT true,
  enabled_email BOOLEAN DEFAULT true,
  enabled_push BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_type, notification_type)
);

CREATE INDEX idx_profile_notification_settings_user_profile
  ON public.profile_notification_settings(user_id, profile_type);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('comedian', 'promoter', 'manager', 'photographer', 'videographer')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_profile ON public.notifications(user_id, profile_type);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS Policies
ALTER TABLE public.profile_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification settings"
  ON public.profile_notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON public.profile_notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### 🔔 Notification Hook Implementation

```typescript
// src/hooks/useProfileNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export const useProfileNotifications = () => {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications for active profile
  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', activeProfile, user?.id],
    queryFn: async () => {
      if (!activeProfile || !user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_type', activeProfile)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!activeProfile && !!user,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', activeProfile] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)
        .eq('profile_type', activeProfile)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', activeProfile] });
    },
  });

  // Computed values
  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  const unreadNotifications = notifications?.filter(n => !n.read) || [];

  return {
    notifications: notifications || [],
    unreadNotifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    isMarkingAsRead: markAsRead.isPending,
  };
};

// Hook for notification settings
export const useNotificationSettings = () => {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['notification-settings', activeProfile, user?.id],
    queryFn: async () => {
      if (!activeProfile || !user) return [];

      const { data, error } = await supabase
        .from('profile_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_type', activeProfile);

      if (error) throw error;
      return data;
    },
    enabled: !!activeProfile && !!user,
  });

  const updateSetting = useMutation({
    mutationFn: async ({
      notificationType,
      enabled_in_app,
      enabled_email,
      enabled_push,
    }: {
      notificationType: string;
      enabled_in_app?: boolean;
      enabled_email?: boolean;
      enabled_push?: boolean;
    }) => {
      const { error } = await supabase
        .from('profile_notification_settings')
        .upsert({
          user_id: user?.id,
          profile_type: activeProfile,
          notification_type: notificationType,
          enabled_in_app,
          enabled_email,
          enabled_push,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', activeProfile] });
    },
  });

  return {
    settings: settings || [],
    isLoading,
    updateSetting: updateSetting.mutate,
    isUpdating: updateSetting.isPending,
  };
};
```

---

### 🎨 UI Components

```typescript
// src/components/notifications/NotificationCenter.tsx
export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useProfileNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsRead(notification.id)}
              />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Part 2: Backend Query Optimization

### 🎯 Overview

Optimize database queries for manager, photographer, and videographer dashboards to ensure fast data loading and real-time updates.

---

### 📊 Manager Dashboard Queries

#### Query 1: Client Roster with Metrics

```typescript
// Optimized query with aggregations
export async function fetchManagerClientRoster(managerId: string) {
  const { data, error } = await supabase.rpc('get_manager_client_roster', {
    p_manager_id: managerId,
  });

  if (error) throw error;
  return data;
}
```

```sql
-- Database function for optimized client roster query
CREATE OR REPLACE FUNCTION get_manager_client_roster(p_manager_id UUID)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  client_avatar_url TEXT,
  commission_rate DECIMAL,
  total_gigs INTEGER,
  total_earnings DECIMAL,
  upcoming_gigs INTEGER,
  contract_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.comedian_id AS client_id,
    p.name AS client_name,
    p.avatar_url AS client_avatar_url,
    mc.commission_rate,
    COUNT(DISTINCT ce.id) AS total_gigs,
    COALESCE(SUM(ce.payment_amount), 0) AS total_earnings,
    COUNT(DISTINCT CASE WHEN ce.event_date >= NOW() THEN ce.id END) AS upcoming_gigs,
    CASE
      WHEN mc.contract_end_date < NOW() THEN 'expired'
      WHEN mc.contract_end_date < NOW() + INTERVAL '30 days' THEN 'expiring'
      ELSE 'active'
    END AS contract_status
  FROM manager_clients mc
  JOIN profiles p ON p.id = mc.comedian_id
  LEFT JOIN calendar_events ce ON ce.comedian_id = mc.comedian_id
  WHERE mc.manager_id = p_manager_id
    AND mc.status = 'active'
  GROUP BY mc.comedian_id, p.name, p.avatar_url, mc.commission_rate, mc.contract_end_date;
END;
$$ LANGUAGE plpgsql;
```

#### Query 2: Commission Tracking

```sql
-- Optimized commission tracking with monthly breakdown
CREATE OR REPLACE FUNCTION get_manager_commissions(
  p_manager_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  month DATE,
  total_commission DECIMAL,
  paid_commission DECIMAL,
  pending_commission DECIMAL,
  commission_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', mc.created_at)::DATE AS month,
    SUM(mc.commission_amount) AS total_commission,
    SUM(CASE WHEN mc.payment_status = 'paid' THEN mc.commission_amount ELSE 0 END) AS paid_commission,
    SUM(CASE WHEN mc.payment_status = 'pending' THEN mc.commission_amount ELSE 0 END) AS pending_commission,
    COUNT(*)::INTEGER AS commission_count
  FROM manager_commissions mc
  WHERE mc.manager_id = p_manager_id
    AND (p_start_date IS NULL OR mc.created_at >= p_start_date)
    AND (p_end_date IS NULL OR mc.created_at <= p_end_date)
  GROUP BY month
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;
```

---

### 📸 Photographer Dashboard Queries

#### Query 1: Booking Overview

```sql
CREATE OR REPLACE FUNCTION get_photographer_bookings_overview(
  p_photographer_id UUID,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  total_bookings INTEGER,
  confirmed_bookings INTEGER,
  pending_bookings INTEGER,
  completed_bookings INTEGER,
  total_revenue DECIMAL,
  paid_revenue DECIMAL,
  pending_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_bookings,
    COUNT(CASE WHEN pb.booking_status = 'confirmed' THEN 1 END)::INTEGER AS confirmed_bookings,
    COUNT(CASE WHEN pb.booking_status = 'pending' THEN 1 END)::INTEGER AS pending_bookings,
    COUNT(CASE WHEN pb.booking_status = 'completed' THEN 1 END)::INTEGER AS completed_bookings,
    COALESCE(SUM(pb.rate_agreed), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN pb.payment_status = 'fully_paid' THEN pb.rate_agreed ELSE 0 END), 0) AS paid_revenue,
    COALESCE(SUM(CASE WHEN pb.payment_status != 'fully_paid' THEN pb.rate_agreed ELSE 0 END), 0) AS pending_revenue
  FROM photographer_bookings pb
  WHERE pb.photographer_id = p_photographer_id
    AND (p_date_from IS NULL OR pb.created_at >= p_date_from)
    AND (p_date_to IS NULL OR pb.created_at <= p_date_to);
END;
$$ LANGUAGE plpgsql;
```

---

### ⚡ Query Optimization Strategies

#### 1. Indexed Columns

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_calendar_events_comedian_event_date
  ON calendar_events(comedian_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_photographer_bookings_status_date
  ON photographer_bookings(photographer_id, booking_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manager_commissions_payment_status
  ON manager_commissions(manager_id, payment_status, created_at DESC);
```

#### 2. Materialized Views (for complex aggregations)

```sql
-- Materialized view for manager dashboard metrics
CREATE MATERIALIZED VIEW manager_dashboard_cache AS
SELECT
  mc.manager_id,
  COUNT(DISTINCT mc.comedian_id) AS total_clients,
  COUNT(DISTINCT CASE WHEN mc.status = 'active' THEN mc.comedian_id END) AS active_clients,
  COALESCE(SUM(comm.commission_amount), 0) AS total_commissions
FROM manager_clients mc
LEFT JOIN manager_commissions comm ON comm.manager_id = mc.manager_id
GROUP BY mc.manager_id;

CREATE UNIQUE INDEX ON manager_dashboard_cache(manager_id);

-- Refresh function (call hourly via cron job)
CREATE OR REPLACE FUNCTION refresh_manager_dashboard_cache()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY manager_dashboard_cache;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Query Result Caching in Frontend

```typescript
// Use staleTime and cacheTime strategically
export const useManagerDashboard = () => {
  return useQuery({
    queryKey: ['manager-dashboard', user?.id],
    queryFn: fetchManagerDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
};
```

---

## ✅ Implementation Checklist

### Notifications (Week 1-2)
- [ ] Create database tables and RLS policies
- [ ] Implement notification hooks
- [ ] Create NotificationCenter component
- [ ] Create NotificationSettings component
- [ ] Add email notification templates
- [ ] Set up notification triggers (database functions)
- [ ] Test all notification types

### Backend Queries (Week 2-3)
- [ ] Create database functions for each dashboard
- [ ] Add necessary indexes
- [ ] Create materialized views (if needed)
- [ ] Implement query hooks
- [ ] Update dashboard components to use optimized queries
- [ ] Performance testing and benchmarking
- [ ] Set up query monitoring

---

**Document Version:** 1.0
**Status:** Specification Complete
**Last Updated:** January 19, 2025
**Related:** PHASE_8_DATA_INTEGRATION_PLAN.md
