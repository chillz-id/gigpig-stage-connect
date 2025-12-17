import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { customerService } from '@/services/crm/customer-service';
import {
  metaMarketingService,
  MetaMarketingConfig,
  CustomerData,
} from '@/services/metaMarketingService';

export interface SyncProgress {
  status: 'idle' | 'fetching' | 'hashing' | 'uploading' | 'complete' | 'error';
  totalCustomers: number;
  processedCustomers: number;
  successCount: number;
  errorCount: number;
  currentBatch: number;
  totalBatches: number;
  message: string;
}

export interface SyncStats {
  totalSynced: number;
  lastSyncAt: string | null;
  successRate: number;
  last24hCount: number;
  last7dCount: number;
}

const BATCH_SIZE = 10000; // Meta API limit per request

export function useMetaAudienceSync() {
  const { toast } = useToast();
  const [progress, setProgress] = useState<SyncProgress>({
    status: 'idle',
    totalCustomers: 0,
    processedCustomers: 0,
    successCount: 0,
    errorCount: 0,
    currentBatch: 0,
    totalBatches: 0,
    message: 'Ready to sync',
  });
  const [stats, setStats] = useState<SyncStats | null>(null);

  // Fetch sync statistics from database
  const fetchSyncStats = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('meta_sync_stats')
        .select('*')
        .eq('sync_type', 'audience');

      if (error) throw error;

      if (data && data.length > 0) {
        const successRow = data.find((r: any) => r.status === 'success');
        const failedRow = data.find((r: any) => r.status === 'failed');

        const totalSuccess = successRow?.count || 0;
        const totalFailed = failedRow?.count || 0;
        const total = totalSuccess + totalFailed;

        setStats({
          totalSynced: totalSuccess,
          lastSyncAt: successRow?.last_sync || null,
          successRate: total > 0 ? (totalSuccess / total) * 100 : 0,
          last24hCount: (successRow?.last_24h || 0) + (failedRow?.last_24h || 0),
          last7dCount: (successRow?.last_7d || 0) + (failedRow?.last_7d || 0),
        });
      }
    } catch (error) {
      console.error('Failed to fetch sync stats:', error);
    }
  }, []);

  // Start bulk upload of all customers
  const startBulkSync = useCallback(
    async (config: MetaMarketingConfig) => {
      if (!config.accessToken || !config.customAudienceId) {
        toast({
          title: 'Configuration Required',
          description: 'Please configure Meta access token and Custom Audience ID first.',
          variant: 'destructive',
        });
        return;
      }

      setProgress({
        status: 'fetching',
        totalCustomers: 0,
        processedCustomers: 0,
        successCount: 0,
        errorCount: 0,
        currentBatch: 0,
        totalBatches: 0,
        message: 'Fetching customer data...',
      });

      try {
        // Step 1: Fetch all customers
        const customers = await customerService.fetchAllForExport();

        const totalBatches = Math.ceil(customers.length / BATCH_SIZE);

        setProgress((prev) => ({
          ...prev,
          status: 'hashing',
          totalCustomers: customers.length,
          totalBatches,
          message: `Found ${customers.length.toLocaleString()} customers. Preparing for upload...`,
        }));

        // Step 2: Transform to CustomerData format
        const customerData: CustomerData[] = customers
          .filter((c) => c.email) // Must have email
          .map((c) => ({
            email: c.email || undefined,
            phone: c.mobile || c.phone || undefined,
            firstName: c.first_name || undefined,
            lastName: c.last_name || undefined,
            city: c.city || undefined,
            state: c.state || undefined,
            postcode: c.postcode || undefined,
            country: c.country || 'AU',
          }));

        setProgress((prev) => ({
          ...prev,
          status: 'uploading',
          message: 'Starting upload to Meta Custom Audience...',
        }));

        // Step 3: Process in batches
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < customerData.length; i += BATCH_SIZE) {
          const batch = customerData.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

          setProgress((prev) => ({
            ...prev,
            currentBatch: batchNumber,
            message: `Uploading batch ${batchNumber} of ${totalBatches}...`,
          }));

          try {
            const result = await metaMarketingService.bulkUploadCustomers(batch, config);

            if (result.success) {
              successCount += result.numReceived || batch.length;
              if (result.numInvalid) {
                errorCount += result.numInvalid;
              }
            } else {
              errorCount += batch.length;
            }
          } catch (batchError) {
            console.error(`Batch ${batchNumber} failed:`, batchError);
            errorCount += batch.length;
          }

          setProgress((prev) => ({
            ...prev,
            processedCustomers: Math.min(i + BATCH_SIZE, customerData.length),
            successCount,
            errorCount,
          }));

          // Small delay between batches to avoid rate limiting
          if (i + BATCH_SIZE < customerData.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Step 4: Update customer_profiles with sync timestamp
        const { error: updateError } = await (supabase as any)
          .from('customer_profiles')
          .update({ meta_audience_synced_at: new Date().toISOString() })
          .is('meta_audience_synced_at', null);

        if (updateError) {
          console.error('Failed to update sync timestamps:', updateError);
        }

        setProgress({
          status: 'complete',
          totalCustomers: customerData.length,
          processedCustomers: customerData.length,
          successCount,
          errorCount,
          currentBatch: totalBatches,
          totalBatches,
          message: `Sync complete! ${successCount.toLocaleString()} customers uploaded successfully.`,
        });

        toast({
          title: 'Sync Complete',
          description: `Successfully uploaded ${successCount.toLocaleString()} customers to Meta Custom Audience.`,
        });

        // Refresh stats
        fetchSyncStats();
      } catch (error) {
        console.error('Bulk sync failed:', error);

        setProgress((prev) => ({
          ...prev,
          status: 'error',
          message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));

        toast({
          title: 'Sync Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    },
    [toast, fetchSyncStats]
  );

  // Reset progress state
  const reset = useCallback(() => {
    setProgress({
      status: 'idle',
      totalCustomers: 0,
      processedCustomers: 0,
      successCount: 0,
      errorCount: 0,
      currentBatch: 0,
      totalBatches: 0,
      message: 'Ready to sync',
    });
  }, []);

  return {
    progress,
    stats,
    startBulkSync,
    fetchSyncStats,
    reset,
    isRunning: ['fetching', 'hashing', 'uploading'].includes(progress.status),
  };
}
