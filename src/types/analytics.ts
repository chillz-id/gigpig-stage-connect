export interface ProfileView {
  id: string;
  profile_id: string;
  viewer_id: string | null;
  session_id: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  is_bot: boolean;
  created_at: string;
}

export interface ProfileEngagement {
  id: string;
  profile_id: string;
  viewer_id: string | null;
  session_id: string;
  action_type: 'media_view' | 'link_click' | 'booking_request' | 'share' | 'contact_view' | 'social_link_click';
  action_details: Record<string, any>;
  time_spent_seconds: number | null;
  created_at: string;
}

export interface ProfileAnalyticsDaily {
  id: string;
  profile_id: string;
  date: string;
  total_views: number;
  unique_visitors: number;
  authenticated_views: number;
  anonymous_views: number;
  booking_requests: number;
  media_interactions: number;
  link_clicks: number;
  avg_time_spent_seconds: number;
  top_referrers: Array<{ referrer: string; count: number }>;
  top_countries: Array<{ country: string; count: number }>;
  device_breakdown: Record<string, number>;
  browser_breakdown: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsTimeRange {
  start_date: string;
  end_date: string;
  interval: 'day' | 'week' | 'month';
}

export interface AnalyticsSummary {
  total_views: number;
  unique_visitors: number;
  booking_conversion_rate: number;
  avg_session_duration: number;
  growth_percentage: number;
  top_traffic_sources: Array<{ source: string; percentage: number }>;
}

export interface TrackingEventData {
  action_type: ProfileEngagement['action_type'];
  action_details?: Record<string, any>;
  time_spent_seconds?: number;
}

export interface VisitorInfo {
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  region?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
}