# Profile Analytics System Deployment Guide

## Overview

The profile analytics system provides comedians with insights into their profile performance while maintaining visitor privacy.

## Features

- **Profile View Tracking**: Track page views with visitor information
- **Engagement Metrics**: Monitor time spent, media interactions, and booking requests
- **Geographic Analytics**: See where visitors are coming from
- **Device & Browser Stats**: Understand what devices visitors use
- **Real-time Viewers**: See who's viewing profiles right now
- **Privacy-Compliant**: No PII collected, GDPR compliant

## Deployment Steps

### 1. Apply Database Migration

```bash
cd /root/agents
npm run mcp:migrate -- scripts/apply-analytics-migration.js
```

Or manually:
```bash
node scripts/apply-analytics-migration.js
```

### 2. Deploy Edge Functions

```bash
cd /root/agents/supabase
supabase functions deploy track-analytics
supabase functions deploy visitor-info
supabase functions deploy aggregate-analytics
```

### 3. Set Up Daily Aggregation

Create a cron job to run the aggregation function daily:

```sql
-- In Supabase SQL Editor
SELECT cron.schedule(
  'aggregate-profile-analytics',
  '0 2 * * *', -- Run at 2 AM daily
  $$
  SELECT aggregate_profile_analytics();
  SELECT cleanup_old_analytics();
  $$
);
```

### 4. Configure Edge Function Secrets

In Supabase dashboard, add these secrets to your edge functions:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. Test the System

```bash
node scripts/test-analytics-system.js
```

## Frontend Integration

### Track Profile Views

```typescript
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

// In your comedian profile component
const { trackInteraction } = useAnalyticsTracking({
  profileId: comedian.id,
  trackView: true,
  trackEngagement: true,
});
```

### Track Specific Interactions

```typescript
// Track when someone clicks a booking button
trackInteraction('booking_request', { method: 'email' });

// Track social media link clicks
trackInteraction('social_link_click', { platform: 'instagram' });

// Track media views
trackInteraction('media_view', { type: 'video', id: 'video-123' });
```

### Display Analytics Dashboard

```typescript
import { AnalyticsDashboard } from '@/components/analytics';

// Show analytics for comedian's own profile
<AnalyticsDashboard profileId={comedian.id} />
```

## Privacy Considerations

1. **Anonymous by Default**: Visitors are tracked anonymously unless logged in
2. **IP Anonymization**: IP addresses are stored but can be anonymized
3. **Data Retention**: Raw data kept for 90 days, aggregated data for 1 year
4. **User Rights**: Users can export or request deletion of their data
5. **No Third-Party**: All data stays in your Supabase instance

## Monitoring & Maintenance

### Check Analytics Health

```sql
-- Check recent profile views
SELECT COUNT(*), DATE(created_at) as date
FROM profile_views
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

-- Check aggregation status
SELECT profile_id, date, total_views
FROM profile_analytics_daily
WHERE date > CURRENT_DATE - 7
ORDER BY date DESC, total_views DESC
LIMIT 20;
```

### Manual Aggregation

If the cron job fails, run manually:

```sql
SELECT aggregate_profile_analytics('2024-02-14'::date);
```

### Export Analytics Data

```typescript
// In frontend
const { exportAnalytics } = useProfileAnalytics({ profileId });
exportAnalytics('csv'); // or 'json'
```

## Troubleshooting

### No Analytics Data Showing

1. Check if migration was applied: `node scripts/test-analytics-system.js`
2. Verify edge functions are deployed: Check Supabase dashboard
3. Check browser console for tracking errors
4. Ensure RLS policies are correct

### Aggregation Not Working

1. Check if cron job is scheduled
2. Run aggregation manually
3. Check Supabase logs for errors

### Performance Issues

1. Ensure indexes are created (migration handles this)
2. Monitor table sizes and run cleanup if needed
3. Consider adjusting data retention periods

## API Reference

### Edge Functions

#### POST /track-analytics
Track profile views and engagement events

#### GET /visitor-info
Get visitor geographic information

#### POST /aggregate-analytics
Manually trigger analytics aggregation

### Database Functions

- `aggregate_profile_analytics(target_date)` - Aggregate daily stats
- `cleanup_old_analytics()` - Remove old raw data

## Security Notes

- Edge functions validate all input
- RLS policies ensure users only see their own data
- Service role key only used for aggregation
- No PII stored in analytics tables