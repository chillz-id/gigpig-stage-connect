import { calculateGST } from '@/utils/gst-calculator';

describe('calculateGST', () => {
  describe('GST Inclusive mode', () => {
    it('should extract GST from total amount', () => {
      const result = calculateGST(1000, 'inclusive');
      expect(result.gross).toBe(1000);
      expect(result.tax).toBeCloseTo(90.91, 2);
      expect(result.net).toBeCloseTo(909.09, 2);
    });
  });

  describe('GST Exclusive mode', () => {
    it('should add GST to net amount', () => {
      const result = calculateGST(1000, 'exclusive');
      expect(result.gross).toBe(1100);
      expect(result.tax).toBe(100);
      expect(result.net).toBe(1000);
    });
  });

  describe('No GST mode', () => {
    it('should return amount unchanged with zero tax', () => {
      const result = calculateGST(1000, 'none');
      expect(result.gross).toBe(1000);
      expect(result.tax).toBe(0);
      expect(result.net).toBe(1000);
    });
  });
});
