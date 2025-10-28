/**
 * GST Calculation Utility
 *
 * Handles Australian GST (10%) calculations in three modes:
 * - inclusive: GST is extracted from total (total / 1.1)
 * - exclusive: GST is added to amount (amount * 1.1)
 * - none: No GST applied
 */

export type GSTMode = 'inclusive' | 'exclusive' | 'none';

export interface GSTCalculation {
  gross: number;    // Total including GST
  tax: number;      // GST amount
  net: number;      // Amount excluding GST
}

const GST_RATE = 0.1; // 10% Australian GST

/**
 * Calculate GST breakdown for a given amount and mode
 *
 * @param amount - The input amount (interpretation depends on mode)
 * @param gstMode - How to treat GST (inclusive/exclusive/none)
 * @returns Breakdown of gross, tax, and net amounts
 *
 * @example
 * // GST Inclusive: $1000 total includes GST
 * calculateGST(1000, 'inclusive')
 * // Returns: { gross: 1000, tax: 90.91, net: 909.09 }
 *
 * @example
 * // GST Exclusive: $1000 is net, add GST
 * calculateGST(1000, 'exclusive')
 * // Returns: { gross: 1100, tax: 100, net: 1000 }
 *
 * @example
 * // No GST
 * calculateGST(1000, 'none')
 * // Returns: { gross: 1000, tax: 0, net: 1000 }
 */
export function calculateGST(amount: number, gstMode: GSTMode): GSTCalculation {
  switch (gstMode) {
    case 'inclusive': {
      // Extract GST from total
      const net = amount / (1 + GST_RATE);
      const tax = amount - net;
      return {
        gross: amount,
        tax: Math.round(tax * 100) / 100, // Round to 2 decimal places
        net: Math.round(net * 100) / 100,
      };
    }

    case 'exclusive': {
      // Add GST to amount
      const tax = amount * GST_RATE;
      const gross = amount + tax;
      return {
        gross: Math.round(gross * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        net: amount,
      };
    }

    case 'none': {
      // No GST
      return {
        gross: amount,
        tax: 0,
        net: amount,
      };
    }

    default: {
      throw new Error(`Invalid GST mode: ${gstMode}`);
    }
  }
}

/**
 * Get default GST mode based on profile's GST registration status
 *
 * @param gstRegistered - Whether the profile is registered for GST
 * @returns Default GST mode ('inclusive' if registered, 'none' if not)
 */
export function getDefaultGSTMode(gstRegistered: boolean): GSTMode {
  return gstRegistered ? 'inclusive' : 'none';
}
