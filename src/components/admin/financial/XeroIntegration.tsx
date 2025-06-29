
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useXeroIntegration } from '@/hooks/useXeroIntegration';
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const XeroIntegration = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { integration, invoices, bills, connectToXero, syncData, isLoading } = useXeroIntegration();
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectToXero();
      toast({
        title: "XERO Connection",
        description: "Successfully connected to XERO!",
      });
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

  const handleSync = async () => {
    try {
      await syncData();
      toast({
        title: "Sync Complete",
        description: "Successfully synced data with XERO!",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with XERO. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">XERO Integration</h2>
        {integration?.connection_status === 'active' && (
          <Button onClick={handleSync} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Data
          </Button>
        )}
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Connection Status
            {integration?.connection_status === 'active' ? (
              <Badge className="bg-green-600">Connected</Badge>
            ) : (
              <Badge variant="destructive">Not Connected</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {integration?.connection_status === 'active' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Connected Since</p>
                  <p className="text-white">{new Date(integration.created_at).toLocaleDateString('en-AU')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Last Sync</p>
                  <p className="text-white">
                    {integration.last_sync_at 
                      ? new Date(integration.last_sync_at).toLocaleString('en-AU')
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <ExternalLink className="w-4 h-4" />
                <span>Connected to XERO tenant: {integration.tenant_id}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-300 mb-4">Connect your XERO account to automatically sync invoices and bills.</p>
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? 'Connecting...' : 'Connect to XERO'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {integration?.connection_status === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-white/10 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : invoices && invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                      <div>
                        <p className="font-medium text-white">{invoice.xero_invoice_number || 'Draft'}</p>
                        <p className="text-sm text-gray-400">${invoice.total_amount.toLocaleString('en-AU')}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(invoice.sync_status)}
                        <Badge variant={invoice.invoice_status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.invoice_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No invoices synced yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Bills</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-white/10 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : bills && bills.length > 0 ? (
                <div className="space-y-3">
                  {bills.slice(0, 5).map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                      <div>
                        <p className="font-medium text-white">{bill.xero_bill_number || 'Draft'}</p>
                        <p className="text-sm text-gray-400">${bill.total_amount.toLocaleString('en-AU')}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(bill.sync_status)}
                        <Badge variant={bill.bill_status === 'paid' ? 'default' : 'secondary'}>
                          {bill.bill_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No bills synced yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default XeroIntegration;
