/**
 * Schedule Optimizer
 *
 * Assigns time slots to drafts using Metricool Best Times data.
 * Enforces daily caps, minimum gaps, and priority-based conflict resolution.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BestTimeSlot {
  day: number;  // 0=Sunday, 6=Saturday
  hour: number; // 0-23
  score: number;
}

export interface DraftSlot {
  eventId: string;
  eventName: string;
  windowLabel: string;
  platform: string;
  postType: string;
  priority: number;
  targetDate: Date;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  organizationId: string;
}

export interface ScheduledSlot extends DraftSlot {
  scheduledFor: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Max feed posts per day per brand (avoids follower fatigue) */
const MAX_FEED_POSTS_PER_DAY = 2;

/** Min hours between feed posts on same brand */
const MIN_GAP_HOURS = 3;

/** Days with highest engagement (Tue=2, Wed=3, Thu=4) get a slight boost */
const MIDWEEK_BONUS_DAYS = new Set([2, 3, 4]);
const MIDWEEK_BONUS = 5;

// ─── Main Optimizer ──────────────────────────────────────────────────────────

/**
 * Assign optimal time slots to all draft slots.
 * Uses Metricool best times, enforces caps and gaps.
 */
export function optimizeSchedule(
  drafts: DraftSlot[],
  bestTimes: Map<string, BestTimeSlot[]>,
  existingScheduled: Date[],
): ScheduledSlot[] {
  // Sort by priority (1=urgent first) then by target date (earliest first)
  const sorted = [...drafts].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.targetDate.getTime() - b.targetDate.getTime();
  });

  const scheduled: ScheduledSlot[] = [];
  const daySlotCounts = new Map<string, number>(); // "YYYY-MM-DD" → count
  const scheduledTimes: Date[] = [...existingScheduled];

  for (const draft of sorted) {
    const slotTime = findBestSlot(
      draft,
      bestTimes.get(draft.platform) ?? [],
      scheduledTimes,
      daySlotCounts,
    );

    if (slotTime) {
      scheduled.push({ ...draft, scheduledFor: slotTime });
      scheduledTimes.push(slotTime);

      // Track daily counts (only for feed posts, not stories)
      if (draft.postType === 'post' || draft.postType === 'reel') {
        const dayKey = formatDateKey(slotTime);
        daySlotCounts.set(dayKey, (daySlotCounts.get(dayKey) ?? 0) + 1);
      }
    }
  }

  return scheduled;
}

/**
 * Find the best available time slot for a draft.
 */
function findBestSlot(
  draft: DraftSlot,
  platformBestTimes: BestTimeSlot[],
  scheduledTimes: Date[],
  daySlotCounts: Map<string, number>,
): Date | null {
  const targetDay = draft.targetDate.getDay();
  const isFeedPost = draft.postType === 'post' || draft.postType === 'reel';

  // Get best times for the target day, sorted by score
  let dayBestTimes = platformBestTimes
    .filter((bt) => bt.day === targetDay)
    .sort((a, b) => {
      let scoreA = a.score;
      let scoreB = b.score;
      // Midweek bonus
      if (MIDWEEK_BONUS_DAYS.has(a.day)) scoreA += MIDWEEK_BONUS;
      if (MIDWEEK_BONUS_DAYS.has(b.day)) scoreB += MIDWEEK_BONUS;
      return scoreB - scoreA;
    });

  // If no best times for this day, use reasonable defaults
  if (dayBestTimes.length === 0) {
    dayBestTimes = getDefaultTimeSlots(targetDay);
  }

  // Try each time slot in order of score
  for (const slot of dayBestTimes) {
    const candidate = new Date(draft.targetDate);
    candidate.setHours(slot.hour, 0, 0, 0);

    // Skip if in the past
    if (candidate <= new Date()) continue;

    // Check daily cap for feed posts
    if (isFeedPost) {
      const dayKey = formatDateKey(candidate);
      const dayCount = daySlotCounts.get(dayKey) ?? 0;
      if (dayCount >= MAX_FEED_POSTS_PER_DAY) continue;
    }

    // Check minimum gap with existing scheduled posts
    const hasConflict = scheduledTimes.some((existing) => {
      const gapMs = Math.abs(candidate.getTime() - existing.getTime());
      const gapHours = gapMs / (1000 * 60 * 60);
      return gapHours < MIN_GAP_HOURS;
    });

    if (!hasConflict) {
      return candidate;
    }
  }

  // If no slot found on target day, try adjacent days (-1, +1)
  for (const offset of [-1, 1]) {
    const adjacentDate = new Date(draft.targetDate);
    adjacentDate.setDate(adjacentDate.getDate() + offset);
    const adjacentDay = adjacentDate.getDay();

    const adjacentBestTimes = platformBestTimes
      .filter((bt) => bt.day === adjacentDay)
      .sort((a, b) => b.score - a.score);

    const timesToTry = adjacentBestTimes.length > 0
      ? adjacentBestTimes
      : getDefaultTimeSlots(adjacentDay);

    for (const slot of timesToTry) {
      const candidate = new Date(adjacentDate);
      candidate.setHours(slot.hour, 0, 0, 0);

      if (candidate <= new Date()) continue;

      if (isFeedPost) {
        const dayKey = formatDateKey(candidate);
        const dayCount = daySlotCounts.get(dayKey) ?? 0;
        if (dayCount >= MAX_FEED_POSTS_PER_DAY) continue;
      }

      const hasConflict = scheduledTimes.some((existing) => {
        const gapMs = Math.abs(candidate.getTime() - existing.getTime());
        const gapHours = gapMs / (1000 * 60 * 60);
        return gapHours < MIN_GAP_HOURS;
      });

      if (!hasConflict) {
        return candidate;
      }
    }
  }

  // Last resort: use target date at noon
  const fallback = new Date(draft.targetDate);
  fallback.setHours(12, 0, 0, 0);
  if (fallback > new Date()) return fallback;

  return null;
}

/**
 * Generate reasonable default time slots when Metricool data is unavailable.
 * Based on general social media best practices.
 */
function getDefaultTimeSlots(dayOfWeek: number): BestTimeSlot[] {
  // Higher scores for midweek, standard posting hours
  const isMidweek = MIDWEEK_BONUS_DAYS.has(dayOfWeek);
  const bonus = isMidweek ? 10 : 0;

  return [
    { day: dayOfWeek, hour: 11, score: 80 + bonus },  // Late morning
    { day: dayOfWeek, hour: 13, score: 75 + bonus },  // After lunch
    { day: dayOfWeek, hour: 18, score: 70 + bonus },  // Evening commute
    { day: dayOfWeek, hour: 9, score: 65 + bonus },   // Morning
    { day: dayOfWeek, hour: 20, score: 60 + bonus },  // Evening
    { day: dayOfWeek, hour: 15, score: 55 + bonus },  // Afternoon
  ];
}

/**
 * Parse Metricool best times API response into BestTimeSlot array.
 */
export function parseBestTimesResponse(
  response: unknown,
): BestTimeSlot[] {
  if (!response || typeof response !== 'object') return [];

  // Handle MetricoolListResponse wrapper: { ok, data: [...] }
  const items = Array.isArray(response)
    ? response
    : (response as { data?: unknown }).data;

  if (!Array.isArray(items)) return [];

  const slots: BestTimeSlot[] = [];

  for (const entry of items) {
    if (typeof entry !== 'object' || entry === null) continue;

    // Metricool format: { dayOfWeek, bestTimesByHour: [{ hourOfDay, value }] }
    if ('dayOfWeek' in entry && 'bestTimesByHour' in entry) {
      const dayEntry = entry as {
        dayOfWeek: number;
        bestTimesByHour: { hourOfDay: number; value: number }[];
      };
      if (Array.isArray(dayEntry.bestTimesByHour)) {
        for (const slot of dayEntry.bestTimesByHour) {
          if (typeof slot.hourOfDay === 'number' && typeof slot.value === 'number') {
            slots.push({
              day: dayEntry.dayOfWeek,
              hour: slot.hourOfDay,
              score: slot.value,
            });
          }
        }
      }
    }
  }

  return slots;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
