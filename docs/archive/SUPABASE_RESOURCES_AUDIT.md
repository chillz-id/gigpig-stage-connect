# Supabase Resources Audit

This document lists all Supabase resources that the Stand Up Sydney application depends on.

## Storage Buckets

1. **comedian-media**
   - Purpose: Store comedian profile photos and videos
   - Configuration: Public bucket, 50MB file size limit, accepts image/* and video/* MIME types
   - Referenced in: `src/scripts/setupComedianMedia.ts`

2. **profile-images** (inferred from table reference)
   - Purpose: Likely stores user profile images
   - Referenced in database queries

## Database Tables

The application uses the following tables (found via .from() queries):

### Core User/Profile Tables
- profiles
- user_roles
- user_interests
- organizations
- customization_settings

### Comedian-Related Tables
- comedian_media
- comedian_availability
- comedian_blocked_dates
- comedian_bookings
- comedian_reviews
- comedian_stats

### Event Management Tables
- events
- event_spots
- event_templates
- event_applications
- event_waitlists
- event_ticket_summary
- unmatched_external_events
- pending_event_matches

### Financial/Payment Tables
- invoices
- invoice_items
- invoice_payments
- invoice_recipients
- recurring_invoices
- payment_records
- payment_gateway_settings
- batch_payments
- payout_batches
- commission_rules
- commission_splits
- ticket_sales
- tickets
- xero_invoices
- xero_bills
- xero_integrations

### Tour Management Tables
- tours
- tour_stops
- tour_participants
- tour_collaborations
- tour_expenses
- tour_revenue
- tour_itinerary
- tour_logistics

### Agency/Management Tables
- agencies
- agency_analytics
- artist_management
- manager_profiles

### Communication Tables
- messages
- deal_messages
- deal_negotiations
- notifications
- notification_preferences
- contact_requests

### Task Management Tables
- tasks
- task_comments
- task_templates
- task_template_items
- time_entries

### Photographer/Videographer Tables
- photographer_profiles
- photographer_portfolio
- photographer_availability
- photographer_vouch_stats

### Other Tables
- applications
- booking_requests
- calendar_events
- calendar_integrations
- error_logs
- flight_bookings
- flight_notifications
- flight_search_cache
- marketing_costs
- venue_costs
- vouches

### Special/System Tables
- _sql (for raw SQL execution)

## RPC Functions

The application calls the following RPC functions:

1. **calculate_commission_splits** - Calculate commission splits for events
2. **calculate_negotiation_strategy** - AI-powered negotiation strategy
3. **calculate_tour_statistics** - Calculate tour-related statistics
4. **exec_sql** - Execute raw SQL (used in setup scripts)
5. **generate_recurring_invoice** - Generate invoices from recurring templates
6. **get_agency_dashboard_data** - Fetch agency dashboard analytics
7. **get_comedian_stats** - Get comedian performance statistics
8. **get_existing_vouch** - Check if a vouch already exists
9. **get_flight_delay_trends** - Analyze flight delay patterns
10. **get_photographer_vouches** - Get vouches for photographers
11. **get_task_completion_trends** - Analyze task completion patterns
12. **get_team_task_statistics** - Get team task statistics
13. **get_tour_details** - Get detailed tour information
14. **get_user_flight_statistics** - Get user's flight statistics
15. **get_user_task_statistics** - Get user's task statistics
16. **get_vouch_stats** - Get vouch statistics
17. **is_co_promoter_for_event** - Check if user is co-promoter for an event
18. **link_external_event** - Link external events to internal events
19. **process_automated_deal_response** - Process automated deal responses
20. **update_agency_analytics** - Update agency analytics data

## Edge Functions

The application uses the following Supabase Edge Functions:

1. **check-subscription** - Check user subscription status
2. **create-checkout** - Create payment checkout sessions
3. **customer-portal** - Manage customer portal sessions
4. **google-calendar-sync** - Sync with Google Calendar
5. **google-maps-proxy** - Proxy for Google Maps API calls
6. **xero-oauth** - Handle Xero OAuth flow
7. **save-push-subscription** - Save push notification subscriptions (referenced but not found in functions directory)

## Realtime Subscriptions

The application subscribes to realtime changes on:

1. **events** table - Monitor event changes
2. **ticket_sales** table - Monitor ticket sale updates
3. **comedian_bookings** table - Monitor comedian booking changes

## Missing or Potentially Missing Resources

Based on the code references, these resources might be missing:

1. **save-push-subscription** Edge Function - Referenced in `pwaService.ts` but not found in functions directory
2. Various table relationships and foreign keys that should be properly configured
3. Row Level Security (RLS) policies for all tables
4. Proper indexes for performance optimization

## Recommendations

1. Ensure all tables have appropriate RLS policies enabled
2. Create the missing `save-push-subscription` Edge Function
3. Verify all storage buckets are created with correct permissions
4. Ensure all RPC functions are properly created in the database
5. Set up proper database indexes for frequently queried columns
6. Configure proper foreign key constraints between related tables