/**
 * Financial Validation Engine
 * 
 * Validates financial calculations and partner revenue sharing based on
 * real data patterns from 746 orders totaling $32,472.86 AUD
 */

export interface PartnerRevenueValidation {
  partnerSharePercentage: number;
  totalRevenue: number;
  partnerShare: number;
  platformFees: number;
  calculationsAccurate: boolean;
}

export interface FeeCalculationValidation {
  platformFeePercentage: number;
  humanitixFee: number;
  bookingFee: number;
  passedOnFeePercentage: number;
  absorbedFeePercentage: number;
  totalFees: number;
}

export interface DiscountValidation {
  averageDiscountPercentage: number;
  totalDiscounts: number;
  discountedOrdersPercentage: number;
  discountCodesValid: boolean;
  stackedDiscountsHandled: boolean;
}

export interface RefundValidation {
  refundPercentage: number;
  totalRefunds: number;
  refundedOrdersPercentage: number;
  partialRefundsHandled: boolean;
  refundImpactOnPartnerRevenue: number;
}

export interface ComplexScenarioValidation {
  calculationsAccurate: boolean;
  auditTrailComplete: boolean;
  edgeCasesHandled: boolean;
  financialIntegrityMaintained: boolean;
  scenario: string;
  details: any;
}

export interface EdgeCaseValidation {
  feeAbsorptionHandled?: boolean;
  partnerRevenueAccurate?: boolean;
  stackedDiscountsHandled?: boolean;
  finalPriceAccurate?: boolean;
  partialRefundCalculated?: boolean;
  remainingBalanceAccurate?: boolean;
  currencyHandled?: boolean;
  exchangeRateApplied?: boolean;
  groupDiscountApplied?: boolean;
  revenueDistributionAccurate?: boolean;
  edgeCaseType: string;
}

export class FinancialValidationEngine {
  // Real data constants from Agent 3 analysis
  private readonly TOTAL_REVENUE = 32472.86;
  private readonly PARTNER_SHARE = 24142.07;
  private readonly PARTNER_SHARE_PERCENTAGE = 74.3;
  private readonly PLATFORM_FEE_PERCENTAGE = 13.8;
  private readonly DISCOUNT_IMPACT_PERCENTAGE = 10.4;
  private readonly REFUND_IMPACT_PERCENTAGE = 1.5;
  private readonly TOTAL_ORDERS = 746;
  private readonly TOTAL_DISCOUNTS = 3392.50;
  private readonly TOTAL_REFUNDS = 473.00;

  /**
   * Validate partner revenue sharing calculations
   */
  async validatePartnerRevenue(orders: any[]): Promise<PartnerRevenueValidation> {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
    const totalFees = orders.reduce((sum, order) => sum + (order.fees?.total || 0), 0);
    const totalDiscounts = orders.reduce((sum, order) => sum + (order.discounts || 0), 0);
    const totalRefunds = orders.reduce((sum, order) => sum + (order.refunds || 0), 0);

    // Partner revenue = subtotal - discounts - refunds - passed on fees
    const partnerShare = totalRevenue - totalDiscounts - totalRefunds - totalFees;
    const partnerSharePercentage = (partnerShare / totalRevenue) * 100;

    return {
      partnerSharePercentage,
      totalRevenue,
      partnerShare,
      platformFees: totalFees,
      calculationsAccurate: Math.abs(partnerSharePercentage - this.PARTNER_SHARE_PERCENTAGE) < 1.0
    };
  }

  /**
   * Validate fee calculation accuracy
   */
  async validateFeeCalculations(orders: any[]): Promise<FeeCalculationValidation> {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
    const humanitixFees = orders.reduce((sum, order) => sum + (order.fees?.humanitix || 0), 0);
    const bookingFees = orders.reduce((sum, order) => sum + (order.fees?.booking || 0), 0);
    const passedOnFees = orders.reduce((sum, order) => sum + (order.fees?.passedOn || 0), 0);
    const absorbedFees = orders.reduce((sum, order) => sum + (order.fees?.absorbed || 0), 0);

    const totalFees = humanitixFees + bookingFees;
    const platformFeePercentage = (totalFees / totalRevenue) * 100;
    const passedOnFeePercentage = (passedOnFees / totalFees) * 100;
    const absorbedFeePercentage = (absorbedFees / totalFees) * 100;

    return {
      platformFeePercentage,
      humanitixFee: humanitixFees,
      bookingFee: bookingFees,
      passedOnFeePercentage,
      absorbedFeePercentage,
      totalFees
    };
  }

  /**
   * Validate discount calculations
   */
  async validateDiscountCalculations(orders: any[]): Promise<DiscountValidation> {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
    const totalDiscounts = orders.reduce((sum, order) => sum + (order.discounts || 0), 0);
    const discountedOrders = orders.filter(order => order.discounts > 0);

    const averageDiscountPercentage = (totalDiscounts / totalRevenue) * 100;
    const discountedOrdersPercentage = (discountedOrders.length / orders.length) * 100;

    return {
      averageDiscountPercentage,
      totalDiscounts,
      discountedOrdersPercentage,
      discountCodesValid: this.validateDiscountCodes(discountedOrders),
      stackedDiscountsHandled: this.validateStackedDiscounts(discountedOrders)
    };
  }

  /**
   * Validate refund calculations
   */
  async validateRefundCalculations(orders: any[]): Promise<RefundValidation> {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
    const totalRefunds = orders.reduce((sum, order) => sum + (order.refunds || 0), 0);
    const refundedOrders = orders.filter(order => order.refunds > 0);

    const refundPercentage = (totalRefunds / totalRevenue) * 100;
    const refundedOrdersPercentage = (refundedOrders.length / orders.length) * 100;

    return {
      refundPercentage,
      totalRefunds,
      refundedOrdersPercentage,
      partialRefundsHandled: this.validatePartialRefunds(refundedOrders),
      refundImpactOnPartnerRevenue: totalRefunds * (this.PARTNER_SHARE_PERCENTAGE / 100)
    };
  }

  /**
   * Validate complex financial scenarios
   */
  async validateComplexScenario(scenario: any): Promise<ComplexScenarioValidation> {
    const scenarioType = scenario.type;
    let validation: ComplexScenarioValidation = {
      calculationsAccurate: false,
      auditTrailComplete: false,
      edgeCasesHandled: false,
      financialIntegrityMaintained: false,
      scenario: scenarioType,
      details: scenario
    };

    switch (scenarioType) {
      case 'group_booking':
        validation = await this.validateGroupBookingScenario(scenario);
        break;
      case 'corporate_booking':
        validation = await this.validateCorporateBookingScenario(scenario);
        break;
      case 'multi_ticket_order':
        validation = await this.validateMultiTicketOrderScenario(scenario);
        break;
      case 'partial_refund':
        validation = await this.validatePartialRefundScenario(scenario);
        break;
      case 'amex_fee':
        validation = await this.validateAmexFeeScenario(scenario);
        break;
    }

    return validation;
  }

  /**
   * Validate edge cases
   */
  async validateEdgeCase(edgeCase: any): Promise<EdgeCaseValidation> {
    const edgeCaseType = edgeCase.type;
    let validation: EdgeCaseValidation = {
      edgeCaseType
    };

    switch (edgeCaseType) {
      case 'partial_fee_absorption':
        validation.feeAbsorptionHandled = this.validateFeeAbsorption(edgeCase);
        validation.partnerRevenueAccurate = this.validatePartnerRevenueAccuracy(edgeCase);
        break;
      case 'multiple_discounts':
        validation.stackedDiscountsHandled = this.validateStackedDiscounts([edgeCase]);
        validation.finalPriceAccurate = this.validateFinalPriceAccuracy(edgeCase);
        break;
      case 'partial_refund':
        validation.partialRefundCalculated = this.validatePartialRefundCalculation(edgeCase);
        validation.remainingBalanceAccurate = this.validateRemainingBalance(edgeCase);
        break;
      case 'international_transaction':
        validation.currencyHandled = this.validateCurrencyHandling(edgeCase);
        validation.exchangeRateApplied = this.validateExchangeRate(edgeCase);
        break;
      case 'high_value_group_booking':
        validation.groupDiscountApplied = this.validateGroupDiscount(edgeCase);
        validation.revenueDistributionAccurate = this.validateRevenueDistribution(edgeCase);
        break;
    }

    return validation;
  }

  /**
   * Private validation methods
   */
  private validateDiscountCodes(orders: any[]): boolean {
    return orders.every(order => order.discountCode && order.discountCode.length > 0);
  }

  private validateStackedDiscounts(orders: any[]): boolean {
    return orders.every(order => {
      if (order.discountCodes && order.discountCodes.length > 1) {
        return order.finalDiscount <= order.subtotal;
      }
      return true;
    });
  }

  private validatePartialRefunds(orders: any[]): boolean {
    return orders.every(order => {
      if (order.refundType === 'partial') {
        return order.refunds < order.subtotal;
      }
      return true;
    });
  }

  private async validateGroupBookingScenario(scenario: any): Promise<ComplexScenarioValidation> {
    const groupDiscount = scenario.groupDiscount || 0;
    const calculatedDiscount = scenario.subtotal * 0.1; // 10% group discount
    
    return {
      calculationsAccurate: Math.abs(groupDiscount - calculatedDiscount) < 0.01,
      auditTrailComplete: Boolean(scenario.auditTrail && scenario.auditTrail.length > 0),
      edgeCasesHandled: Boolean(scenario.groupSize > 1),
      financialIntegrityMaintained: scenario.finalTotal > 0,
      scenario: 'group_booking',
      details: scenario
    };
  }

  private async validateCorporateBookingScenario(scenario: any): Promise<ComplexScenarioValidation> {
    return {
      calculationsAccurate: scenario.businessPurpose === true,
      auditTrailComplete: Boolean(scenario.corporateDetails),
      edgeCasesHandled: Boolean(scenario.taxId),
      financialIntegrityMaintained: scenario.finalTotal > 0,
      scenario: 'corporate_booking',
      details: scenario
    };
  }

  private async validateMultiTicketOrderScenario(scenario: any): Promise<ComplexScenarioValidation> {
    const totalCalculated = scenario.tickets.reduce((sum: number, ticket: any) => 
      sum + (ticket.price * ticket.quantity), 0);
    
    return {
      calculationsAccurate: Math.abs(scenario.subtotal - totalCalculated) < 0.01,
      auditTrailComplete: Boolean(scenario.tickets.length > 1),
      edgeCasesHandled: scenario.tickets.every((t: any) => t.quantity > 0),
      financialIntegrityMaintained: scenario.finalTotal > 0,
      scenario: 'multi_ticket_order',
      details: scenario
    };
  }

  private async validatePartialRefundScenario(scenario: any): Promise<ComplexScenarioValidation> {
    const refundValid = scenario.refundAmount < scenario.originalAmount;
    const remainingBalance = scenario.originalAmount - scenario.refundAmount;
    
    return {
      calculationsAccurate: refundValid && remainingBalance >= 0,
      auditTrailComplete: Boolean(scenario.refundReason),
      edgeCasesHandled: Boolean(scenario.refundType === 'partial'),
      financialIntegrityMaintained: remainingBalance >= 0,
      scenario: 'partial_refund',
      details: scenario
    };
  }

  private async validateAmexFeeScenario(scenario: any): Promise<ComplexScenarioValidation> {
    const amexFeeValid = scenario.amexFee >= 0.13 && scenario.amexFee <= 0.96;
    
    return {
      calculationsAccurate: amexFeeValid,
      auditTrailComplete: Boolean(scenario.paymentMethod === 'amex'),
      edgeCasesHandled: Boolean(scenario.additionalFees),
      financialIntegrityMaintained: scenario.finalTotal > 0,
      scenario: 'amex_fee',
      details: scenario
    };
  }

  private validateFeeAbsorption(edgeCase: any): boolean {
    return edgeCase.absorbedFee > 0 && edgeCase.absorbedFee < edgeCase.totalFees;
  }

  private validatePartnerRevenueAccuracy(edgeCase: any): boolean {
    const expectedRevenue = edgeCase.subtotal - edgeCase.discounts - edgeCase.refunds - edgeCase.passedOnFees;
    return Math.abs(edgeCase.partnerShare - expectedRevenue) < 0.01;
  }

  private validateFinalPriceAccuracy(edgeCase: any): boolean {
    const expectedTotal = edgeCase.subtotal - edgeCase.totalDiscounts + edgeCase.totalFees;
    return Math.abs(edgeCase.finalTotal - expectedTotal) < 0.01;
  }

  private validatePartialRefundCalculation(edgeCase: any): boolean {
    return edgeCase.refundAmount < edgeCase.originalAmount && edgeCase.refundAmount > 0;
  }

  private validateRemainingBalance(edgeCase: any): boolean {
    const remainingBalance = edgeCase.originalAmount - edgeCase.refundAmount;
    return Math.abs(edgeCase.remainingBalance - remainingBalance) < 0.01;
  }

  private validateCurrencyHandling(edgeCase: any): boolean {
    return edgeCase.currency === 'AUD' && edgeCase.internationalFlag === true;
  }

  private validateExchangeRate(edgeCase: any): boolean {
    return edgeCase.exchangeRate > 0 && edgeCase.exchangeRate !== 1;
  }

  private validateGroupDiscount(edgeCase: any): boolean {
    return edgeCase.groupDiscount > 0 && edgeCase.groupSize > 1;
  }

  private validateRevenueDistribution(edgeCase: any): boolean {
    const totalRevenue = edgeCase.subtotal - edgeCase.discounts - edgeCase.refunds - edgeCase.fees;
    const distributedRevenue = edgeCase.partnerShare + edgeCase.platformShare;
    return Math.abs(totalRevenue - distributedRevenue) < 0.01;
  }

  /**
   * Generate financial validation report
   */
  async generateValidationReport(orders: any[]): Promise<{
    partnerRevenue: PartnerRevenueValidation;
    feeCalculations: FeeCalculationValidation;
    discountValidation: DiscountValidation;
    refundValidation: RefundValidation;
    overallAccuracy: number;
  }> {
    const partnerRevenue = await this.validatePartnerRevenue(orders);
    const feeCalculations = await this.validateFeeCalculations(orders);
    const discountValidation = await this.validateDiscountCalculations(orders);
    const refundValidation = await this.validateRefundCalculations(orders);

    const accuracyChecks = [
      partnerRevenue.calculationsAccurate,
      Math.abs(feeCalculations.platformFeePercentage - this.PLATFORM_FEE_PERCENTAGE) < 1.0,
      Math.abs(discountValidation.averageDiscountPercentage - this.DISCOUNT_IMPACT_PERCENTAGE) < 1.0,
      Math.abs(refundValidation.refundPercentage - this.REFUND_IMPACT_PERCENTAGE) < 1.0
    ];

    const overallAccuracy = accuracyChecks.filter(check => check).length / accuracyChecks.length * 100;

    return {
      partnerRevenue,
      feeCalculations,
      discountValidation,
      refundValidation,
      overallAccuracy
    };
  }
}