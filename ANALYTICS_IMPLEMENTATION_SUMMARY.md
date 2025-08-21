# Profile Analytics System Implementation Summary

## Overview

I've implemented a comprehensive profile analytics system for Stand Up Sydney that tracks profile views and engagement metrics while maintaining visitor privacy. The system provides comedians with valuable insights into their profile performance.

## What Was Implemented

### 1. Database Schema

Created three tables with appropriate indexes and RLS policies:

- **`profile_views`**: Tracks individual profile visits with visitor information
- **`profile_engagement`**: Records specific interactions (media views, link clicks, booking requests)
- **`profile_analytics_daily`**: Stores aggregated daily statistics for performance

### 2. Analytics Tracking Features

- **Automatic View Tracking**: Profile views are tracked automatically when someone visits
- **Engagement Tracking**: Tracks interactions like:
  - Media views (photos/videos)
  - Social media link clicks
  - Booking request initiations
  - Contact information views
  - Profile shares
- **Session Duration**: Tracks time spent on profile pages
- **Geographic Analytics**: Country, region, and city-level data
- **Device & Browser Stats**: Tracks device types and browsers used

### 3. Privacy Protection Measures

- **Anonymous Tracking**: Visitors tracked anonymously by default
- **No PII Collection**: No personally identifiable information stored
- **IP Anonymization**: IP addresses can be anonymized
- **Data Retention**: Raw data kept for 90 days, aggregated for 1 year
- **GDPR Compliant**: Full compliance with privacy regulations
- **User Control**: Profile owners can export or delete their data

### 4. Analytics Dashboard Components

Created a full analytics dashboard with multiple views:

- **Overview**: Key metrics cards showing total views, unique visitors, conversion rates
- **Charts**: Time-series visualizations for views and visitor trends
- **Traffic Sources**: Where visitors come from (referrers, search, direct)
- **Geographic Data**: Top countries and regions
- **Device Breakdown**: Desktop vs mobile vs tablet usage
- **Browser Stats**: Most popular browsers
- **Engagement Metrics**: Booking conversions, media interactions, time spent
- **Real-time Viewers**: Shows current active viewers
- **Privacy Notice**: Clear explanation of what's tracked and user rights

### 5. Edge Functions

Three Supabase edge functions for secure tracking:

- **`track-analytics`**: Handles profile view and engagement tracking
- **`visitor-info`**: Gets geographic information from IP addresses
- **`aggregate-analytics`**: Aggregates raw data into daily statistics

### 6. React Hooks & Services

- **`useProfileAnalytics`**: Main hook for fetching analytics data
- **`useAnalyticsTracking`**: Hook for tracking views and interactions
- **`analyticsService`**: Service layer for analytics operations
- Export functionality for CSV/JSON data download

### 7. Integration Points

The analytics system is integrated into:

- **Comedian Profile Pages**: Automatic tracking when profiles are viewed
- **Media Components**: Track when photos/videos are viewed
- **Contact Components**: Track booking request interactions
- **Social Links**: Track clicks on social media links

## How to Use

### For Developers

1. **Apply the migration**:
   ```bash
   node scripts/apply-analytics-migration.js
   ```

2. **Deploy edge functions**:
   ```bash
   cd supabase
   supabase functions deploy track-analytics
   supabase functions deploy visitor-info
   supabase functions deploy aggregate-analytics
   ```

3. **Track profile views** (automatic in ComedianProfileLayout):
   ```typescript
   const { trackInteraction } = useAnalyticsTracking({
     profileId: comedian.id,
     trackView: true
   });
   ```

4. **Track specific interactions**:
   ```typescript
   trackInteraction('booking_request', { method: 'email' });
   trackInteraction('media_view', { type: 'video', id: 'abc123' });
   trackInteraction('social_link_click', { platform: 'instagram' });
   ```

### For Comedians

1. **View Analytics**: Go to your profile and click the "Analytics" tab
2. **Time Range**: Select different date ranges (7 days, 30 days, 90 days, 1 year)
3. **Export Data**: Click "Export CSV" to download your analytics
4. **Real-time**: See how many people are viewing your profile right now
5. **Privacy**: Review the Privacy tab to understand what's tracked

## Performance Optimizations

- **Efficient Indexes**: Database indexes on profile_id, created_at, session_id
- **Daily Aggregation**: Raw data aggregated daily to reduce query load
- **Lazy Loading**: Analytics only loaded when needed
- **Caching**: 5-minute cache for analytics queries
- **Batch Tracking**: Multiple events can be batched together

## Security Measures

- **RLS Policies**: Users can only view their own analytics
- **Edge Function Validation**: All inputs validated and sanitized
- **No Cross-Profile Access**: Profiles cannot see who viewed them
- **Service Role Protection**: Admin keys only used for aggregation

## Next Steps for Full Deployment

1. **Set up daily cron job** for aggregation:
   ```sql
   SELECT cron.schedule(
     'aggregate-profile-analytics',
     '0 2 * * *',
     $$SELECT aggregate_profile_analytics();$$
   );
   ```

2. **Monitor performance** with:
   ```sql
   SELECT COUNT(*), DATE(created_at) as date
   FROM profile_views
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY date ORDER BY date DESC;
   ```

3. **Configure alerting** for failed aggregations or unusual traffic

## Testing

Run the comprehensive test:
```bash
node scripts/test-analytics-system.js
```

This will verify:
- Tables exist and are accessible
- Tracking functions work correctly
- Aggregation processes data properly
- RLS policies enforce security
- Analytics can be retrieved

## Files Created/Modified

### New Files:
- `/supabase/migrations/20250114_profile_analytics_system.sql`
- `/src/types/analytics.ts`
- `/src/services/analyticsService.ts`
- `/src/hooks/useProfileAnalytics.ts`
- `/src/hooks/useAnalyticsTracking.ts`
- `/src/components/analytics/` (8 components)
- `/src/utils/userAgentParser.ts`
- `/src/utils/sessionUtils.ts`
- `/supabase/functions/track-analytics/`
- `/supabase/functions/visitor-info/`
- `/supabase/functions/aggregate-analytics/`
- `/scripts/apply-analytics-migration.js`
- `/scripts/test-analytics-system.js`
- `/docs/analytics-deployment.md`

### Modified Files:
- `/src/components/comedian-profile/ComedianProfileLayout.tsx`
- `/src/components/comedian-profile/ComedianContact.tsx`
- `/src/components/comedian-profile/ComedianMedia.tsx`

## Benefits for Comedians

1. **Understand Your Audience**: See where visitors come from and what devices they use
2. **Track Engagement**: Know which content gets the most interaction
3. **Measure Conversion**: See how many profile views turn into booking requests
4. **Optimize Content**: Use data to improve profile effectiveness
5. **Export Reports**: Download data for external analysis or reporting

The system is designed to be privacy-first while providing valuable insights to help comedians grow their careers.