import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { flexPayService, PaymentGatewayConfig } from '@/services/paymentService';
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

  const createPaymentLink = async (): Promise<string | null> => {
    if (!user) {
      toast.error('Please log in to create payment links');
      return null;
    }

    // Payment link creation requires a configured payment gateway
    const defaultGateway = getDefaultGateway();
    if (!defaultGateway) {
      toast.error('No payment gateway configured. Please set up a payment gateway first.');
      return null;
    }

    toast.info('Payment link feature coming soon with new payment provider');
    return null;
  };

  const getPaymentLink = async (): Promise<PaymentLink | null> => {
    // Placeholder - payment link retrieval will be implemented with new provider
    return null;
  };

  const getPaymentStatus = async (): Promise<PaymentStatus | null> => {
    // Placeholder - payment status will be implemented with new provider
    return null;
  };

  const getPaymentHistory = async (): Promise<PaymentHistoryEntry[]> => {
    // Placeholder - payment history will be implemented with new provider
    return [];
  };

  const cancelPaymentLink = async (): Promise<boolean> => {
    toast.info('Payment link cancellation will be available with new payment provider');
    return false;
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

      await flexPayService.updateGatewaySettings(user.id, gatewayName as 'paypal' | 'bank_transfer', config);

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
