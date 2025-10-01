import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { usePayments } from '../hooks/usePayments';
import { PaymentGateway, PaymentGatewayConfig } from '../services/paymentService';
import { CreditCard, Banknote, Building2, Settings, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface GatewayConfigForm {
  isEnabled: boolean;
  isDefault: boolean;
  configuration: Record<string, string>;
  credentials: Record<string, string>;
}

const GATEWAY_CONFIGS = {
  stripe: {
    name: 'Stripe',
    icon: CreditCard,
    description: 'Accept credit and debit cards worldwide',
    configFields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, credential: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false, credential: true },
    ],
    fees: '2.9% + $0.30 per transaction'
  },
  paypal: {
    name: 'PayPal',
    icon: Banknote,
    description: 'Accept PayPal and credit card payments',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, credential: true },
      { key: 'environment', label: 'Environment', type: 'select', required: true, options: ['sandbox', 'production'] },
    ],
    fees: '3.4% + $0.30 per transaction'
  },
  bank_transfer: {
    name: 'Bank Transfer',
    icon: Building2,
    description: 'Direct bank transfers and manual payments',
    configFields: [
      { key: 'accountName', label: 'Account Name', type: 'text', required: true },
      { key: 'bsb', label: 'BSB', type: 'text', required: true },
      { key: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { key: 'instructions', label: 'Payment Instructions', type: 'textarea', required: false },
    ],
    fees: 'No processing fees'
  }
};

export const PaymentGatewaySettings: React.FC = () => {
  const { 
    gatewaySettings, 
    isLoadingGateways, 
    updateGatewaySettings, 
    isUpdatingGateway 
  } = usePayments();

  const [activeTab, setActiveTab] = useState<PaymentGateway>('stripe');
  const [formData, setFormData] = useState<Record<PaymentGateway, GatewayConfigForm>>({
    stripe: { isEnabled: false, isDefault: false, configuration: {}, credentials: {} },
    paypal: { isEnabled: false, isDefault: false, configuration: {}, credentials: {} },
    bank_transfer: { isEnabled: false, isDefault: false, configuration: {}, credentials: {} }
  });

  // Initialize form data from gateway settings
  React.useEffect(() => {
    if (gatewaySettings) {
      setFormData(prev => {
        const next = { ...prev };

        gatewaySettings.forEach(setting => {
          next[setting.gatewayName as PaymentGateway] = {
            isEnabled: setting.isEnabled,
            isDefault: setting.isDefault,
            configuration: setting.configuration || {},
            credentials: setting.credentials || {}
          };
        });

        return next;
      });
    }
  }, [gatewaySettings]);

  const handleInputChange = (
    gateway: PaymentGateway,
    field: string,
    value: string,
    isCredential: boolean = false
  ) => {
    setFormData(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        [isCredential ? 'credentials' : 'configuration']: {
          ...prev[gateway][isCredential ? 'credentials' : 'configuration'],
          [field]: value
        }
      }
    }));
  };

  const handleSwitchChange = (gateway: PaymentGateway, field: 'isEnabled' | 'isDefault', value: boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [gateway]: {
          ...prev[gateway],
          [field]: value
        }
      };

      // If setting as default, disable default for other gateways
      if (field === 'isDefault' && value) {
        Object.keys(newData).forEach(key => {
          if (key !== gateway) {
            newData[key as PaymentGateway].isDefault = false;
          }
        });
      }

      return newData;
    });
  };

  const handleSaveGateway = async (gateway: PaymentGateway) => {
    try {
      const config = formData[gateway];
      const gatewayConfig = GATEWAY_CONFIGS[gateway];

      // Validate required fields
      const requiredFields = gatewayConfig.configFields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => {
        const value = field.credential 
          ? config.credentials[field.key] 
          : config.configuration[field.key];
        return !value || value.trim() === '';
      });

      if (config.isEnabled && missingFields.length > 0) {
        toast.error(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }

      await updateGatewaySettings(gateway, {
        isEnabled: config.isEnabled,
        isDefault: config.isDefault,
        configuration: config.configuration,
        credentials: config.credentials
      });

      toast.success(`${gatewayConfig.name} settings saved successfully`);
    } catch (error) {
      console.error('Failed to save gateway settings:', error);
      toast.error('Failed to save gateway settings');
    }
  };

  const getGatewayStatus = (gateway: PaymentGateway) => {
    const config = formData[gateway];
    if (!config.isEnabled) return 'disabled';
    
    const gatewayConfig = GATEWAY_CONFIGS[gateway];
    const requiredFields = gatewayConfig.configFields.filter(field => field.required);
    const hasAllRequired = requiredFields.every(field => {
      const value = field.credential 
        ? config.credentials[field.key] 
        : config.configuration[field.key];
      return value && value.trim() !== '';
    });

    return hasAllRequired ? 'configured' : 'incomplete';
  };

  const renderGatewayForm = (gateway: PaymentGateway) => {
    const config = formData[gateway];
    const gatewayConfig = GATEWAY_CONFIGS[gateway];
    const Icon = gatewayConfig.icon;
    const status = getGatewayStatus(gateway);

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className="h-6 w-6" />
              <div>
                <CardTitle>{gatewayConfig.name}</CardTitle>
                <CardDescription>{gatewayConfig.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={status === 'configured' ? 'default' : status === 'incomplete' ? 'secondary' : 'outline'}
                className="capitalize"
              >
                {status === 'configured' && <Check className="w-3 h-3 mr-1" />}
                {status === 'incomplete' && <Settings className="w-3 h-3 mr-1" />}
                {status === 'disabled' && <X className="w-3 h-3 mr-1" />}
                {status}
              </Badge>
              {config.isDefault && (
                <Badge variant="outline">Default</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id={`${gateway}-enabled`}
              checked={config.isEnabled}
              onCheckedChange={(checked) => handleSwitchChange(gateway, 'isEnabled', checked)}
            />
            <Label htmlFor={`${gateway}-enabled`}>Enable {gatewayConfig.name}</Label>
          </div>

          {config.isEnabled && (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${gateway}-default`}
                  checked={config.isDefault}
                  onCheckedChange={(checked) => handleSwitchChange(gateway, 'isDefault', checked)}
                />
                <Label htmlFor={`${gateway}-default`}>Set as default payment method</Label>
              </div>

              <div className="grid gap-4">
                {gatewayConfig.configFields.map((field) => {
                  const value = field.credential 
                    ? config.credentials[field.key] || ''
                    : config.configuration[field.key] || '';

                  if (field.type === 'select') {
                    return (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <select
                          id={field.key}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={value}
                          onChange={(e) => handleInputChange(gateway, field.key, e.target.value, field.credential)}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === 'textarea') {
                    return (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <textarea
                          id={field.key}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          value={value}
                          onChange={(e) => handleInputChange(gateway, field.key, e.target.value, field.credential)}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id={field.key}
                        type={field.type}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={value}
                        onChange={(e) => handleInputChange(gateway, field.key, e.target.value, field.credential)}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Processing Fees:</strong> {gatewayConfig.fees}
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={!config.isEnabled}>
                  Test Connection
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Test {gatewayConfig.name} Connection</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will test the connection to {gatewayConfig.name} using your configured credentials.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => toast.info('Connection test not implemented yet')}>
                    Test Connection
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              onClick={() => handleSaveGateway(gateway)}
              disabled={isUpdatingGateway}
            >
              {isUpdatingGateway ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingGateways) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment gateway settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment Gateway Settings</h2>
        <p className="text-muted-foreground">
          Configure your payment gateways to accept payments from customers.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PaymentGateway)}>
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(GATEWAY_CONFIGS).map(([key, config]) => {
            const status = getGatewayStatus(key as PaymentGateway);
            const Icon = config.icon;
            
            return (
              <TabsTrigger key={key} value={key} className="relative">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{config.name}</span>
                  {status === 'configured' && (
                    <Check className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(GATEWAY_CONFIGS).map((gateway) => (
          <TabsContent key={gateway} value={gateway}>
            {renderGatewayForm(gateway as PaymentGateway)}
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Payment Flow Overview</CardTitle>
          <CardDescription>
            How payments are processed through your configured gateways
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Customer Payment</h3>
              <p className="text-sm text-muted-foreground">
                Customer selects payment method and completes payment
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Gateway Processing</h3>
              <p className="text-sm text-muted-foreground">
                Payment is processed through your configured gateway
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Check className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Commission Split</h3>
              <p className="text-sm text-muted-foreground">
                Automatic commission distribution to all parties
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
