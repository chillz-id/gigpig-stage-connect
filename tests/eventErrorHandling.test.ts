import { describe, it, expect } from '@jest/globals';
import { parseEventError, validateEventData } from '../src/utils/eventErrorHandling';
import { PostgrestError } from '@supabase/supabase-js';

describe('Event Error Handling', () => {
  describe('parseEventError', () => {
    it('should parse unique constraint violation correctly', () => {
      const error: PostgrestError = {
        name: 'PostgrestError',
        code: '23505',
        message: 'duplicate key value violates unique constraint',
        details: 'Key (title, event_date, venue)=(Comedy Night, 2024-03-20, The Venue) already exists.',
        hint: '',
      };

      const result = parseEventError(error);
      expect(result.code).toBe('23505');
      expect(result.userMessage).toContain('already exists');
      expect(result.severity).toBe('low');
      expect(result.recoverable).toBe(true);
    });

    it('should parse foreign key violation correctly', () => {
      const error: PostgrestError = {
        name: 'PostgrestError',
        code: '23503',
        message: 'insert or update on table "events" violates foreign key constraint',
        details: 'Key (venue_id)=(invalid-id) is not present in table "venues".',
        hint: '',
      };

      const result = parseEventError(error);
      expect(result.code).toBe('23503');
      expect(result.userMessage).toContain('venue does not exist');
      expect(result.severity).toBe('medium');
    });

    it('should parse check constraint violation correctly', () => {
      const error: any = {
        code: '23514',
        message: 'new row for relation "events" violates check constraint',
        constraint: 'valid_dates',
      };

      const result = parseEventError(error);
      expect(result.code).toBe('23514');
      expect(result.userMessage).toContain('End time must be after start time');
      expect(result.severity).toBe('low');
    });

    it('should handle network errors', () => {
      const error = new Error('Failed to fetch');
      const result = parseEventError(error);
      expect(result.code).toBe('network_error');
      expect(result.userMessage).toContain('internet connection');
      expect(result.recoverable).toBe(true);
    });

    it('should handle permission errors as non-recoverable', () => {
      const error: PostgrestError = {
        name: 'PostgrestError',
        code: '42501',
        message: 'permission denied',
        details: '',
        hint: '',
      };

      const result = parseEventError(error);
      expect(result.code).toBe('42501');
      expect(result.userMessage).toContain('permission');
      expect(result.severity).toBe('high');
      expect(result.recoverable).toBe(false);
    });
  });

  describe('validateEventData', () => {
    const validEventData = {
      title: 'Comedy Night',
      venue: 'The Venue',
      event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      start_time: '19:00',
      end_time: '21:00',
      capacity: 100,
      total_spots: 10,
      ticket_price: 20,
    };

    it('should validate correct event data', () => {
      const result = validateEventData(validEventData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const invalidData = {
        ...validEventData,
        title: '',
        venue: '',
      };

      const result = validateEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toContain('required');
      expect(result.errors.venue).toContain('required');
    });

    it('should catch past event dates', () => {
      const invalidData = {
        ...validEventData,
        event_date: '2020-01-01',
      };

      const result = validateEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.event_date).toContain('past');
    });

    it('should catch invalid time order', () => {
      const invalidData = {
        ...validEventData,
        start_time: '21:00',
        end_time: '19:00',
      };

      const result = validateEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.end_time).toContain('after start time');
    });

    it('should catch negative values', () => {
      const invalidData = {
        ...validEventData,
        capacity: -1,
        total_spots: 0,
        ticket_price: -10,
      };

      const result = validateEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.capacity).toContain('greater than 0');
      expect(result.errors.total_spots).toContain('greater than 0');
      expect(result.errors.ticket_price).toContain('negative');
    });
  });
});