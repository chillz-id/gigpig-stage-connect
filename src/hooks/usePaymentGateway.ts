import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { stripePaymentService } from '@/services/stripeService';
import { flexPayService, PaymentGatewayConfig } from '@/services/paymentService';
import { Invoice } from '@/types/invoice';
import { toast } from 'sonner';

export interface PaymentLink {
  id: string;
  invoiceId: string;
  paymentLinkId: string;
  url: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}

export interface PaymentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  gatewayTransactionId?: string;
}

export interface PaymentHistoryEntry {
  id: string;
  amount: number;
  status: string;
  paymentDate: string;
  paymentMethod: string;
  gatewayTransactionId?: string;
}

export const usePaymentGateway = () => {
  const { user } = useAuth();
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load gateway configurations
  const loadGateways = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const gatewayConfigs = await flexPayService.getGatewaySettings(user.id);
      setGateways(gatewayConfigs);

      // Initialize FlexPay with user's settings
      await flexPayService.initializeGateways(user.id);
    } catch (err) {
      console.error('Failed to load gateways:', err);
      setError('Failed to load payment gateways');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadGateways();
    }
  }, [loadGateways, user]);

  const createPaymentLink = async (invoice: Invoice): Promise<string | null> => {
    if (!user) {
      toast.error('Please log in to create payment links');
      return null;
    }

    try {
      setLoading(true);
      
      // Initialize Stripe if not already done
      if (!stripePaymentService.isInitialized()) {
        await stripePaymentService.initializeFromEnv();
      }

      const response = await stripePaymentService.createPaymentLink(invoice);
      
      toast.success('Payment link created successfully!');
      return response.url;
    } catch (err) {
      console.error('Failed to create payment link:', err);
      toast.error('Failed to create payment link');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPaymentLink = async (invoiceId: string): Promise<PaymentLink | null> => {
    try {
      const link = await stripePaymentService.getPaymentLink(invoiceId);
      return link ? {
        id: '',
        invoiceId,
        paymentLinkId: '',
        url: link.url,
        status: link.status as any,
        expiresAt: '',
        createdAt: ''
      } : null;
    } catch (err) {
      console.error('Failed to get payment link:', err);
      return null;
    }
  };

  const getPaymentStatus = async (invoiceId: string): Promise<PaymentStatus | null> => {
    try {
      const status = await stripePaymentService.getPaymentStatus(invoiceId);
      return status ? {
        status: status.status as any,
        amount: status.amount,
        paymentDate: status.paymentDate,
        paymentMethod: status.paymentMethod
      } : null;
    } catch (err) {
      console.error('Failed to get payment status:', err);
      return null;
    }
  };

  const getPaymentHistory = async (invoiceId: string): Promise<PaymentHistoryEntry[]> => {
    try {
      const history = await stripePaymentService.getPaymentHistory(invoiceId);
      return history;
    } catch (err) {
      console.error('Failed to get payment history:', err);
      return [];
    }
  };

  const cancelPaymentLink = async (invoiceId: string): Promise<boolean> => {
    try {
      await stripePaymentService.cancelPaymentLink(invoiceId);
      toast.success('Payment link cancelled successfully');
      return true;
    } catch (err) {
      console.error('Failed to cancel payment link:', err);
      toast.error('Failed to cancel payment link');
      return false;
    }
  };

  const updateGatewaySettings = async (
    gatewayName: string,
    config: Partial<PaymentGatewayConfig>
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to update gateway settings');
      return false;
    }

    try {
      setLoading(true);
      
      await flexPayService.updateGatewaySettings(user.id, gatewayName as any, config);
      
      // Reload gateways to reflect changes
      await loadGateways();
      
      toast.success(`${gatewayName} settings updated successfully`);
      return true;
    } catch (err) {
      console.error('Failed to update gateway settings:', err);
      toast.error('Failed to update gateway settings');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDefaultGateway = (): PaymentGatewayConfig | null => {
    const defaultGateway = gateways.find(g => g.isDefault && g.isEnabled);
    return defaultGateway || null;
  };

  const getEnabledGateways = (): PaymentGatewayConfig[] => {
    return gateways.filter(g => g.isEnabled);
  };

  const isGatewayConfigured = (gatewayName: string): boolean => {
    const gateway = gateways.find(g => g.gatewayName === gatewayName);
    if (!gateway || !gateway.isEnabled) return false;
    
    // Check if required credentials are present
    const hasCredentials = Object.keys(gateway.credentials || {}).length > 0;
    return hasCredentials;
  };

  return {
    gateways,
    loading,
    error,
    createPaymentLink,
    getPaymentLink,
    getPaymentStatus,
    getPaymentHistory,
    cancelPaymentLink,
    updateGatewaySettings,
    getDefaultGateway,
    getEnabledGateways,
    isGatewayConfigured,
    refreshGateways: loadGateways
  };
};
