import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useXeroIntegration } from '@/hooks/useXeroIntegration';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';
import { xeroService } from '@/services/xeroService';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  FileText,
  DollarSign,
  Clock,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const XeroIntegrationEnhanced: React.FC = () => {
  const { integration, invoices, bills, isLoading, syncData } = useXeroIntegration();
  const { connectToXero, syncFromXero } = useInvoiceOperations();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = () => {
    if (process.env.NODE_ENV === 'production') {
      // Use real OAuth flow in production
      const authUrl = xeroService.getAuthorizationUrl();
      window.location.href = authUrl;
    } else {
      // Use demo connection in development
      connectToXero();
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncData();
      await syncFromXero.mutateAsync();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Xero Integration
            {integration?.connection_status === 'active' ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-4 h-4 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sync your invoices and financial data with Xero accounting software
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integration?.connection_status === 'active' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-medium">{integration.tenant_name || 'Stand Up Sydney'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(integration.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Sync</p>
                  <p className="font-medium">
                    {integration.last_sync_at
                      ? formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })
                      : 'Never'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    className="professional-button"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => window.open('https://go.xero.com', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Xero
                  </Button>
                </div>
                <Button variant="destructive" size="sm">
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect to Xero</h3>
              <p className="text-muted-foreground mb-4">
                Integrate with Xero to automatically sync invoices and streamline your accounting
              </p>
              <Button onClick={handleConnect}>
                Connect to Xero
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Synced Invoices */}
      {integration?.connection_status === 'active' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>
                Invoices synced between Stand Up Sydney and Xero
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {invoice.xero_invoice_number || 'Pending'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(invoice.total_amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={invoice.sync_status === 'synced' ? 'default' : 'secondary'}>
                          {invoice.sync_status}
                        </Badge>
                        <Badge variant={
                          invoice.invoice_status === 'PAID' ? 'default' :
                          invoice.invoice_status === 'AUTHORISED' ? 'secondary' :
                          'outline'
                        }>
                          {invoice.invoice_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No invoices synced yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Sync Statistics</CardTitle>
              <CardDescription>
                Overview of your Xero synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{invoices?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Synced Invoices</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {invoices?.filter(inv => inv.invoice_status === 'PAID').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Paid Invoices</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {invoices?.filter(inv => inv.sync_status === 'pending').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Sync</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Automatic Sync:</strong> Invoices are automatically synced when created or updated. 
              Manual sync updates payment status and imports new invoices from Xero.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
};