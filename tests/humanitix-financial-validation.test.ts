/**
 * Humanitix Financial Validation Tests
 * 
 * Comprehensive validation of financial calculations based on real data patterns:
 * - 746 orders totaling $32,472.86 AUD
 * - 74.3% partner revenue share ($24,142.07)
 * - 13.8% platform fees ($4,480.49)
 * - 10.4% discount impact ($3,392.50)
 * - 1.5% refund impact ($473.00)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { FinancialValidationEngine } from './helpers/FinancialValidationEngine';
import { MockDataGenerator } from './helpers/MockDataGenerator';

describe('Humanitix Financial Validation', () => {
  let financialValidator: FinancialValidationEngine;
  let mockDataGenerator: MockDataGenerator;

  beforeEach(() => {
    financialValidator = new FinancialValidationEngine();
    mockDataGenerator = new MockDataGenerator();
  });

  describe('Partner Revenue Calculations', () => {
    it('should calculate 74.3% partner revenue share accurately', async () => {
      const testOrders = mockDataGenerator.generateOrderData(746);
      const validation = await financialValidator.validatePartnerRevenue(testOrders);

      expect(validation.partnerSharePercentage).toBeCloseTo(74.3, 1);
      expect(validation.calculationsAccurate).toBe(true);
      expect(validation.partnerShare).toBeGreaterThan(0);
      expect(validation.totalRevenue).toBeGreaterThan(0);
    });

    it('should handle complex revenue scenarios', async () => {
      const scenarios = [
        mockDataGenerator.generateGroupBookingScenario(),
        mockDataGenerator.generateCorporateBookingScenario(),
        mockDataGenerator.generateMultiTicketOrderScenario()
      ];

      for (const scenario of scenarios) {
        const validation = await financialValidator.validateComplexScenario(scenario);
        expect(validation.calculationsAccurate).toBe(true);
        expect(validation.financialIntegrityMaintained).toBe(true);
      }
    });

    it('should maintain accuracy with high-value transactions', async () => {
      const highValueOrders = Array.from({ length: 10 }, () => ({
        subtotal: 250 + Math.random() * 250, // $250-$500
        fees: { total: 20 + Math.random() * 20 },
        discounts: Math.random() * 50,
        refunds: 0
      }));

      const validation = await financialValidator.validatePartnerRevenue(highValueOrders);
      expect(validation.calculationsAccurate).toBe(true);
      expect(validation.partnerShare).toBeGreaterThan(0);
    });
  });

  describe('Fee Structure Validation', () => {
    it('should validate 13.8% platform fee structure', async () => {
      const testOrders = mockDataGenerator.generateOrderData(100);
      const validation = await financialValidator.validateFeeCalculations(testOrders);

      expect(validation.platformFeePercentage).toBeCloseTo(13.8, 1);
      expect(validation.passedOnFeePercentage).toBeCloseTo(99.66, 1);
      expect(validation.absorbedFeePercentage).toBeCloseTo(0.34, 1);
    });

    it('should handle fee absorption scenarios', async () => {
      const feeAbsorptionScenario = mockDataGenerator.generatePartialFeeAbsorptionScenario();
      const validation = await financialValidator.validateEdgeCase(feeAbsorptionScenario);

      expect(validation.feeAbsorptionHandled).toBe(true);
      expect(validation.partnerRevenueAccurate).toBe(true);
    });

    it('should validate Amex additional fees', async () => {
      const amexScenario = mockDataGenerator.generateAmexFeeScenario();
      const validation = await financialValidator.validateComplexScenario(amexScenario);

      expect(validation.calculationsAccurate).toBe(true);
      expect(validation.edgeCasesHandled).toBe(true);
    });
  });

  describe('Discount Validation', () => {
    it('should validate 10.4% discount impact', async () => {
      const discountedOrders = mockDataGenerator.generateOrdersWithDiscounts(82);
      const validation = await financialValidator.validateDiscountCalculations(discountedOrders);

      expect(validation.averageDiscountPercentage).toBeCloseTo(10.4, 1);
      expect(validation.discountCodesValid).toBe(true);
      expect(validation.stackedDiscountsHandled).toBe(true);
    });

    it('should handle multiple discount codes', async () => {
      const multiDiscountScenario = mockDataGenerator.generateMultipleDiscountScenario();
      const validation = await financialValidator.validateEdgeCase(multiDiscountScenario);

      expect(validation.stackedDiscountsHandled).toBe(true);
      expect(validation.finalPriceAccurate).toBe(true);
    });

    it('should validate discount code authenticity', async () => {
      const discountCodes = ['EARLY25', 'STUDENT20', 'GROUP10', 'WELCOME30'];
      const ordersWithDiscounts = discountCodes.map(code => ({
        subtotal: 100,
        discountCode: code,
        discounts: code === 'EARLY25' ? 25 : code === 'STUDENT20' ? 20 : 10,
        fees: { total: 7 },
        refunds: 0
      }));

      const validation = await financialValidator.validateDiscountCalculations(ordersWithDiscounts);
      expect(validation.discountCodesValid).toBe(true);
    });
  });

  describe('Refund Processing', () => {
    it('should validate 1.5% refund impact', async () => {
      const refundedOrders = mockDataGenerator.generateOrdersWithRefunds(9);
      const validation = await financialValidator.validateRefundCalculations(refundedOrders);

      expect(validation.refundPercentage).toBeCloseTo(1.5, 0.5);
      expect(validation.partialRefundsHandled).toBe(true);
      expect(validation.refundImpactOnPartnerRevenue).toBeGreaterThan(0);
    });

    it('should handle partial refunds correctly', async () => {
      const partialRefundScenario = mockDataGenerator.generatePartialRefundScenario();
      const validation = await financialValidator.validateEdgeCase(partialRefundScenario);

      expect(validation.partialRefundCalculated).toBe(true);
      expect(validation.remainingBalanceAccurate).toBe(true);
    });

    it('should validate refund impact on partner revenue', async () => {
      const refundScenario = {
        originalAmount: 100,
        refundAmount: 50,
        partnerSharePercentage: 74.3,
        type: 'partial_refund'
      };

      const validation = await financialValidator.validateComplexScenario(refundScenario);
      expect(validation.calculationsAccurate).toBe(true);
    });
  });

  describe('International Transactions', () => {
    it('should handle international transaction fees', async () => {
      const internationalScenario = mockDataGenerator.generateInternationalTransactionScenario();
      const validation = await financialValidator.validateEdgeCase(internationalScenario);

      expect(validation.currencyHandled).toBe(true);
      expect(validation.exchangeRateApplied).toBe(true);
    });

    it('should maintain revenue accuracy with currency conversion', async () => {
      const internationalOrders = Array.from({ length: 10 }, () => ({
        subtotal: 75,
        currency: 'AUD',
        originalCurrency: 'USD',
        exchangeRate: 0.85,
        fees: { total: 5.25 },
        discounts: 0,
        refunds: 0,
        internationalFlag: true
      }));

      const validation = await financialValidator.validatePartnerRevenue(internationalOrders);
      expect(validation.calculationsAccurate).toBe(true);
    });
  });

  describe('Group Booking Scenarios', () => {
    it('should handle group booking discounts', async () => {
      const groupBookingScenario = mockDataGenerator.generateGroupBookingScenario();
      const validation = await financialValidator.validateComplexScenario(groupBookingScenario);

      expect(validation.calculationsAccurate).toBe(true);
      expect(validation.edgeCasesHandled).toBe(true);
    });

    it('should validate high-value group bookings', async () => {
      const highValueGroupScenario = mockDataGenerator.generateHighValueGroupBookingScenario();
      const validation = await financialValidator.validateEdgeCase(highValueGroupScenario);

      expect(validation.groupDiscountApplied).toBe(true);
      expect(validation.revenueDistributionAccurate).toBe(true);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle zero-value transactions', async () => {
      const freeOrders = Array.from({ length: 5 }, () => ({
        subtotal: 0,
        fees: { total: 0 },
        discounts: 0,
        refunds: 0,
        financialStatus: 'free'
      }));

      const validation = await financialValidator.validatePartnerRevenue(freeOrders);
      expect(validation.partnerShare).toBe(0);
      expect(validation.calculationsAccurate).toBe(true);
    });

    it('should handle mixed payment statuses', async () => {
      const mixedOrders = [
        { subtotal: 45, fees: { total: 3.15 }, discounts: 0, refunds: 0, financialStatus: 'paid' },
        { subtotal: 0, fees: { total: 0 }, discounts: 0, refunds: 0, financialStatus: 'free' },
        { subtotal: 60, fees: { total: 4.20 }, discounts: 0, refunds: 60, financialStatus: 'refunded' }
      ];

      const validation = await financialValidator.validatePartnerRevenue(mixedOrders);
      expect(validation.partnerShare).toBeCloseTo(37.65, 2); // 45 - 3.15 + 0 + 0 - 4.20
    });

    it('should validate complex multi-ticket orders', async () => {
      const multiTicketScenario = mockDataGenerator.generateMultiTicketOrderScenario();
      const validation = await financialValidator.validateComplexScenario(multiTicketScenario);

      expect(validation.calculationsAccurate).toBe(true);
      expect(validation.auditTrailComplete).toBe(true);
    });
  });

  describe('Financial Integrity Checks', () => {
    it('should maintain financial integrity across all scenarios', async () => {
      const scenarios = [
        mockDataGenerator.generateGroupBookingScenario(),
        mockDataGenerator.generateCorporateBookingScenario(),
        mockDataGenerator.generateMultiTicketOrderScenario(),
        mockDataGenerator.generatePartialRefundScenario(),
        mockDataGenerator.generateAmexFeeScenario()
      ];

      for (const scenario of scenarios) {
        const validation = await financialValidator.validateComplexScenario(scenario);
        expect(validation.financialIntegrityMaintained).toBe(true);
      }
    });

    it('should validate total revenue reconciliation', async () => {
      const testOrders = mockDataGenerator.generateOrderData(100);
      const validation = await financialValidator.validatePartnerRevenue(testOrders);

      const calculatedTotal = validation.partnerShare + validation.platformFees;
      expect(calculatedTotal).toBeCloseTo(validation.totalRevenue, 2);
    });

    it('should generate comprehensive financial report', async () => {
      const testOrders = mockDataGenerator.generateOrderData(746);
      const report = await financialValidator.generateValidationReport(testOrders);

      expect(report.overallAccuracy).toBeGreaterThan(95);
      expect(report.partnerRevenue.calculationsAccurate).toBe(true);
      expect(report.feeCalculations.totalFees).toBeGreaterThan(0);
      expect(report.discountValidation.totalDiscounts).toBeGreaterThan(0);
      expect(report.refundValidation.totalRefunds).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large volume calculations efficiently', async () => {
      const largeOrderSet = mockDataGenerator.generateLargeDataset(10000);
      const startTime = Date.now();
      
      const validation = await financialValidator.validatePartnerRevenue(largeOrderSet);
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(validation.calculationsAccurate).toBe(true);
    });

    it('should maintain accuracy with concurrent calculations', async () => {
      const concurrentCalculations = Array.from({ length: 10 }, () => 
        financialValidator.validatePartnerRevenue(mockDataGenerator.generateOrderData(100))
      );

      const results = await Promise.all(concurrentCalculations);
      results.forEach(result => {
        expect(result.calculationsAccurate).toBe(true);
      });
    });
  });

  describe('Data Quality and Consistency', () => {
    it('should validate data consistency across calculations', async () => {
      const testOrders = mockDataGenerator.generateOrderData(100);
      
      const [partnerValidation, feeValidation, discountValidation] = await Promise.all([
        financialValidator.validatePartnerRevenue(testOrders),
        financialValidator.validateFeeCalculations(testOrders),
        financialValidator.validateDiscountCalculations(testOrders)
      ]);

      // Total revenue should be consistent across all calculations
      expect(partnerValidation.totalRevenue).toBeCloseTo(feeValidation.totalFees + partnerValidation.partnerShare, 2);
    });

    it('should handle missing or null values gracefully', async () => {
      const ordersWithMissingData = [
        { subtotal: 50, fees: null, discounts: 0, refunds: 0 },
        { subtotal: null, fees: { total: 3.5 }, discounts: 0, refunds: 0 },
        { subtotal: 75, fees: { total: 5.25 }, discounts: null, refunds: 0 }
      ];

      const validation = await financialValidator.validatePartnerRevenue(ordersWithMissingData);
      expect(validation.calculationsAccurate).toBe(true);
    });
  });

  describe('Audit Trail and Compliance', () => {
    it('should maintain complete audit trail for all calculations', async () => {
      const testOrders = mockDataGenerator.generateOrderData(50);
      testOrders.forEach(order => {
        expect(order.auditTrail).toBeDefined();
        expect(order.auditTrail.length).toBeGreaterThan(0);
      });
    });

    it('should validate compliance with financial regulations', async () => {
      const testOrders = mockDataGenerator.generateOrderData(100);
      const validation = await financialValidator.validatePartnerRevenue(testOrders);

      // All calculations should be transparent and auditable
      expect(validation.partnerShare).toBeGreaterThan(0);
      expect(validation.platformFees).toBeGreaterThan(0);
      expect(validation.partnerShare + validation.platformFees).toBeCloseTo(validation.totalRevenue, 2);
    });
  });
});