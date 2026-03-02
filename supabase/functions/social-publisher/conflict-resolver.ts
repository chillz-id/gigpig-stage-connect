/**
 * Conflict Resolver
 *
 * Detects scheduling conflicts and finds the next available time slot.
 * Used by the publisher to auto-reschedule drafts before pushing to Metricool.
 *
 * Same gap/cap constants as optimizer.ts in social-schedule-generator.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OccupiedSlot {
  time: Date;
  source: 'metricool' | 'draft';
  id?: string | number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  originalTime: Date;
  resolvedTime: Date | null;
  reason?: string;
}

export interface RescheduleOptions {
  scheduledFor: Date;
  occupiedSlots: OccupiedSlot[];
  bestTimeSlots: BestTimeSlot[];
  minGapHours?: number;
}

export interface BestTimeSlot {
  day: number;
  hour: number;
  score: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_GAP_HOURS = 3;

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Check if a proposed publish time conflicts with occupied slots.
 * If conflict found, find the next best available slot.
 */
export function resolveConflict(options: RescheduleOptions): ConflictCheckResult {
  const {
    scheduledFor,
    occupiedSlots,
    bestTimeSlots,
    minGapHours = MIN_GAP_HOURS,
  } = options;

  // Find the first conflicting slot
  const conflicting = occupiedSlots.find((slot) => {
    const gapMs = Math.abs(scheduledFor.getTime() - slot.time.getTime());
    const gapHours = gapMs / (1000 * 60 * 60);
    return gapHours < minGapHours;
  });

  if (!conflicting) {
    return { hasConflict: false, originalTime: scheduledFor, resolvedTime: scheduledFor };
  }

  const timeStr = conflicting.time.toISOString().slice(11, 16);
  const reason = conflicting.source === 'metricool'
    ? `Conflicts with Metricool post #${conflicting.id} at ${timeStr}`
    : `Conflicts with pending draft ${conflicting.id} at ${timeStr}`;

  const newTime = findNextAvailableSlot(
    scheduledFor,
    occupiedSlots.map((s) => s.time),
    bestTimeSlots,
    minGapHours,
  );

  return {
    hasConflict: true,
    originalTime: scheduledFor,
    resolvedTime: newTime,
    reason,
  };
}

/**
 * Find the next available slot starting from the target time.
 * Tries best-time slots on same day first, then adjacent days.
 */
function findNextAvailableSlot(
  targetTime: Date,
  occupiedTimes: Date[],
  bestTimeSlots: BestTimeSlot[],
  minGapHours: number,
): Date | null {
  // Try same day, then +1 day, then -1 day
  for (const dayOffset of [0, 1, -1]) {
    const candidateDate = new Date(targetTime);
    candidateDate.setDate(candidateDate.getDate() + dayOffset);
    const dayOfWeek = candidateDate.getDay();

    const dayCandidates = bestTimeSlots
      .filter((bt) => bt.day === dayOfWeek)
      .sort((a, b) => b.score - a.score);

    const slots = dayCandidates.length > 0 ? dayCandidates : getDefaultSlots(dayOfWeek);

    for (const slot of slots) {
      const candidate = new Date(candidateDate);
      candidate.setHours(slot.hour, 0, 0, 0);

      // Skip past times
      if (candidate <= new Date()) continue;

      // Check gap against all occupied times
      const hasConflict = occupiedTimes.some((existing) => {
        const gapMs = Math.abs(candidate.getTime() - existing.getTime());
        return gapMs / (1000 * 60 * 60) < minGapHours;
      });

      if (!hasConflict) return candidate;
    }
  }

  // Fallback: next day at noon
  const fallback = new Date(targetTime);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(12, 0, 0, 0);
  if (fallback > new Date()) return fallback;

  return null;
}

/**
 * Default time slots when Metricool best-times data is unavailable.
 * Mirrors optimizer.ts getDefaultTimeSlots().
 */
function getDefaultSlots(dayOfWeek: number): BestTimeSlot[] {
  const isMidweek = [2, 3, 4].includes(dayOfWeek);
  const bonus = isMidweek ? 10 : 0;

  return [
    { day: dayOfWeek, hour: 11, score: 80 + bonus },
    { day: dayOfWeek, hour: 13, score: 75 + bonus },
    { day: dayOfWeek, hour: 18, score: 70 + bonus },
    { day: dayOfWeek, hour: 9, score: 65 + bonus },
    { day: dayOfWeek, hour: 20, score: 60 + bonus },
    { day: dayOfWeek, hour: 15, score: 55 + bonus },
  ];
}
