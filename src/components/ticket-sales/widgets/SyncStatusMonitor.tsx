import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Clock,
  AlertCircle,
  Zap,
  Link,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ticketSyncService } from '@/services/ticketSyncService';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SyncStatusMonitorProps {
  eventId: string;
}

interface PlatformStatus {
  platform: string;
  status: 'active' | 'error' | 'inactive';
  lastSync?: string;
  ticketsSold: number;
  revenue: number;
  error?: string;
  externalUrl?: string;
}

const SyncStatusMonitor: React.FC<SyncStatusMonitorProps> = ({ eventId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);
  const [syncHealth, setSyncHealth] = useState<number>(100);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const { data: platformData, error } = await supabase
        .from('ticket_platforms')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;

      if (!platformData || platformData.length === 0) {
        setPlatforms([]);
        setSyncHealth(0);
        return;
      }

      const statuses: PlatformStatus[] = platformData.map(platform => {
        const lastSync = platform.platform_data?.last_sync;
        const hasError = platform.platform_data?.last_error;
        
        // Determine status based on last sync time and errors
        let status: 'active' | 'error' | 'inactive' = 'active';
        if (hasError) {
          status = 'error';
        } else if (!lastSync) {
          status = 'inactive';
        } else {
          const lastSyncDate = new Date(lastSync);
          const hoursSinceSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);
          if (hoursSinceSync > 24) {
            status = 'error';
          } else if (hoursSinceSync > 1) {
            status = 'inactive';
          }
        }

        return {
          platform: platform.platform,
          status,
          lastSync,
          ticketsSold: platform.tickets_sold || 0,
          revenue: platform.gross_sales || 0,
          error: hasError,
          externalUrl: platform.external_event_url
        };
      });

      setPlatforms(statuses);

      // Calculate sync health
      const activeCount = statuses.filter(p => p.status === 'active').length;
      const health = statuses.length > 0 ? (activeCount / statuses.length) * 100 : 0;
      setSyncHealth(health);

    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const results = await ticketSyncService.syncAllPlatforms(eventId);
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${successCount} platform${successCount > 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: "Partial Sync",
          description: `Synced ${successCount} of ${totalCount} platforms`,
          variant: "default",
        });
      }
      
      // Refresh status
      await fetchSyncStatus();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync ticket platforms",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Active</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-700 border-red-500/20">Error</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getHealthColor = () => {
    if (syncHealth >= 80) return 'bg-green-500';
    if (syncHealth >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  useEffect(() => {
    fetchSyncStatus();

    // Refresh every minute
    const interval = setInterval(fetchSyncStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sync Status</CardTitle>
          <Button
            className="professional-button"
            size="sm"
            onClick={handleManualSync}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sync Health</span>
            <span className="font-medium">{syncHealth.toFixed(0)}%</span>
          </div>
          <Progress value={syncHealth} className="h-2">
            <div 
              className={`h-full ${getHealthColor()} rounded-full transition-all`}
              style={{ width: `${syncHealth}%` }}
            />
          </Progress>
        </div>

        {/* Platform Status List */}
        <div className="space-y-3">
          {platforms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No ticket platforms configured</p>
              <p className="text-sm mt-1">Add platforms to start syncing ticket sales</p>
            </div>
          ) : (
            platforms.map((platform, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(platform.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{platform.platform}</span>
                      {getStatusBadge(platform.status)}
                    </div>
                    {platform.lastSync ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last synced {formatDistanceToNow(new Date(platform.lastSync), { addSuffix: true })}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Never synced
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {platform.ticketsSold} tickets
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${platform.revenue.toFixed(0)} revenue
                  </p>
                  {platform.externalUrl && (
                    <a 
                      href={platform.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      <Link className="w-3 h-3" />
                      View
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Auto-sync indicator */}
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            <span>Auto-syncing every 15 minutes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncStatusMonitor;
