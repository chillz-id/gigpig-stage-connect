/**
 * photographer-service.test.ts
 *
 * Unit tests for photographer service to verify:
 * - getBySlug() method correctly fetches photographer by URL slug
 * - Slug-based lookup returns profile with vouch stats
 * - Service handles missing profiles gracefully
 * - All service methods work correctly with photographer profiles
 */

import { photographerService } from '@/services/photographer/photographer-service';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe('photographerService', () => {
  const mockSupabaseClient = supabase as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBySlug', () => {
    it('fetches photographer profile by URL slug', async () => {
      const mockPhotographer = {
        id: 'photographer-id-123',
        url_slug: 'jane-photographer',
        bio: 'Professional event photographer',
        specialties: ['events', 'portraits'],
        services_offered: ['photography', 'editing'],
        experience_years: 5,
        rate_per_hour: 150,
        rate_per_event: 800,
        available_for_events: true,
        profiles: {
          id: 'photographer-id-123',
          name: 'Jane Photographer',
          stage_name: 'Jane Photos',
          avatar_url: 'https://example.com/jane.jpg',
          location: 'Sydney, Australia',
        },
      };

      const mockVouchStats = {
        photographer_id: 'photographer-id-123',
        total_vouches: 10,
        unique_vouchers: 8,
        average_rating: 4.5,
        recent_vouches: 3,
      };

      // Mock photographer_profiles query
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockPhotographer,
              error: null,
            }),
          }),
        }),
      });

      // Mock vouch stats query (called internally by getVouchStats)
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'photographer_vouch_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockVouchStats,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: mockPhotographer,
                error: null,
              }),
            }),
          }),
        };
      });

      const result = await photographerService.getBySlug('jane-photographer');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('photographer-id-123');
      expect(result?.url_slug).toBe('jane-photographer');
      expect(result?.vouch_stats).toEqual(mockVouchStats);
    });

    it('returns null when photographer slug does not exist', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const result = await photographerService.getBySlug('non-existent-slug');

      expect(result).toBeNull();
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Database connection failed');

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(
        photographerService.getBySlug('jane-photographer')
      ).rejects.toThrow('Database connection failed');
    });

    it('handles PGRST116 error gracefully (no rows returned)', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const result = await photographerService.getBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('queries photographer_profiles table with correct fields', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      await photographerService.getBySlug('test-slug');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'photographer_profiles'
      );
      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining('url_slug')
      );
      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining('profiles!inner')
      );
    });

    it('returns default vouch stats when stats are missing', async () => {
      const mockPhotographer = {
        id: 'photographer-id-456',
        url_slug: 'new-photographer',
        bio: 'New to the platform',
        profiles: {
          id: 'photographer-id-456',
          name: 'New Photographer',
        },
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'photographer_vouch_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: mockPhotographer,
                error: null,
              }),
            }),
          }),
        };
      });

      const result = await photographerService.getBySlug('new-photographer');

      expect(result).toBeTruthy();
      expect(result?.vouch_stats).toEqual({
        photographer_id: 'photographer-id-456',
        total_vouches: 0,
        unique_vouchers: 0,
        average_rating: 0,
        recent_vouches: 0,
      });
    });
  });

  describe('getById', () => {
    it('includes url_slug in select query', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      await photographerService.getById('photographer-id-123');

      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining('url_slug')
      );
    });
  });

  describe('list', () => {
    it('includes url_slug in photographer_profile selection', async () => {
      const orderMock = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const inMock = jest.fn().mockReturnValue({
        order: orderMock,
      });

      const selectMock = jest.fn().mockReturnValue({
        in: inMock,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      await photographerService.list();

      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining('photographer_profile:photographer_profiles')
      );
      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining('url_slug')
      );
    });

    it('filters by role photographer and videographer', async () => {
      const orderMock = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const inMock = jest.fn().mockReturnValue({
        order: orderMock,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: inMock,
        }),
      });

      await photographerService.list();

      expect(inMock).toHaveBeenCalledWith('role', [
        'photographer',
        'videographer',
      ]);
    });
  });
});
