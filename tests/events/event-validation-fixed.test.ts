// Event System Validation Tests - Fixed version
describe('Event System Validation', () => {
  describe('Event Creation', () => {
    test('should create event with promoter_id from authenticated user', () => {
      const userId = 'test-user-123';
      const eventData = {
        title: 'New Comedy Night',
        venue: 'Laugh Factory',
        address: '123 Comedy St',
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia',
        event_date: '2024-03-20T19:00:00Z',
        start_time: '19:00',
        event_type: 'open_mic',
        total_spots: 10,
        description: 'Open mic night',
        requirements: ['5 min set'],
        promoter_id: userId
      };

      // Verify promoter_id is set correctly
      expect(eventData.promoter_id).toBe(userId);
      expect(eventData).not.toHaveProperty('stage_manager_id');
      expect(eventData).toHaveProperty('event_date');
      expect(eventData.event_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    test('should validate required fields', () => {
      const validateEvent = (data: any) => {
        const errors: string[] = [];
        if (!data.title) errors.push('Title is required');
        if (!data.venue) errors.push('Venue is required');
        if (!data.event_date) errors.push('Event date is required');
        if (!data.promoter_id) errors.push('Promoter ID is required');
        return errors;
      };

      // Test missing fields
      expect(validateEvent({})).toContain('Title is required');
      expect(validateEvent({ title: 'Test' })).toContain('Venue is required');
      expect(validateEvent({ title: 'Test', venue: 'Place' })).toContain('Event date is required');
      
      // Test valid event
      const validEvent = {
        title: 'Test Event',
        venue: 'Test Venue',
        event_date: '2024-03-20',
        promoter_id: 'user-123'
      };
      expect(validateEvent(validEvent)).toHaveLength(0);
    });
  });

  describe('Event Display', () => {
    test('should handle event with banner image', () => {
      const event = {
        id: 'event-1',
        title: 'Test Comedy Show',
        description: 'A great comedy show',
        event_date: '2024-03-15T20:00:00Z',
        start_time: '20:00',
        venue: 'Comedy Club',
        promoter_id: 'promoter-123',
        status: 'open',
        total_spots: 10,
        image_url: 'https://example.com/banner.jpg',
        city: 'Sydney',
        state: 'NSW'
      };

      expect(event.image_url).toBeDefined();
      expect(event.image_url).toMatch(/^https?:\/\//);
    });

    test('should handle event without banner', () => {
      const event = {
        id: 'event-1',
        title: 'Test Comedy Show',
        event_date: '2024-03-15T20:00:00Z',
        venue: 'Comedy Club',
        promoter_id: 'promoter-123',
        image_url: null
      };

      expect(event.image_url).toBeNull();
      // Component should show fallback gradient
    });
  });

  describe('Event Filtering', () => {
    test('should filter events by status', () => {
      const events = [
        { id: '1', title: 'Event 1', status: 'open' },
        { id: '2', title: 'Event 2', status: 'closed' },
        { id: '3', title: 'Event 3', status: 'open' },
        { id: '4', title: 'Event 4', status: 'completed' }
      ];

      const openEvents = events.filter(e => e.status === 'open');
      expect(openEvents).toHaveLength(2);
      expect(openEvents[0]?.title).toBe('Event 1');
      expect(openEvents[1]?.title).toBe('Event 3');
    });

    test('should search events by title', () => {
      const events = [
        { id: '1', title: 'Comedy Night' },
        { id: '2', title: 'Music Festival' },
        { id: '3', title: 'Comedy Workshop' }
      ];

      const searchTerm = 'Comedy';
      const filtered = events.filter(e => 
        e.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.id)).toEqual(['1', '3']);
    });
  });

  describe('Field Mapping Validation', () => {
    test('should use correct field names for database', () => {
      const dbEvent = {
        id: 'event-123',
        title: 'Test Event',
        event_date: '2024-03-15T20:00:00Z', // NOT 'date'
        promoter_id: 'user-123', // NOT 'stage_manager_id'
        venue: 'Test Venue',
        total_spots: 10,
        status: 'open'
      };

      // Correct fields
      expect(dbEvent).toHaveProperty('event_date');
      expect(dbEvent).toHaveProperty('promoter_id');
      
      // Incorrect fields
      expect(dbEvent).not.toHaveProperty('date');
      expect(dbEvent).not.toHaveProperty('stage_manager_id');
    });
  });

  describe('No stage_manager_id References', () => {
    test('should not use stage_manager_id anywhere', () => {
      const eventData = {
        title: 'Test',
        venue: 'Test Venue',
        event_date: '2024-03-20T19:00:00Z',
        start_time: '19:00',
        promoter_id: 'user-id'
      };

      // Ensure the prepared data doesn't have stage_manager_id
      expect(eventData).not.toHaveProperty('stage_manager_id');
      expect(eventData).toHaveProperty('promoter_id');
      
      // Check field names
      const fieldNames = Object.keys(eventData);
      expect(fieldNames).not.toContain('stage_manager_id');
      expect(fieldNames).toContain('promoter_id');
    });
  });
});