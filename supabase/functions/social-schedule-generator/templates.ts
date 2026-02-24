/**
 * Template Rendering Engine
 *
 * Renders social media captions from templates with {{variable}} interpolation.
 * Adapts captions per platform (character limits, hashtag counts, tone).
 */

import type { EventData } from './strategy.ts';
import type { BrandConfig } from './brand-config.ts';

// ─── Default Templates Per Window ──────────────────────────────────────────────

const WINDOW_TEMPLATES: Record<string, string> = {
  'Early Announcement': `📣 SAVE THE DATE 📣

{{event_name}}

📅 {{event_date}}
📍 {{venue_name}}

Mark your calendars — this is going to be one you don't want to miss! 🎤

🎟️ Tickets: {{ticket_link}}

{{hashtags}}`,

  'Initial Announcement': `🎤 {{event_name}} 🎤

📅 {{event_date}}
📍 {{venue_name}}
🎟️ Tickets: {{ticket_link}}

Get ready for a night of incredible live comedy! 🔥

{{hashtags}}`,

  '1 Week Reminder': `⏰ 1 WEEK TO GO! ⏰

{{event_name}} is just 7 days away!

📅 {{event_date}}
📍 {{venue_name}}
{{lineup_section}}
🎟️ Don't miss out → {{ticket_link}}

{{hashtags}}`,

  '3 Days Out': `🔥 3 DAYS LEFT! 🔥

{{event_name}} is almost here!

Tickets are moving fast — grab yours before they're gone!

📅 {{event_date}}
📍 {{venue_name}}
🎟️ {{ticket_link}}

{{hashtags}}`,

  'Day Before': `⚡ TOMORROW NIGHT ⚡

{{event_name}}

📅 {{event_date}}
📍 {{venue_name}}
⏰ Doors: {{start_time}}

Last chance to grab tickets 👇
🎟️ {{ticket_link}}

Don't miss out — see you there! 🎤

{{hashtags}}`,

  'Day-Of Hype': `🚨 TONIGHT! 🚨

{{event_name}} is HAPPENING TONIGHT!

📍 {{venue_name}}
⏰ Doors: {{start_time}}

Last chance for tickets 👇
🎟️ {{ticket_link}}

See you there! 🎤🔥

{{hashtags}}`,

  'Post-Show Recap': `What. A. Night! 🙌

Thank you to everyone who came out to {{event_name}}!

The laughs were incredible and the energy was 🔥

Stay tuned for our next show — you won't want to miss it!

{{hashtags}}`,
};

// ─── Template Rendering ────────────────────────────────────────────────────────

export function renderCaption(
  windowLabel: string,
  event: EventData,
  brand: BrandConfig,
  platform: string,
): string {
  const template = WINDOW_TEMPLATES[windowLabel] ?? WINDOW_TEMPLATES['Initial Announcement']!;

  // Format date for display (e.g., "Friday, 28 Feb")
  const eventDate = new Date(event.event_date);
  const dateStr = formatEventDate(eventDate);

  // Format start time
  const timeStr = event.start_time
    ? formatTime(event.start_time)
    : 'Check event details';

  // Build lineup section
  const lineupSection = event.lineup && event.lineup.length > 0
    ? `\n🎤 Featuring: ${event.lineup.join(', ')}\n`
    : '';

  // Build hashtags
  const hashtags = buildHashtags(brand, platform);

  // Render template
  let caption = template
    .replace(/\{\{event_name\}\}/g, event.name)
    .replace(/\{\{event_date\}\}/g, dateStr)
    .replace(/\{\{venue_name\}\}/g, event.venue ?? 'Venue TBA')
    .replace(/\{\{ticket_link\}\}/g, event.ticket_url ?? '')
    .replace(/\{\{start_time\}\}/g, timeStr)
    .replace(/\{\{lineup_section\}\}/g, lineupSection)
    .replace(/\{\{lineup_list\}\}/g, event.lineup?.join(', ') ?? 'TBA')
    .replace(/\{\{hashtags\}\}/g, hashtags);

  // Add brand tag if needed (Magic Mic posts to iD accounts)
  if (brand.tagInCaption) {
    caption = caption.replace(
      /\{\{hashtags\}\}/g,
      `${brand.tagInCaption}\n\n${hashtags}`,
    );
    // If the tag wasn't already in the template, prepend it
    if (!caption.includes(brand.tagInCaption)) {
      caption += `\n\n${brand.tagInCaption}`;
    }
  }

  // Platform-specific adjustments
  return adaptForPlatform(caption, platform);
}

function adaptForPlatform(caption: string, platform: string): string {
  switch (platform) {
    case 'twitter':
      // Twitter: 280 chars max, fewer hashtags
      return truncateCaption(caption, 280);

    case 'tiktok':
      // TikTok: Short and punchy, ~150 chars ideal
      return truncateCaption(caption, 2200);

    case 'instagram':
      // Instagram: Full caption, up to 2200 chars
      return truncateCaption(caption, 2200);

    case 'facebook':
      // Facebook: Longer form, 63,206 char limit
      return caption;

    default:
      return caption;
  }
}

function truncateCaption(caption: string, maxLength: number): string {
  if (caption.length <= maxLength) return caption;

  // Try to cut at the last complete line that fits
  const truncated = caption.slice(0, maxLength - 3);
  const lastNewline = truncated.lastIndexOf('\n');
  if (lastNewline > maxLength * 0.5) {
    return truncated.slice(0, lastNewline) + '...';
  }
  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.5) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}

function buildHashtags(brand: BrandConfig, platform: string): string {
  const tags = [...brand.defaultHashtags];

  // Platform-specific hashtag limits
  const maxTags = platform === 'twitter' ? 3
    : platform === 'tiktok' ? 5
    : platform === 'instagram' ? 15
    : 10;

  return tags.slice(0, maxTags).join(' ');
}

function formatEventDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  return `${day}, ${date.getDate()} ${month}`;
}

function formatTime(timeStr: string): string {
  // Handle HH:mm or HH:mm:ss format
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0]!, 10);
  const minutes = parts[1]!;
  if (isNaN(hours)) return timeStr;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return minutes === '00' ? `${displayHours}${period}` : `${displayHours}:${minutes}${period}`;
}
