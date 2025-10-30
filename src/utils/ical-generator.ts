import { UnifiedGig } from '@/hooks/useUnifiedGigs';
import { format } from 'date-fns';

export interface ICalEvent {
  uid: string;
  summary: string;
  location?: string;
  description?: string;
  dtstart: string;
  dtend?: string;
  created: string;
  lastModified: string;
}

/**
 * RFC 5545 compliant iCalendar generator
 * Generates .ics files for calendar subscriptions
 */
export class ICalGenerator {
  private events: ICalEvent[] = [];

  /**
   * Add an event to the calendar
   */
  addEvent(event: ICalEvent): void {
    this.events.push(event);
  }

  /**
   * Generate RFC 5545 compliant iCalendar format
   * Uses CRLF line endings and proper escaping
   */
  generate(): string {
    const lines: string[] = [];

    // iCalendar header (RFC 5545)
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Stand Up Sydney//Gig Calendar//EN');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    lines.push('X-WR-CALNAME:My Comedy Gigs');
    lines.push('X-WR-TIMEZONE:Australia/Sydney');

    // Add events
    this.events.forEach(event => {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.uid}`);
      lines.push(`SUMMARY:${this.escape(event.summary)}`);

      if (event.location) {
        lines.push(`LOCATION:${this.escape(event.location)}`);
      }

      if (event.description) {
        lines.push(`DESCRIPTION:${this.escape(event.description)}`);
      }

      lines.push(`DTSTART:${this.formatDateTime(event.dtstart)}`);

      if (event.dtend) {
        lines.push(`DTEND:${this.formatDateTime(event.dtend)}`);
      }

      lines.push(`DTSTAMP:${this.formatDateTime(event.created)}`);
      lines.push(`LAST-MODIFIED:${this.formatDateTime(event.lastModified)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('SEQUENCE:0');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');

    // RFC 5545 requires CRLF line endings
    return lines.join('\r\n');
  }

  /**
   * Format ISO 8601 datetime to iCalendar format: YYYYMMDDTHHMMSSZ
   * Always formats in UTC regardless of local timezone
   */
  private formatDateTime(isoString: string): string {
    const date = new Date(isoString);

    // Get UTC components
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Escape special characters per RFC 5545
   * Must escape: backslash, semicolon, comma, newline
   */
  private escape(text: string): string {
    return text
      .replace(/\\/g, '\\\\')  // Backslash must be escaped first
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Static factory method to convert UnifiedGig array to iCalendar format
   */
  static fromUnifiedGigs(gigs: UnifiedGig[]): string {
    const generator = new ICalGenerator();
    const now = new Date().toISOString();

    gigs.forEach(gig => {
      generator.addEvent({
        uid: `${gig.id}@standupsydney.com`,
        summary: gig.title,
        location: gig.venue_name || undefined,
        description: gig.notes || undefined,
        dtstart: gig.start_datetime,
        dtend: gig.end_datetime || undefined,
        created: now,
        lastModified: now,
      });
    });

    return generator.generate();
  }
}
