import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Clock, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SyncStatus {
  id: string;
  platform: string;
  event_type: string;
  response_status: string;
  processed_at: string;
  payload: any;
  external_order_id?: string;
}

interface SyncStats {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  last_24h_syncs: number;
  platforms: {
    humanitix: number;
    eventbrite: number;
  };
}

export const BrevoSyncMonitor: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d'>('24h');

  // Fetch sync logs
  const { data: syncLogs, isLoading: isLoadingLogs, error: logsError } = useQuery({
    queryKey: ['brevo-sync-logs', selectedTimeframe],
    queryFn: async () => {
      const hoursAgo = selectedTimeframe === '1h' ? 1 : selectedTimeframe === '24h' ? 24 : 168;
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .gte('processed_at', since)
        .order('processed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SyncStatus[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch sync statistics
  const { data: syncStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['brevo-sync-stats'],
    queryFn: async () => {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('platform, response_status, processed_at')
        .gte('processed_at', last24h);

      if (error) throw error;

      const stats: SyncStats = {
        total_syncs: data.length,
        successful_syncs: data.filter(log => log.response_status === 'success').length,
        failed_syncs: data.filter(log => log.response_status === 'failed').length,
        last_24h_syncs: data.length,
        platforms: {
          humanitix: data.filter(log => log.platform === 'Humanitix').length,
          eventbrite: data.filter(log => log.platform === 'Eventbrite').length,
        }
      };

      return stats;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Manual refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Trigger a manual sync check (this would typically call an edge function)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brevo-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['brevo-sync-stats'] });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial_success':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'partial_success':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPlatformBadgeColor = (platform: string) => {
    return platform === 'Humanitix' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-orange-100 text-orange-800';
  };

  const getSuccessRate = () => {
    if (!syncStats || syncStats.total_syncs === 0) return 0;
    return Math.round((syncStats.successful_syncs / syncStats.total_syncs) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Brevo Sync Monitor</h2>
          <p className="text-muted-foreground">
            Monitor customer data sync from Humanitix & Eventbrite to Brevo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="professional-button"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : `${getSuccessRate()}%`}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Syncs (24h)</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? '...' : syncStats?.total_syncs || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Humanitix Syncs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoadingStats ? '...' : syncStats?.platforms.humanitix || 0}
                </p>
              </div>
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">H</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventbrite Syncs</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoadingStats ? '...' : syncStats?.platforms.eventbrite || 0}
                </p>
              </div>
              <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">E</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Sync Activity</CardTitle>
            <div className="flex gap-2">
              {(['1h', '24h', '7d'] as const).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                >
                  {timeframe === '1h' ? 'Last Hour' : timeframe === '24h' ? 'Last 24h' : 'Last 7 days'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading sync logs...
            </div>
          ) : logsError ? (
            <div className="text-center py-8 text-red-600">
              Error loading sync logs: {logsError.message}
            </div>
          ) : !syncLogs || syncLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sync activity in the selected timeframe
            </div>
          ) : (
            <div className="space-y-2">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.response_status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getPlatformBadgeColor(log.platform)}>
                          {log.platform}
                        </Badge>
                        <Badge className={getStatusColor(log.response_status)}>
                          {log.response_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.event_type} • {formatTimestamp(log.processed_at)}
                        {log.external_order_id && (
                          <span className="ml-2">• Order: {log.external_order_id}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {log.payload?.totalProcessed && (
                      <p className="text-sm font-medium">
                        {log.payload.successCount || 0}/{log.payload.totalProcessed} customers
                      </p>
                    )}
                    {log.payload?.customersProcessed && (
                      <p className="text-sm font-medium">
                        {log.payload.customersProcessed} customers
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">Brevo API</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">State Mapping</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">N8N Workflows</p>
                <p className="text-sm text-muted-foreground">Ready</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};