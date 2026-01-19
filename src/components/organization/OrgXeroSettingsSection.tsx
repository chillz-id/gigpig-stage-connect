import React, { useState, useEffect } from 'react';
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
  Loader2,
  Settings,
} from 'lucide-react';
import { useOrgXeroIntegration } from '@/hooks/useOrgXeroIntegration';
import { useOrganization } from '@/contexts/OrganizationContext';
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
  bookingInvoiceType: 'ACCPAY', // Orgs typically pay comedians (bills)
  pdfAttachment: true,
  bookingInvoiceAccount: '',
  commissionInvoiceAccount: '',
  overrideCommissionInvoice: 'auto',
  rosterInvoiceAccount: '',
  lineItemInvoiceAccount: '',
  depositInvoiceAccount: '',
};

export const OrgXeroSettingsSection: React.FC = () => {
  const { integration, isLoading, isConnected, connectToXero, disconnectFromXero, syncData } = useOrgXeroIntegration();
  const { isOwner, isAdmin } = useOrganization();
  const { toast } = useToast();

  const canEdit = isOwner || isAdmin;

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
    if (!canEdit) return;
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
    if (!canEdit) return;
    setIsDisconnecting(true);
    try {
      await disconnectFromXero();
      toast({
        title: "XERO Disconnected",
        description: "Your organization's XERO account has been disconnected.",
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
        description: "Your organization's data has been synced with XERO!",
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
    if (!integration?.id || !canEdit) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('xero_integrations')
        .update({ settings })
        .eq('id', integration.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your organization's XERO settings have been updated.",
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#13B5EA]/10 rounded-lg">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#13B5EA]" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Xero Integration</span>
            {isConnected && (
              <Badge className="bg-green-600 text-white text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Sync invoices with your organization's Xero account
          </p>
        </div>
      </div>

      {isConnected ? (
        <>
          {/* Connection Status */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p>
              Connected to: <span className="font-semibold">{integration?.tenant_name || 'Unknown'}</span>
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
            {canEdit && (
              <Button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="secondary"
                size="sm"
              >
                <Unlink className="w-4 h-4 mr-2" />
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            )}
          </div>

          <Separator />

          {/* Settings Section */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4" />
              Invoice Settings
            </h4>

            {/* Invoice Status */}
            <div className="space-y-1">
              <Label htmlFor="org-invoiceStatus" className="text-sm">Invoice Status</Label>
              <Select
                value={settings.invoiceStatus}
                onValueChange={(value) => updateSetting('invoiceStatus', value as 'AUTHORISED' | 'DRAFT')}
                disabled={!canEdit}
              >
                <SelectTrigger id="org-invoiceStatus" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTHORISED">Authorised</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Booking Invoice Type */}
            <div className="space-y-1">
              <Label htmlFor="org-bookingInvoiceType" className="text-sm">Comedian Payment Invoices</Label>
              <Select
                value={settings.bookingInvoiceType}
                onValueChange={(value) => updateSetting('bookingInvoiceType', value as 'ACCREC' | 'ACCPAY')}
                disabled={!canEdit}
              >
                <SelectTrigger id="org-bookingInvoiceType" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCPAY">Bill (Accounts Payable)</SelectItem>
                  <SelectItem value="ACCREC">Invoice (Sales Invoice)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How payments to comedians appear in Xero
              </p>
            </div>

            {/* PDF Attachment */}
            <div className="space-y-1">
              <Label htmlFor="org-pdfAttachment" className="text-sm">Attach PDF</Label>
              <Select
                value={settings.pdfAttachment ? 'yes' : 'no'}
                onValueChange={(value) => updateSetting('pdfAttachment', value === 'yes')}
                disabled={!canEdit}
              >
                <SelectTrigger id="org-pdfAttachment" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <h4 className="font-medium text-sm">Account Mapping</h4>

            {isLoadingAccounts ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Xero accounts...
              </div>
            ) : (
              <>
                {/* Roster/Comedian Payment Account */}
                <div className="space-y-1">
                  <Label htmlFor="org-rosterInvoiceAccount" className="text-sm">Comedian Payments Account</Label>
                  <Select
                    value={settings.rosterInvoiceAccount || 'none'}
                    onValueChange={(value) => updateSetting('rosterInvoiceAccount', value === 'none' ? '' : value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger id="org-rosterInvoiceAccount" className="h-9">
                      <SelectValue placeholder="Default expense account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Default expense account</SelectItem>
                      {expenseAccounts.map((account) => (
                        <SelectItem key={account.AccountID} value={account.AccountID}>
                          {account.Code} - {account.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Booking Invoice Account */}
                <div className="space-y-1">
                  <Label htmlFor="org-bookingInvoiceAccount" className="text-sm">Booking Revenue Account</Label>
                  <Select
                    value={settings.bookingInvoiceAccount || 'none'}
                    onValueChange={(value) => updateSetting('bookingInvoiceAccount', value === 'none' ? '' : value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger id="org-bookingInvoiceAccount" className="h-9">
                      <SelectValue placeholder="Default sales account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Default sales account</SelectItem>
                      {revenueAccounts.map((account) => (
                        <SelectItem key={account.AccountID} value={account.AccountID}>
                          {account.Code} - {account.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    For invoices to clients/venues
                  </p>
                </div>
              </>
            )}

            {/* Save Button */}
            {canEdit && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Not Connected State */
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect to XERO to automatically sync invoices for comedian payments and venue billing.
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
          {canEdit ? (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              size="sm"
            >
              <Link className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect to XERO'}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Only organization owners and admins can connect Xero.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
