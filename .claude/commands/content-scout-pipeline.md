# Content Scout Pipeline — Automated Comedian Content → Metricool Drafts

You are a content pipeline orchestrator. Your job is to take a published lineup, discover each comedian's top reels, check for duplicates, create Comedian Spotlight drafts, refine captions with brand voice, and push everything to Metricool as DRAFTs.

**Argument**: `$ARGUMENTS` — an event name, event ID, or `"check queue"` to process pending lineup_published entries

---

## Prerequisites

- `yt-dlp` installed locally (`yt-dlp --version`)
- Chrome automation tools (mcp__claude-in-chrome__*) for browsing Instagram/TikTok
- Supabase MCP for database queries
- `content-scout` Edge Function (actions: check-needs, register-urls, check-already-posted, create-spotlight-drafts)
- `social-drive` Edge Function for Drive folder operations
- `social-publisher` Edge Function for pushing drafts to Metricool

---

## Mode: Check Queue

If `$ARGUMENTS` is `"check queue"` or `"queue"`:

1. Query pending lineup_published entries:
```sql
SELECT id, trigger_entity_id, trigger_data, created_at
FROM social_content_queue
WHERE trigger_type = 'lineup_published'
  AND status = 'pending'
ORDER BY priority ASC, created_at ASC
LIMIT 5;
```

2. For each entry, show:
```
Queue #<id>: "<event_name>" (published <time_ago>)
  → <N> comedians in lineup
```

3. Ask the user which one to process (or "all")

4. For the chosen entry, proceed with the full pipeline below using the `trigger_entity_id` as the event ID

5. After processing, mark the queue entry as completed:
```sql
UPDATE social_content_queue
SET status = 'completed', processed_at = now()
WHERE id = '<queue-id>';
```

---

## Full Pipeline Flow

### 1. Resolve Event

Parse `$ARGUMENTS` to find the event:

**If UUID:**
```sql
SELECT id, title, name, event_date, venue, ticket_url, organization_id
FROM events WHERE id = '<uuid>';
```

**If name:**
```sql
SELECT id, title, name, event_date, venue, ticket_url, organization_id
FROM events
WHERE (title ILIKE '%<name>%' OR name ILIKE '%<name>%')
  AND event_date >= CURRENT_DATE
ORDER BY event_date ASC
LIMIT 1;
```

### 2. Get Lineup

```sql
SELECT es.comedian_id, p.display_name, p.instagram_url, p.tiktok_url
FROM event_spots es
JOIN profiles p ON p.id = es.comedian_id
WHERE es.event_id = '<event-id>'
  AND es.comedian_id IS NOT NULL;
```

Report: "Found <N> comedians in lineup for <Event Name>"

### 3. Check Content Needs

Call the content-scout Edge Function:

```
POST /functions/v1/content-scout
{ "action": "check-needs", "eventId": "<event-id>" }
```

This returns which comedians need reels/images. Report the results.

### 4. Discover Content via Chrome

For each comedian who needs content:

#### Instagram Reels
1. Extract username from `instagram_url` (strip `https://instagram.com/` and trailing `/`)
2. Navigate to `https://www.instagram.com/<username>/reels/` using `mcp__claude-in-chrome__navigate`
3. Read the page with `mcp__claude-in-chrome__read_page`
4. Extract reel URLs (pattern: `/reel/<shortcode>/`), view counts, and dates
5. **Filter**: Only reels from 3+ months ago (proven content)
6. **Sort by view count** (highest first)
7. **Pick top 5** (or fewer if not enough qualify)

#### TikTok (if available)
1. Extract username from `tiktok_url`
2. Navigate to `https://www.tiktok.com/@<username>` using Chrome automation
3. Read the page for video URLs and view counts
4. Same 3-month filter, pick top performers
5. TikTok URLs: `https://www.tiktok.com/@username/video/<id>`

**Rate limiting**: Wait 5-10 seconds between profile visits to avoid blocks.

### 5. Register Discovered URLs

Call the content-scout Edge Function:

```
POST /functions/v1/content-scout
{
  "action": "register-urls",
  "comedianId": "<comedian-id>",
  "items": [
    {
      "sourceUrl": "https://www.instagram.com/reel/<code>/",
      "sourcePlatform": "instagram",
      "contentType": "reel",
      "publishedAt": "<date>",
      "viewCount": <views>,
      "likeCount": <likes>,
      "durationSeconds": <duration>
    }
  ]
}
```

Report: "Registered <N> URLs, <M> duplicates skipped"

### 6. Download via yt-dlp

For each newly registered content item (status = 'discovered'):

```bash
mkdir -p /tmp/content-scout

# Download reel/video
yt-dlp -o "/tmp/content-scout/%(id)s.%(ext)s" --no-playlist "<source-url>"
```

After successful download, upload to Drive using `social-drive` Edge Function:
1. Create folder: `<Brand>/<YYYY-MM-DD - Event Name>/Ready to Post/`
2. Upload the file to that folder

Update the content library entry:
```sql
UPDATE comedian_content_library
SET status = 'available',
    drive_file_id = '<drive-file-id>',
    updated_at = now()
WHERE id = '<content-id>';
```

### 7. Check Already Posted

Gather all source URLs for content that's now available:

```
POST /functions/v1/content-scout
{
  "action": "check-already-posted",
  "sourceUrls": ["url1", "url2", ...],
  "lookbackDays": 90
}
```

Filter out any content where `recentlyPosted = true`. Report:
"Filtered out <N> recently-posted URLs, <M> fresh content available"

### 8. Create Comedian Spotlight Drafts

For fresh (not recently posted) content:

```
POST /functions/v1/content-scout
{
  "action": "create-spotlight-drafts",
  "eventId": "<event-id>",
  "brand": "<brand-name>",
  "platforms": ["instagram", "facebook", "tiktok"],
  "items": [
    {
      "comedianId": "<comedian-id>",
      "comedianName": "Comedian Name",
      "comedianHandle": "@instagram_handle",
      "contentId": "<content-library-id>",
      "assetId": "<social-media-asset-id>"
    }
  ]
}
```

Report: "Created <N> spotlight drafts, <M> duplicates skipped"

### 9. Voice-Refine Captions

For each created draft:

1. Read the brand's voice file (if available — e.g., from Drive or a stored template)
2. Use your language capabilities to refine each caption:
   - Match the brand's tone (casual, energetic for iD Comedy Club)
   - Include comedian's handle naturally
   - Keep the core info (date, venue, ticket link)
   - Make each caption unique (don't reuse the same structure)
3. Update the draft:
```sql
UPDATE social_content_drafts
SET caption = '<refined-caption>'
WHERE id = '<draft-id>';
```

### 10. Push to Metricool as DRAFT

For each draft, use the social-publisher Edge Function:

```
POST /functions/v1/social-publisher
{
  "action": "publish-draft",
  "draftId": "<draft-id>",
  "asDraft": true
}
```

**CRITICAL**: Always push as DRAFT (`asDraft: true`). Never auto-publish.

Report per draft: "Pushed to Metricool as DRAFT — <platform> — <comedian_name> — <scheduled_date>"

### 11. Print Summary

```
## Content Scout Pipeline Report

### Event: <Event Name> (<Event Date>)
### Brand: <Brand Name>

### Comedians Processed
| Comedian | Reels Found | Downloaded | Fresh | Drafts Created |
|----------|-------------|------------|-------|----------------|
| Name 1   | 5           | 3          | 2     | 6 (3 platforms) |
| Name 2   | 3           | 2          | 2     | 6 (3 platforms) |

### Totals
- Comedians in lineup: <N>
- Already had enough content: <N>
- New content discovered: <N> URLs
- Downloaded to Drive: <N> files
- Already posted (filtered): <N>
- Spotlight drafts created: <N>
- Pushed to Metricool: <N> DRAFTs

### Next Steps
- Review drafts in Metricool planner
- Approve and schedule final posts
- Any failed downloads noted above need manual attention
```

---

## Error Handling

- **No Instagram URL**: Skip reels discovery, note in report
- **Private account**: Note "private account — skipped"
- **yt-dlp fails**: Mark as 'failed' in DB, continue with next URL
- **Rate limited**: Wait 30 seconds. If still blocked, stop and report progress
- **No fresh content**: Note in report, don't create empty drafts
- **Edge Function errors**: Log and continue — don't let one failure stop the whole pipeline

---

## Important Rules

- **Always DRAFT** — Nothing auto-publishes. Everything lands in Metricool for user review.
- **3-month rule** — Only grab content from 3+ months ago. Recent content hasn't proven itself.
- **Dedup is built in** — Window label `Comedian Spotlight: <Name>` ensures one draft per comedian per event per platform.
- **Rate limit Chrome** — Wait between profile visits to avoid blocks.
- **Non-blocking** — If yt-dlp or Drive upload fails for one comedian, continue with others.
