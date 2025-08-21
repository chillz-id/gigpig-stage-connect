import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  validateEventFormEnhanced, 
  validateField,
  hasUnsavedChanges,
  eventValidators
} from '@/utils/eventValidation.enhanced';
import { EventFormData, RecurringSettings, CustomDate } from '@/types/eventTypes';
import { addDays, format } from 'date-fns';

describe('Event Validation System', () => {
  const validFormData: EventFormData = {
    title: 'Test Comedy Night',
    venue: 'Comedy Club',
    address: '123 Main Street, Sydney',
    city: 'Sydney',
    state: 'NSW',
    country: 'Australia',
    date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    time: '19:00',
    endTime: '21:00',
    type: 'showcase',
    spots: 5,
    description: 'A great comedy show',
    requirements: [],
    isVerifiedOnly: false,
    isPaid: false,
    allowRecording: false,
    ageRestriction: '18+',
    dresscode: 'Casual',
    imageUrl: '',
    showLevel: 'intermediate',
    showType: 'standup',
    customShowType: '',
    ticketingType: 'external',
    externalTicketUrl: 'https://example.com/tickets',
    tickets: [],
    feeHandling: 'absorb',
    capacity: 100,
  };

  const validRecurringSettings: RecurringSettings = {
    isRecurring: false,
    pattern: 'weekly',
    endDate: '',
    customDates: []
  };

  describe('Title Validation', () => {
    it('should reject empty title', () => {
      const errors = eventValidators.title('');
      expect(errors).toContain('Event title is required');
    });

    it('should reject title that is too short', () => {
      const errors = eventValidators.title('Hi');
      expect(errors).toContain('Title must be at least 3 characters long');
    });

    it('should reject title that is too long', () => {
      const errors = eventValidators.title('A'.repeat(101));
      expect(errors).toContain('Title must be less than 100 characters');
    });

    it('should accept valid title', () => {
      const errors = eventValidators.title('Wednesday Night Comedy');
      expect(errors).toHaveLength(0);
    });
  });

  describe('Date Validation', () => {
    it('should reject past dates', () => {
      const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
      const result = eventValidators.date(yesterday);
      expect(result.errors).toContain('Event date cannot be in the past');
    });

    it('should warn about far future dates', () => {
      const farFuture = format(addDays(new Date(), 200), 'yyyy-MM-dd');
      const result = eventValidators.date(farFuture);
      expect(result.warnings).toContain('Event is scheduled more than 6 months in the future');
    });

    it('should warn about events tomorrow', () => {
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      const result = eventValidators.date(tomorrow);
      expect(result.warnings).toContain('Event is scheduled for tomorrow - ensure venue and performers are confirmed');
    });
  });

  describe('Time Validation', () => {
    it('should reject invalid time format', () => {
      const result = eventValidators.time('25:00');
      expect(result.errors).toContain('Invalid start time format (use HH:MM)');
    });

    it('should reject end time before start time', () => {
      const result = eventValidators.time('20:00', '19:00');
      expect(result.errors).toContain('End time must be after start time');
    });

    it('should warn about very long events', () => {
      const result = eventValidators.time('10:00', '17:00');
      expect(result.warnings).toContain('Event duration is over 6 hours - is this intentional?');
    });

    it('should warn about late night events', () => {
      const result = eventValidators.time('23:00');
      expect(result.warnings).toContain('Event starts very late/early - ensure venue availability');
    });
  });

  describe('Venue Validation', () => {
    it('should require venue name', () => {
      const errors = eventValidators.venue('', '123 Main St');
      expect(errors).toContain('Venue name is required');
    });

    it('should require venue address', () => {
      const errors = eventValidators.venue('Comedy Club', '');
      expect(errors).toContain('Venue address is required');
    });

    it('should require complete address', () => {
      const errors = eventValidators.venue('Comedy Club', 'Main St');
      expect(errors).toContain('Please provide a complete address');
    });
  });

  describe('Capacity Validation', () => {
    it('should reject zero or negative capacity', () => {
      const result = eventValidators.capacity(0, 5);
      expect(result.errors).toContain('Capacity must be greater than 0');
    });

    it('should reject capacity less than spots', () => {
      const result = eventValidators.capacity(5, 10);
      expect(result.errors).toContain('Venue capacity cannot be less than the number of performer spots');
    });

    it('should warn about large capacity', () => {
      const result = eventValidators.capacity(1500, 10);
      expect(result.warnings).toContain('Large venue capacity - ensure adequate facilities and staffing');
    });

    it('should warn about small capacity', () => {
      const result = eventValidators.capacity(15, 5);
      expect(result.warnings).toContain('Small venue capacity - consider if this meets your event needs');
    });
  });

  describe('Ticketing Validation', () => {
    it('should require URL for external ticketing', () => {
      const errors = eventValidators.ticketing('external', '');
      expect(errors).toContain('External ticket URL is required when using external ticketing');
    });

    it('should validate URL format', () => {
      const errors = eventValidators.ticketing('external', 'not-a-url');
      expect(errors).toContain('Please provide a valid ticket URL');
    });

    it('should require tickets for internal ticketing', () => {
      const errors = eventValidators.ticketing('internal', '', []);
      expect(errors).toContain('At least one ticket type is required for internal ticketing');
    });
  });

  describe('Full Form Validation', () => {
    it('should pass validation for valid form', () => {
      const result = validateEventFormEnhanced(validFormData, validRecurringSettings);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should fail validation for invalid form', () => {
      const invalidData = {
        ...validFormData,
        title: '',
        date: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
        capacity: 3, // Less than spots
      };
      
      const result = validateEventFormEnhanced(invalidData, validRecurringSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
      expect(result.errors.date).toBeDefined();
      expect(result.errors.capacity).toBeDefined();
    });

    it('should include warnings for valid but questionable data', () => {
      const questionableData = {
        ...validFormData,
        date: format(addDays(new Date(), 200), 'yyyy-MM-dd'),
        time: '23:30',
        capacity: 1200,
      };
      
      const result = validateEventFormEnhanced(questionableData, validRecurringSettings);
      expect(result.isValid).toBe(true);
      expect(result.warnings.date).toBeDefined();
      expect(result.warnings.time).toBeDefined();
      expect(result.warnings.capacity).toBeDefined();
    });
  });

  describe('Recurring Events Validation', () => {
    it('should require end date for recurring events', () => {
      const settings: RecurringSettings = {
        isRecurring: true,
        pattern: 'weekly',
        endDate: '',
        customDates: []
      };
      
      const result = eventValidators.recurring(settings);
      expect(result.errors).toContain('End date is required for recurring events');
    });

    it('should require dates for custom pattern', () => {
      const settings: RecurringSettings = {
        isRecurring: true,
        pattern: 'custom',
        endDate: '',
        customDates: []
      };
      
      const result = eventValidators.recurring(settings);
      expect(result.errors).toContain('At least one date must be selected for custom recurring events');
    });

    it('should warn about many recurring events', () => {
      const settings: RecurringSettings = {
        isRecurring: true,
        pattern: 'weekly',
        endDate: format(addDays(new Date(), 200), 'yyyy-MM-dd'),
        customDates: []
      };
      
      const result = eventValidators.recurring(settings);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Field Validation', () => {
    it('should validate individual fields', () => {
      const result = validateField('title', 'Hi', validFormData);
      expect(result.errors).toContain('Title must be at least 3 characters long');
    });

    it('should handle field dependencies', () => {
      const result = validateField('endTime', '18:00', { ...validFormData, time: '19:00' });
      expect(result.errors).toContain('End time must be after start time');
    });
  });

  describe('Unsaved Changes Detection', () => {
    it('should detect form data changes', () => {
      const original = { ...validFormData };
      const current = { ...validFormData, title: 'Changed Title' };
      
      const hasChanges = hasUnsavedChanges(
        current, original, [], [], validRecurringSettings, validRecurringSettings
      );
      
      expect(hasChanges).toBe(true);
    });

    it('should detect spot changes', () => {
      const originalSpots = [{ id: '1', name: 'Spot 1' }];
      const currentSpots = [{ id: '1', name: 'Spot 1 Changed' }];
      
      const hasChanges = hasUnsavedChanges(
        validFormData, validFormData, currentSpots, originalSpots, 
        validRecurringSettings, validRecurringSettings
      );
      
      expect(hasChanges).toBe(true);
    });

    it('should detect no changes', () => {
      const hasChanges = hasUnsavedChanges(
        validFormData, validFormData, [], [], 
        validRecurringSettings, validRecurringSettings
      );
      
      expect(hasChanges).toBe(false);
    });
  });
});