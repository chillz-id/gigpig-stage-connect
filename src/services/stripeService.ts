import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';

export interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  priceId?: string;
}

export interface PaymentLinkRequest {
  invoiceId: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PaymentLinkResponse {
  paymentLinkId: string;
  url: string;
  expiresAt: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

/**
 * Stripe Payment Service for invoice payments
 * Handles payment link generation, webhook processing, and payment status updates
 */
export class StripePaymentService {
  private stripe: Stripe | null = null;
  private publicKey: string | null = null;

  constructor() {}

  /**
   * Initialize Stripe with configuration
   */
  async initialize(config: StripeConfig): Promise<void> {
    try {
      this.publicKey = config.publicKey;
      this.stripe = await loadStripe(config.publicKey);
      
      if (!this.stripe) {
        throw new Error('Failed to load Stripe');
      }

      console.log('Stripe initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  /**
   * Initialize with environment variables
   */
  async initializeFromEnv(): Promise<void> {
    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    
    if (!publicKey) {
      throw new Error('VITE_STRIPE_PUBLIC_KEY environment variable is not set');
    }

    await this.initialize({
      publicKey,
      secretKey: '', // Not needed on frontend
      webhookSecret: '', // Not needed on frontend
    });
  }

  /**
   * Create a payment link for an invoice
   */
  async createPaymentLink(invoice: Invoice, options?: {
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<PaymentLinkResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call Supabase Edge Function to create payment link
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          invoiceId: invoice.id,
          amount: Math.round(invoice.total_amount * 100), // Convert to cents
          currency: invoice.currency.toLowerCase(),
          description: `Invoice ${invoice.invoice_number}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            userId: user.id
          },
          successUrl: options?.successUrl || `${window.location.origin}/invoices/${invoice.id}/payment-success`,
          cancelUrl: options?.cancelUrl || `${window.location.origin}/invoices/${invoice.id}/payment-cancelled`
        }
      });

      if (error) throw error;

      // Store payment link in database
      await this.storePaymentLink(invoice.id, data.paymentLinkId, data.url);

      return data;
    } catch (error) {
      console.error('Failed to create payment link:', error);
      throw error;
    }
  }

  /**
   * Store payment link in database
   */
  private async storePaymentLink(invoiceId: string, paymentLinkId: string, url: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_payment_links')
      .upsert({
        invoice_id: invoiceId,
        payment_link_id: paymentLinkId,
        url: url,
        status: 'active',
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Get payment link for an invoice
   */
  async getPaymentLink(invoiceId: string): Promise<{ url: string; status: string } | null> {
    try {
      const { data, error } = await supabase
        .from('invoice_payment_links')
        .select('url, status')
        .eq('invoice_id', invoiceId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No payment link found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get payment link:', error);
      throw error;
    }
  }

  /**
   * Cancel a payment link
   */
  async cancelPaymentLink(invoiceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoice_payment_links')
        .update({ status: 'cancelled' })
        .eq('invoice_id', invoiceId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to cancel payment link:', error);
      throw error;
    }
  }

  /**
   * Get payment status for an invoice
   */
  async getPaymentStatus(invoiceId: string): Promise<{
    status: string;
    amount: number;
    paymentDate?: string;
    paymentMethod?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('invoice_payments')
        .select('status, amount, payment_date, payment_method')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No payment record found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }

  /**
   * Get payment history for an invoice
   */
  async getPaymentHistory(invoiceId: string): Promise<Array<{
    id: string;
    amount: number;
    status: string;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('invoice_payments')
        .select(`
          id,
          amount,
          status,
          payment_date,
          payment_method,
          reference_number
        `)
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw error;
    }
  }

  /**
   * Check if Stripe is initialized
   */
  isInitialized(): boolean {
    return this.stripe !== null;
  }

  /**
   * Get Stripe instance
   */
  getStripe(): Stripe | null {
    return this.stripe;
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await this.stripe.redirectToCheckout({
      sessionId
    });

    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  }

  /**
   * Process successful payment
   */
  async processPaymentSuccess(invoiceId: string, paymentData: any): Promise<void> {
    try {
      // Update invoice status
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;

      // Update payment link status
      const { error: linkError } = await supabase
        .from('invoice_payment_links')
        .update({ status: 'used' })
        .eq('invoice_id', invoiceId);

      if (linkError) throw linkError;

      // Send payment confirmation notification
      await this.sendPaymentNotification(invoiceId, 'payment_success');
    } catch (error) {
      console.error('Failed to process payment success:', error);
      throw error;
    }
  }

  /**
   * Process failed payment
   */
  async processPaymentFailure(invoiceId: string, errorData: any): Promise<void> {
    try {
      // Log the failure
      console.error('Payment failed for invoice:', invoiceId, errorData);

      // Send payment failure notification
      await this.sendPaymentNotification(invoiceId, 'payment_failed');
    } catch (error) {
      console.error('Failed to process payment failure:', error);
      throw error;
    }
  }

  /**
   * Send payment notification
   */
  private async sendPaymentNotification(invoiceId: string, type: 'payment_success' | 'payment_failed'): Promise<void> {
    try {
      // Get invoice details
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_recipients(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      // Create notification record
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: invoice.promoter_id || invoice.comedian_id,
          title: type === 'payment_success' 
            ? `Payment Received - Invoice ${invoice.invoice_number}`
            : `Payment Failed - Invoice ${invoice.invoice_number}`,
          message: type === 'payment_success'
            ? `Payment of ${invoice.currency} ${invoice.total_amount} has been received for invoice ${invoice.invoice_number}.`
            : `Payment attempt failed for invoice ${invoice.invoice_number}. Please check your payment method.`,
          type: type === 'payment_success' ? 'payment_success' : 'payment_failed',
          read: false,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.total_amount,
            currency: invoice.currency
          }
        });

      if (notificationError) throw notificationError;
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      // Don't throw - notification failure shouldn't break payment processing
    }
  }
}

// Export singleton instance
export const stripePaymentService = new StripePaymentService();