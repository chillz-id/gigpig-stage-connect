import { supabase } from '@/integrations/supabase/client';
import { format, differenceInHours, differenceInMinutes, addHours, addDays } from 'date-fns';

export interface DeadlineReminder {
  hours_before: number;
  template_id: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MonitoringConfig {
  check_interval_minutes: number;
  reminders: DeadlineReminder[];
  enable_sms: boolean;
  enable_email: boolean;
  enable_push: boolean;
}

export class DeadlineMonitoringService {
  private static instance: DeadlineMonitoringService;
  private monitoringIntervalId: NodeJS.Timeout | null = null;
  private reminderCheckIntervalId: NodeJS.Timeout | null = null;
  
  private defaultConfig: MonitoringConfig = {
    check_interval_minutes: 15, // Check every 15 minutes
    reminders: [
      { hours_before: 24, template_id: 'deadline_24h', priority: 'medium' },
      { hours_before: 6, template_id: 'deadline_6h', priority: 'high' },
      { hours_before: 1, template_id: 'deadline_1h', priority: 'high' }
    ],
    enable_sms: true,
    enable_email: true,
    enable_push: true
  };

  private constructor() {}

  static getInstance(): DeadlineMonitoringService {
    if (!DeadlineMonitoringService.instance) {
      DeadlineMonitoringService.instance = new DeadlineMonitoringService();
    }
    return DeadlineMonitoringService.instance;
  }

  // Start monitoring deadlines
  startMonitoring(config?: Partial<MonitoringConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Stop any existing monitoring
    this.stopMonitoring();

    // Start monitoring for expired spots
    this.monitoringIntervalId = setInterval(() => {
      this.checkExpiredDeadlines().catch(error => {
        console.error('Failed to check expired deadlines:', error);
      });
    }, finalConfig.check_interval_minutes * 60 * 1000);

    // Start reminder checks
    this.reminderCheckIntervalId = setInterval(() => {
      this.sendPendingReminders(finalConfig).catch(error => {
        console.error('Failed to send reminders:', error);
      });
    }, 5 * 60 * 1000); // Check every 5 minutes for reminders

    // Run initial checks
    this.checkExpiredDeadlines();
    this.sendPendingReminders(finalConfig);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }
    if (this.reminderCheckIntervalId) {
      clearInterval(this.reminderCheckIntervalId);
      this.reminderCheckIntervalId = null;
    }
  }

  // Check for expired deadlines and handle them
  async checkExpiredDeadlines(): Promise<{ expired: number; reassigned: number }> {
    try {
      // Call the database function to handle expired spots
      const { data, error } = await supabase.rpc('handle_expired_spot_confirmations');
      
      if (error) throw error;
      
      const result = data?.[0] || { expired_count: 0, notification_count: 0 };
      
      // Trigger reassignment workflow for expired spots
      if (result.expired_count > 0) {
        await this.triggerReassignmentWorkflow(result.expired_count);
      }
      
      return { 
        expired: result.expired_count, 
        reassigned: 0 // Will be updated when reassignment is implemented
      };
    } catch (error) {
      console.error('Failed to check expired deadlines:', error);
      throw error;
    }
  }

  // Send pending reminders based on configuration
  async sendPendingReminders(config: MonitoringConfig): Promise<number> {
    let remindersSent = 0;
    
    try {
      for (const reminder of config.reminders) {
        const spots = await this.getSpotsNeedingReminder(reminder.hours_before);
        
        for (const spot of spots) {
          const sent = await this.sendReminder(spot, reminder, config);
          if (sent) remindersSent++;
        }
      }
      
      return remindersSent;
    } catch (error) {
      console.error('Failed to send reminders:', error);
      return remindersSent;
    }
  }

  // Get spots that need reminders
  private async getSpotsNeedingReminder(hoursBefore: number): Promise<any[]> {
    try {
      const now = new Date();
      const targetTime = addHours(now, hoursBefore);
      
      const { data, error } = await supabase
        .from('event_spots')
        .select(`
          id,
          spot_name,
          confirmation_deadline,
          confirmation_reminder_sent,
          comedian_id,
          event_id,
          events!inner (
            id,
            title,
            event_date,
            start_time,
            venue,
            promoter_id
          ),
          profiles!comedian_id (
            id,
            first_name,
            last_name,
            stage_name,
            email,
            phone
          )
        `)
        .eq('confirmation_status', 'pending')
        .eq('is_filled', true)
        .not('confirmation_deadline', 'is', null)
        .gte('confirmation_deadline', now.toISOString())
        .lte('confirmation_deadline', targetTime.toISOString())
        .or(`confirmation_reminder_sent.is.null,confirmation_reminder_sent->>reminder_${hoursBefore}h.neq.true`);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Failed to get spots needing reminder:', error);
      return [];
    }
  }

  // Send reminder for a specific spot
  private async sendReminder(
    spot: any, 
    reminder: DeadlineReminder,
    config: MonitoringConfig
  ): Promise<boolean> {
    try {
      if (!spot.profiles || !spot.events) return false;
      
      const deadlineTime = new Date(spot.confirmation_deadline);
      const hoursUntilDeadline = differenceInHours(deadlineTime, new Date());
      const formattedDeadline = format(deadlineTime, 'PPP p');
      
      // Create in-app notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: spot.comedian_id,
          type: 'deadline_reminder',
          title: `Confirmation Deadline: ${spot.events.title}`,
          message: `Your ${spot.spot_name} spot for "${spot.events.title}" needs confirmation within ${hoursUntilDeadline} hours (by ${formattedDeadline}).`,
          priority: reminder.priority,
          data: {
            event_id: spot.event_id,
            spot_id: spot.id,
            deadline: spot.confirmation_deadline,
            hours_remaining: hoursUntilDeadline,
            reminder_type: `${reminder.hours_before}h`
          },
          action_url: `/events/${spot.event_id}/spots/${spot.id}/confirm`,
          action_label: 'Confirm Now'
        });

      if (notifError) throw notifError;

      // Queue email if enabled
      if (config.enable_email && spot.profiles.email) {
        await this.queueEmailReminder(spot, reminder);
      }

      // Queue SMS if enabled
      if (config.enable_sms && spot.profiles.phone) {
        await this.queueSMSReminder(spot, reminder);
      }

      // Update reminder sent status
      const reminderStatus = spot.confirmation_reminder_sent || {};
      reminderStatus[`reminder_${reminder.hours_before}h`] = true;
      
      await supabase
        .from('event_spots')
        .update({ 
          confirmation_reminder_sent: reminderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', spot.id);

      return true;
    } catch (error) {
      console.error('Failed to send reminder:', error);
      return false;
    }
  }

  // Queue email reminder
  private async queueEmailReminder(spot: any, reminder: DeadlineReminder): Promise<void> {
    try {
      await supabase
        .from('email_queue')
        .insert({
          to_email: spot.profiles.email,
          template_id: reminder.template_id,
          template_data: {
            comedian_name: spot.profiles.stage_name || `${spot.profiles.first_name} ${spot.profiles.last_name}`,
            event_title: spot.events.title,
            event_date: format(new Date(spot.events.event_date), 'PPP'),
            event_time: spot.events.start_time,
            venue: spot.events.venue,
            spot_type: spot.spot_name,
            deadline: format(new Date(spot.confirmation_deadline), 'PPP p'),
            hours_remaining: differenceInHours(new Date(spot.confirmation_deadline), new Date()),
            confirmation_url: `${process.env.VITE_APP_URL}/events/${spot.event_id}/spots/${spot.id}/confirm`
          },
          priority: reminder.priority,
          scheduled_for: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to queue email reminder:', error);
    }
  }

  // Queue SMS reminder
  private async queueSMSReminder(spot: any, reminder: DeadlineReminder): Promise<void> {
    try {
      const hoursRemaining = differenceInHours(new Date(spot.confirmation_deadline), new Date());
      const message = `Stand Up Sydney: Your ${spot.spot_name} spot for "${spot.events.title}" needs confirmation within ${hoursRemaining} hours. Confirm: ${process.env.VITE_APP_URL}/confirm/${spot.id}`;
      
      await supabase
        .from('sms_queue')
        .insert({
          to_phone: spot.profiles.phone,
          message: message.substring(0, 160), // SMS limit
          priority: reminder.priority,
          scheduled_for: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to queue SMS reminder:', error);
    }
  }

  // Trigger reassignment workflow for expired spots
  private async triggerReassignmentWorkflow(expiredCount: number): Promise<void> {
    try {
      // Get expired spots that need reassignment
      const { data: expiredSpots, error } = await supabase
        .from('event_spots')
        .select(`
          id,
          spot_name,
          event_id,
          events!inner (
            id,
            title,
            event_date,
            promoter_id
          )
        `)
        .eq('confirmation_status', 'expired')
        .eq('is_filled', false)
        .is('comedian_id', null)
        .gte('events.event_date', new Date().toISOString());

      if (error) throw error;

      // Create tasks for promoters to reassign spots
      for (const spot of expiredSpots || []) {
        await supabase
          .from('tasks')
          .insert({
            title: `Reassign ${spot.spot_name} - ${spot.events.title}`,
            description: `The ${spot.spot_name} spot has expired and needs to be reassigned for the event "${spot.events.title}" on ${format(new Date(spot.events.event_date), 'PPP')}.`,
            assigned_to: spot.events.promoter_id,
            priority: 'high',
            due_date: addDays(new Date(), 1).toISOString(),
            category: 'spot_reassignment',
            metadata: {
              event_id: spot.event_id,
              spot_id: spot.id,
              spot_type: spot.spot_name
            }
          });
      }
    } catch (error) {
      console.error('Failed to trigger reassignment workflow:', error);
    }
  }

  // Get monitoring dashboard data
  async getMonitoringDashboard(promoterId: string): Promise<any> {
    try {
      // Get events with pending confirmations
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          event_spots!inner (
            id,
            spot_name,
            confirmation_status,
            confirmation_deadline,
            comedian_id,
            profiles!comedian_id (
              id,
              first_name,
              last_name,
              stage_name
            )
          )
        `)
        .eq('promoter_id', promoterId)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Calculate statistics
      const stats = {
        total_pending: 0,
        expiring_24h: 0,
        expiring_6h: 0,
        expired_today: 0,
        confirmed_today: 0
      };

      const now = new Date();
      const in24h = addHours(now, 24);
      const in6h = addHours(now, 6);
      const todayStart = new Date(now.setHours(0, 0, 0, 0));

      for (const event of events || []) {
        for (const spot of event.event_spots || []) {
          if (spot.confirmation_status === 'pending') {
            stats.total_pending++;
            
            if (spot.confirmation_deadline) {
              const deadline = new Date(spot.confirmation_deadline);
              if (deadline <= in6h) {
                stats.expiring_6h++;
              } else if (deadline <= in24h) {
                stats.expiring_24h++;
              }
            }
          } else if (spot.confirmation_status === 'expired' && 
                     new Date(spot.updated_at) >= todayStart) {
            stats.expired_today++;
          } else if (spot.confirmation_status === 'confirmed' && 
                     spot.confirmed_at && 
                     new Date(spot.confirmed_at) >= todayStart) {
            stats.confirmed_today++;
          }
        }
      }

      return {
        events,
        stats,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get monitoring dashboard:', error);
      throw error;
    }
  }

  // Extend deadline for a specific spot
  async extendDeadline(
    spotId: string, 
    newDeadline: Date, 
    promoterId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Verify promoter owns the event
      const { data: spot, error: spotError } = await supabase
        .from('event_spots')
        .select(`
          id,
          comedian_id,
          spot_name,
          events!inner (
            id,
            title,
            promoter_id
          )
        `)
        .eq('id', spotId)
        .single();

      if (spotError || !spot) throw new Error('Spot not found');
      if (spot.events.promoter_id !== promoterId) {
        throw new Error('Unauthorized to extend deadline');
      }

      // Update the deadline
      const { error: updateError } = await supabase
        .from('event_spots')
        .update({
          confirmation_deadline: newDeadline.toISOString(),
          confirmation_reminder_sent: {}, // Reset reminders
          updated_at: new Date().toISOString()
        })
        .eq('id', spotId);

      if (updateError) throw updateError;

      // Notify the comedian about the extension
      if (spot.comedian_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: spot.comedian_id,
            type: 'deadline_extended',
            title: 'Deadline Extended',
            message: `The confirmation deadline for your ${spot.spot_name} spot at "${spot.events.title}" has been extended to ${format(newDeadline, 'PPP p')}.${reason ? ` Reason: ${reason}` : ''}`,
            priority: 'high',
            data: {
              event_id: spot.events.id,
              spot_id: spot.id,
              new_deadline: newDeadline.toISOString(),
              reason
            },
            action_url: `/events/${spot.events.id}/spots/${spot.id}/confirm`,
            action_label: 'View Details'
          });
      }

      // Log the extension
      await supabase
        .from('audit_logs')
        .insert({
          user_id: promoterId,
          action: 'deadline_extended',
          resource_type: 'event_spot',
          resource_id: spotId,
          details: {
            new_deadline: newDeadline.toISOString(),
            reason
          }
        });

      return true;
    } catch (error) {
      console.error('Failed to extend deadline:', error);
      return false;
    }
  }
}

// Export singleton instance
export const deadlineMonitoringService = DeadlineMonitoringService.getInstance();