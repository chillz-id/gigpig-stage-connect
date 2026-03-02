/**
 * Conflict Resolver (Frontend)
 *
 * Detects scheduling conflicts and finds the next available time slot.
 * Used by publish-approved.ts before pushing drafts to Metricool.
 *
 * Same algorithm as the Edge Function version in social-publisher/conflict-resolver.ts.
 */

import { getPosts } from '@/services/social/metricool-posts';
import { supabase } from '@/integrations/supabase/client';

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

interface RescheduleOptions {
  scheduledFor: Date;
  occupiedSlots: OccupiedSlot[];
  bestTimeSlots: BestTimeSlot[];
  minGapHours?: number;
}

interface BestTimeSlot {
  day: number;
  hour: number;
  score: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_GAP_HOURS = 3;

// ─── Data Fetching ───────────────────────────────────────────────────────────

/**
 * Gather all occupied time slots from Metricool calendar + our DB drafts.
 */
export async function gatherOccupiedSlots(
  targetTime: Date,
  blogId?: string,
  excludeDraftId?: string,
): Promise<OccupiedSlot[]> {
  const slots: OccupiedSlot[] = [];

  // Query range: ±2 days around target
  const rangeStart = new Date(targetTime);
  rangeStart.setDate(rangeStart.getDate() - 2);
  const rangeEnd = new Date(targetTime);
  rangeEnd.setDate(rangeEnd.getDate() + 2);

  // 1. Fetch Metricool calendar
  try {
    const startStr = rangeStart.toISOString().split('T')[0]!;
    const endStr = rangeEnd.toISOString().split('T')[0]!;

    const mcPosts = await getPosts(startStr, endStr, 'Australia/Sydney', blogId);
    if (mcPosts?.data && Array.isArray(mcPosts.data)) {
      for (const post of mcPosts.data) {
        if (post.publicationDate?.dateTime) {
          slots.push({
            time: new Date(post.publicationDate.dateTime),
            source: 'metricool',
            id: post.id,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Metricool calendar for conflict check:', err);
  }

  // 2. Fetch our DB drafts (approved/scheduled, excluding self)
  let query = supabase
    .from('social_content_drafts')
    .select('id, scheduled_for')
    .not('scheduled_for', 'is', null)
    .in('status', ['approved', 'scheduled'])
    .gte('scheduled_for', rangeStart.toISOString())
    .lte('scheduled_for', rangeEnd.toISOString());

  if (excludeDraftId) {
    query = query.neq('id', excludeDraftId);
  }

  const { data: drafts } = await query;
  for (const d of drafts ?? []) {
    if (d.scheduled_for) {
      slots.push({ time: new Date(d.scheduled_for as string), source: 'draft', id: d.id });
    }
  }

  return slots;
}

// ─── Conflict Detection ──────────────────────────────────────────────────────

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

// ─── Slot Finding ────────────────────────────────────────────────────────────

function findNextAvailableSlot(
  targetTime: Date,
  occupiedTimes: Date[],
  bestTimeSlots: BestTimeSlot[],
  minGapHours: number,
): Date | null {
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

      if (candidate <= new Date()) continue;

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
