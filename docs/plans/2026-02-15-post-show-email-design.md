# Post-Show Email Template - Design

## Goal
Build a Mautic email template that sends post-show to event attendees, featuring the lineup with comedian headshots, bios, social links, and a Google Review CTA.

## Architecture
- **Edge function** `post-show-email` assembles lineup data from Supabase and pushes it to Mautic as a campaign email
- **Mautic email template** with dynamic content tokens populated by the edge function
- **No automatic trigger yet** - manual invocation only until template is validated
- Future: daily cron at 10am AEST sends for events that completed the previous evening

## Data Sources
- `events` table: title, venue, event_date, organization_id
- `event_spots` table: spot_order, spot_name, comedian_id (ordered by spot_order, type='act' only)
- `profiles` table: stage_name, bio, avatar_url, instagram_url, tiktok_url, twitter_url, youtube_url, facebook_url, website_url
- `organizations` table: name, logo, google_review_url (new field)
- `ticket_sales` table: customer_email matched to Mautic contacts

## Email Structure
1. **Header**: Organisation logo + "Thanks for coming to [Show Name] at [Venue]!" + formatted date
2. **Lineup section**: Each act in order of appearance
   - Avatar (from profiles.avatar_url)
   - Spot label + Stage name (e.g. "Headliner: Wil Anderson")
   - First 2 sentences of bio (auto-truncated, skipped if empty)
   - Social media icons (only rendered if URL exists on profile)
   - "See upcoming shows" link to public comedian page (configurable base URL)
3. **Review CTA**: "How was your night?" + Google Review button linking to organisation's google_review_url
4. **Footer**: Unsubscribe link + organisation social links

## Implementation Scope (No Trigger)
1. Add `google_review_url` field to organisations table
2. Build edge function that:
   - Accepts an event_id parameter
   - Fetches event + lineup + comedian profiles + organisation data
   - Truncates bios to first 2 sentences
   - Assembles HTML email content
   - Creates/sends Mautic campaign email to event attendees
3. Build Mautic email template (HTML)
4. Manual testing via direct edge function invocation

## Out of Scope (Future)
- Automatic 10am AEST trigger via pg_cron
- Configurable public website base URL for comedian profiles
- Analytics/tracking on email engagement feeding back to CRM
