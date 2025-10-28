/**
 * Settlement service exports
 * Pure functions for validation and calculations
 */

export {
  validateDealForSettlement,
  type ValidationResult
} from './settlementValidation';

export {
  calculateInvoiceDirection,
  calculateSplitAmount,
  generateSplitDescription,
  type InvoiceDirection,
  type DealParticipant
} from './settlementCalculations';
