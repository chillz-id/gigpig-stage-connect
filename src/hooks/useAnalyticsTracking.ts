import { useEffect, useRef } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';

interface UseAnalyticsTrackingOptions {
  profileId?: string;
  trackView?: boolean;
  trackEngagement?: boolean;
}

export function useAnalyticsTracking({
  profileId,
  trackView = true,
  trackEngagement = true,
}: UseAnalyticsTrackingOptions) {
  const { user } = useAuth();
  const hasTrackedView = useRef(false);
  const pageLoadTime = useRef(Date.now());
  const lastInteractionTime = useRef(Date.now());

  // Track page view
  useEffect(() => {
    if (!profileId || !trackView || hasTrackedView.current) return;
    
    // Don't track own profile views
    if (user?.id === profileId) return;

    hasTrackedView.current = true;
    analyticsService.trackProfileView(profileId);
  }, [profileId, trackView, user?.id]);

  // Track time spent and page unload
  useEffect(() => {
    if (!profileId || !trackEngagement) return;
    if (user?.id === profileId) return; // Don't track own engagement

    const handleUnload = () => {
      const timeSpent = Math.floor((Date.now() - pageLoadTime.current) / 1000);
      if (timeSpent > 0) {
        // Use sendBeacon for reliable tracking on page unload
        const data = {
          profile_id: profileId,
          event_type: 'engagement',
          event_data: {
            action_type: 'media_view',
            time_spent_seconds: timeSpent,
          },
        };
        
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-analytics`,
          JSON.stringify(data)
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeSpent = Math.floor((Date.now() - lastInteractionTime.current) / 1000);
        if (timeSpent > 0) {
          analyticsService.trackEngagement(profileId, {
            action_type: 'media_view',
            time_spent_seconds: timeSpent,
          });
        }
      } else {
        lastInteractionTime.current = Date.now();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profileId, trackEngagement, user?.id]);

  // Track specific interactions
  const trackInteraction = (
    actionType: 'link_click' | 'media_view' | 'booking_request' | 'share' | 'contact_view' | 'social_link_click',
    actionDetails?: Record<string, any>
  ) => {
    if (!profileId || user?.id === profileId) return;

    analyticsService.trackEngagement(profileId, {
      action_type: actionType,
      action_details: actionDetails,
    });
  };

  return {
    trackInteraction,
  };
}