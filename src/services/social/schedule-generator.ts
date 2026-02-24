/**
 * Schedule Generator Client Service
 *
 * Client-side service to trigger the social-schedule-generator Edge Function.
 * Used for manual "Generate Schedule" button and future cron monitoring.
 */

import { supabase } from '@/integrations/supabase/client';

export interface GenerateScheduleResult {
  ok: boolean;
  eventsProcessed: number;
  draftsCreated: number;
  draftsSkipped: number;
  foldersCreated: number;
  errors: string[];
  summary: string;
}

/**
 * Trigger the schedule generator Edge Function.
 * Optionally pass specific event IDs to generate for.
 */
export async function generateSchedule(
  eventIds?: string[],
): Promise<GenerateScheduleResult> {
  const { data, error } = await supabase.functions.invoke<GenerateScheduleResult>(
    'social-schedule-generator',
    { body: eventIds ? { eventIds } : {} },
  );

  if (error) {
    throw new Error(error.message || 'Failed to generate schedule');
  }

  if (!data) {
    throw new Error('No response from schedule generator');
  }

  return data;
}
