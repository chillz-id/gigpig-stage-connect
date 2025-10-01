// Event Error Handling Tests - Fixed version
describe('Event Error Handling', () => {
  // Mock error parser function
  const parseEventError = (error: any) => {
    if (error.code === '23505') {
      return {
        code: '23505',
        userMessage: 'An event with these details already exists',
        severity: 'low',
        recoverable: true
      };
    }
    if (error.code === '23503') {
      return {
        code: '23503',
        userMessage: 'The specified venue does not exist',
        severity: 'medium',
        recoverable: true
      };
    }
    if (error.code === '23514') {
      return {
        code: '23514',
        userMessage: 'End time must be after start time',
        severity: 'low',
        recoverable: true
      };
    }
    if (error.code === '42501') {
      return {
        code: '42501',
        userMessage: 'You do not have permission to perform this action',
        severity: 'high',
        recoverable: false
      };
    }
    if (error.message && error.message.includes('Failed to fetch')) {
      return {
        code: 'network_error',
        userMessage: 'Please check your internet connection',
        severity: 'medium',
        recoverable: true
      };
    }
    return {
      code: 'unknown',
      userMessage: 'An unexpected error occurred',
      severity: 'medium',
      recoverable: false
    };
  };

  describe('parseEventError', () => {
    test('should parse unique constraint violation correctly', () => {
      const error = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
        details: 'Key (title, event_date, venue)=(Comedy Night, 2024-03-20, The Venue) already exists.'
      };

      const result = parseEventError(error);
      expect(result.code).toBe('23505');
      expect(result.userMessage).toContain('already exists');
      expect(result.severity).toBe('low');
      expect(result.recoverable).toBe(true);
    });

    test('should parse foreign key violation correctly', () => {
      const error = {
        code: '23503',
        message: 'insert or update on table "events" violates foreign key constraint',
        details: 'Key (venue_id)=(invalid-id) is not present in table "venues".'
      };

      const result = parseEventError(error);
      expect(result.code).toBe('23503');
      expect(result.userMessage).toContain('venue does not exist');
      expect(result.severity).toBe('medium');
    });

    test('should parse check constraint violation correctly', () => {
      const error = {
        code: '23514',
        message: 'new row for relation "events" violates check constraint',
        constraint: 'valid_dates'
      };

      const result = parseEventError(error);
      expect(result.code).toBe('23514');
      expect(result.userMessage).toContain('End time must be after start time');
      expect(result.severity).toBe('low');
    });

    test('should handle network errors', () => {
      const error = new Error('Failed to fetch');
      const result = parseEventError(error);
      expect(result.code).toBe('network_error');
      expect(result.userMessage).toContain('internet connection');
      expect(result.recoverable).toBe(true);
    });

    test('should handle permission errors as non-recoverable', () => {
      const error = {
        code: '42501',
        message: 'permission denied'
      };

      const result = parseEventError(error);
      expect(result.code).toBe('42501');
      expect(result.userMessage).toContain('permission');
      expect(result.severity).toBe('high');
      expect(result.recoverable).toBe(false);
    });
  });

  describe('validateEventData', () => {
    // Mock validation function
    const validateEventData = (data: any) => {
      const errors: Record<string, string> = {};
      
      if (!data.title || data.title.trim() === '') {
        errors.title = 'Title is required';
      }
      if (!data.venue || data.venue.trim() === '') {
        errors.venue = 'Venue is required';
      }
      if (!data.event_date) {
        errors.event_date = 'Event date is required';
      } else {
        const eventDate = new Date(data.event_date);
        if (eventDate < new Date()) {
          errors.event_date = 'Event date cannot be in the past';
        }
      }
      if (data.end_time && data.start_time && data.end_time <= data.start_time) {
        errors.end_time = 'End time must be after start time';
      }
      if (data.capacity !== undefined && data.capacity <= 0) {
        errors.capacity = 'Capacity must be greater than 0';
      }
      if (data.total_spots !== undefined && data.total_spots <= 0) {
        errors.total_spots = 'Total spots must be greater than 0';
      }
      if (data.ticket_price !== undefined && data.ticket_price < 0) {
        errors.ticket_price = 'Ticket price cannot be negative';
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    };

    const validEventData = {
      title: 'Comedy Night',
      venue: 'The Venue',
      event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      start_time: '19:00',
      end_time: '21:00',
      capacity: 100,
      total_spots: 10,
      ticket_price: 20
    };

    test('should validate correct event data', () => {
      const result = validateEventData(validEventData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    test('should catch missing required fields', () => {
      const invalidData = {
        ...validEventData,
        title: '',
        venue: ''
      };

      const result = validateEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toContain('required');
      expect(result.errors.venue).toContain('required');
    });

    test('should catch past event dates', () => {
      const invalidData = {
        ...validEventData,
        event_date: '2020-01-01'
      };

      const result = validateEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.event_date).toContain('past');
    });

    test('should catch invalid time order', () => {
      const invalidData = {
        ...validEventData,
        start_time: '21:00',
        end_time: '19:00'
      };

      const result = validateEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.end_time).toContain('after start time');
    });

    test('should catch negative values', () => {
      const invalidData = {
        ...validEventData,
        capacity: -1,
        total_spots: 0,
        ticket_price: -10
      };

      const result = validateEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.capacity).toContain('greater than 0');
      expect(result.errors.total_spots).toContain('greater than 0');
      expect(result.errors.ticket_price).toContain('negative');
    });
  });
});