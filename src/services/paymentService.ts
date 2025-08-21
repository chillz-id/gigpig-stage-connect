import { supabase } from '../integrations/supabase/client';

// Payment gateway types
export type PaymentGateway = 'stripe' | 'paypal' | 'bank_transfer';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'paypal_account' | 'cash';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// Payment interfaces
export interface PaymentGatewayConfig {
  gatewayName: PaymentGateway;
  isEnabled: boolean;
  isDefault: boolean;
  configuration: Record<string, any>;
  credentials: Record<string, any>;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface PaymentRequest {
  invoiceId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentGateway: PaymentGateway;
  metadata?: Record<string, any>;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentRecordId?: string;
  gatewayTransactionId?: string;
  status: PaymentStatus;
  redirectUrl?: string;
  error?: string;
  gatewayResponse?: Record<string, any>;
}

export interface CommissionSplit {
  recipientType: 'platform' | 'agency' | 'comedian' | 'promoter' | 'venue';
  recipientId?: string;
  splitPercentage: number;
  splitAmount: number;
}

/**
 * FlexPay - Multi-gateway payment processing service
 * Handles Stripe, PayPal, and bank transfer payments with commission splitting
 */
export class FlexPayService {
  private static instance: FlexPayService;
  private gatewayConfigs: Map<PaymentGateway, PaymentGatewayConfig> = new Map();

  private constructor() {}

  static getInstance(): FlexPayService {
    if (!FlexPayService.instance) {
      FlexPayService.instance = new FlexPayService();
    }
    return FlexPayService.instance;
  }

  /**
   * Initialize payment gateway configurations for the current user
   */
  async initializeGateways(userId: string): Promise<void> {
    try {
      const { data: configs, error } = await supabase
        .from('payment_gateway_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true);

      if (error) throw error;

      // Clear existing configs
      this.gatewayConfigs.clear();

      // Load enabled gateway configs
      configs?.forEach(config => {
        this.gatewayConfigs.set(config.gateway_name as PaymentGateway, {
          gatewayName: config.gateway_name as PaymentGateway,
          isEnabled: config.is_enabled,
          isDefault: config.is_default,
          configuration: config.configuration,
          credentials: config.credentials,
          webhookUrl: config.webhook_url,
          webhookSecret: config.webhook_secret
        });
      });

      console.log(`Initialized ${configs?.length || 0} payment gateways`);
    } catch (error) {
      console.error('Failed to initialize payment gateways:', error);
      throw error;
    }
  }

  /**
   * Process a payment using the specified gateway
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate request
      if (!request.invoiceId || !request.amount || request.amount <= 0) {
        throw new Error('Invalid payment request');
      }

      // Get gateway config
      const gatewayConfig = this.gatewayConfigs.get(request.paymentGateway);
      if (!gatewayConfig) {
        throw new Error(`Payment gateway ${request.paymentGateway} not configured`);
      }

      // Create payment record
      const paymentRecordId = await this.createPaymentRecord(request);

      // Process payment based on gateway
      let paymentResponse: PaymentResponse;
      switch (request.paymentGateway) {
        case 'stripe':
          paymentResponse = await this.processStripePayment(request, gatewayConfig, paymentRecordId);
          break;
        case 'paypal':
          paymentResponse = await this.processPayPalPayment(request, gatewayConfig, paymentRecordId);
          break;
        case 'bank_transfer':
          paymentResponse = await this.processBankTransferPayment(request, paymentRecordId);
          break;
        default:
          throw new Error(`Unsupported payment gateway: ${request.paymentGateway}`);
      }

      // Update payment record with response
      await this.updatePaymentRecord(paymentRecordId, paymentResponse);

      return paymentResponse;
    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create initial payment record in database
   */
  private async createPaymentRecord(request: PaymentRequest): Promise<string> {
    const { data, error } = await supabase
      .from('payment_records')
      .insert({
        invoice_id: request.invoiceId,
        payment_gateway: request.paymentGateway,
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
        payment_method: request.paymentMethod,
        net_amount: request.amount, // Will be updated after processing fees
        metadata: request.metadata || {}
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Update payment record with gateway response
   */
  private async updatePaymentRecord(paymentRecordId: string, response: PaymentResponse): Promise<void> {
    const updates: any = {
      status: response.status,
      gateway_response: response.gatewayResponse,
      updated_at: new Date().toISOString()
    };

    if (response.gatewayTransactionId) {
      updates.gateway_transaction_id = response.gatewayTransactionId;
    }

    if (response.status === 'completed') {
      updates.payment_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('payment_records')
      .update(updates)
      .eq('id', paymentRecordId);

    if (error) throw error;
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(
    request: PaymentRequest,
    config: PaymentGatewayConfig,
    paymentRecordId: string
  ): Promise<PaymentResponse> {
    try {
      // This is a placeholder for actual Stripe integration
      // In a real implementation, you would use Stripe SDK
      
      const stripeResponse = await this.mockStripePayment(request, config);
      
      // Calculate fees and commission splits
      const processorFee = request.amount * 0.029 + 0.30; // Stripe's standard fee
      const netAmount = request.amount - processorFee;
      
      // Update payment record with fees
      await supabase
        .from('payment_records')
        .update({
          processor_fee: processorFee,
          net_amount: netAmount
        })
        .eq('id', paymentRecordId);

      return {
        success: true,
        paymentRecordId,
        gatewayTransactionId: stripeResponse.transactionId,
        status: 'completed',
        gatewayResponse: stripeResponse
      };
    } catch (error) {
      console.error('Stripe payment failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Stripe payment failed'
      };
    }
  }

  /**
   * Process PayPal payment
   */
  private async processPayPalPayment(
    request: PaymentRequest,
    config: PaymentGatewayConfig,
    paymentRecordId: string
  ): Promise<PaymentResponse> {
    try {
      // This is a placeholder for actual PayPal integration
      // In a real implementation, you would use PayPal SDK
      
      const paypalResponse = await this.mockPayPalPayment(request, config);
      
      // Calculate fees and commission splits
      const processorFee = request.amount * 0.034 + 0.30; // PayPal's standard fee
      const netAmount = request.amount - processorFee;
      
      // Update payment record with fees
      await supabase
        .from('payment_records')
        .update({
          processor_fee: processorFee,
          net_amount: netAmount
        })
        .eq('id', paymentRecordId);

      return {
        success: true,
        paymentRecordId,
        gatewayTransactionId: paypalResponse.transactionId,
        status: 'completed',
        redirectUrl: paypalResponse.approvalUrl,
        gatewayResponse: paypalResponse
      };
    } catch (error) {
      console.error('PayPal payment failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'PayPal payment failed'
      };
    }
  }

  /**
   * Process bank transfer payment
   */
  private async processBankTransferPayment(
    request: PaymentRequest,
    paymentRecordId: string
  ): Promise<PaymentResponse> {
    try {
      // Bank transfers are typically manual processes
      // Mark as pending and provide payment instructions
      
      const bankDetails = {
        accountName: 'Stand Up Sydney',
        bsb: '123-456',
        accountNumber: '987654321',
        reference: `INV-${request.invoiceId}`,
        instructions: 'Please include the reference number in your transfer description'
      };

      return {
        success: true,
        paymentRecordId,
        status: 'pending',
        gatewayResponse: {
          paymentMethod: 'bank_transfer',
          bankDetails,
          message: 'Payment instructions sent. Please complete bank transfer.'
        }
      };
    } catch (error) {
      console.error('Bank transfer payment failed:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Bank transfer setup failed'
      };
    }
  }

  /**
   * Calculate and create commission splits for a payment
   */
  async calculateCommissionSplits(
    paymentRecordId: string,
    platformRate: number = 2.5,
    agencyRate: number = 10.0
  ): Promise<CommissionSplit[]> {
    try {
      // Call the database function to calculate splits
      const { data, error } = await supabase.rpc('calculate_commission_splits', {
        payment_record_id_param: paymentRecordId,
        platform_rate: platformRate,
        agency_rate: agencyRate
      });

      if (error) throw error;

      // Fetch the created splits
      const { data: splits, error: splitsError } = await supabase
        .from('commission_splits')
        .select('*')
        .eq('payment_record_id', paymentRecordId);

      if (splitsError) throw splitsError;

      return splits?.map(split => ({
        recipientType: split.recipient_type,
        recipientId: split.recipient_id,
        splitPercentage: split.split_percentage,
        splitAmount: split.split_amount
      })) || [];
    } catch (error) {
      console.error('Failed to calculate commission splits:', error);
      throw error;
    }
  }

  /**
   * Get payment gateway settings for a user
   */
  async getGatewaySettings(userId: string): Promise<PaymentGatewayConfig[]> {
    try {
      const { data, error } = await supabase
        .from('payment_gateway_settings')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return data?.map(config => ({
        gatewayName: config.gateway_name as PaymentGateway,
        isEnabled: config.is_enabled,
        isDefault: config.is_default,
        configuration: config.configuration,
        credentials: config.credentials,
        webhookUrl: config.webhook_url,
        webhookSecret: config.webhook_secret
      })) || [];
    } catch (error) {
      console.error('Failed to get gateway settings:', error);
      throw error;
    }
  }

  /**
   * Update payment gateway settings
   */
  async updateGatewaySettings(
    userId: string,
    gatewayName: PaymentGateway,
    config: Partial<PaymentGatewayConfig>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_gateway_settings')
        .upsert({
          user_id: userId,
          gateway_name: gatewayName,
          is_enabled: config.isEnabled,
          is_default: config.isDefault,
          configuration: config.configuration,
          credentials: config.credentials,
          webhook_url: config.webhookUrl,
          webhook_secret: config.webhookSecret
        });

      if (error) throw error;

      // Update local cache
      if (config.isEnabled) {
        this.gatewayConfigs.set(gatewayName, {
          gatewayName,
          isEnabled: config.isEnabled || false,
          isDefault: config.isDefault || false,
          configuration: config.configuration || {},
          credentials: config.credentials || {},
          webhookUrl: config.webhookUrl,
          webhookSecret: config.webhookSecret
        });
      } else {
        this.gatewayConfigs.delete(gatewayName);
      }
    } catch (error) {
      console.error('Failed to update gateway settings:', error);
      throw error;
    }
  }

  /**
   * Mock Stripe payment for development/testing
   */
  private async mockStripePayment(request: PaymentRequest, config: PaymentGatewayConfig): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful payment
    return {
      transactionId: `stripe_${Date.now()}`,
      status: 'succeeded',
      amount: request.amount,
      currency: request.currency,
      paymentMethod: request.paymentMethod,
      created: new Date().toISOString()
    };
  }

  /**
   * Mock PayPal payment for development/testing
   */
  private async mockPayPalPayment(request: PaymentRequest, config: PaymentGatewayConfig): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Mock PayPal response
    return {
      transactionId: `paypal_${Date.now()}`,
      status: 'approved',
      amount: request.amount,
      currency: request.currency,
      approvalUrl: `https://paypal.com/approve/${Date.now()}`,
      created: new Date().toISOString()
    };
  }

  /**
   * Process webhook from payment gateway
   */
  async processWebhook(gatewayName: PaymentGateway, payload: any, signature: string): Promise<void> {
    try {
      const config = this.gatewayConfigs.get(gatewayName);
      if (!config) {
        throw new Error(`Gateway ${gatewayName} not configured`);
      }

      // Verify webhook signature (implementation depends on gateway)
      const isValid = await this.verifyWebhookSignature(gatewayName, payload, signature, config.webhookSecret);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Process webhook based on gateway
      switch (gatewayName) {
        case 'stripe':
          await this.processStripeWebhook(payload);
          break;
        case 'paypal':
          await this.processPayPalWebhook(payload);
          break;
        default:
          console.warn(`Webhook processing not implemented for ${gatewayName}`);
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  private async verifyWebhookSignature(
    gatewayName: PaymentGateway,
    payload: any,
    signature: string,
    secret?: string
  ): Promise<boolean> {
    // Implementation depends on the specific gateway
    // This is a placeholder - real implementation would use crypto libraries
    return true;
  }

  /**
   * Process Stripe webhook
   */
  private async processStripeWebhook(payload: any): Promise<void> {
    // Handle different Stripe webhook events
    switch (payload.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(payload.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(payload.data.object);
        break;
      default:
        console.log(`Unhandled Stripe webhook event: ${payload.type}`);
    }
  }

  /**
   * Process PayPal webhook
   */
  private async processPayPalWebhook(payload: any): Promise<void> {
    // Handle different PayPal webhook events
    switch (payload.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.handlePaymentSuccess(payload.resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await this.handlePaymentFailure(payload.resource);
        break;
      default:
        console.log(`Unhandled PayPal webhook event: ${payload.event_type}`);
    }
  }

  /**
   * Handle payment success
   */
  private async handlePaymentSuccess(paymentData: any): Promise<void> {
    // Update payment record status
    const { error } = await supabase
      .from('payment_records')
      .update({
        status: 'completed',
        payment_date: new Date().toISOString(),
        gateway_response: paymentData
      })
      .eq('gateway_transaction_id', paymentData.id);

    if (error) {
      console.error('Failed to update payment record:', error);
    }
  }

  /**
   * Handle payment failure
   */
  private async handlePaymentFailure(paymentData: any): Promise<void> {
    // Update payment record status
    const { error } = await supabase
      .from('payment_records')
      .update({
        status: 'failed',
        gateway_response: paymentData
      })
      .eq('gateway_transaction_id', paymentData.id);

    if (error) {
      console.error('Failed to update payment record:', error);
    }
  }
}

// Export singleton instance
export const flexPayService = FlexPayService.getInstance();