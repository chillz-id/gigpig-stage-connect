# Post-Show Email Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an edge function that generates and sends a post-show email to event attendees via Mautic, featuring the lineup with comedian headshots, bios, social links, and a Google Review CTA.

**Architecture:** Single Mautic email template with `{lineup_html}` token. Edge function `post-show-email` takes an event_id + mautic_email_id, assembles lineup data from Supabase, generates the lineup HTML block, and sends to each attendee via Mautic's `sendToContact` API with custom tokens. No automatic trigger - manual invocation only.

**Tech Stack:** Supabase Edge Functions (Deno), Mautic API (OAuth2), HTML email template in Mautic

---

### Task 1: Add google_review_url to organizations -- DONE

Migration applied. Column `google_review_url TEXT` added to `organizations` table.

---

### Task 2: Build post-show-email edge function -- DONE

**File:** `supabase/functions/post-show-email/index.ts`

**Data flow:**
1. Accept `event_id` + `mautic_email_id` in request body (POST, JWT-authenticated)
2. Fetch event from `events` table (title, name, venue, event_date, organization_id)
3. Fetch organization from `organizations` table (name, logo_url, google_review_url)
4. Fetch lineup from `event_spots` joined to `directory_profiles` via `directory_profile_id`:
   - Filter: `event_id` match, `spot_type = 'act'`, exclude doors/intermission, `directory_profile_id IS NOT NULL`
   - Order: `spot_order ASC`
   - From directory_profiles: `stage_name`, `slug`, `short_bio`, `long_bio`, `primary_headshot_url`, `instagram_url`, `tiktok_url`, `youtube_url`, `facebook_url`, `twitter_url`, `website`
5. Generate lineup HTML block with inline styles (email-safe)
6. Fetch attendees from `attendees` table (deduplicated by email)
7. Match attendees to Mautic contacts via `customer_emails` -> `mautic_sync_status`
8. Send to each contact: `POST /api/emails/{mautic_email_id}/contact/{contactId}/send` with tokens
9. Return summary: sent count, failed count, lineup preview

**Tokens passed to Mautic template:**
- `{lineup_html}` - Full HTML lineup block (acts with headshots, bios, social links)
- `{show_name}` - Event title
- `{show_date}` - Formatted date (en-AU locale)
- `{venue_name}` - Venue name
- `{org_name}` - Organization name
- `{google_review_url}` - Google review URL for CTA button
- `{org_logo_url}` - Organization logo URL

**Modes:**
- `dry_run: true` - Returns tokens and HTML preview without sending
- `test_email: "email@example.com"` - Sends only to that email instead of all attendees

---

### Task 3: Create Mautic email template -- PENDING

Create a reusable email template in Mautic using the tokens above. This is done manually in Mautic's email builder.

**Template structure:**
- Organisation logo header (via `{org_logo_url}`)
- Greeting: "Thanks for coming to {show_name}!"
- Date/venue: "{show_date} at {venue_name}"
- Lineup section: `{lineup_html}` token (HTML rendered by edge function)
- Google Review CTA: "How was your night?" + button linking to `{google_review_url}`
- Footer: {org_name} + `{unsubscribe_url}` (Mautic built-in)

**Note:** The `{lineup_html}` token contains the full HTML for each act including headshot, stage name, bio, social links, and "See upcoming shows" link. It uses inline styles and table-based layout for email compatibility.

---

### Task 4: Configure Mautic SMTP with Amazon SES -- PENDING

Mautic's current `mailer_dsn` is `smtp://localhost:25` which doesn't work. Need to configure SES SMTP credentials.

**Requires from user:** SES SMTP username + password (or SES API credentials)

---

### Task 5: Manual test with a real event -- PENDING

**Prerequisites:**
- Mautic SMTP configured (Task 4)
- Mautic email template created (Task 3)
- At least one event with `directory_profile_id` linked on event_spots
- Attendees in the `attendees` table (from ticket webhook)

**Steps:**
1. Dry run: `POST /functions/v1/post-show-email` with `{"event_id": "...", "mautic_email_id": N, "dry_run": true}`
2. Review tokens and lineup HTML
3. Test send: same request with `"test_email": "anthony@..."` instead of dry_run
4. Verify email received with correct layout

---

### Data Dependencies (Current State)

| Data | Status | Notes |
|------|--------|-------|
| `events` | Has data | Events with titles, venues, dates |
| `organizations` | Has data | Org names, need to set google_review_url |
| `event_spots` | Structure exists | 52 act spots, but `directory_profile_id` mostly NULL |
| `directory_profiles` | 302 profiles | Stage names, slugs, 176 with Instagram. Need to link to event_spots |
| `attendees` | Empty (0 records) | Will populate from ticket webhooks (Humanitix/Eventbrite) |
| `customer_emails` -> `mautic_sync_status` | 16,039 synced | Mautic contact matching ready |
