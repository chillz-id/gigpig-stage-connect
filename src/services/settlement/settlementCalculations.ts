/**
 * Pure calculation functions for settlement workflow
 * No side effects - just mathematical calculations
 */

export interface InvoiceDirection {
  shouldGenerate: boolean;
  direction?: 'participant_to_promoter' | 'promoter_to_participant';
  absoluteAmount?: number;
}

export interface DealParticipant {
  split_type: 'percentage' | 'flat_fee' | 'minimum_plus_percentage';
  split_percentage: number;
  flat_fee_amount: number;
  calculated_amount?: number;
}

/**
 * Determines invoice direction based on calculated amount
 *
 * @param amount - The calculated amount (positive = participant owed, negative = participant owes)
 * @returns Invoice direction and whether to generate
 */
export function calculateInvoiceDirection(amount: number): InvoiceDirection {
  if (amount === 0) {
    return { shouldGenerate: false };
  }

  return {
    shouldGenerate: true,
    direction: amount > 0 ? 'participant_to_promoter' : 'promoter_to_participant',
    absoluteAmount: Math.abs(amount)
  };
}

/**
 * Calculates the split amount for a participant based on split type
 *
 * @param participant - The deal participant
 * @param totalRevenue - The total event revenue
 * @returns The calculated split amount
 */
export function calculateSplitAmount(
  participant: DealParticipant,
  totalRevenue: number
): number {
  switch (participant.split_type) {
    case 'percentage':
      return totalRevenue * (participant.split_percentage / 100);

    case 'flat_fee':
      return participant.flat_fee_amount;

    case 'minimum_plus_percentage':
      const percentageAmount = totalRevenue * (participant.split_percentage / 100);
      return Math.max(participant.flat_fee_amount, percentageAmount);

    default:
      return 0;
  }
}

/**
 * Generates human-readable split description
 *
 * @param participant - The deal participant
 * @returns Human-readable description of the split
 */
export function generateSplitDescription(participant: DealParticipant): string {
  switch (participant.split_type) {
    case 'percentage':
      return `${participant.split_percentage}% of total revenue`;

    case 'flat_fee':
      return `Flat fee: $${participant.flat_fee_amount}`;

    case 'minimum_plus_percentage':
      return `Guaranteed $${participant.flat_fee_amount} + ${participant.split_percentage}% of remainder`;

    default:
      return 'Custom split';
  }
}
