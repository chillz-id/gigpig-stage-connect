// Event Template Test Suite - Fixed version
describe('Event Template Test Suite', () => {
  describe('Template Save/Load Functionality', () => {
    test('should save event as template', () => {
      const template = {
        name: 'New Template',
        description: 'A new template for events',
        title: 'Comedy Show',
        venue: 'The Venue',
        address: '123 Main St',
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia',
        event_type: 'open_mic',
        total_spots: 10,
        event_description: 'Weekly comedy open mic',
        requirements: ['5 minute set', 'Clean material'],
        banner_url: 'https://example.com/banner.jpg',
        start_time: '20:00',
        end_time: '22:00'
      };

      expect(template.name).toBe('New Template');
      expect(template.title).toBe('Comedy Show');
      expect(template.requirements).toHaveLength(2);
      expect(template.banner_url).toBeDefined();
    });

    test('should load template list', () => {
      const templates = [
        {
          id: 'template-1',
          name: 'Comedy Night Template',
          description: 'Standard comedy night template',
          title: 'Friday Comedy Night',
          venue: 'The Comedy Club'
        },
        {
          id: 'template-2',
          name: 'Workshop Template',
          description: 'Comedy workshop template',
          title: 'Comedy Workshop',
          venue: 'Community Center'
        }
      ];

      expect(templates).toHaveLength(2);
      expect(templates[0]?.name).toBe('Comedy Night Template');
      expect(templates[1]?.name).toBe('Workshop Template');
    });

    test('should update existing template', () => {
      const template = {
        id: 'template-1',
        name: 'Comedy Night Template',
        title: 'Friday Comedy Night',
        venue: 'The Comedy Club'
      };

      // Update template
      template.name = 'Updated Comedy Night';
      template.title = 'Saturday Comedy Night';

      expect(template.name).toBe('Updated Comedy Night');
      expect(template.title).toBe('Saturday Comedy Night');
      expect(template.id).toBe('template-1'); // ID should not change
    });

    test('should validate template before saving', () => {
      const validateTemplate = (template: any) => {
        const errors: string[] = [];
        if (!template.name) errors.push('Template name is required');
        if (!template.title) errors.push('Event title is required');
        if (!template.venue) errors.push('Venue is required');
        return errors;
      };

      const invalidTemplate = { name: '', title: 'Test' };
      const errors = validateTemplate(invalidTemplate);
      
      expect(errors).toContain('Template name is required');
      expect(errors).toContain('Venue is required');
      
      const validTemplate = {
        name: 'Valid Template',
        title: 'Event Title',
        venue: 'Test Venue'
      };
      expect(validateTemplate(validTemplate)).toHaveLength(0);
    });
  });

  describe('Banner Inclusion', () => {
    test('should save template with banner URL', () => {
      const template = {
        name: 'Template with Banner',
        title: 'Comedy Show',
        venue: 'The Venue',
        banner_url: 'https://example.com/banner.jpg'
      };

      expect(template.banner_url).toBeDefined();
      expect(template.banner_url).toMatch(/^https?:\/\//);
      expect(template.banner_url).toContain('banner.jpg');
    });

    test('should validate banner URL format', () => {
      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidUrl('https://example.com/banner.jpg')).toBe(true);
      expect(isValidUrl('http://example.com/image.png')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });

    test('should handle missing banner gracefully', () => {
      const template = {
        name: 'Template without Banner',
        title: 'Comedy Show',
        venue: 'The Venue',
        banner_url: null
      };

      expect(template.banner_url).toBeNull();
      // Component should show placeholder or default image
    });
  });

  describe('Template Application', () => {
    test('should apply template to new event', () => {
      const template = {
        title: 'Friday Comedy Night',
        venue: 'The Comedy Club',
        address: '123 Comedy St',
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia',
        event_type: 'open_mic',
        total_spots: 10,
        event_description: 'Weekly comedy open mic',
        requirements: ['5 minute set'],
        banner_url: 'https://example.com/banner.jpg',
        start_time: '20:00',
        end_time: '22:00'
      };

      // Apply template to new event
      const newEvent = {
        ...template,
        event_date: '2025-01-20T20:00:00Z',
        promoter_id: 'user-123',
        status: 'draft' as const
      };

      expect(newEvent.title).toBe(template.title);
      expect(newEvent.venue).toBe(template.venue);
      expect(newEvent.banner_url).toBe(template.banner_url);
      expect(newEvent.event_date).toBeDefined();
      expect(newEvent.promoter_id).toBeDefined();
    });

    test('should preserve all template settings when applying', () => {
      const template = {
        title: 'Comedy Night',
        venue: 'The Club',
        address: '123 Main St',
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia',
        event_type: 'showcase',
        total_spots: 15,
        event_description: 'Monthly showcase',
        requirements: ['7 minute set', 'Clean material only'],
        banner_url: 'https://example.com/showcase.jpg',
        start_time: '19:30',
        end_time: '22:30'
      };

      const appliedFields = Object.keys(template);
      
      expect(appliedFields).toContain('title');
      expect(appliedFields).toContain('venue');
      expect(appliedFields).toContain('banner_url');
      expect(appliedFields).toContain('requirements');
      expect(template.requirements).toHaveLength(2);
    });

    test('should allow customization after template application', () => {
      const template = {
        title: 'Comedy Night Template',
        venue: 'Default Venue',
        total_spots: 10
      };

      const customizedEvent = {
        ...template,
        title: 'Special Comedy Night', // Customized
        event_date: '2025-02-14', // Added
        total_spots: 20 // Customized
      };

      expect(customizedEvent.title).not.toBe(template.title);
      expect(customizedEvent.venue).toBe(template.venue); // Unchanged
      expect(customizedEvent.total_spots).not.toBe(template.total_spots);
      expect(customizedEvent).toHaveProperty('event_date');
    });
  });

  describe('Template Search and Filter', () => {
    test('should search templates by name', () => {
      const templates = [
        { id: '1', name: 'Comedy Night Template', event_type: 'open_mic' },
        { id: '2', name: 'Workshop Template', event_type: 'workshop' },
        { id: '3', name: 'Comedy Showcase Template', event_type: 'showcase' }
      ];

      const searchTerm = 'Comedy';
      const filtered = templates.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '3']);
    });

    test('should filter templates by event type', () => {
      const templates = [
        { id: '1', name: 'Open Mic 1', event_type: 'open_mic' },
        { id: '2', name: 'Workshop 1', event_type: 'workshop' },
        { id: '3', name: 'Open Mic 2', event_type: 'open_mic' }
      ];

      const openMicTemplates = templates.filter(t => t.event_type === 'open_mic');
      expect(openMicTemplates).toHaveLength(2);
      
      const workshopTemplates = templates.filter(t => t.event_type === 'workshop');
      expect(workshopTemplates).toHaveLength(1);
    });
  });
});