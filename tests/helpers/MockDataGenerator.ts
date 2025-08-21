/**
 * Mock Data Generator
 * 
 * Generates realistic test data based on patterns from real Humanitix data:
 * - 22 events, 52 ticket types, 746 orders, 677 customers
 * - $32,472.86 total revenue, $24,142.07 partner share (74.3%)
 * - 10.4% discount impact, 1.5% refund impact
 */

export class MockDataGenerator {
  // Real data patterns from Agent analysis
  private readonly VENUES = [
    { name: 'Kinselas Hotel', address: '383 Darlinghurst Rd, Darlinghurst NSW 2010', capacity: 150 },
    { name: 'iD Comedy Club', address: '383 Bourke St, Darlinghurst NSW 2010', capacity: 110 },
    { name: 'Arcade Comedy Club', address: '11 Oxford St, Darlinghurst NSW 2010', capacity: 80 },
    { name: 'The Comedy Store', address: '478 George St, Sydney NSW 2000', capacity: 200 },
    { name: 'Sydney Comedy Club', address: '106 Pitt St, Sydney NSW 2000', capacity: 120 }
  ];

  private readonly TICKET_TYPES = [
    { name: 'General Admission', priceRange: [25, 45], percentage: 44 },
    { name: 'Early Bird', priceRange: [20, 35], percentage: 18 },
    { name: 'VIP', priceRange: [60, 120], percentage: 6 },
    { name: 'Group Package (4)', priceRange: [80, 160], percentage: 15 },
    { name: 'Student', priceRange: [15, 25], percentage: 8 },
    { name: 'Premium', priceRange: [50, 80], percentage: 9 }
  ];

  private readonly PAYMENT_GATEWAYS = [
    { name: 'braintree', percentage: 85.5 },
    { name: 'manual', percentage: 14.1 },
    { name: 'stripe', percentage: 0.4 }
  ];

  private readonly DISCOUNT_CODES = [
    { code: 'EARLY25', amount: 25, percentage: 0 },
    { code: 'STUDENT20', amount: 20, percentage: 0 },
    { code: 'GROUP10', amount: 0, percentage: 10 },
    { code: 'WELCOME30', amount: 30, percentage: 0 },
    { code: 'SAVE50', amount: 50, percentage: 0 }
  ];

  private readonly CUSTOMER_NAMES = [
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Jessica Davis', 'David Wilson',
    'Emma Thompson', 'James Anderson', 'Lisa Miller', 'Robert Taylor', 'Amanda White',
    'Christopher Martin', 'Michelle Garcia', 'Daniel Rodriguez', 'Jennifer Lewis',
    'Matthew Walker', 'Ashley Hall', 'Anthony Young', 'Stephanie King',
    'Joshua Wright', 'Rachel Green', 'Andrew Hill', 'Nicole Scott',
    'Brandon Adams', 'Megan Baker', 'Justin Campbell'
  ];

  /**
   * Generate realistic order data
   */
  generateOrderData(count: number): any[] {
    const orders = [];
    
    for (let i = 0; i < count; i++) {
      const venue = this.getRandomVenue();
      const ticketType = this.getRandomTicketType();
      const customer = this.generateCustomer();
      const paymentGateway = this.getRandomPaymentGateway();
      
      const subtotal = this.getRandomPrice(ticketType.priceRange[0], ticketType.priceRange[1]);
      const fees = this.generateFees(subtotal);
      const discounts = Math.random() < 0.11 ? this.generateDiscount(subtotal) : 0;
      const refunds = Math.random() < 0.012 ? this.generateRefund(subtotal) : 0;
      
      const order = {
        id: `order_${i + 1}`,
        orderId: this.generateOrderId(),
        eventId: `event_${Math.floor(Math.random() * 22) + 1}`,
        eventName: this.generateEventName(),
        venue,
        ticketType,
        customer,
        subtotal,
        fees,
        discounts,
        refunds,
        total: subtotal + fees.total - discounts - refunds,
        paymentGateway,
        status: 'complete',
        financialStatus: refunds > 0 ? 'refunded' : (subtotal === 0 ? 'free' : 'paid'),
        createdAt: this.generateRandomDate(),
        completedAt: this.generateRandomDate(),
        auditTrail: this.generateAuditTrail()
      };

      orders.push(order);
    }

    return orders;
  }

  /**
   * Generate orders with discount scenarios
   */
  generateOrdersWithDiscounts(count: number): any[] {
    const orders = this.generateOrderData(count);
    
    // Ensure all orders have discounts
    return orders.map(order => ({
      ...order,
      discounts: this.generateDiscount(order.subtotal),
      discountCode: this.getRandomDiscountCode().code,
      total: order.subtotal + order.fees.total - this.generateDiscount(order.subtotal) - order.refunds
    }));
  }

  /**
   * Generate orders with refund scenarios
   */
  generateOrdersWithRefunds(count: number): any[] {
    const orders = this.generateOrderData(count);
    
    // Ensure all orders have refunds
    return orders.map(order => ({
      ...order,
      refunds: this.generateRefund(order.subtotal),
      refundReason: this.getRandomRefundReason(),
      refundType: Math.random() < 0.7 ? 'full' : 'partial',
      financialStatus: 'refunded',
      total: order.subtotal + order.fees.total - order.discounts - this.generateRefund(order.subtotal)
    }));
  }

  /**
   * Generate customer data
   */
  generateCustomerData(count: number): any[] {
    const customers = [];
    
    for (let i = 0; i < count; i++) {
      const customer = {
        id: `customer_${i + 1}`,
        email: `customer${i + 1}@example.com`,
        firstName: this.getRandomName().split(' ')[0],
        lastName: this.getRandomName().split(' ')[1],
        mobile: Math.random() < 0.917 ? this.generateMobileNumber() : null,
        location: 'AU',
        businessPurpose: false,
        organiserMailListOptIn: Math.random() < 0.3,
        totalOrders: Math.floor(Math.random() * 4) + 1,
        totalSpent: Math.random() * 500 + 20,
        isRepeat: Math.random() < 0.075,
        createdAt: this.generateRandomDate(),
        updatedAt: this.generateRandomDate()
      };

      customers.push(customer);
    }

    return customers;
  }

  /**
   * Generate event data
   */
  generateEventData(count: number): any[] {
    const events = [];
    
    for (let i = 0; i < count; i++) {
      const venue = this.getRandomVenue();
      const ticketTypes = this.generateTicketTypesForEvent();
      
      const event = {
        id: `event_${i + 1}`,
        name: this.generateEventName(),
        venue,
        ticketTypes,
        startTime: this.generateRandomDate(),
        endTime: this.generateRandomDate(),
        description: this.generateEventDescription(),
        capacity: venue.capacity,
        ticketsSold: Math.floor(Math.random() * venue.capacity * 0.8),
        revenue: Math.random() * 3000 + 500,
        status: 'active',
        createdAt: this.generateRandomDate(),
        updatedAt: this.generateRandomDate()
      };

      events.push(event);
    }

    return events;
  }

  /**
   * Generate payment data
   */
  generatePaymentData(count: number): any[] {
    const payments = [];
    
    for (let i = 0; i < count; i++) {
      const gateway = this.getRandomPaymentGateway();
      
      const payment = {
        id: `payment_${i + 1}`,
        orderId: `order_${i + 1}`,
        gateway: gateway.name,
        amount: Math.random() * 200 + 20,
        currency: 'AUD',
        status: 'completed',
        transactionId: this.generateTransactionId(),
        processedAt: this.generateRandomDate(),
        fees: this.generatePaymentFees(gateway.name)
      };

      payments.push(payment);
    }

    return payments;
  }

  /**
   * Generate order lifecycle data
   */
  generateOrderLifecycleData(count: number): any[] {
    const orders = [];
    
    for (let i = 0; i < count; i++) {
      const createdAt = this.generateRandomDate();
      const completedAt = new Date(createdAt.getTime() + Math.random() * 3600000); // Within 1 hour
      
      const order = {
        id: `order_${i + 1}`,
        status: 'complete',
        createdAt,
        updatedAt: completedAt,
        completedAt,
        incompleteAt: null,
        processingTime: completedAt.getTime() - createdAt.getTime(),
        lifecycle: {
          created: createdAt,
          processing: new Date(createdAt.getTime() + 1000),
          completed: completedAt
        }
      };

      orders.push(order);
    }

    return orders;
  }

  /**
   * Generate group booking scenario
   */
  generateGroupBookingScenario(): any {
    const groupSize = Math.floor(Math.random() * 6) + 4; // 4-10 people
    const basePrice = 45;
    const subtotal = basePrice * groupSize;
    const groupDiscount = subtotal * 0.1; // 10% group discount
    
    return {
      type: 'group_booking',
      groupSize,
      basePrice,
      subtotal,
      groupDiscount,
      finalTotal: subtotal - groupDiscount + this.generateFees(subtotal).total,
      auditTrail: ['Group booking created', 'Discount applied', 'Payment processed'],
      bookedBy: this.generateCustomer(),
      attendees: Array.from({ length: groupSize }, () => this.generateCustomer())
    };
  }

  /**
   * Generate corporate booking scenario
   */
  generateCorporateBookingScenario(): any {
    const ticketCount = Math.floor(Math.random() * 20) + 5; // 5-25 tickets
    const basePrice = 60;
    const subtotal = basePrice * ticketCount;
    
    return {
      type: 'corporate_booking',
      ticketCount,
      basePrice,
      subtotal,
      businessPurpose: true,
      corporateDetails: {
        companyName: 'Corporate Client Ltd',
        abn: '12345678901',
        contactPerson: 'John Manager',
        billingAddress: '123 Business St, Sydney NSW 2000'
      },
      taxId: 'TAX123456',
      finalTotal: subtotal + this.generateFees(subtotal).total,
      invoiceRequired: true
    };
  }

  /**
   * Generate multi-ticket order scenario
   */
  generateMultiTicketOrderScenario(): any {
    const tickets = [
      { type: 'General Admission', price: 35, quantity: 2 },
      { type: 'VIP', price: 75, quantity: 1 },
      { type: 'Student', price: 20, quantity: 1 }
    ];
    
    const subtotal = tickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0);
    
    return {
      type: 'multi_ticket_order',
      tickets,
      subtotal,
      fees: this.generateFees(subtotal),
      finalTotal: subtotal + this.generateFees(subtotal).total,
      customer: this.generateCustomer()
    };
  }

  /**
   * Generate partial refund scenario
   */
  generatePartialRefundScenario(): any {
    const originalAmount = 120;
    const refundAmount = 60; // 50% refund
    const remainingBalance = originalAmount - refundAmount;
    
    return {
      type: 'partial_refund',
      originalAmount,
      refundAmount,
      remainingBalance,
      refundReason: 'Customer requested partial refund',
      refundType: 'partial',
      processedAt: this.generateRandomDate(),
      refundMethod: 'original_payment'
    };
  }

  /**
   * Generate Amex fee scenario
   */
  generateAmexFeeScenario(): any {
    const subtotal = 89;
    const standardFees = this.generateFees(subtotal);
    const amexFee = 0.45; // Additional Amex fee
    
    return {
      type: 'amex_fee',
      subtotal,
      standardFees,
      amexFee,
      totalFees: standardFees.total + amexFee,
      paymentMethod: 'amex',
      finalTotal: subtotal + standardFees.total + amexFee,
      additionalFees: true
    };
  }

  /**
   * Generate edge case scenarios
   */
  generatePartialFeeAbsorptionScenario(): any {
    const subtotal = 150;
    const standardFees = this.generateFees(subtotal);
    const absorbedFee = 2.80; // Partial absorption
    
    return {
      type: 'partial_fee_absorption',
      subtotal,
      totalFees: standardFees.total,
      absorbedFee,
      passedOnFees: standardFees.total - absorbedFee,
      partnerShare: subtotal - (standardFees.total - absorbedFee),
      finalTotal: subtotal + (standardFees.total - absorbedFee)
    };
  }

  generateMultipleDiscountScenario(): any {
    const subtotal = 100;
    const discountCodes = [
      { code: 'EARLY25', amount: 25 },
      { code: 'STUDENT20', amount: 20 }
    ];
    const totalDiscounts = Math.min(45, subtotal * 0.5); // Max 50% discount
    
    return {
      type: 'multiple_discounts',
      subtotal,
      discountCodes,
      totalDiscounts,
      finalTotal: subtotal - totalDiscounts + this.generateFees(subtotal).total,
      stackingRules: 'Maximum 50% total discount'
    };
  }

  generateInternationalTransactionScenario(): any {
    const subtotal = 75;
    const exchangeRate = 0.85; // USD to AUD
    
    return {
      type: 'international_transaction',
      subtotal,
      originalCurrency: 'USD',
      originalAmount: subtotal * exchangeRate,
      exchangeRate,
      currency: 'AUD',
      internationalFlag: true,
      finalTotal: subtotal + this.generateFees(subtotal).total,
      processingFees: 2.50
    };
  }

  generateHighValueGroupBookingScenario(): any {
    const groupSize = 15;
    const basePrice = 85;
    const subtotal = basePrice * groupSize;
    const groupDiscount = subtotal * 0.15; // 15% group discount
    const partnerShare = (subtotal - groupDiscount) * 0.743;
    const platformShare = (subtotal - groupDiscount) * 0.257;
    
    return {
      type: 'high_value_group_booking',
      groupSize,
      basePrice,
      subtotal,
      groupDiscount,
      partnerShare,
      platformShare,
      revenueDistribution: {
        partner: partnerShare,
        platform: platformShare,
        total: partnerShare + platformShare
      },
      finalTotal: subtotal - groupDiscount + this.generateFees(subtotal).total
    };
  }

  /**
   * Generate large dataset for performance testing
   */
  generateLargeDataset(count: number): any[] {
    const dataset = [];
    
    for (let i = 0; i < count; i++) {
      const order = {
        id: `large_order_${i + 1}`,
        ...this.generateOrderData(1)[0],
        processedAt: this.generateRandomDate(),
        batchId: Math.floor(i / 100) + 1
      };
      
      dataset.push(order);
    }

    return dataset;
  }

  /**
   * Generate concurrent order scenario
   */
  generateConcurrentOrderScenario(count: number): any[] {
    const baseTime = new Date();
    const orders = [];
    
    for (let i = 0; i < count; i++) {
      const order = {
        id: `concurrent_order_${i + 1}`,
        ...this.generateOrderData(1)[0],
        createdAt: new Date(baseTime.getTime() + Math.random() * 1000), // Within 1 second
        concurrentBatch: true,
        batchId: Math.floor(i / 10) + 1
      };
      
      orders.push(order);
    }

    return orders;
  }

  /**
   * Generate complete dataset
   */
  generateCompleteDataSet(): any {
    return {
      events: this.generateEventData(22),
      orders: this.generateOrderData(746),
      customers: this.generateCustomerData(677),
      payments: this.generatePaymentData(746),
      discountedOrders: this.generateOrdersWithDiscounts(82),
      refundedOrders: this.generateOrdersWithRefunds(9)
    };
  }

  /**
   * Helper methods
   */
  private getRandomVenue(): any {
    return this.VENUES[Math.floor(Math.random() * this.VENUES.length)];
  }

  private getRandomTicketType(): any {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const ticketType of this.TICKET_TYPES) {
      cumulative += ticketType.percentage;
      if (random <= cumulative) {
        return ticketType;
      }
    }
    
    return this.TICKET_TYPES[0];
  }

  private getRandomPaymentGateway(): any {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const gateway of this.PAYMENT_GATEWAYS) {
      cumulative += gateway.percentage;
      if (random <= cumulative) {
        return gateway;
      }
    }
    
    return this.PAYMENT_GATEWAYS[0];
  }

  private getRandomDiscountCode(): any {
    return this.DISCOUNT_CODES[Math.floor(Math.random() * this.DISCOUNT_CODES.length)];
  }

  private getRandomName(): string {
    return this.CUSTOMER_NAMES[Math.floor(Math.random() * this.CUSTOMER_NAMES.length)];
  }

  private generateCustomer(): any {
    const name = this.getRandomName();
    const [firstName, lastName] = name.split(' ');
    
    return {
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      mobile: Math.random() < 0.917 ? this.generateMobileNumber() : null,
      location: 'AU',
      businessPurpose: false,
      organiserMailListOptIn: Math.random() < 0.3
    };
  }

  private generateFees(subtotal: number): any {
    const humanitixFee = Math.max(1.70, subtotal * 0.07);
    const bookingFee = Math.max(1.70, subtotal * 0.07);
    const passedOnFee = humanitixFee + bookingFee;
    const absorbedFee = Math.random() < 0.0034 ? Math.random() * 5 : 0;
    
    return {
      humanitix: humanitixFee,
      booking: bookingFee,
      passedOn: passedOnFee,
      absorbed: absorbedFee,
      total: humanitixFee + bookingFee
    };
  }

  private generateDiscount(subtotal: number): number {
    const discountAmounts = [25, 30, 20, 50, 40, 60, 12.50];
    return discountAmounts[Math.floor(Math.random() * discountAmounts.length)];
  }

  private generateRefund(subtotal: number): number {
    const refundAmounts = [60, 40, 80, 20, 33];
    return refundAmounts[Math.floor(Math.random() * refundAmounts.length)];
  }

  private generateRandomDate(): Date {
    const start = new Date(2024, 0, 1);
    const end = new Date(2025, 6, 14);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  private generateOrderId(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private generateTransactionId(): string {
    return `txn_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateMobileNumber(): string {
    return `+614${Math.floor(Math.random() * 90000000) + 10000000}`;
  }

  private generateEventName(): string {
    const prefixes = ['Comedy Night', 'Stand Up', 'Laugh Out Loud', 'Comedy Showcase', 'Mic Drop'];
    const suffixes = ['Live', 'Special', 'Unplugged', 'Uncut', 'Raw'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix} ${suffix}`;
  }

  private generateEventDescription(): string {
    return 'A hilarious night of comedy featuring local and international comedians.';
  }

  private generateTicketTypesForEvent(): any[] {
    const count = Math.floor(Math.random() * 4) + 2; // 2-5 ticket types
    const types = [];
    
    for (let i = 0; i < count; i++) {
      const ticketType = this.getRandomTicketType();
      types.push({
        id: `ticket_${i + 1}`,
        name: ticketType.name,
        price: this.getRandomPrice(ticketType.priceRange[0], ticketType.priceRange[1]),
        capacity: Math.floor(Math.random() * 50) + 20,
        sold: Math.floor(Math.random() * 30) + 10
      });
    }
    
    return types;
  }

  private generateAuditTrail(): any[] {
    return [
      { action: 'order_created', timestamp: this.generateRandomDate() },
      { action: 'payment_processed', timestamp: this.generateRandomDate() },
      { action: 'order_completed', timestamp: this.generateRandomDate() }
    ];
  }

  private generatePaymentFees(gateway: string): any {
    const baseFee = 0.30;
    const percentageFee = 0.029;
    
    return {
      base: baseFee,
      percentage: percentageFee,
      gateway,
      total: baseFee + (Math.random() * 100 * percentageFee)
    };
  }

  private getRandomPrice(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomRefundReason(): string {
    const reasons = [
      'Customer requested refund',
      'Event cancelled',
      'Duplicate booking',
      'Unable to attend',
      'Dissatisfied with service'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }
}