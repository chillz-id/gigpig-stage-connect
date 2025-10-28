import { eventApplicationService, type EventApplication } from '@/services/event/application-service';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('eventApplicationService', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('approveApplication', () => {
    it('should update status to accepted and set responded_at timestamp', async () => {
      const mockApplication: EventApplication = {
        id: 'app-123',
        event_id: 'event-456',
        comedian_id: 'comedian-789',
        status: 'accepted',
        responded_at: new Date().toISOString(),
        applied_at: '2025-10-01T00:00:00Z',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockApplication,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await eventApplicationService.approveApplication('app-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('applications');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'accepted',
          responded_at: expect.any(String),
        })
      );
      expect(result).toEqual(mockApplication);
    });

    it('should throw error if application not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Application not found', code: 'PGRST116' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await expect(
        eventApplicationService.approveApplication('nonexistent-id')
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Application not found',
        })
      );
    });
  });

  describe('addToShortlist', () => {
    it('should set is_shortlisted to true and set timestamp', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await eventApplicationService.addToShortlist('app-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('applications');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_shortlisted: true,
          shortlisted_at: expect.any(String),
        })
      );
    });

    it('should throw error if update fails', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: 'PGRST500' },
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await expect(
        eventApplicationService.addToShortlist('app-123')
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Database error',
        })
      );
    });
  });

  describe('removeFromShortlist', () => {
    it('should set is_shortlisted to false and clear timestamp', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await eventApplicationService.removeFromShortlist('app-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('applications');
      expect(mockUpdate).toHaveBeenCalledWith({
        is_shortlisted: false,
        shortlisted_at: null,
      });
    });
  });

  describe('bulkApprove', () => {
    it('should approve multiple applications at once', async () => {
      const applicationIds = ['app-1', 'app-2', 'app-3'];

      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await eventApplicationService.bulkApprove(applicationIds);

      expect(mockSupabase.from).toHaveBeenCalledWith('applications');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'accepted',
          responded_at: expect.any(String),
        })
      );
    });

    it('should throw error on partial failure', async () => {
      const applicationIds = ['app-1', 'app-2'];

      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Bulk update failed', code: 'PGRST500' },
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await expect(
        eventApplicationService.bulkApprove(applicationIds)
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Bulk update failed',
        })
      );
    });
  });

  describe('bulkShortlist', () => {
    it('should shortlist multiple applications at once', async () => {
      const applicationIds = ['app-1', 'app-2', 'app-3'];

      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await eventApplicationService.bulkShortlist(applicationIds);

      expect(mockSupabase.from).toHaveBeenCalledWith('applications');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_shortlisted: true,
          shortlisted_at: expect.any(String),
        })
      );
    });
  });

  describe('getShortlistedApplications', () => {
    it('should return only shortlisted applications for event', async () => {
      const mockApplications: EventApplication[] = [
        {
          id: 'app-1',
          event_id: 'event-123',
          comedian_id: 'comedian-1',
          status: 'pending',
          applied_at: '2025-10-01T00:00:00Z',
        },
        {
          id: 'app-2',
          event_id: 'event-123',
          comedian_id: 'comedian-2',
          status: 'pending',
          applied_at: '2025-10-02T00:00:00Z',
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockApplications,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await eventApplicationService.getShortlistedApplications('event-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('applications');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockApplications);
    });

    it('should return empty array if no shortlisted applications', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await eventApplicationService.getShortlistedApplications('event-123');

      expect(result).toEqual([]);
    });

    it('should order by shortlisted_at descending', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      await eventApplicationService.getShortlistedApplications('event-123');

      expect(mockOrder).toHaveBeenCalledWith('shortlisted_at', { ascending: false });
    });
  });

  describe('deleteApplicationsForEvent', () => {
    it('should delete all applications for an event', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      } as any);

      await eventApplicationService.deleteApplicationsForEvent('event-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('applications');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error if deletion fails', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Deletion failed', code: 'PGRST500' },
        }),
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      } as any);

      await expect(
        eventApplicationService.deleteApplicationsForEvent('event-123')
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Deletion failed',
        })
      );
    });
  });
});
