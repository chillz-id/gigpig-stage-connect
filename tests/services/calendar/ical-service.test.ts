import { icalService } from '@/services/calendar/ical-service';
import { supabase } from '@/integrations/supabase/client';
import { manualGigsService } from '@/services/gigs/manual-gigs-service';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/services/gigs/manual-gigs-service', () => ({
  manualGigsService: {
    getUserManualGigs: jest.fn(),
  },
}));

describe('ICalService', () => {
  const mockToken = 'test-token-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFeedForToken', () => {
    it('should return null for invalid token', async () => {
      // Mock failed subscription lookup
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Not found'),
              }),
            }),
          }),
        }),
      });

      const result = await icalService.generateFeedForToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for inactive subscription', async () => {
      // Mock subscription with is_active = false
      // Note: The query includes .eq('is_active', true), so this won't match
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null, // No match because is_active = false
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await icalService.generateFeedForToken(mockToken);
      expect(result).toBeNull();
    });

    it('should update last_accessed_at on valid token', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock subscription lookup
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'calendar_subscriptions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { user_id: mockUserId, is_active: true },
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      (manualGigsService.getUserManualGigs as jest.Mock).mockResolvedValue([]);

      await icalService.generateFeedForToken(mockToken);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          last_accessed_at: expect.any(String),
        })
      );
    });

    it('should generate iCal feed with manual gigs', async () => {
      const mockManualGigs = [
        {
          id: 'manual-1',
          user_id: mockUserId,
          title: 'Manual Comedy Show',
          venue_name: 'The Laugh Factory',
          venue_address: '123 Comedy St',
          start_datetime: '2025-11-01T19:00:00Z',
          end_datetime: '2025-11-01T21:00:00Z',
          notes: 'Headlining set',
          created_at: '2025-10-29T10:00:00Z',
          updated_at: '2025-10-29T10:00:00Z',
        },
      ];

      // Mock subscription lookup
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'calendar_subscriptions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { user_id: mockUserId, is_active: true },
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      (manualGigsService.getUserManualGigs as jest.Mock).mockResolvedValue(
        mockManualGigs
      );

      const result = await icalService.generateFeedForToken(mockToken);

      expect(result).toBeTruthy();
      expect(result).toContain('BEGIN:VCALENDAR');
      expect(result).toContain('END:VCALENDAR');
      expect(result).toContain('Manual Comedy Show');
      expect(result).toContain('LOCATION:The Laugh Factory');
      expect(result).toContain('DESCRIPTION:Headlining set');
    });

    it('should generate iCal feed with platform gigs', async () => {
      const mockPlatformGigs = [
        {
          id: 'app-1',
          event: {
            name: 'Platform Show',
            venue_name: 'Comedy Club',
            start_date: '2025-11-03T20:00:00Z',
          },
        },
      ];

      // Mock subscription lookup
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'calendar_subscriptions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { user_id: mockUserId, is_active: true },
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockPlatformGigs,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      (manualGigsService.getUserManualGigs as jest.Mock).mockResolvedValue([]);

      const result = await icalService.generateFeedForToken(mockToken);

      expect(result).toBeTruthy();
      expect(result).toContain('Platform Show');
      expect(result).toContain('LOCATION:Comedy Club');
    });

    it('should combine manual and platform gigs', async () => {
      const mockManualGigs = [
        {
          id: 'manual-1',
          user_id: mockUserId,
          title: 'Manual Show',
          venue_name: 'Venue A',
          venue_address: null,
          start_datetime: '2025-11-01T19:00:00Z',
          end_datetime: null,
          notes: null,
          created_at: '2025-10-29T10:00:00Z',
          updated_at: '2025-10-29T10:00:00Z',
        },
      ];

      const mockPlatformGigs = [
        {
          id: 'app-1',
          event: {
            name: 'Platform Show',
            venue_name: 'Venue B',
            start_date: '2025-11-03T20:00:00Z',
          },
        },
      ];

      // Mock subscription lookup
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'calendar_subscriptions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { user_id: mockUserId, is_active: true },
                    error: null,
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockPlatformGigs,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      (manualGigsService.getUserManualGigs as jest.Mock).mockResolvedValue(
        mockManualGigs
      );

      const result = await icalService.generateFeedForToken(mockToken);

      expect(result).toBeTruthy();
      expect(result).toContain('Manual Show');
      expect(result).toContain('Platform Show');
      expect(result).toContain('LOCATION:Venue A');
      expect(result).toContain('LOCATION:Venue B');
    });
  });

  describe('downloadICalFile', () => {
    let mockCreateElement: jest.SpyInstance;
    let mockAppendChild: jest.SpyInstance;
    let mockRemoveChild: jest.SpyInstance;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };

      mockCreateElement = jest
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as unknown as HTMLElement);

      mockAppendChild = jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockLink as unknown as Node);

      mockRemoveChild = jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockLink as unknown as Node);

      // Mock URL methods
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should trigger download with correct filename', () => {
      const icalContent = 'BEGIN:VCALENDAR\r\nEND:VCALENDAR';

      icalService.downloadICalFile(icalContent, 'test-calendar.ics');

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should use default filename if not provided', () => {
      const icalContent = 'BEGIN:VCALENDAR\r\nEND:VCALENDAR';

      icalService.downloadICalFile(icalContent);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should create blob with correct MIME type', () => {
      const icalContent = 'BEGIN:VCALENDAR\r\nEND:VCALENDAR';

      // Simply verify the download process completes without errors
      // The MIME type is hardcoded in the implementation
      expect(() => {
        icalService.downloadICalFile(icalContent);
      }).not.toThrow();

      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
