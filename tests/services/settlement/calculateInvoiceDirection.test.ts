/**
 * Unit tests for calculateInvoiceDirection
 */

import { calculateInvoiceDirection } from '@/services/settlement';

describe('calculateInvoiceDirection', () => {
  it('should return shouldGenerate=false for zero amount', () => {
    const result = calculateInvoiceDirection(0);

    expect(result.shouldGenerate).toBe(false);
    expect(result.direction).toBeUndefined();
    expect(result.absoluteAmount).toBeUndefined();
  });

  it('should return participant_to_promoter for positive amount', () => {
    const result = calculateInvoiceDirection(1000);

    expect(result.shouldGenerate).toBe(true);
    expect(result.direction).toBe('participant_to_promoter');
    expect(result.absoluteAmount).toBe(1000);
  });

  it('should return promoter_to_participant for negative amount', () => {
    const result = calculateInvoiceDirection(-500);

    expect(result.shouldGenerate).toBe(true);
    expect(result.direction).toBe('promoter_to_participant');
    expect(result.absoluteAmount).toBe(500);
  });

  it('should return absolute value regardless of direction', () => {
    const positive = calculateInvoiceDirection(1234.56);
    const negative = calculateInvoiceDirection(-1234.56);

    expect(positive.absoluteAmount).toBe(1234.56);
    expect(negative.absoluteAmount).toBe(1234.56);
  });

  it('should handle very small amounts', () => {
    const result = calculateInvoiceDirection(0.01);

    expect(result.shouldGenerate).toBe(true);
    expect(result.direction).toBe('participant_to_promoter');
    expect(result.absoluteAmount).toBe(0.01);
  });

  it('should handle very large amounts', () => {
    const result = calculateInvoiceDirection(999999.99);

    expect(result.shouldGenerate).toBe(true);
    expect(result.direction).toBe('participant_to_promoter');
    expect(result.absoluteAmount).toBe(999999.99);
  });
});
