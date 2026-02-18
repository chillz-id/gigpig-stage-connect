/**
 * Utility to generate dates for recurring events
 */

export interface CustomDate {
  date: string;
  times: Array<{
    startTime: string;
    endTime?: string;
  }>;
}

export interface RecurringDateResult {
  eventDate: string; // ISO string
  startTime: string;
  endTime?: string;
}

/**
 * Generate all dates for a recurring event pattern
 */
export function generateRecurringDates(
  baseDate: string,
  baseTime: string,
  endTime: string | undefined,
  pattern: string,
  endDate?: string,
  customDates?: CustomDate[]
): RecurringDateResult[] {
  const results: RecurringDateResult[] = [];

  if (pattern === 'custom' && customDates && customDates.length > 0) {
    // Custom dates mode - use the provided dates/times
    customDates.forEach((customDate) => {
      customDate.times.forEach((timeSlot) => {
        const eventDateTime = new Date(customDate.date);
        const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
        eventDateTime.setHours(hours, minutes, 0, 0);

        results.push({
          eventDate: eventDateTime.toISOString(),
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
        });
      });
    });
  } else if (pattern && endDate) {
    // Pattern-based recurring (weekly, monthly, etc.)
    const startDateTime = new Date(baseDate);
    const endDateTime = new Date(endDate);
    const currentDate = new Date(startDateTime);

    while (currentDate <= endDateTime) {
      results.push({
        eventDate: currentDate.toISOString(),
        startTime: baseTime,
        endTime: endTime,
      });

      // Advance to next occurrence based on pattern
      if (pattern === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (pattern === 'fortnightly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (pattern === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        // Unknown pattern, just break to avoid infinite loop
        break;
      }
    }
  }

  return results;
}
