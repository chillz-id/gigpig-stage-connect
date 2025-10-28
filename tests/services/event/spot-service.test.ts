import { eventSpotService } from '@/services/event/spot-service';
import { supabase } from '@/integrations/supabase/client';
import { calculateGST } from '@/utils/gst-calculator';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock GST calculator
jest.mock('@/utils/gst-calculator');

describe('eventSpotService - GST Payment Methods', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockCalculateGST = calculateGST as jest.MockedFunction<typeof calculateGST>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateSpotPayment', () => {
    it('should update payment data for a spot', async () => {
      const paymentData = {
        payment_gross: 1100,
        payment_tax: 100,
        payment_net: 1000,
        payment_status: 'paid' as const,
        gst_mode: 'exclusive' as const,
        payment_notes: 'Payment received',
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

      await eventSpotService.updateSpotPayment('spot-123', paymentData);

      expect(mockSupabase.from).toHaveBeenCalledWith('event_spots');
      expect(mockUpdate).toHaveBeenCalledWith(paymentData);
    });

    it('should throw error if update fails', async () => {
      const paymentData = {
        payment_gross: 1100,
        payment_status: 'paid' as const,
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed', code: 'PGRST500' },
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await expect(
        eventSpotService.updateSpotPayment('spot-123', paymentData)
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Update failed',
        })
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update only payment status', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await eventSpotService.updatePaymentStatus('spot-123', 'pending');

      expect(mockSupabase.from).toHaveBeenCalledWith('event_spots');
      expect(mockUpdate).toHaveBeenCalledWith({ payment_status: 'pending' });
    });

    it('should handle all valid payment statuses', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const statuses: Array<'unpaid' | 'pending' | 'paid'> = ['unpaid', 'pending', 'paid'];

      for (const status of statuses) {
        await eventSpotService.updatePaymentStatus('spot-123', status);
        expect(mockUpdate).toHaveBeenCalledWith({ payment_status: status });
      }

      expect(mockUpdate).toHaveBeenCalledTimes(3);
    });
  });

  describe('calculateAndSetSpotPayment', () => {
    it('should calculate GST and update spot with all amounts (inclusive mode)', async () => {
      const mockGSTResult = {
        gross: 1000,
        tax: 90.91,
        net: 909.09,
      };

      mockCalculateGST.mockReturnValue(mockGSTResult);

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await eventSpotService.calculateAndSetSpotPayment('spot-123', 1000, 'inclusive');

      expect(mockCalculateGST).toHaveBeenCalledWith(1000, 'inclusive');
      expect(mockUpdate).toHaveBeenCalledWith({
        payment_gross: 1000,
        payment_tax: 90.91,
        payment_net: 909.09,
        gst_mode: 'inclusive',
      });
    });

    it('should calculate GST and update spot with all amounts (exclusive mode)', async () => {
      const mockGSTResult = {
        gross: 1100,
        tax: 100,
        net: 1000,
      };

      mockCalculateGST.mockReturnValue(mockGSTResult);

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await eventSpotService.calculateAndSetSpotPayment('spot-123', 1000, 'exclusive');

      expect(mockCalculateGST).toHaveBeenCalledWith(1000, 'exclusive');
      expect(mockUpdate).toHaveBeenCalledWith({
        payment_gross: 1100,
        payment_tax: 100,
        payment_net: 1000,
        gst_mode: 'exclusive',
      });
    });

    it('should calculate GST and update spot with all amounts (none mode)', async () => {
      const mockGSTResult = {
        gross: 1000,
        tax: 0,
        net: 1000,
      };

      mockCalculateGST.mockReturnValue(mockGSTResult);

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await eventSpotService.calculateAndSetSpotPayment('spot-123', 1000, 'none');

      expect(mockCalculateGST).toHaveBeenCalledWith(1000, 'none');
      expect(mockUpdate).toHaveBeenCalledWith({
        payment_gross: 1000,
        payment_tax: 0,
        payment_net: 1000,
        gst_mode: 'none',
      });
    });

    it('should throw error if database update fails', async () => {
      const mockGSTResult = {
        gross: 1000,
        tax: 0,
        net: 1000,
      };

      mockCalculateGST.mockReturnValue(mockGSTResult);

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
        eventSpotService.calculateAndSetSpotPayment('spot-123', 1000, 'none')
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Database error',
        })
      );
    });

    it('should handle decimal amounts correctly', async () => {
      const mockGSTResult = {
        gross: 1234.56,
        tax: 112.23,
        net: 1122.33,
      };

      mockCalculateGST.mockReturnValue(mockGSTResult);

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await eventSpotService.calculateAndSetSpotPayment('spot-123', 1234.56, 'inclusive');

      expect(mockCalculateGST).toHaveBeenCalledWith(1234.56, 'inclusive');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_gross: 1234.56,
        })
      );
    });
  });
});
