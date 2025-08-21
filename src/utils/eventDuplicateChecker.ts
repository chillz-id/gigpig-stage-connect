import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isSameDay, addHours, subHours } from 'date-fns';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarEvents: Array<{
    id: string;
    title: string;
    event_date: string;
    venue: string;
    similarity: number;
  }>;
  warnings: string[];
}

/**
 * Check for potential duplicate events based on title, date, and venue
 */
export const checkForDuplicateEvents = async (
  title: string,
  date: string,
  venue: string,
  excludeEventId?: string
): Promise<DuplicateCheckResult> => {
  const result: DuplicateCheckResult = {
    isDuplicate: false,
    similarEvents: [],
    warnings: []
  };

  if (!title || !date || !venue) {
    return result;
  }

  try {
    const eventDate = parseISO(date);
    const dateRangeStart = subHours(eventDate, 12);
    const dateRangeEnd = addHours(eventDate, 12);

    // Query for events with similar attributes
    let query = supabase
      .from('events')
      .select('id, title, event_date, venue, address')
      .gte('event_date', dateRangeStart.toISOString())
      .lte('event_date', dateRangeEnd.toISOString())
      .neq('status', 'cancelled');

    if (excludeEventId) {
      query = query.neq('id', excludeEventId);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error checking for duplicates:', error);
      return result;
    }

    if (!events || events.length === 0) {
      return result;
    }

    // Calculate similarity for each event
    events.forEach(event => {
      let similarity = 0;
      
      // Title similarity (using simple comparison, could use Levenshtein distance)
      const titleSimilarity = calculateTitleSimilarity(title, event.title);
      similarity += titleSimilarity * 0.4; // 40% weight
      
      // Venue similarity
      const venueSimilarity = calculateVenueSimilarity(venue, event.venue);
      similarity += venueSimilarity * 0.3; // 30% weight
      
      // Date similarity
      const dateSimilarity = isSameDay(eventDate, parseISO(event.event_date)) ? 1 : 0.5;
      similarity += dateSimilarity * 0.3; // 30% weight
      
      // If similarity is high enough, add to similar events
      if (similarity > 0.7) {
        result.similarEvents.push({
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          venue: event.venue,
          similarity: Math.round(similarity * 100)
        });
      }
    });

    // Sort by similarity
    result.similarEvents.sort((a, b) => b.similarity - a.similarity);

    // Check if it's likely a duplicate
    if (result.similarEvents.length > 0 && result.similarEvents[0].similarity > 85) {
      result.isDuplicate = true;
      result.warnings.push(
        `A very similar event "${result.similarEvents[0].title}" already exists on ${format(parseISO(result.similarEvents[0].event_date), 'MMM d, yyyy')}`
      );
    } else if (result.similarEvents.length > 0) {
      result.warnings.push(
        `Found ${result.similarEvents.length} similar event(s). Please ensure this isn't a duplicate.`
      );
    }

    return result;
  } catch (error) {
    console.error('Error in duplicate check:', error);
    return result;
  }
};

/**
 * Calculate similarity between two titles
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().trim();
  const t2 = title2.toLowerCase().trim();
  
  if (t1 === t2) return 1;
  
  // Check if one contains the other
  if (t1.includes(t2) || t2.includes(t1)) return 0.8;
  
  // Check word overlap
  const words1 = new Set(t1.split(/\s+/));
  const words2 = new Set(t2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Calculate similarity between two venues
 */
function calculateVenueSimilarity(venue1: string, venue2: string): number {
  const v1 = venue1.toLowerCase().trim();
  const v2 = venue2.toLowerCase().trim();
  
  if (v1 === v2) return 1;
  
  // Check if one contains the other (for variations like "Comedy Club" vs "The Comedy Club")
  if (v1.includes(v2) || v2.includes(v1)) return 0.9;
  
  // Check word overlap
  const words1 = new Set(v1.split(/\s+/));
  const words2 = new Set(v2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  
  if (intersection.size > 0) {
    return 0.5 + (intersection.size / Math.max(words1.size, words2.size)) * 0.5;
  }
  
  return 0;
}

/**
 * Check venue availability for a specific date/time
 */
export const checkVenueAvailability = async (
  venue: string,
  date: string,
  startTime: string,
  endTime?: string,
  excludeEventId?: string
): Promise<{
  isAvailable: boolean;
  conflicts: Array<{
    id: string;
    title: string;
    time: string;
  }>;
}> => {
  try {
    const eventDate = parseISO(date);
    const dayStart = new Date(eventDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(eventDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Query events at the same venue on the same day
    let query = supabase
      .from('events')
      .select('id, title, start_time, end_time')
      .eq('venue', venue)
      .gte('event_date', dayStart.toISOString())
      .lte('event_date', dayEnd.toISOString())
      .neq('status', 'cancelled');

    if (excludeEventId) {
      query = query.neq('id', excludeEventId);
    }

    const { data: events, error } = await query;

    if (error || !events) {
      return { isAvailable: true, conflicts: [] };
    }

    // Check for time conflicts
    const conflicts = events.filter(event => {
      if (!event.start_time) return false;
      
      const eventStart = parseTime(event.start_time);
      const eventEnd = event.end_time ? parseTime(event.end_time) : addMinutes(eventStart, 120);
      const newStart = parseTime(startTime);
      const newEnd = endTime ? parseTime(endTime) : addMinutes(newStart, 120);
      
      // Check for overlap
      return (newStart < eventEnd && newEnd > eventStart);
    }).map(event => ({
      id: event.id,
      title: event.title,
      time: event.start_time || 'Unknown time'
    }));

    return {
      isAvailable: conflicts.length === 0,
      conflicts
    };
  } catch (error) {
    console.error('Error checking venue availability:', error);
    return { isAvailable: true, conflicts: [] };
  }
};

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Add minutes to a time value
 */
function addMinutes(time: number, minutes: number): number {
  return time + minutes;
}