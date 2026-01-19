
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, RefreshCw, Link, Unlink, CheckCircle, AlertCircle } from 'lucide-react';
import { useUserXeroIntegration } from '@/hooks/useUserXeroIntegration';
import { useToast } from '@/hooks/use-toast';

export const XeroSyncButton: React.FC = () => {
  const { integration, isLoading, isConnected, connectToXero, disconnectFromXero, syncData } = useUserXeroIntegration();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectToXero();
      toast({
        title: "XERO Connected",
        description: "Your XERO account has been successfully connected!",
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
        description: "Your financial data has been synced with XERO!",
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">XERO Integration</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
          <div className="animate-pulse bg-muted h-10 w-32 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Separator />
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">XERO Integration</h3>
            {isConnected ? (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
          
          {isConnected ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Sync your financial information with XERO for automated invoicing and expense tracking.
              </p>
              {integration?.tenant_name && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Connected to: {integration.tenant_name}
                </p>
              )}
              {integration?.last_sync_at && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {new Date(integration.last_sync_at).toLocaleString('en-AU')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
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
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="professional-button"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="professional-button"
                size="sm"
              >
                <Unlink className="w-4 h-4 mr-2" />
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="professional-button"
              size="sm"
            >
              <Link className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect to XERO'}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
