/**
 * Unit tests for calculateSplitAmount
 */

import { calculateSplitAmount, type DealParticipant } from '@/services/settlement';

describe('calculateSplitAmount', () => {
  const totalRevenue = 10000;

  describe('Percentage splits', () => {
    it('should calculate 50% correctly', () => {
      const participant: DealParticipant = {
        split_type: 'percentage',
        split_percentage: 50,
        flat_fee_amount: 0
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      expect(result).toBe(5000);
    });

    it('should calculate 30% correctly', () => {
      const participant: DealParticipant = {
        split_type: 'percentage',
        split_percentage: 30,
        flat_fee_amount: 0
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      expect(result).toBe(3000);
    });

    it('should calculate 100% correctly', () => {
      const participant: DealParticipant = {
        split_type: 'percentage',
        split_percentage: 100,
        flat_fee_amount: 0
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      expect(result).toBe(10000);
    });

    it('should handle 0%', () => {
      const participant: DealParticipant = {
        split_type: 'percentage',
        split_percentage: 0,
        flat_fee_amount: 0
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      expect(result).toBe(0);
    });

    it('should handle decimal percentages', () => {
      const participant: DealParticipant = {
        split_type: 'percentage',
        split_percentage: 12.5,
        flat_fee_amount: 0
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      expect(result).toBe(1250);
    });
  });

  describe('Flat fee splits', () => {
    it('should return exact flat fee amount', () => {
      const participant: DealParticipant = {
        split_type: 'flat_fee',
        split_percentage: 0,
        flat_fee_amount: 2500
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      expect(result).toBe(2500);
    });

    it('should ignore revenue when using flat fee', () => {
      const participant: DealParticipant = {
        split_type: 'flat_fee',
        split_percentage: 0,
        flat_fee_amount: 1000
      };

      const result1 = calculateSplitAmount(participant, 5000);
      const result2 = calculateSplitAmount(participant, 50000);

      expect(result1).toBe(1000);
      expect(result2).toBe(1000);
    });
  });

  describe('Minimum plus percentage splits', () => {
    it('should return percentage when higher than minimum', () => {
      const participant: DealParticipant = {
        split_type: 'minimum_plus_percentage',
        split_percentage: 50,
        flat_fee_amount: 1000
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      // 50% of 10000 = 5000, which is > 1000 minimum
      expect(result).toBe(5000);
    });

    it('should return minimum when percentage is lower', () => {
      const participant: DealParticipant = {
        split_type: 'minimum_plus_percentage',
        split_percentage: 10,
        flat_fee_amount: 2000
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      // 10% of 10000 = 1000, which is < 2000 minimum
      expect(result).toBe(2000);
    });

    it('should handle edge case where percentage equals minimum', () => {
      const participant: DealParticipant = {
        split_type: 'minimum_plus_percentage',
        split_percentage: 20,
        flat_fee_amount: 2000
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      // 20% of 10000 = 2000, which equals 2000 minimum
      expect(result).toBe(2000);
    });
  });

  describe('Edge cases', () => {
    it('should return 0 for unknown split type', () => {
      const participant: any = {
        split_type: 'invalid_type',
        split_percentage: 50,
        flat_fee_amount: 1000
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      expect(result).toBe(0);
    });

    it('should handle negative flat fee', () => {
      const participant: DealParticipant = {
        split_type: 'flat_fee',
        split_percentage: 0,
        flat_fee_amount: -500
      };

      const result = calculateSplitAmount(participant, totalRevenue);
      expect(result).toBe(-500);
    });

    it('should handle zero revenue', () => {
      const participant: DealParticipant = {
        split_type: 'percentage',
        split_percentage: 50,
        flat_fee_amount: 0
      };

      const result = calculateSplitAmount(participant, 0);
      expect(result).toBe(0);
    });
  });
});
