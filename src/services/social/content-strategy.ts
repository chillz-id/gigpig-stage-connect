/**
 * Content Strategy Rules Engine
 *
 * Determines WHAT to post, WHEN to post it, and for WHICH platforms,
 * based on event lifecycle and ticket milestones.
 */

import type { SocialPlatform } from '@/types/social';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type TriggerType = 'event_created' | 'lineup_changed' | 'ticket_milestone' | 'manual';

export interface SchedulingWindow {
  /** Descriptive label for this posting window */
  label: string;
  /** When to publish (ISO datetime) */
  publishAt: Date;
  /** Priority: 1 = urgent, 10 = low */
  priority: number;
  /** Which platforms this window targets */
  platforms: SocialPlatform[];
  /** Content type hint for the AI */
  postTypes: ('post' | 'reel' | 'story' | 'short')[];
  /** Prompt hint for caption generation */
  contentHint: string;
}

export interface EventContext {
  id: string;
  name: string;
  eventDate: string;       // ISO date
  startTime?: string;      // HH:mm
  venue?: string;
  ticketUrl?: string;
  ticketsSold?: number;
  capacity?: number;
  heroImageUrl?: string;
  description?: string;
  lineupPublishedAt?: string;
}

export interface TicketMilestone {
  percentage: number;
  label: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const ALL_PLATFORMS: SocialPlatform[] = [
  'instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'threads', 'bluesky',
];

const VIDEO_PLATFORMS: SocialPlatform[] = [
  'instagram', 'facebook', 'tiktok', 'youtube',
];

const TICKET_MILESTONES: TicketMilestone[] = [
  { percentage: 50, label: '50% Sold', urgency: 'medium' },
  { percentage: 75, label: '75% Sold — Selling Fast', urgency: 'high' },
  { percentage: 90, label: 'Almost Sold Out', urgency: 'critical' },
  { percentage: 100, label: 'Sold Out', urgency: 'critical' },
];

// ─── Event Announcement Schedule ────────────────────────────────────────────────

/**
 * Generate scheduling windows for a new event announcement.
 * Creates a cadence of posts leading up to and following the event.
 */
export function getEventAnnouncementWindows(event: EventContext): SchedulingWindow[] {
  const eventDate = new Date(event.eventDate);
  const now = new Date();
  const windows: SchedulingWindow[] = [];

  // 2 weeks before: Initial announcement
  const twoWeeksBefore = addDays(eventDate, -14);
  if (twoWeeksBefore > now) {
    windows.push({
      label: 'Initial Announcement',
      publishAt: setPostingTime(twoWeeksBefore, 11, 0), // 11am
      priority: 3,
      platforms: ALL_PLATFORMS,
      postTypes: ['post'],
      contentHint: `Announce "${event.name}" at ${event.venue ?? 'venue TBA'}. Build excitement. Include date, venue, and ticket link.`,
    });
  }

  // 1 week before: Reminder with urgency
  const oneWeekBefore = addDays(eventDate, -7);
  if (oneWeekBefore > now) {
    windows.push({
      label: '1 Week Reminder',
      publishAt: setPostingTime(oneWeekBefore, 12, 0), // noon
      priority: 4,
      platforms: ALL_PLATFORMS,
      postTypes: ['post', 'story'],
      contentHint: `One week until "${event.name}"! Build urgency. Mention lineup highlights if available. Ticket link.`,
    });
  }

  // 3 days before: Final push
  const threeDaysBefore = addDays(eventDate, -3);
  if (threeDaysBefore > now) {
    windows.push({
      label: '3 Days Out — Last Chance',
      publishAt: setPostingTime(threeDaysBefore, 18, 0), // 6pm
      priority: 2,
      platforms: ['instagram', 'facebook', 'twitter', 'threads'],
      postTypes: ['post', 'story'],
      contentHint: `Only 3 days until "${event.name}"! Final push for tickets. Urgency and FOMO.`,
    });
  }

  // Day of: It's happening
  if (eventDate >= now) {
    windows.push({
      label: 'Day-Of Hype',
      publishAt: setPostingTime(eventDate, 10, 0), // 10am
      priority: 1,
      platforms: ALL_PLATFORMS,
      postTypes: ['post', 'story', 'reel'],
      contentHint: `TODAY! "${event.name}" is happening tonight at ${event.venue ?? 'the venue'}. Last tickets. See you there!`,
    });
  }

  // Day after: Recap/thank you
  const dayAfter = addDays(eventDate, 1);
  if (dayAfter > now) {
    windows.push({
      label: 'Post-Show Recap',
      publishAt: setPostingTime(dayAfter, 12, 0), // noon next day
      priority: 5,
      platforms: ALL_PLATFORMS,
      postTypes: ['post', 'reel'],
      contentHint: `Recap of "${event.name}". Thank the audience, highlight moments, tag performers. Tease next event.`,
    });
  }

  return windows;
}

// ─── Lineup Reveal Schedule ─────────────────────────────────────────────────────

/**
 * Generate scheduling windows for a lineup reveal/change.
 */
export function getLineupRevealWindows(event: EventContext): SchedulingWindow[] {
  const now = new Date();
  const windows: SchedulingWindow[] = [];

  // Immediate: Lineup reveal post
  const revealTime = addHours(now, 1); // Schedule 1 hour from now
  windows.push({
    label: 'Lineup Reveal',
    publishAt: revealTime,
    priority: 2,
    platforms: ALL_PLATFORMS,
    postTypes: ['post', 'reel'],
    contentHint: `LINEUP ANNOUNCED for "${event.name}"! Reveal the comedians with excitement. Tag them if possible. Ticket link.`,
  });

  // Story tease (same day, slightly earlier)
  windows.push({
    label: 'Lineup Tease (Story)',
    publishAt: addMinutes(now, 30),
    priority: 1,
    platforms: ['instagram', 'facebook'],
    postTypes: ['story'],
    contentHint: `Tease: "Lineup dropping soon for ${event.name}..." Build anticipation.`,
  });

  return windows;
}

// ─── Ticket Milestone Schedule ──────────────────────────────────────────────────

/**
 * Determine which ticket milestones have been hit and generate posts.
 */
export function getTicketMilestoneWindows(event: EventContext): SchedulingWindow[] {
  if (!event.ticketsSold || !event.capacity || event.capacity === 0) return [];

  const percentage = Math.round((event.ticketsSold / event.capacity) * 100);
  const now = new Date();
  const windows: SchedulingWindow[] = [];

  for (const milestone of TICKET_MILESTONES) {
    if (percentage >= milestone.percentage) {
      const priority = milestone.urgency === 'critical' ? 1
        : milestone.urgency === 'high' ? 2
        : milestone.urgency === 'medium' ? 3
        : 5;

      windows.push({
        label: `Ticket Milestone: ${milestone.label}`,
        publishAt: addMinutes(now, 15), // Post soon
        priority,
        platforms: milestone.urgency === 'critical'
          ? ALL_PLATFORMS
          : ['instagram', 'facebook', 'twitter', 'threads'],
        postTypes: milestone.percentage === 100 ? ['post'] : ['post', 'story'],
        contentHint: milestone.percentage === 100
          ? `SOLD OUT! "${event.name}" is sold out. Thank the community, build hype for next show.`
          : `${milestone.label}! "${event.name}" is ${milestone.label.toLowerCase()}. Create urgency: grab tickets before they're gone.`,
      });
    }
  }

  // Only return the highest milestone hit (avoid duplicate posts)
  return windows.length > 0 ? [windows[windows.length - 1]!] : [];
}

// ─── Strategy Resolver ──────────────────────────────────────────────────────────

/**
 * Given a trigger type and event context, return all scheduling windows.
 */
export function resolveStrategy(
  triggerType: TriggerType,
  event: EventContext,
): SchedulingWindow[] {
  switch (triggerType) {
    case 'event_created':
      return getEventAnnouncementWindows(event);
    case 'lineup_changed':
      return getLineupRevealWindows(event);
    case 'ticket_milestone':
      return getTicketMilestoneWindows(event);
    case 'manual':
      // Manual triggers don't have automatic windows
      return [{
        label: 'Manual Post',
        publishAt: addHours(new Date(), 1),
        priority: 5,
        platforms: ALL_PLATFORMS,
        postTypes: ['post'],
        contentHint: 'User-initiated post. Follow their instructions.',
      }];
  }
}

/**
 * Find the next optimal posting time for a platform,
 * preferring the suggested time but snapping to best-times if available.
 */
export function snapToOptimalTime(
  suggestedTime: Date,
  bestTimes?: { day: number; hour: number; score: number }[],
): Date {
  if (!bestTimes || bestTimes.length === 0) return suggestedTime;

  const day = suggestedTime.getDay(); // 0=Sun, 6=Sat
  const sameDayTimes = bestTimes
    .filter((bt) => bt.day === day)
    .sort((a, b) => b.score - a.score);

  if (sameDayTimes.length > 0 && sameDayTimes[0]) {
    const best = sameDayTimes[0];
    const snapped = new Date(suggestedTime);
    snapped.setHours(best.hour, 0, 0, 0);
    // Only snap if the best time is in the future
    if (snapped > new Date()) return snapped;
  }

  return suggestedTime;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

function setPostingTime(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
