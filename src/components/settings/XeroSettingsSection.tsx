import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ExternalLink,
  RefreshCw,
  Link,
  Unlink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
} from 'lucide-react';
import { useUserXeroIntegration } from '@/hooks/useUserXeroIntegration';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { xeroService } from '@/services/xeroService';

interface XeroSettings {
  invoiceStatus: 'AUTHORISED' | 'DRAFT';
  bookingInvoiceType: 'ACCREC' | 'ACCPAY';
  pdfAttachment: boolean;
  bookingInvoiceAccount: string;
  commissionInvoiceAccount: string;
  overrideCommissionInvoice: 'auto' | 'sales' | 'bill';
  rosterInvoiceAccount: string;
  lineItemInvoiceAccount: string;
  depositInvoiceAccount: string;
}

interface XeroAccount {
  AccountID: string;
  Code: string;
  Name: string;
  Type: string;
  Status: string;
}

const DEFAULT_SETTINGS: XeroSettings = {
  invoiceStatus: 'DRAFT',
  bookingInvoiceType: 'ACCREC',
  pdfAttachment: true,
  bookingInvoiceAccount: '',
  commissionInvoiceAccount: '',
  overrideCommissionInvoice: 'auto',
  rosterInvoiceAccount: '',
  lineItemInvoiceAccount: '',
  depositInvoiceAccount: '',
};

export const XeroSettingsSection: React.FC = () => {
  const { integration, isLoading, isConnected, connectToXero, disconnectFromXero, syncData } = useUserXeroIntegration();
  const { toast } = useToast();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const [settings, setSettings] = useState<XeroSettings>(DEFAULT_SETTINGS);
  const [accounts, setAccounts] = useState<XeroAccount[]>([]);

  // Load settings from integration record
  useEffect(() => {
    if (integration?.settings) {
      setSettings(prev => ({
        ...prev,
        ...(integration.settings as Partial<XeroSettings>),
      }));
    }
  }, [integration]);

  // Load Xero accounts when connected
  useEffect(() => {
    const loadAccounts = async () => {
      if (!isConnected) return;

      setIsLoadingAccounts(true);
      try {
        const xeroAccounts = await xeroService.getAccounts();
        setAccounts(xeroAccounts);
      } catch (error) {
        console.error('Failed to load Xero accounts:', error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [isConnected]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectToXero();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to XERO. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectFromXero();
      toast({
        title: "XERO Disconnected",
        description: "Your XERO account has been disconnected.",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect from XERO. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncData();
      toast({
        title: "Sync Complete",
        description: "Your data has been synced with XERO!",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with XERO. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!integration?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('xero_integrations')
        .update({ settings })
        .eq('id', integration.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your XERO settings have been updated.",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof XeroSettings>(key: K, value: XeroSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Filter accounts by type for different dropdowns
  const revenueAccounts = accounts.filter(a => a.Type === 'REVENUE' || a.Type === 'SALES');
  const expenseAccounts = accounts.filter(a => a.Type === 'EXPENSE' || a.Type === 'OVERHEADS' || a.Type === 'DIRECTCOSTS');
  const allActiveAccounts = accounts.filter(a => a.Status === 'ACTIVE');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#13B5EA]/10 rounded-lg">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#13B5EA]" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4z"/>
            </svg>
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Xero Integration
              {isConnected && (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Automatically sync, generate and send invoices to your Xero organization.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isConnected ? (
          <>
            {/* Connection Status */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                You are connected to and syncing with your Xero organization:{' '}
                <span className="font-semibold">{integration?.tenant_name || 'Unknown'}</span>
              </p>
              {integration?.last_sync_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last synced: {new Date(integration.last_sync_at).toLocaleString('en-AU')}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="secondary"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="secondary"
                size="sm"
              >
                <Unlink className="w-4 h-4 mr-2" />
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>

            <Separator />

            {/* Settings Section */}
            <div className="space-y-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Invoice Settings
              </h3>

              {/* Invoice Status */}
              <div className="space-y-2">
                <Label htmlFor="invoiceStatus">Invoice Status</Label>
                <Select
                  value={settings.invoiceStatus}
                  onValueChange={(value) => updateSetting('invoiceStatus', value as 'AUTHORISED' | 'DRAFT')}
                >
                  <SelectTrigger id="invoiceStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTHORISED">Authorised</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The status type for every invoice generated (can either be Authorised or Draft)
                </p>
              </div>

              {/* Create booking invoices I owe as */}
              <div className="space-y-2">
                <Label htmlFor="bookingInvoiceType">Create booking invoices I owe as</Label>
                <Select
                  value={settings.bookingInvoiceType}
                  onValueChange={(value) => updateSetting('bookingInvoiceType', value as 'ACCREC' | 'ACCPAY')}
                >
                  <SelectTrigger id="bookingInvoiceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCREC">Invoice (Sales Invoice)</SelectItem>
                    <SelectItem value="ACCPAY">Bill (Accounts Payable)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Create booking invoices where I am the payer (ACCPAY), as a credit note in Xero
                </p>
              </div>

              {/* PDF Attachment */}
              <div className="space-y-2">
                <Label htmlFor="pdfAttachment">PDF Attachment</Label>
                <Select
                  value={settings.pdfAttachment ? 'yes' : 'no'}
                  onValueChange={(value) => updateSetting('pdfAttachment', value === 'yes')}
                >
                  <SelectTrigger id="pdfAttachment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Attach a PDF copy of the invoice when syncing to Xero
                </p>
              </div>

              <Separator />

              <h3 className="font-semibold">Account Mapping</h3>
              <p className="text-sm text-muted-foreground">
                Map different invoice types to specific Xero accounts
              </p>

              {isLoadingAccounts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Xero accounts...
                </div>
              ) : (
                <>
                  {/* Booking Invoice Account */}
                  <div className="space-y-2">
                    <Label htmlFor="bookingInvoiceAccount">Booking Invoice</Label>
                    <Select
                      value={settings.bookingInvoiceAccount || 'none'}
                      onValueChange={(value) => updateSetting('bookingInvoiceAccount', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger id="bookingInvoiceAccount">
                        <SelectValue placeholder="Send as Draft with no Account set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Send as Draft with no Account set</SelectItem>
                        {allActiveAccounts.map((account) => (
                          <SelectItem key={account.AccountID} value={account.AccountID}>
                            {account.Code} - {account.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The account assigned to standard booking invoices when they're automatically generated in XERO
                    </p>
                  </div>

                  {/* Commission Invoice Account */}
                  <div className="space-y-2">
                    <Label htmlFor="commissionInvoiceAccount">Commission Invoice</Label>
                    <Select
                      value={settings.commissionInvoiceAccount || 'none'}
                      onValueChange={(value) => updateSetting('commissionInvoiceAccount', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger id="commissionInvoiceAccount">
                        <SelectValue placeholder="Sales" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sales (Default)</SelectItem>
                        {revenueAccounts.map((account) => (
                          <SelectItem key={account.AccountID} value={account.AccountID}>
                            {account.Code} - {account.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The account assigned to commission invoices when they're automatically generated in XERO
                    </p>
                  </div>

                  {/* Override Commission Invoice */}
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    <Label htmlFor="overrideCommissionInvoice">Override Commission Invoice</Label>
                    <Select
                      value={settings.overrideCommissionInvoice}
                      onValueChange={(value) => updateSetting('overrideCommissionInvoice', value as 'auto' | 'sales' | 'bill')}
                    >
                      <SelectTrigger id="overrideCommissionInvoice">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatically Detect</SelectItem>
                        <SelectItem value="sales">Always Sales Invoice</SelectItem>
                        <SelectItem value="bill">Always Bill Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Force your invoices to be set in Xero as a Sales Invoice or Bill Invoice. This may be useful if you're using a second Xero connection and a trust account for commission payments.
                    </p>
                  </div>

                  {/* Roster Invoice Account */}
                  <div className="space-y-2">
                    <Label htmlFor="rosterInvoiceAccount">Roster Invoice (Comedian Payments)</Label>
                    <Select
                      value={settings.rosterInvoiceAccount || 'none'}
                      onValueChange={(value) => updateSetting('rosterInvoiceAccount', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger id="rosterInvoiceAccount">
                        <SelectValue placeholder="Contractors & Entertainers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Contractors & Entertainers (Default)</SelectItem>
                        {expenseAccounts.map((account) => (
                          <SelectItem key={account.AccountID} value={account.AccountID}>
                            {account.Code} - {account.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The account assigned to roster/comedian payment invoices when they're automatically generated in XERO
                    </p>
                  </div>

                  {/* Line Item Invoice Account */}
                  <div className="space-y-2">
                    <Label htmlFor="lineItemInvoiceAccount">Line Item / Grouped Invoice</Label>
                    <Select
                      value={settings.lineItemInvoiceAccount || 'none'}
                      onValueChange={(value) => updateSetting('lineItemInvoiceAccount', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger id="lineItemInvoiceAccount">
                        <SelectValue placeholder="Send as Draft with no Account set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Send as Draft with no Account set</SelectItem>
                        {allActiveAccounts.map((account) => (
                          <SelectItem key={account.AccountID} value={account.AccountID}>
                            {account.Code} - {account.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The account assigned to misc. settlement line item invoices when they're automatically generated in XERO
                    </p>
                  </div>

                  {/* Deposit Invoice Account */}
                  <div className="space-y-2">
                    <Label htmlFor="depositInvoiceAccount">Deposit Invoice</Label>
                    <Select
                      value={settings.depositInvoiceAccount || 'none'}
                      onValueChange={(value) => updateSetting('depositInvoiceAccount', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger id="depositInvoiceAccount">
                        <SelectValue placeholder="Sales" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sales (Default)</SelectItem>
                        {revenueAccounts.map((account) => (
                          <SelectItem key={account.AccountID} value={account.AccountID}>
                            {account.Code} - {account.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The account assigned to booking deposit invoices when they're automatically generated in XERO
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="professional-button"
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Not Connected State */
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect to XERO to automatically sync your financial information and generate invoices.
            </p>
            <p className="text-xs text-muted-foreground">
              Don't have Xero?{' '}
              <a
                href="https://referrals.xero.com/l2mxbjnerobj"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline font-medium inline-flex items-center gap-1"
              >
                Get 90% off your first 3 months
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="professional-button"
            >
              <Link className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect to XERO'}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
