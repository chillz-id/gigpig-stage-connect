/**
 * Unit tests for validateDealForSettlement
 */

import { validateDealForSettlement } from '@/services/settlement';
import type { EventDeal } from '@/types/deal';

describe('validateDealForSettlement', () => {
  const mockUserId = 'user-123';

  const createMockDeal = (overrides: Partial<EventDeal> = {}): EventDeal => ({
    id: 'deal-1',
    event_id: 'event-1',
    title: 'Test Deal',
    total_amount: 1000,
    status: 'fully_approved',
    total_revenue: 5000,
    deal_participants: [
      {
        id: 'p1',
        deal_id: 'deal-1',
        participant_id: 'participant-1',
        participant_name: 'Participant 1',
        participant_type: 'comedian',
        split_type: 'percentage',
        split_percentage: 50,
        flat_fee_amount: 0,
        calculated_amount: 2500,
        approval_status: 'approved',
        created_at: '2025-01-01',
        updated_at: '2025-01-01'
      }
    ],
    events: {
      id: 'event-1',
      title: 'Test Event',
      promoter_id: mockUserId
    },
    created_by: mockUserId,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    ...overrides
  });

  it('should return valid for fully approved deal with all approvals', () => {
    const deal = createMockDeal();
    const result = validateDealForSettlement(deal, mockUserId);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should return error for non-fully_approved status', () => {
    const deal = createMockDeal({ status: 'pending_approval' });
    const result = validateDealForSettlement(deal, mockUserId);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Deal must be fully approved');
  });

  it('should return error when not all participants approved', () => {
    const deal = createMockDeal({
      deal_participants: [
        {
          id: 'p1',
          deal_id: 'deal-1',
          participant_id: 'participant-1',
          participant_name: 'Participant 1',
          participant_type: 'comedian',
          split_type: 'percentage',
          split_percentage: 50,
          flat_fee_amount: 0,
          calculated_amount: 2500,
          approval_status: 'pending',
          created_at: '2025-01-01',
          updated_at: '2025-01-01'
        }
      ]
    });
    const result = validateDealForSettlement(deal, mockUserId);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('All participants must approve');
  });

  it('should return error for zero revenue', () => {
    const deal = createMockDeal({ total_revenue: 0 });
    const result = validateDealForSettlement(deal, mockUserId);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Total revenue must be set');
  });

  it('should return error for negative revenue', () => {
    const deal = createMockDeal({ total_revenue: -100 });
    const result = validateDealForSettlement(deal, mockUserId);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Total revenue must be set');
  });

  it('should return error when user is not event owner', () => {
    const deal = createMockDeal({
      events: {
        id: 'event-1',
        title: 'Test Event',
        promoter_id: 'different-user-456'
      }
    });
    const result = validateDealForSettlement(deal, mockUserId);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Only event owner can settle deals');
  });

  it('should return multiple errors when multiple conditions fail', () => {
    const deal = createMockDeal({
      status: 'draft',
      total_revenue: 0,
      deal_participants: [
        {
          id: 'p1',
          deal_id: 'deal-1',
          participant_id: 'participant-1',
          participant_name: 'Participant 1',
          participant_type: 'comedian',
          split_type: 'percentage',
          split_percentage: 50,
          flat_fee_amount: 0,
          calculated_amount: 2500,
          approval_status: 'pending',
          created_at: '2025-01-01',
          updated_at: '2025-01-01'
        }
      ],
      events: {
        id: 'event-1',
        title: 'Test Event',
        promoter_id: 'different-user-456'
      }
    });
    const result = validateDealForSettlement(deal, mockUserId);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(4);
    expect(result.errors).toContain('Deal must be fully approved');
    expect(result.errors).toContain('All participants must approve');
    expect(result.errors).toContain('Total revenue must be set');
    expect(result.errors).toContain('Only event owner can settle deals');
  });
});
