/**
 * Unit tests for generateSplitDescription
 */

import { generateSplitDescription, type DealParticipant } from '@/services/settlement';

describe('generateSplitDescription', () => {
  it('should return correct description for percentage split', () => {
    const participant: DealParticipant = {
      split_type: 'percentage',
      split_percentage: 50,
      flat_fee_amount: 0
    };

    const result = generateSplitDescription(participant);
    expect(result).toBe('50% of total revenue');
  });

  it('should return correct description for flat fee', () => {
    const participant: DealParticipant = {
      split_type: 'flat_fee',
      split_percentage: 0,
      flat_fee_amount: 2500
    };

    const result = generateSplitDescription(participant);
    expect(result).toBe('Flat fee: $2500');
  });

  it('should return correct description for minimum + percentage', () => {
    const participant: DealParticipant = {
      split_type: 'minimum_plus_percentage',
      split_percentage: 20,
      flat_fee_amount: 1000
    };

    const result = generateSplitDescription(participant);
    expect(result).toBe('Guaranteed $1000 + 20% of remainder');
  });

  it('should return Custom split for unknown types', () => {
    const participant: any = {
      split_type: 'invalid_type',
      split_percentage: 50,
      flat_fee_amount: 1000
    };

    const result = generateSplitDescription(participant);
    expect(result).toBe('Custom split');
  });

  it('should handle decimal percentages', () => {
    const participant: DealParticipant = {
      split_type: 'percentage',
      split_percentage: 12.5,
      flat_fee_amount: 0
    };

    const result = generateSplitDescription(participant);
    expect(result).toBe('12.5% of total revenue');
  });

  it('should handle decimal flat fees', () => {
    const participant: DealParticipant = {
      split_type: 'flat_fee',
      split_percentage: 0,
      flat_fee_amount: 1234.56
    };

    const result = generateSplitDescription(participant);
    expect(result).toBe('Flat fee: $1234.56');
  });
});
