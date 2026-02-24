/**
 * Content Strategy — Posting Windows
 *
 * Determines WHAT to post and WHEN for each event.
 * Adapted from src/services/social/content-strategy.ts for Edge Function use.
 */

export interface PostingWindow {
  /** Descriptive label (also used as dedup key) */
  label: string;
  /** Target day for this post (actual hour set by Metricool best times) */
  targetDate: Date;
  /** Priority: 1 = urgent (day-of), 6 = low (recap) */
  priority: number;
  /** Which platforms to target */
  platforms: string[];
  /** Post format types to create */
  postTypes: ('post' | 'reel' | 'story' | 'short')[];
  /** Hint for caption generation */
  contentHint: string;
}

export interface EventData {
  id: string;
  name: string;
  event_date: string;
  start_time?: string | null;
  venue?: string | null;
  ticket_url?: string | null;
  hero_image_url?: string | null;
  banner_url?: string | null;
  description?: string | null;
  organization_id?: string | null;
  organization_name?: string | null;
  lineup?: string[] | null;
  tickets_sold?: number | null;
  capacity?: number | null;
}

/**
 * Generate posting windows for an event.
 * Only returns future windows — past ones are skipped.
 */
export function getPostingWindows(event: EventData): PostingWindow[] {
  const eventDate = new Date(event.event_date);
  const now = new Date();
  const windows: PostingWindow[] = [];

  const allPlatforms = ['instagram', 'facebook', 'tiktok', 'twitter'];

  // 42 days before: Early Announcement (for events 5-8 weeks out)
  const sixWeeksBefore = addDays(eventDate, -42);
  if (sixWeeksBefore > now) {
    windows.push({
      label: 'Early Announcement',
      targetDate: sixWeeksBefore,
      priority: 7,
      platforms: allPlatforms,
      postTypes: ['post'],
      contentHint: `Save the date! "${event.name}" is coming to ${event.venue ?? 'a venue near you'}. Mark your calendars. Tickets available soon.`,
    });
  }

  // 14 days before: Initial Announcement
  const twoWeeksBefore = addDays(eventDate, -14);
  if (twoWeeksBefore > now) {
    windows.push({
      label: 'Initial Announcement',
      targetDate: twoWeeksBefore,
      priority: 5,
      platforms: allPlatforms,
      postTypes: ['post'],
      contentHint: `Announce "${event.name}" at ${event.venue ?? 'venue TBA'}. Build excitement. Include date, venue, and ticket link.`,
    });
  }

  // 7 days before: 1 Week Reminder
  const oneWeekBefore = addDays(eventDate, -7);
  if (oneWeekBefore > now) {
    windows.push({
      label: '1 Week Reminder',
      targetDate: oneWeekBefore,
      priority: 4,
      platforms: allPlatforms,
      postTypes: ['post', 'story'],
      contentHint: `One week until "${event.name}"! Build urgency. Mention lineup highlights if available. Ticket link.`,
    });
  }

  // 3 days before: Last Chance
  const threeDaysBefore = addDays(eventDate, -3);
  if (threeDaysBefore > now) {
    windows.push({
      label: '3 Days Out',
      targetDate: threeDaysBefore,
      priority: 3,
      platforms: ['instagram', 'facebook', 'twitter'],
      postTypes: ['post', 'story'],
      contentHint: `Only 3 days until "${event.name}"! Final push for tickets. Urgency and FOMO.`,
    });
  }

  // 1 day before: Tomorrow reminder
  const dayBefore = addDays(eventDate, -1);
  if (dayBefore > now) {
    windows.push({
      label: 'Day Before',
      targetDate: dayBefore,
      priority: 2,
      platforms: allPlatforms,
      postTypes: ['post', 'story'],
      contentHint: `TOMORROW! "${event.name}" at ${event.venue ?? 'the venue'}. Last chance for tickets. Build excitement and urgency.`,
    });
  }

  // Day of: TONIGHT hype
  if (eventDate >= now) {
    windows.push({
      label: 'Day-Of Hype',
      targetDate: eventDate,
      priority: 1,
      platforms: allPlatforms,
      postTypes: ['post', 'story', 'reel'],
      contentHint: `TODAY! "${event.name}" is happening tonight at ${event.venue ?? 'the venue'}. Last tickets. See you there!`,
    });
  }

  // Day after: Recap
  const dayAfter = addDays(eventDate, 1);
  if (dayAfter > now) {
    windows.push({
      label: 'Post-Show Recap',
      targetDate: dayAfter,
      priority: 6,
      platforms: allPlatforms,
      postTypes: ['post', 'reel'],
      contentHint: `Recap of "${event.name}". Thank the audience, highlight moments, tag performers. Tease next event.`,
    });
  }

  return windows;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
