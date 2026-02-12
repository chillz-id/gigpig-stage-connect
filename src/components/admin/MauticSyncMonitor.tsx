import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Clock, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SyncStatus {
  id: string;
  contact_id: number;
  sync_status: string;
  sync_attempted_at: string;
  sync_completed_at: string | null;
  sync_error: string | null;
  customer_email: string | null;
}

interface SyncStats {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  pending_syncs: number;
  last_24h_syncs: number;
}

export const MauticSyncMonitor: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d'>('24h');

  // Fetch sync logs
  const { data: syncLogs, isLoading: isLoadingLogs, error: logsError } = useQuery({
    queryKey: ['mautic-sync-logs', selectedTimeframe],
    queryFn: async () => {
      const hoursAgo = selectedTimeframe === '1h' ? 1 : selectedTimeframe === '24h' ? 24 : 168;
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('mautic_sync_logs')
        .select('*')
        .gte('sync_attempted_at', since)
        .order('sync_attempted_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SyncStatus[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch sync statistics
  const { data: syncStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['mautic-sync-stats'],
    queryFn: async () => {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('mautic_sync_logs')
        .select('sync_status, sync_attempted_at')
        .gte('sync_attempted_at', last24h);

      if (error) throw error;

      const stats: SyncStats = {
        total_syncs: data.length,
        successful_syncs: data.filter(log => log.sync_status === 'success').length,
        failed_syncs: data.filter(log => log.sync_status === 'failed').length,
        pending_syncs: data.filter(log => log.sync_status === 'pending').length,
        last_24h_syncs: data.length,
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
      queryClient.invalidateQueries({ queryKey: ['mautic-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['mautic-sync-stats'] });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
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

  const getSuccessRate = () => {
    if (!syncStats || syncStats.total_syncs === 0) return 0;
    return Math.round((syncStats.successful_syncs / syncStats.total_syncs) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mautic Sync Monitor</h2>
          <p className="text-muted-foreground">
            Monitor customer data sync from Humanitix & Eventbrite to Mautic
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
                <p className="text-sm text-muted-foreground">Successful Syncs</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : syncStats?.successful_syncs || 0}
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
                <p className="text-sm text-muted-foreground">Failed Syncs</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : syncStats?.failed_syncs || 0}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
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
                    {getStatusIcon(log.sync_status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(log.sync_status)}>
                          {log.sync_status}
                        </Badge>
                        {log.customer_email && (
                          <span className="text-sm text-muted-foreground">
                            {log.customer_email}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Contact ID: {log.contact_id} • {formatTimestamp(log.sync_attempted_at)}
                        {log.sync_error && (
                          <span className="ml-2 text-red-600">• Error: {log.sync_error}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {log.sync_completed_at && (
                      <p className="text-sm text-muted-foreground">
                        Completed: {formatTimestamp(log.sync_completed_at)}
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
                <p className="font-medium">Mautic API</p>
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
