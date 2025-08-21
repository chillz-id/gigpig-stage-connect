import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsService } from '@/services/analyticsService';
import type { 
  AnalyticsTimeRange, 
  AnalyticsSummary, 
  ProfileAnalyticsDaily,
  TrackingEventData 
} from '@/types/analytics';
import { getSessionDuration } from '@/utils/sessionUtils';

interface UseProfileAnalyticsOptions {
  profileId: string;
  timeRange?: AnalyticsTimeRange;
  trackView?: boolean;
  realtimePolling?: boolean;
}

export function useProfileAnalytics({
  profileId,
  timeRange = {
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    interval: 'day',
  },
  trackView = false,
  realtimePolling = false,
}: UseProfileAnalyticsOptions) {
  const queryClient = useQueryClient();
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const sessionStartRef = useRef<number>(Date.now());
  const isTrackingRef = useRef(false);

  // Track profile view
  useEffect(() => {
    if (trackView && !hasTrackedView && profileId && !isTrackingRef.current) {
      isTrackingRef.current = true;
      analyticsService.trackProfileView(profileId)
        .then(() => setHasTrackedView(true))
        .finally(() => {
          isTrackingRef.current = false;
        });
    }
  }, [trackView, hasTrackedView, profileId]);

  // Track time spent on page
  useEffect(() => {
    if (!trackView) return;

    const trackTimeSpent = () => {
      const timeSpent = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      if (timeSpent > 0) {
        analyticsService.trackEngagement(profileId, {
          action_type: 'media_view',
          time_spent_seconds: timeSpent,
        });
      }
    };

    // Track when user leaves the page
    const handleBeforeUnload = () => trackTimeSpent();
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Also track if the page becomes hidden (mobile browsers)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackTimeSpent();
      } else {
        sessionStartRef.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      trackTimeSpent();
    };
  }, [profileId, trackView]);

  // Fetch analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['profile-analytics', profileId, timeRange],
    queryFn: () => analyticsService.getProfileAnalytics(profileId, timeRange),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch analytics summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['profile-analytics-summary', profileId, timeRange],
    queryFn: () => analyticsService.getAnalyticsSummary(profileId, timeRange),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch realtime viewers
  const { data: realtimeViewers } = useQuery({
    queryKey: ['profile-realtime-viewers', profileId],
    queryFn: () => analyticsService.getRealtimeViewers(profileId),
    enabled: !!profileId && realtimePolling,
    refetchInterval: realtimePolling ? 30000 : false, // Poll every 30 seconds
    staleTime: 10000, // 10 seconds
  });

  // Track engagement mutation
  const trackEngagementMutation = useMutation({
    mutationFn: (event: TrackingEventData) => 
      analyticsService.trackEngagement(profileId, event),
    onSuccess: () => {
      // Invalidate analytics queries to reflect new data
      queryClient.invalidateQueries({ 
        queryKey: ['profile-analytics', profileId] 
      });
    },
  });

  // Export analytics mutation
  const exportAnalyticsMutation = useMutation({
    mutationFn: (format: 'csv' | 'json') => 
      analyticsService.exportAnalytics(profileId, timeRange, format),
    onSuccess: (blob, format) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${profileId}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  const trackEngagement = useCallback((event: TrackingEventData) => {
    trackEngagementMutation.mutate(event);
  }, [trackEngagementMutation]);

  const exportAnalytics = useCallback((format: 'csv' | 'json' = 'csv') => {
    exportAnalyticsMutation.mutate(format);
  }, [exportAnalyticsMutation]);

  return {
    analyticsData: analyticsData || [],
    summary: summary || {
      total_views: 0,
      unique_visitors: 0,
      booking_conversion_rate: 0,
      avg_session_duration: 0,
      growth_percentage: 0,
      top_traffic_sources: [],
    },
    realtimeViewers: realtimeViewers || 0,
    isLoading: isLoadingAnalytics || isLoadingSummary,
    trackEngagement,
    exportAnalytics,
    isExporting: exportAnalyticsMutation.isPending,
  };
}