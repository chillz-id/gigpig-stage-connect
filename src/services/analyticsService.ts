import { supabase } from '@/integrations/supabase/client';
import type { 
  ProfileView, 
  ProfileEngagement, 
  ProfileAnalyticsDaily, 
  AnalyticsTimeRange,
  AnalyticsSummary,
  TrackingEventData,
  VisitorInfo
} from '@/types/analytics';
import { parseUserAgent, getDeviceType } from '@/utils/userAgentParser';
import { generateSessionId } from '@/utils/sessionUtils';

class AnalyticsService {
  private sessionId: string;
  private visitorInfo: VisitorInfo | null = null;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.initializeVisitorInfo();
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) return stored;
    
    const newId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', newId);
    return newId;
  }

  private async initializeVisitorInfo() {
    try {
      // Get IP and location info from edge function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('visitor-info', {
        headers: {
          'x-session-id': this.sessionId,
        },
      });
      const data = response.data;
      
      const ua = navigator.userAgent;
      const parsed = parseUserAgent(ua);
      
      this.visitorInfo = {
        session_id: this.sessionId,
        ip_address: data.ip,
        user_agent: ua,
        referrer: document.referrer || null,
        country: data.country,
        region: data.region,
        city: data.city,
        device_type: getDeviceType(ua),
        browser: parsed.browser,
        os: parsed.os,
      };
    } catch (error) {
      console.error('Failed to initialize visitor info:', error);
      // Fallback to basic info
      const ua = navigator.userAgent;
      const parsed = parseUserAgent(ua);
      
      this.visitorInfo = {
        session_id: this.sessionId,
        user_agent: ua,
        referrer: document.referrer || null,
        device_type: getDeviceType(ua),
        browser: parsed.browser,
        os: parsed.os,
      };
    }
  }

  async trackProfileView(profileId: string): Promise<void> {
    if (!this.visitorInfo) {
      await this.initializeVisitorInfo();
    }

    try {
      const response = await supabase.functions.invoke('track-analytics', {
        body: {
          profile_id: profileId,
          event_type: 'view',
        },
        headers: {
          'x-session-id': this.sessionId,
        },
      });

      if (response.error) throw response.error;
    } catch (error) {
      console.error('Failed to track profile view:', error);
    }
  }

  async trackEngagement(profileId: string, event: TrackingEventData): Promise<void> {
    try {
      const response = await supabase.functions.invoke('track-analytics', {
        body: {
          profile_id: profileId,
          event_type: 'engagement',
          event_data: event,
        },
        headers: {
          'x-session-id': this.sessionId,
        },
      });

      if (response.error) throw response.error;
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  }

  async getProfileAnalytics(
    profileId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ProfileAnalyticsDaily[]> {
    const { data, error } = await supabase
      .from('profile_analytics_daily')
      .select('*')
      .eq('profile_id', profileId)
      .gte('date', timeRange.start_date)
      .lte('date', timeRange.end_date)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getAnalyticsSummary(
    profileId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<AnalyticsSummary> {
    const analytics = await this.getProfileAnalytics(profileId, timeRange);
    
    if (analytics.length === 0) {
      return {
        total_views: 0,
        unique_visitors: 0,
        booking_conversion_rate: 0,
        avg_session_duration: 0,
        growth_percentage: 0,
        top_traffic_sources: [],
      };
    }

    const totals = analytics.reduce((acc, day) => ({
      views: acc.views + day.total_views,
      visitors: acc.visitors + day.unique_visitors,
      bookings: acc.bookings + day.booking_requests,
      duration: acc.duration + (day.avg_time_spent_seconds * day.total_views),
    }), { views: 0, visitors: 0, bookings: 0, duration: 0 });

    // Calculate growth (compare first half to second half)
    const midPoint = Math.floor(analytics.length / 2);
    const firstHalf = analytics.slice(0, midPoint);
    const secondHalf = analytics.slice(midPoint);
    
    const firstHalfViews = firstHalf.reduce((sum, day) => sum + day.total_views, 0);
    const secondHalfViews = secondHalf.reduce((sum, day) => sum + day.total_views, 0);
    const growth = firstHalfViews > 0 
      ? ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100 
      : 0;

    // Aggregate top traffic sources
    const referrerMap = new Map<string, number>();
    analytics.forEach(day => {
      day.top_referrers.forEach(ref => {
        const current = referrerMap.get(ref.referrer) || 0;
        referrerMap.set(ref.referrer, current + ref.count);
      });
    });

    const sortedReferrers = Array.from(referrerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const totalReferrerViews = sortedReferrers.reduce((sum, [_, count]) => sum + count, 0);
    const topTrafficSources = sortedReferrers.map(([source, count]) => ({
      source: source || 'Direct',
      percentage: (count / totalReferrerViews) * 100,
    }));

    return {
      total_views: totals.views,
      unique_visitors: totals.visitors,
      booking_conversion_rate: totals.views > 0 ? (totals.bookings / totals.views) * 100 : 0,
      avg_session_duration: totals.views > 0 ? Math.round(totals.duration / totals.views) : 0,
      growth_percentage: growth,
      top_traffic_sources: topTrafficSources,
    };
  }

  async getRealtimeViewers(profileId: string): Promise<number> {
    // Get views from last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('profile_views')
      .select('session_id')
      .eq('profile_id', profileId)
      .gte('created_at', fiveMinutesAgo);

    if (error) throw error;
    
    // Count unique sessions
    const uniqueSessions = new Set(data?.map(v => v.session_id) || []);
    return uniqueSessions.size;
  }

  async exportAnalytics(
    profileId: string,
    timeRange: AnalyticsTimeRange,
    format: 'csv' | 'json' = 'csv'
  ): Promise<Blob> {
    const analytics = await this.getProfileAnalytics(profileId, timeRange);
    
    if (format === 'json') {
      const json = JSON.stringify(analytics, null, 2);
      return new Blob([json], { type: 'application/json' });
    }

    // CSV format
    const headers = [
      'Date',
      'Total Views',
      'Unique Visitors',
      'Authenticated Views',
      'Anonymous Views',
      'Booking Requests',
      'Media Interactions',
      'Link Clicks',
      'Avg Time Spent (seconds)',
    ];

    const rows = analytics.map(day => [
      day.date,
      day.total_views,
      day.unique_visitors,
      day.authenticated_views,
      day.anonymous_views,
      day.booking_requests,
      day.media_interactions,
      day.link_clicks,
      day.avg_time_spent_seconds,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return new Blob([csv], { type: 'text/csv' });
  }

  private isBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawl/i,
      /spider/i,
      /scraper/i,
      /facebookexternalhit/i,
      /WhatsApp/i,
      /Slack/i,
      /TwitterBot/i,
    ];
    
    return botPatterns.some(pattern => pattern.test(userAgent));
  }
}

export const analyticsService = new AnalyticsService();