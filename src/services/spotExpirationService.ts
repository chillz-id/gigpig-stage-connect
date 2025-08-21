import { supabase } from '@/integrations/supabase/client';

export class SpotExpirationService {
  private static instance: SpotExpirationService;
  private cleanupIntervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SpotExpirationService {
    if (!SpotExpirationService.instance) {
      SpotExpirationService.instance = new SpotExpirationService();
    }
    return SpotExpirationService.instance;
  }

  // Manual cleanup function
  async cleanupExpiredSpots(): Promise<{ expired_count: number; notification_count: number }> {
    try {
      const { data, error } = await supabase.rpc('handle_expired_spot_confirmations');
      
      if (error) {
        console.error('Error cleaning up expired spots:', error);
        throw error;
      }
      
      const result = data && data.length > 0 ? data[0] : { expired_count: 0, notification_count: 0 };
      
      if (result.expired_count > 0) {
        console.log(`Cleaned up ${result.expired_count} expired spots and sent ${result.notification_count} notifications`);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to cleanup expired spots:', error);
      throw error;
    }
  }

  // Start periodic cleanup (every 30 minutes)
  startPeriodicCleanup(): void {
    if (this.cleanupIntervalId) {
      this.stopPeriodicCleanup();
    }

    // Run cleanup every 30 minutes
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupExpiredSpots().catch(error => {
        console.error('Periodic cleanup failed:', error);
      });
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

    // Run initial cleanup
    this.cleanupExpiredSpots().catch(error => {
      console.error('Initial cleanup failed:', error);
    });
  }

  // Stop periodic cleanup
  stopPeriodicCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  // Get spots that are approaching expiration (within 4 hours)
  async getExpiringSpots(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('event_spots')
        .select(`
          id,
          spot_name,
          confirmation_deadline,
          events!inner (
            id,
            title,
            event_date,
            promoter_id
          ),
          profiles!comedian_id (
            id,
            name
          )
        `)
        .eq('confirmation_status', 'pending')
        .not('confirmation_deadline', 'is', null)
        .gte('confirmation_deadline', new Date().toISOString())
        .lte('confirmation_deadline', new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()) // 4 hours from now
        .eq('is_filled', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get expiring spots:', error);
      return [];
    }
  }

  // Send reminder notifications for spots expiring soon
  async sendExpirationReminders(): Promise<void> {
    try {
      const expiringSpots = await this.getExpiringSpots();
      
      for (const spot of expiringSpots) {
        if (spot.profiles && spot.events) {
          const { error } = await supabase
            .from('notifications')
            .insert({
              user_id: spot.profiles.id,
              type: 'spot_assigned',
              title: `Spot Confirmation Reminder: ${spot.events.title}`,
              message: `Your ${spot.spot_name} spot for "${spot.events.title}" expires at ${new Date(spot.confirmation_deadline).toLocaleString()}. Please confirm your availability soon.`,
              priority: 'high',
              data: {
                event_id: spot.events.id,
                spot_id: spot.id,
                spot_type: spot.spot_name,
                deadline: spot.confirmation_deadline
              },
              action_url: `/events/${spot.events.id}`,
              action_label: 'Confirm Spot'
            });

          if (error) {
            console.error('Failed to send expiration reminder:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send expiration reminders:', error);
    }
  }
}

// Export singleton instance
export const spotExpirationService = SpotExpirationService.getInstance();