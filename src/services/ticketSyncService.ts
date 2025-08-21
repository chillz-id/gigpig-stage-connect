/**
 * Unified Ticket Sync Service for managing multi-platform ticket sales
 * Coordinates between Humanitix, Eventbrite, and other platforms
 */

import { supabase } from '@/integrations/supabase/client';
import { humanitixApiService } from './humanitixApiService';
import { eventbriteApiService } from './eventbriteApiService';
import { PlatformType } from '@/types/ticketSales';

export interface TicketSyncConfig {
  eventId: string;
  platforms: Array<{
    platform: PlatformType;
    externalEventId: string;
    isPrimary?: boolean;
  }>;
  syncInterval?: number; // in minutes
  webhookSecret?: string;
}

export interface SyncResult {
  success: boolean;
  platform: PlatformType;
  eventId: string;
  externalEventId: string;
  ticketsSold: number;
  grossRevenue: number;
  error?: string;
  lastSync: string;
}

export interface WebhookEvent {
  platform: PlatformType;
  eventType: string;
  payload: any;
  signature?: string;
  timestamp: string;
}

class TicketSyncService {
  private syncIntervals: Map<string, NodeJS.Timer> = new Map();

  // ==================================
  // SYNC ORCHESTRATION
  // ==================================

  async syncAllPlatforms(eventId: string): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    try {
      // Get all ticket platforms for this event
      const { data: platforms, error } = await supabase
        .from('ticket_platforms')
        .select('*')
        .eq('event_id', eventId);

      if (error) {
        throw error;
      }

      if (!platforms || platforms.length === 0) {
        console.log(`No ticket platforms configured for event ${eventId}`);
        
        // In mock mode, create demo platforms for testing
        if (!import.meta.env?.VITE_HUMANITIX_API_KEY || !import.meta.env?.VITE_EVENTBRITE_API_KEY) {
          console.log('Running in mock mode - creating demo platforms');
          await this.addPlatform(eventId, 'humanitix', 'mock-event-123', 'https://events.humanitix.com/mock-event');
          await this.addPlatform(eventId, 'eventbrite', '123456789', 'https://www.eventbrite.com/e/mock-event');
          
          // Re-fetch platforms
          const { data: mockPlatforms } = await supabase
            .from('ticket_platforms')
            .select('*')
            .eq('event_id', eventId);
          
          if (mockPlatforms) {
            for (const platform of mockPlatforms) {
              try {
                const result = await this.syncPlatform(
                  platform.platform as PlatformType,
                  eventId,
                  platform.external_event_id
                );
                results.push(result);
              } catch (error) {
                console.error(`Error syncing mock platform ${platform.platform}:`, error);
              }
            }
          }
        }
        
        return results;
      }

      // Sync each platform
      for (const platform of platforms) {
        try {
          const result = await this.syncPlatform(
            platform.platform as PlatformType,
            eventId,
            platform.external_event_id
          );
          results.push(result);
        } catch (error) {
          console.error(`Error syncing platform ${platform.platform}:`, error);
          results.push({
            success: false,
            platform: platform.platform as PlatformType,
            eventId,
            externalEventId: platform.external_event_id,
            ticketsSold: 0,
            grossRevenue: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastSync: new Date().toISOString(),
          });
        }
      }

      // Update event totals after all platforms are synced
      await this.updateEventTotals(eventId);

      return results;
    } catch (error) {
      console.error('Error syncing all platforms:', error);
      throw error;
    }
  }

  private async syncPlatform(
    platform: PlatformType,
    eventId: string,
    externalEventId: string
  ): Promise<SyncResult> {
    const startTime = new Date().toISOString();
    
    try {
      switch (platform) {
        case 'humanitix':
          await humanitixApiService.syncEventTicketSales(eventId, externalEventId);
          break;
        case 'eventbrite':
          await eventbriteApiService.syncEventTicketSales(eventId, externalEventId);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Get updated platform data
      const { data: platformData } = await supabase
        .from('ticket_platforms')
        .select('*')
        .eq('event_id', eventId)
        .eq('platform', platform)
        .eq('external_event_id', externalEventId)
        .single();

      return {
        success: true,
        platform,
        eventId,
        externalEventId,
        ticketsSold: platformData?.tickets_sold || 0,
        grossRevenue: platformData?.gross_sales || 0,
        lastSync: startTime,
      };
    } catch (error) {
      console.error(`Error syncing ${platform} platform:`, error);
      return {
        success: false,
        platform,
        eventId,
        externalEventId,
        ticketsSold: 0,
        grossRevenue: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastSync: startTime,
      };
    }
  }

  // ==================================
  // SCHEDULED SYNC
  // ==================================

  startScheduledSync(config: TicketSyncConfig): void {
    const { eventId, syncInterval = 15 } = config; // Default 15 minutes
    
    // Clear existing interval if it exists
    this.stopScheduledSync(eventId);

    // Start new interval
    const interval = setInterval(async () => {
      console.log(`Starting scheduled sync for event ${eventId}`);
      try {
        const results = await this.syncAllPlatforms(eventId);
        console.log(`Scheduled sync completed for event ${eventId}:`, results);
      } catch (error) {
        console.error(`Scheduled sync failed for event ${eventId}:`, error);
      }
    }, syncInterval * 60 * 1000); // Convert minutes to milliseconds

    this.syncIntervals.set(eventId, interval);
    console.log(`Scheduled sync started for event ${eventId} (every ${syncInterval} minutes)`);
  }

  stopScheduledSync(eventId: string): void {
    const interval = this.syncIntervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(eventId);
      console.log(`Scheduled sync stopped for event ${eventId}`);
    }
  }

  stopAllScheduledSyncs(): void {
    for (const [eventId, interval] of this.syncIntervals) {
      clearInterval(interval);
      console.log(`Scheduled sync stopped for event ${eventId}`);
    }
    this.syncIntervals.clear();
  }

  // ==================================
  // WEBHOOK HANDLING
  // ==================================

  async handleWebhook(webhookEvent: WebhookEvent): Promise<void> {
    try {
      const { platform, eventType, payload, signature } = webhookEvent;
      
      console.log(`Processing webhook for ${platform}: ${eventType}`);

      // Verify webhook signature if provided
      if (signature) {
        const isValid = await this.verifyWebhookSignature(platform, payload, signature);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Route to appropriate platform handler
      switch (platform) {
        case 'humanitix':
          await humanitixApiService.handleWebhook(payload);
          break;
        case 'eventbrite':
          await eventbriteApiService.handleWebhook(payload);
          break;
        default:
          console.warn(`Unhandled webhook platform: ${platform}`);
      }

      // Log webhook event
      await this.logWebhookEvent(webhookEvent);
    } catch (error) {
      console.error('Error handling webhook:', error);
      await this.logWebhookEvent(webhookEvent, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async verifyWebhookSignature(
    platform: PlatformType,
    payload: any,
    signature: string
  ): Promise<boolean> {
    const secret = import.meta.env?.[`VITE_${platform.toUpperCase()}_WEBHOOK_SECRET`] || '';
    
    switch (platform) {
      case 'humanitix':
        return humanitixApiService.verifyWebhookSignature(JSON.stringify(payload), signature, secret);
      case 'eventbrite':
        return eventbriteApiService.verifyWebhookSignature(JSON.stringify(payload), signature);
      default:
        return false;
    }
  }

  private async logWebhookEvent(webhookEvent: WebhookEvent, error?: string): Promise<void> {
    try {
      const { error: logError } = await supabase
        .from('webhook_logs')
        .insert({
          platform: webhookEvent.platform,
          event_type: webhookEvent.eventType,
          payload: webhookEvent.payload,
          signature: webhookEvent.signature,
          timestamp: webhookEvent.timestamp,
          processed: !error,
          error_message: error,
        });

      if (logError) {
        console.error('Error logging webhook event:', logError);
      }
    } catch (err) {
      console.error('Error logging webhook event:', err);
    }
  }

  // ==================================
  // PLATFORM MANAGEMENT
  // ==================================

  async addPlatform(
    eventId: string,
    platform: PlatformType,
    externalEventId: string,
    externalUrl?: string,
    isPrimary?: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ticket_platforms')
        .insert({
          event_id: eventId,
          platform,
          external_event_id: externalEventId,
          external_event_url: externalUrl,
          is_primary: isPrimary || false,
        });

      if (error) {
        throw error;
      }

      // Perform initial sync
      await this.syncPlatform(platform, eventId, externalEventId);
      
      console.log(`Added ${platform} platform for event ${eventId}`);
    } catch (error) {
      console.error('Error adding platform:', error);
      throw error;
    }
  }

  async removePlatform(eventId: string, platform: PlatformType): Promise<void> {
    try {
      const { error } = await supabase
        .from('ticket_platforms')
        .delete()
        .eq('event_id', eventId)
        .eq('platform', platform);

      if (error) {
        throw error;
      }

      // Stop scheduled sync if this was the last platform
      const { data: remainingPlatforms } = await supabase
        .from('ticket_platforms')
        .select('id')
        .eq('event_id', eventId);

      if (!remainingPlatforms || remainingPlatforms.length === 0) {
        this.stopScheduledSync(eventId);
      }

      console.log(`Removed ${platform} platform for event ${eventId}`);
    } catch (error) {
      console.error('Error removing platform:', error);
      throw error;
    }
  }

  async updatePlatform(
    eventId: string,
    platform: PlatformType,
    updates: {
      externalEventId?: string;
      externalUrl?: string;
      isPrimary?: boolean;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ticket_platforms')
        .update({
          external_event_id: updates.externalEventId,
          external_event_url: updates.externalUrl,
          is_primary: updates.isPrimary,
        })
        .eq('event_id', eventId)
        .eq('platform', platform);

      if (error) {
        throw error;
      }

      // Re-sync if external event ID changed
      if (updates.externalEventId) {
        await this.syncPlatform(platform, eventId, updates.externalEventId);
      }

      console.log(`Updated ${platform} platform for event ${eventId}`);
    } catch (error) {
      console.error('Error updating platform:', error);
      throw error;
    }
  }

  // ==================================
  // ANALYTICS AND REPORTING
  // ==================================

  async getSyncStatus(eventId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('event_ticket_summary')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        throw error;
      }

      return {
        eventId,
        totalTicketsSold: data.total_tickets_sold,
        totalGrossRevenue: data.total_gross_sales,
        platformCount: data.platforms_count,
        platforms: data.platform_breakdown,
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  async getSyncHistory(eventId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ticket_sales_log')
        .select(`
          *,
          ticket_platforms (platform, external_event_id)
        `)
        .eq('ticket_platforms.event_id', eventId)
        .order('sync_timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting sync history:', error);
      throw error;
    }
  }

  // ==================================
  // UTILITY METHODS
  // ==================================

  private async updateEventTotals(eventId: string): Promise<void> {
    try {
      // The database function handles this automatically, but we can also do it manually
      const { data: platforms, error } = await supabase
        .from('ticket_platforms')
        .select('tickets_sold, gross_sales')
        .eq('event_id', eventId);

      if (error) {
        throw error;
      }

      const totalTicketsSold = platforms?.reduce((sum, p) => sum + (p.tickets_sold || 0), 0) || 0;
      const totalGrossSales = platforms?.reduce((sum, p) => sum + (p.gross_sales || 0), 0) || 0;
      const platformsCount = platforms?.length || 0;

      const { error: updateError } = await supabase
        .from('events')
        .update({
          total_tickets_sold: totalTicketsSold,
          total_gross_sales: totalGrossSales,
          platforms_count: platformsCount,
        })
        .eq('id', eventId);

      if (updateError) {
        throw updateError;
      }
    } catch (error) {
      console.error('Error updating event totals:', error);
      throw error;
    }
  }

  // ==================================
  // INITIALIZATION
  // ==================================

  async initializeEventSync(eventId: string): Promise<void> {
    try {
      // Get all platforms for this event
      const { data: platforms, error } = await supabase
        .from('ticket_platforms')
        .select('*')
        .eq('event_id', eventId);

      if (error) {
        throw error;
      }

      if (!platforms || platforms.length === 0) {
        console.log(`No platforms configured for event ${eventId}`);
        return;
      }

      // Perform initial sync
      await this.syncAllPlatforms(eventId);

      // Start scheduled sync
      this.startScheduledSync({
        eventId,
        platforms: platforms.map(p => ({
          platform: p.platform as PlatformType,
          externalEventId: p.external_event_id,
          isPrimary: p.is_primary,
        })),
      });

      console.log(`Initialized sync for event ${eventId} with ${platforms.length} platforms`);
    } catch (error) {
      console.error('Error initializing event sync:', error);
      throw error;
    }
  }
}

export const ticketSyncService = new TicketSyncService();