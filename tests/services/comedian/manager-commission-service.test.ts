import {
  managerCommissionService,
  type ManagerRelationship,
  type CommissionUpdate,
} from '@/services/comedian/manager-commission-service';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('managerCommissionService', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getManagerForComedian', () => {
    it('should return active manager relationship', async () => {
      const mockRelationship: ManagerRelationship = {
        id: 'rel-123',
        comedian_id: 'comedian-456',
        manager_id: 'manager-789',
        commission_percentage: 20,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockRelationship,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await managerCommissionService.getManagerForComedian('comedian-456');

      expect(mockSupabase.from).toHaveBeenCalledWith('comedian_managers');
      expect(result).toEqual(mockRelationship);
    });

    it('should return null if no active relationship exists', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await managerCommissionService.getManagerForComedian('comedian-456');

      expect(result).toBeNull();
    });

    it('should throw error for non-PGRST116 errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: 'PGRST500' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(
        managerCommissionService.getManagerForComedian('comedian-456')
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Database error',
        })
      );
    });
  });

  describe('getManagerCommissionRate', () => {
    it('should return commission percentage for active relationship', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { commission_percentage: 25 },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await managerCommissionService.getManagerCommissionRate(
        'manager-123',
        'comedian-456'
      );

      expect(result).toBe(25);
    });

    it('should default to 15% if commission_percentage is null', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { commission_percentage: null },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await managerCommissionService.getManagerCommissionRate(
        'manager-123',
        'comedian-456'
      );

      expect(result).toBe(15);
    });

    it('should throw error if no active relationship found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(
        managerCommissionService.getManagerCommissionRate('manager-123', 'comedian-456')
      ).rejects.toThrow('No active manager relationship found');
    });
  });

  describe('getDefaultCommission', () => {
    it('should return default commission from manager profile', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { default_commission_percentage: 18 },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await managerCommissionService.getDefaultCommission('manager-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('comedy_manager_profiles');
      expect(result).toBe(18);
    });

    it('should default to 15% if no default set', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { default_commission_percentage: null },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await managerCommissionService.getDefaultCommission('manager-123');

      expect(result).toBe(15);
    });
  });

  describe('updateCommissionRate', () => {
    it('should update commission percentage and notes', async () => {
      const update: CommissionUpdate = {
        commission_percentage: 22,
        commission_notes: 'Negotiated rate',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await managerCommissionService.updateCommissionRate('rel-123', update);

      expect(mockSupabase.from).toHaveBeenCalledWith('comedian_managers');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          commission_percentage: 22,
          commission_notes: 'Negotiated rate',
          updated_at: expect.any(String),
        })
      );
    });

    it('should reject commission rate below 0%', async () => {
      const update: CommissionUpdate = {
        commission_percentage: -5,
      };

      await expect(
        managerCommissionService.updateCommissionRate('rel-123', update)
      ).rejects.toThrow('Commission rate must be between 0% and 30%');
    });

    it('should reject commission rate above 30%', async () => {
      const update: CommissionUpdate = {
        commission_percentage: 35,
      };

      await expect(
        managerCommissionService.updateCommissionRate('rel-123', update)
      ).rejects.toThrow('Commission rate must be between 0% and 30%');
    });

    it('should accept commission rate at boundaries (0% and 30%)', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      // Test 0%
      await managerCommissionService.updateCommissionRate('rel-123', {
        commission_percentage: 0,
      });
      expect(mockUpdate).toHaveBeenCalled();

      // Test 30%
      await managerCommissionService.updateCommissionRate('rel-456', {
        commission_percentage: 30,
      });
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateDefaultCommission', () => {
    it('should update manager default commission', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await managerCommissionService.updateDefaultCommission('manager-123', 20);

      expect(mockSupabase.from).toHaveBeenCalledWith('comedy_manager_profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        default_commission_percentage: 20,
      });
    });

    it('should validate rate before updating', async () => {
      await expect(
        managerCommissionService.updateDefaultCommission('manager-123', 40)
      ).rejects.toThrow('Commission rate must be between 0% and 30%');
    });
  });

  describe('calculateManagerCut', () => {
    it('should calculate commission amount correctly', async () => {
      const result = await managerCommissionService.calculateManagerCut(1000, 20);

      expect(result.total_amount).toBe(1000);
      expect(result.commission_rate).toBe(20);
      expect(result.commission_amount).toBe(200);
      expect(result.comedian_net).toBe(800);
    });

    it('should calculate comedian net correctly', async () => {
      const result = await managerCommissionService.calculateManagerCut(1500, 15);

      expect(result.commission_amount).toBe(225);
      expect(result.comedian_net).toBe(1275);
    });

    it('should round to 2 decimal places', async () => {
      const result = await managerCommissionService.calculateManagerCut(1000, 15.5);

      expect(result.commission_amount).toBe(155);
      expect(result.comedian_net).toBe(845);
    });

    it('should handle edge case of 0% commission', async () => {
      const result = await managerCommissionService.calculateManagerCut(1000, 0);

      expect(result.commission_amount).toBe(0);
      expect(result.comedian_net).toBe(1000);
    });

    it('should validate rate before calculating', async () => {
      await expect(
        managerCommissionService.calculateManagerCut(1000, -5)
      ).rejects.toThrow('Commission rate must be between 0% and 30%');

      await expect(
        managerCommissionService.calculateManagerCut(1000, 35)
      ).rejects.toThrow('Commission rate must be between 0% and 30%');
    });
  });
});
