import { ICalGenerator } from '@/utils/ical-generator';
import { UnifiedGig } from '@/hooks/useUnifiedGigs';

describe('ICalGenerator', () => {
  describe('RFC 5545 Compliance', () => {
    it('should generate valid iCalendar header', () => {
      const generator = new ICalGenerator();
      const output = generator.generate();

      expect(output).toContain('BEGIN:VCALENDAR');
      expect(output).toContain('VERSION:2.0');
      expect(output).toContain('PRODID:-//Stand Up Sydney//Gig Calendar//EN');
      expect(output).toContain('CALSCALE:GREGORIAN');
      expect(output).toContain('METHOD:PUBLISH');
      expect(output).toContain('END:VCALENDAR');
    });

    it('should use CRLF line endings', () => {
      const generator = new ICalGenerator();
      const output = generator.generate();

      // Should use \r\n not just \n
      expect(output).toContain('\r\n');
      expect(output.split('\r\n').length).toBeGreaterThan(1);
    });

    it('should include calendar metadata', () => {
      const generator = new ICalGenerator();
      const output = generator.generate();

      expect(output).toContain('X-WR-CALNAME:My Comedy Gigs');
      expect(output).toContain('X-WR-TIMEZONE:Australia/Sydney');
    });
  });

  describe('Event Generation', () => {
    it('should generate VEVENT with required fields', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test-123@standupsydney.com',
        summary: 'Test Comedy Show',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();

      expect(output).toContain('BEGIN:VEVENT');
      expect(output).toContain('UID:test-123@standupsydney.com');
      expect(output).toContain('SUMMARY:Test Comedy Show');
      expect(output).toContain('DTSTART:20251101T190000Z');
      expect(output).toContain('DTSTAMP:20251029T100000Z');
      expect(output).toContain('LAST-MODIFIED:20251029T100000Z');
      expect(output).toContain('STATUS:CONFIRMED');
      expect(output).toContain('SEQUENCE:0');
      expect(output).toContain('END:VEVENT');
    });

    it('should include optional location field', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test-123@standupsydney.com',
        summary: 'Test Show',
        location: 'The Comedy Store',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('LOCATION:The Comedy Store');
    });

    it('should include optional description field', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test-123@standupsydney.com',
        summary: 'Test Show',
        description: 'Guest spot at 8pm',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('DESCRIPTION:Guest spot at 8pm');
    });

    it('should include optional end datetime', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test-123@standupsydney.com',
        summary: 'Test Show',
        dtstart: '2025-11-01T19:00:00Z',
        dtend: '2025-11-01T21:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('DTSTART:20251101T190000Z');
      expect(output).toContain('DTEND:20251101T210000Z');
    });

    it('should handle multiple events', () => {
      const generator = new ICalGenerator();

      generator.addEvent({
        uid: 'event-1@standupsydney.com',
        summary: 'Show 1',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      generator.addEvent({
        uid: 'event-2@standupsydney.com',
        summary: 'Show 2',
        dtstart: '2025-11-02T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();

      // Count BEGIN:VEVENT occurrences
      const eventCount = (output.match(/BEGIN:VEVENT/g) || []).length;
      expect(eventCount).toBe(2);

      expect(output).toContain('Show 1');
      expect(output).toContain('Show 2');
    });
  });

  describe('Date Formatting', () => {
    it('should format ISO dates to iCalendar format', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: 'Test',
        dtstart: '2025-11-15T14:30:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();

      // Should be in format: YYYYMMDDTHHMMSSZ
      expect(output).toContain('DTSTART:20251115T143000Z');
    });

    it('should handle timezone-aware dates', () => {
      const generator = new ICalGenerator();

      // Date with timezone offset
      const date = new Date('2025-11-01T19:00:00+11:00');

      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: 'Test',
        dtstart: date.toISOString(),
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });

      const output = generator.generate();

      // Should convert to UTC (Z suffix)
      expect(output).toMatch(/DTSTART:\d{8}T\d{6}Z/);
    });
  });

  describe('Text Escaping', () => {
    it('should escape backslashes', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: 'Test \\ Show',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('SUMMARY:Test \\\\ Show');
    });

    it('should escape semicolons', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: 'Test; Show',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('SUMMARY:Test\\; Show');
    });

    it('should escape commas', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: 'Test, Show',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('SUMMARY:Test\\, Show');
    });

    it('should escape newlines', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: 'Test Show',
        description: 'Line 1\nLine 2',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('DESCRIPTION:Line 1\\nLine 2');
    });

    it('should handle all special characters together', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: 'Test\\Show;with,special\nchars',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('SUMMARY:Test\\\\Show\\;with\\,special\\nchars');
    });
  });

  describe('fromUnifiedGigs', () => {
    it('should convert UnifiedGig array to iCalendar format', () => {
      const gigs: UnifiedGig[] = [
        {
          id: 'gig-1',
          title: 'Comedy Night',
          venue_name: 'The Laugh Factory',
          venue_address: '123 Comedy St',
          start_datetime: '2025-11-01T19:00:00Z',
          end_datetime: '2025-11-01T21:00:00Z',
          source: 'manual',
          notes: 'Headlining set',
        },
        {
          id: 'gig-2',
          title: 'Open Mic',
          venue_name: 'Comedy Bar',
          venue_address: null,
          start_datetime: '2025-11-03T20:00:00Z',
          end_datetime: null,
          source: 'platform',
        },
      ];

      const output = ICalGenerator.fromUnifiedGigs(gigs);

      expect(output).toContain('BEGIN:VCALENDAR');
      expect(output).toContain('END:VCALENDAR');
      expect(output).toContain('Comedy Night');
      expect(output).toContain('Open Mic');
      expect(output).toContain('LOCATION:The Laugh Factory');
      expect(output).toContain('LOCATION:Comedy Bar');
      expect(output).toContain('DESCRIPTION:Headlining set');
      expect(output).toContain('UID:gig-1@standupsydney.com');
      expect(output).toContain('UID:gig-2@standupsydney.com');
    });

    it('should handle empty gigs array', () => {
      const output = ICalGenerator.fromUnifiedGigs([]);

      expect(output).toContain('BEGIN:VCALENDAR');
      expect(output).toContain('END:VCALENDAR');
      expect(output).not.toContain('BEGIN:VEVENT');
    });

    it('should handle gigs with null optional fields', () => {
      const gigs: UnifiedGig[] = [
        {
          id: 'gig-1',
          title: 'Simple Gig',
          venue_name: null,
          venue_address: null,
          start_datetime: '2025-11-01T19:00:00Z',
          end_datetime: null,
          source: 'manual',
          notes: null,
        },
      ];

      const output = ICalGenerator.fromUnifiedGigs(gigs);

      expect(output).toContain('SUMMARY:Simple Gig');
      expect(output).not.toContain('LOCATION:');
      expect(output).not.toContain('DESCRIPTION:');
      expect(output).not.toContain('DTEND:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long event summaries', () => {
      const generator = new ICalGenerator();
      const longSummary = 'A'.repeat(500);

      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: longSummary,
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain(`SUMMARY:${longSummary}`);
    });

    it('should handle special Unicode characters', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: 'Comedy Show 🎭 with émojis and ñ',
        dtstart: '2025-11-01T19:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('SUMMARY:Comedy Show 🎭 with émojis and ñ');
    });

    it('should handle dates at year boundaries', () => {
      const generator = new ICalGenerator();
      generator.addEvent({
        uid: 'test@standupsydney.com',
        summary: 'New Year Show',
        dtstart: '2025-12-31T23:00:00Z',
        dtend: '2026-01-01T01:00:00Z',
        created: '2025-10-29T10:00:00Z',
        lastModified: '2025-10-29T10:00:00Z',
      });

      const output = generator.generate();
      expect(output).toContain('DTSTART:20251231T230000Z');
      expect(output).toContain('DTEND:20260101T010000Z');
    });
  });
});
