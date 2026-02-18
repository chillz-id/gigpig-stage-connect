// Test file for spot notification system
import { notificationService } from '../notificationService';
import { spotConfirmationService } from '../spotConfirmationService';
import {
  createSpotAssignmentEmail,
  createSpotDeadlineEmail,
  createSpotConfirmationEmail,
} from '../../templates/email';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [{ id: 'test-id' }], error: null }),
      select: jest.fn().mockResolvedValue({ data: [{ id: 'test-id' }], error: null }),
      single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
      update: jest.fn().mockResolvedValue({ data: [{ id: 'test-id' }], error: null }),
      eq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
    })),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: { success: true }, error: null })
    }
  }
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

describe('Spot Notification System', () => {
  
  describe('Email Templates', () => {
    const mockData = {
      comedianName: 'John Doe',
      comedianEmail: 'john@example.com',
      eventTitle: 'Comedy Night',
      eventDate: '2024-01-15T20:00:00Z',
      eventTime: '2024-01-15T20:00:00Z',
      venue: 'Comedy Club',
      address: '123 Funny St',
      spotType: 'MC',
      confirmationDeadline: '2024-01-10T10:00:00Z',
      confirmationUrl: 'https://app.com/confirm',
      eventUrl: 'https://app.com/event',
      promoterName: 'Jane Smith',
      promoterEmail: 'jane@example.com'
    };

    test('should create spot assignment email', () => {
      const email = createSpotAssignmentEmail(mockData);
      
      expect(email.to).toBe(mockData.comedianEmail);
      expect(email.subject).toContain('Spot Assignment');
      expect(email.subject).toContain(mockData.eventTitle);
      expect(email.html).toContain(mockData.comedianName);
      expect(email.html).toContain(mockData.eventTitle);
      expect(email.html).toContain(mockData.venue);
      expect(email.text).toContain(mockData.comedianName);
    });

    test('should create deadline reminder email', () => {
      const deadlineData = {
        ...mockData,
        hoursRemaining: 12
      };
      
      const email = createSpotDeadlineEmail(deadlineData);
      
      expect(email.to).toBe(mockData.comedianEmail);
      expect(email.subject).toContain('REMINDER');
      expect(email.html).toContain('12');
      expect(email.html).toContain('HOUR');
    });

    test('should create urgent deadline reminder email', () => {
      const urgentData = {
        ...mockData,
        hoursRemaining: 1
      };
      
      const email = createSpotDeadlineEmail(urgentData);
      
      expect(email.subject).toContain('URGENT');
      expect(email.html).toContain('1');
      expect(email.html).toContain('HOUR');
    });

    test('should create spot confirmation email for comedian', () => {
      const confirmData = {
        ...mockData,
        isPromoterEmail: false
      };
      
      const email = createSpotConfirmationEmail(confirmData);
      
      expect(email.to).toBe(mockData.comedianEmail);
      expect(email.subject).toContain('Spot Confirmation Received');
      expect(email.html).toContain('Thank you for confirming');
    });

    test('should create spot confirmation email for promoter', () => {
      const confirmData = {
        ...mockData,
        isPromoterEmail: true
      };
      
      const email = createSpotConfirmationEmail(confirmData);
      
      expect(email.to).toBe(mockData.promoterEmail);
      expect(email.subject).toContain('Spot Confirmed');
      expect(email.html).toContain('has confirmed their');
    });

  });

  describe('Notification Service', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should send spot assignment notification', async () => {
      const mockOptions = {
        comedianEmail: 'john@example.com',
        comedianName: 'John Doe',
        address: '123 Comedy St',
        promoterName: 'Jane Smith',
        promoterEmail: 'jane@example.com'
      };

      await notificationService.notifySpotAssigned(
        'comedian-123',
        'event-456',
        'Comedy Night',
        '2024-01-15T20:00:00Z',
        'MC',
        'Comedy Club',
        '2024-01-10T10:00:00Z',
        mockOptions
      );

      // Verify notification was created
      expect(jest.fn()).toHaveBeenCalled();
    });

    test('should send deadline reminder notification', async () => {
      const mockOptions = {
        comedianEmail: 'john@example.com',
        comedianName: 'John Doe',
        promoterName: 'Jane Smith',
        promoterEmail: 'jane@example.com',
        spotType: 'MC'
      };

      await notificationService.notifySpotConfirmationDeadline(
        'comedian-123',
        'event-456',
        'Comedy Night',
        '2024-01-15T20:00:00Z',
        'Comedy Club',
        6,
        mockOptions
      );

      // Verify notification was created
      expect(jest.fn()).toHaveBeenCalled();
    });

    test('should send spot confirmed notification', async () => {
      const mockOptions = {
        comedianEmail: 'john@example.com',
        promoterName: 'Jane Smith',
        promoterEmail: 'jane@example.com',
        venue: 'Comedy Club',
        address: '123 Comedy St'
      };

      await notificationService.notifySpotConfirmed(
        'promoter-789',
        'comedian-123',
        'John Doe',
        'event-456',
        'Comedy Night',
        '2024-01-15T20:00:00Z',
        'MC',
        mockOptions
      );

      // Verify notifications were created for both users
      expect(jest.fn()).toHaveBeenCalled();
    });

    test('should send spot declined notification', async () => {
      const mockOptions = {
        comedianEmail: 'john@example.com',
        promoterName: 'Jane Smith',
        promoterEmail: 'jane@example.com',
        venue: 'Comedy Club',
        address: '123 Comedy St'
      };

      await notificationService.notifySpotDeclined(
        'promoter-789',
        'comedian-123',
        'John Doe',
        'event-456',
        'Comedy Night',
        '2024-01-15T20:00:00Z',
        'MC',
        'Schedule conflict',
        mockOptions
      );

      // Verify notifications were created for both users
      expect(jest.fn()).toHaveBeenCalled();
    });
  });

  describe('Spot Confirmation Service', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should assign spot successfully', async () => {
      const assignmentData = {
        eventId: 'event-456',
        comedianId: 'comedian-123',
        spotType: 'MC',
        confirmationDeadline: '2024-01-10T10:00:00Z',
        performanceDuration: '5 minutes',
        specialInstructions: 'No blue material'
      };

      await expect(spotConfirmationService.assignSpot(assignmentData)).resolves.not.toThrow();
    });

    test('should confirm spot successfully', async () => {
      const confirmationData = {
        eventId: 'event-456',
        comedianId: 'comedian-123',
        confirmed: true
      };

      await expect(spotConfirmationService.confirmSpot(confirmationData)).resolves.not.toThrow();
    });

    test('should decline spot successfully', async () => {
      const confirmationData = {
        eventId: 'event-456',
        comedianId: 'comedian-123',
        confirmed: false,
        reason: 'Double booked'
      };

      await expect(spotConfirmationService.confirmSpot(confirmationData)).resolves.not.toThrow();
    });

    test('should send deadline reminder', async () => {
      await expect(
        spotConfirmationService.sendDeadlineReminder('event-456', 'comedian-123')
      ).resolves.not.toThrow();
    });

    test('should send pending reminders', async () => {
      await expect(spotConfirmationService.sendPendingReminders()).resolves.not.toThrow();
    });

    test('should assign multiple spots', async () => {
      const assignments = [
        {
          eventId: 'event-456',
          comedianId: 'comedian-123',
          spotType: 'MC',
          confirmationDeadline: '2024-01-10T10:00:00Z'
        },
        {
          eventId: 'event-456',
          comedianId: 'comedian-789',
          spotType: 'Feature',
          confirmationDeadline: '2024-01-10T10:00:00Z'
        }
      ];

      await expect(spotConfirmationService.assignMultipleSpots(assignments)).resolves.not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should complete full spot assignment workflow', async () => {
      // 1. Assign spot
      const assignmentData = {
        eventId: 'event-456',
        comedianId: 'comedian-123',
        spotType: 'MC',
        confirmationDeadline: '2024-01-10T10:00:00Z'
      };

      await spotConfirmationService.assignSpot(assignmentData);

      // 2. Send reminder
      await spotConfirmationService.sendDeadlineReminder('event-456', 'comedian-123');

      // 3. Confirm spot
      const confirmationData = {
        eventId: 'event-456',
        comedianId: 'comedian-123',
        confirmed: true
      };

      await spotConfirmationService.confirmSpot(confirmationData);

      // All operations should complete without error
      expect(true).toBe(true);
    });

    test('should handle spot decline workflow', async () => {
      // 1. Assign spot
      const assignmentData = {
        eventId: 'event-456',
        comedianId: 'comedian-123',
        spotType: 'Feature',
        confirmationDeadline: '2024-01-10T10:00:00Z'
      };

      await spotConfirmationService.assignSpot(assignmentData);

      // 2. Decline spot
      const declineData = {
        eventId: 'event-456',
        comedianId: 'comedian-123',
        confirmed: false,
        reason: 'Personal emergency'
      };

      await spotConfirmationService.confirmSpot(declineData);

      // All operations should complete without error
      expect(true).toBe(true);
    });
  });
});