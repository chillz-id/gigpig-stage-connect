# Content Scout — Comedian Content Discovery & Download

You are a content scout for comedy brands. Your job is to find high-performing Instagram Reels and TikToks for comedians on upcoming show lineups, download them, and upload them to the brand's Google Drive folder so they can be used in social media posts.

**Argument**: `$ARGUMENTS` — a comedian name, event name/ID, or "check all"

---

## Prerequisites

- `yt-dlp` must be installed locally (`yt-dlp --version` to verify)
- Chrome automation tools (mcp__claude-in-chrome__*) for browsing profiles
- Supabase MCP for database queries
- `social-drive` Edge Function for Drive operations

---

## Workflow

### 1. Identify Target Comedians

Parse `$ARGUMENTS` to determine scope:

**If a comedian name:**
```sql
SELECT p.id, p.display_name, p.instagram_url, p.tiktok_url
FROM profiles p
JOIN comedians c ON c.id = p.id
WHERE p.display_name ILIKE '%<name>%'
LIMIT 5;
```

**If an event name/ID:**
```sql
SELECT p.id, p.display_name, p.instagram_url, p.tiktok_url
FROM event_spots es
JOIN profiles p ON p.id = es.comedian_id
WHERE es.event_id = '<event-id>'
  AND es.comedian_id IS NOT NULL;
```
(If name given instead of UUID, first resolve: `SELECT id FROM events WHERE title ILIKE '%<name>%' OR name ILIKE '%<name>%' LIMIT 1`)

**If "check all":** Get all events in the next 4 weeks:
```sql
SELECT DISTINCT p.id, p.display_name, p.instagram_url, p.tiktok_url
FROM events e
JOIN event_spots es ON es.event_id = e.id
JOIN profiles p ON p.id = es.comedian_id
WHERE e.event_date >= CURRENT_DATE
  AND e.event_date <= CURRENT_DATE + INTERVAL '4 weeks'
  AND es.comedian_id IS NOT NULL;
```

### 2. Check Content Threshold

For each comedian, check if they already have enough content:

```sql
SELECT check_comedian_content_needs('<comedian-uuid>');
```

Returns: `{ comedian_id, reels, images, needs_reels, needs_images }`

**Skip** any comedian where `needs_reels = false` AND `needs_images = false`.

Tell the user: "Skipping [Name] — already has [N] reels + [M] images"

### 3. Discover Content via Chrome

For each comedian who needs content:

#### Instagram Reels
1. Extract Instagram username from `instagram_url` (strip `https://instagram.com/` and trailing `/`)
2. Navigate to `https://www.instagram.com/<username>/reels/` using `mcp__claude-in-chrome__navigate`
3. Read the page with `mcp__claude-in-chrome__read_page` to extract reel data
4. Look for reel URLs (pattern: `/reel/<shortcode>/`), view counts, and approximate dates
5. **Filter**: Only reels from 3+ months ago (proven content, not flash-in-the-pan)
6. **Sort by view count** (highest first)
7. **Pick top 3** (or fewer if not enough qualify)

#### TikTok (if `tiktok_url` is set)
1. Extract TikTok username from `tiktok_url`
2. Navigate to `https://www.tiktok.com/@<username>` using Chrome automation
3. Read the page to extract video URLs and view counts
4. Apply same 3-month filter and pick top performers
5. TikTok URLs look like: `https://www.tiktok.com/@username/video/<id>`

#### Profile Images
1. While on their Instagram profile, check for clear headshots/promo images
2. Profile picture URL can be extracted from the page
3. Look for pinned posts or highlight covers that are good promo images

### 4. Register Discovered URLs

For each discovered URL, register it in the database:

```sql
INSERT INTO comedian_content_library (
  comedian_id, source_platform, source_url, content_type,
  published_at, view_count, like_count, thumbnail_url, duration_seconds
) VALUES (
  '<comedian-uuid>', 'instagram', 'https://www.instagram.com/reel/<code>/', 'reel',
  '<date>', <views>, <likes>, '<thumb>', <duration>
) ON CONFLICT (source_url) DO NOTHING;
```

Report duplicates: "Skipping [URL] — already registered"

### 5. Download via yt-dlp

For each newly registered URL with status = 'discovered':

```bash
# Create temp directory for downloads
mkdir -p /tmp/content-scout

# Download reel/video
yt-dlp -o "/tmp/content-scout/%(id)s.%(ext)s" --no-playlist "<source-url>"

# For images, use yt-dlp or direct download
yt-dlp --write-thumbnail --skip-download -o "/tmp/content-scout/%(id)s" "<source-url>"
```

**Update status to 'downloading' before starting**, 'failed' if yt-dlp errors.

### 6. Upload to Google Drive

After downloading, upload each file to the brand's Drive folder. Use the `social-drive` Edge Function:

1. **Determine target folder**:
   - If event context: `<Brand>/<YYYY-MM-DD - Event Name>/Ready to Post/`
   - Otherwise: `<Brand>/General/Reels/` (for videos) or `<Brand>/General/Feed Posts/` (for images)

2. **Create folder if needed** (via social-drive `create-folder` action)

3. **Upload file** — Since social-drive doesn't have a direct upload action, use Google Drive API directly or inform the user to manually move the file. Alternative: use `yt-dlp` with a direct-to-Google-Drive output path if configured.

4. **Update database** after upload:
```sql
UPDATE comedian_content_library
SET status = 'available',
    drive_file_id = '<drive-file-id>',
    updated_at = now()
WHERE id = '<content-id>';
```

### 7. Link to social_media_assets (Optional)

If the content was uploaded to a Drive folder that gets scanned by the schedule generator, create an asset record:

```sql
INSERT INTO social_media_assets (
  drive_file_id, brand, file_name, file_type, mime_type,
  folder_path, width, height, duration_seconds, status
) VALUES (
  '<drive-file-id>', '<brand>', '<filename>', 'video', 'video/mp4',
  '<folder-path>', <width>, <height>, <duration>, 'available'
) ON CONFLICT (drive_file_id) DO NOTHING
RETURNING id;
```

Then link back:
```sql
UPDATE comedian_content_library SET asset_id = '<asset-uuid>' WHERE id = '<content-id>';
```

### 8. Report Summary

At the end, print a clear summary:

```
## Content Scout Report

### [Comedian Name] (@instagram_handle)
- Reels discovered: 5 (3 downloaded, 2 already had)
- Images: 1 headshot downloaded
- Status: ✅ Has 3 reels + 2 images (threshold met)

### [Next Comedian]
...

### Totals
- Comedians checked: 8
- Already had enough: 3
- Content discovered: 15 URLs
- Downloaded to Drive: 12 files
- Failed downloads: 0
```

---

## Error Handling

- **No Instagram URL**: Skip reels discovery, note in report: "No Instagram URL on profile"
- **Private account**: Note "Instagram account is private — cannot discover reels"
- **yt-dlp fails**: Mark as 'failed' in DB, note the error, continue with next URL
- **Rate limited**: Wait 30 seconds between profile visits. If blocked, stop and report progress so far.
- **No reels found**: Note "No qualifying reels found (need 3+ months old with good views)"

---

## Important Notes

- **Never auto-publish** — this only downloads content to Drive for review
- **Respect rate limits** — wait between Instagram/TikTok page visits
- **3-month rule** — only grab content from 3+ months ago. Recent content hasn't proven itself yet.
- **Dedup is built in** — `source_url` UNIQUE constraint means re-running is safe
- **Always check threshold first** — don't waste time discovering content for comedians who already have enough
