// tests/pages/gigs-time-display.test.tsx
import { describe, it, expect } from '@jest/globals';
import { formatEventTime } from '@/utils/formatEventTime';

describe('formatEventTime', () => {

  it('should extract 8pm correctly from ISO string', () => {
    const result = formatEventTime('2025-11-15T20:00:00');
    expect(result).toBe('8:00pm');
  });

  it('should extract 6am correctly from ISO string', () => {
    const result = formatEventTime('2025-11-15T06:00:00');
    expect(result).toBe('6:00am');
  });

  it('should handle noon correctly', () => {
    const result = formatEventTime('2025-11-15T12:00:00');
    expect(result).toBe('12:00pm');
  });

  it('should handle midnight correctly', () => {
    const result = formatEventTime('2025-11-15T00:00:00');
    expect(result).toBe('12:00am');
  });

  it('should return TBC for null', () => {
    expect(formatEventTime(null)).toBe('TBC');
  });

  it('should return TBC for undefined', () => {
    expect(formatEventTime(undefined)).toBe('TBC');
  });

  it('should return TBC for invalid format', () => {
    expect(formatEventTime('invalid')).toBe('TBC');
  });
});
