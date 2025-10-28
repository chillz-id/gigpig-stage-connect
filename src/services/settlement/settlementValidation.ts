/**
 * Pure validation functions for settlement workflow
 * No side effects - just validation logic
 */

import type { EventDeal } from '@/types/deal';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates if a deal is ready for settlement
 *
 * @param deal - The event deal to validate
 * @param userId - The user attempting to settle
 * @returns Validation result with errors if any
 */
export function validateDealForSettlement(
  deal: EventDeal,
  userId: string
): ValidationResult {
  const errors: string[] = [];

  // Check deal status
  if (deal.status !== 'fully_approved') {
    errors.push('Deal must be fully approved');
  }

  // Check participant approvals
  const participants = deal.deal_participants || [];
  if (!participants.every((p: any) => p.approval_status === 'approved')) {
    errors.push('All participants must approve');
  }

  // Check revenue is set
  if (!deal.total_revenue || deal.total_revenue <= 0) {
    errors.push('Total revenue must be set');
  }

  // Check user is event owner
  const event = deal.events as any;
  if (event?.promoter_id !== userId) {
    errors.push('Only event owner can settle deals');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
