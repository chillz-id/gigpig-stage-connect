// Spot Confirmation Service - Handles spot assignment and confirmation workflow
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';

export interface SpotAssignmentData {
  eventId: string;
  comedianId: string;
  spotType: string;
  confirmationDeadline: string;
  performanceDuration?: string;
  specialInstructions?: string;
}

export interface SpotConfirmationData {
  eventId: string;
  comedianId: string;
  confirmed: boolean;
  reason?: string;
}

export interface SpotAssignmentDetails {
  comedian: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
    date: string;
    venue: string;
    address: string;
  };
  promoter: {
    id: string;
    name: string;
    email: string;
  };
  spot: {
    type: string;
    confirmationDeadline: string;
    performanceDuration?: string;
    specialInstructions?: string;
  };
}

class SpotConfirmationService {
  
  // =====================================
  // SPOT ASSIGNMENT
  // =====================================
  
  async assignSpot(assignmentData: SpotAssignmentData): Promise<void> {
    try {
      // Get event and comedian details
      const details = await this.getSpotAssignmentDetails(
        assignmentData.eventId, 
        assignmentData.comedianId
      );
      
      if (!details) {
        throw new Error('Could not retrieve assignment details');
      }

      // Create database record for spot assignment
      await this.createSpotAssignmentRecord(assignmentData);

      // Send notification with email
      await notificationService.notifySpotAssigned(
        assignmentData.comedianId,
        assignmentData.eventId,
        details.event.title,
        details.event.date,
        assignmentData.spotType,
        details.event.venue,
        assignmentData.confirmationDeadline,
        {
          comedianEmail: details.comedian.email,
          comedianName: details.comedian.name,
          address: details.event.address,
          promoterName: details.promoter.name,
          promoterEmail: details.promoter.email,
          performanceDuration: assignmentData.performanceDuration,
          specialInstructions: assignmentData.specialInstructions
        }
      );

      // Schedule deadline reminder
      await this.scheduleDeadlineReminder(assignmentData);
      
    } catch (error) {
      console.error('Failed to assign spot:', error);
      throw error;
    }
  }

  async assignMultipleSpots(assignments: SpotAssignmentData[]): Promise<void> {
    const promises = assignments.map(assignment => this.assignSpot(assignment));
    await Promise.all(promises);
  }

  // =====================================
  // SPOT CONFIRMATION
  // =====================================
  
  async confirmSpot(confirmationData: SpotConfirmationData): Promise<void> {
    try {
      // Get assignment details
      const details = await this.getSpotAssignmentDetails(
        confirmationData.eventId, 
        confirmationData.comedianId
      );
      
      if (!details) {
        throw new Error('Could not retrieve assignment details');
      }

      // Update database record
      await this.updateSpotConfirmationRecord(confirmationData);

      if (confirmationData.confirmed) {
        // Send confirmation notifications
        await notificationService.notifySpotConfirmed(
          details.promoter.id,
          details.comedian.id,
          details.comedian.name,
          confirmationData.eventId,
          details.event.title,
          details.event.date,
          details.spot.type,
          {
            comedianEmail: details.comedian.email,
            promoterName: details.promoter.name,
            promoterEmail: details.promoter.email,
            venue: details.event.venue,
            address: details.event.address,
            performanceDuration: details.spot.performanceDuration
          }
        );
      } else {
        // Send decline notifications
        await notificationService.notifySpotDeclined(
          details.promoter.id,
          details.comedian.id,
          details.comedian.name,
          confirmationData.eventId,
          details.event.title,
          details.event.date,
          details.spot.type,
          confirmationData.reason,
          {
            comedianEmail: details.comedian.email,
            promoterName: details.promoter.name,
            promoterEmail: details.promoter.email,
            venue: details.event.venue,
            address: details.event.address
          }
        );
      }

      // Update event lineup status
      await this.updateEventLineupStatus(confirmationData.eventId);
      
    } catch (error) {
      console.error('Failed to confirm spot:', error);
      throw error;
    }
  }

  // =====================================
  // REMINDER MANAGEMENT
  // =====================================
  
  async sendDeadlineReminder(eventId: string, comedianId: string): Promise<void> {
    try {
      const details = await this.getSpotAssignmentDetails(eventId, comedianId);
      
      if (!details) {
        throw new Error('Could not retrieve assignment details');
      }

      // Calculate hours remaining
      const now = new Date();
      const deadline = new Date(details.spot.confirmationDeadline);
      const hoursRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

      if (hoursRemaining > 0) {
        await notificationService.notifySpotConfirmationDeadline(
          comedianId,
          eventId,
          details.event.title,
          details.event.date,
          details.event.venue,
          hoursRemaining,
          {
            comedianEmail: details.comedian.email,
            comedianName: details.comedian.name,
            address: details.event.address,
            promoterName: details.promoter.name,
            promoterEmail: details.promoter.email,
            spotType: details.spot.type
          }
        );
      }
    } catch (error) {
      console.error('Failed to send deadline reminder:', error);
      throw error;
    }
  }

  async sendPendingReminders(): Promise<void> {
    try {
      // Get all pending spot assignments (not filled, but has comedian assigned)
      const { data: pendingAssignments, error } = await supabase
        .from('event_spots')
        .select(`
          event_id,
          comedian_id,
          updated_at,
          is_filled
        `)
        .eq('is_filled', false)
        .not('comedian_id', 'is', null)
        .lt('updated_at', new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()); // Assigned more than 23 hours ago

      if (error) throw error;

      // Send reminders for each pending assignment
      const reminderPromises = pendingAssignments?.map(assignment => 
        this.sendDeadlineReminder(assignment.event_id, assignment.comedian_id)
      ) || [];

      await Promise.all(reminderPromises);
    } catch (error) {
      console.error('Failed to send pending reminders:', error);
      throw error;
    }
  }

  // =====================================
  // HELPER METHODS
  // =====================================
  
  private async getSpotAssignmentDetails(eventId: string, comedianId: string): Promise<SpotAssignmentDetails | null> {
    try {
      // Get event details with venue and promoter
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          venue,
          address,
          promoter_id,
          promoter:profiles!promoter_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Get comedian details
      const { data: comedian, error: comedianError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', comedianId)
        .single();

      if (comedianError) throw comedianError;

      // Get spot assignment details from event_spots
      const { data: spotAssignment, error: spotError } = await supabase
        .from('event_spots')
        .select('spot_name, duration_minutes, is_filled, updated_at')
        .eq('event_id', eventId)
        .eq('comedian_id', comedianId)
        .single();

      if (spotError) throw spotError;

      return {
        comedian: {
          id: comedian.id,
          name: `${comedian.first_name} ${comedian.last_name}`,
          email: comedian.email
        },
        event: {
          id: event.id,
          title: event.title,
          date: event.event_date,
          venue: event.venue,
          address: event.address
        },
        promoter: {
          id: event.promoter.id,
          name: `${event.promoter.first_name} ${event.promoter.last_name}`,
          email: event.promoter.email
        },
        spot: {
          type: spotAssignment.spot_name,
          confirmationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          performanceDuration: spotAssignment.duration_minutes ? `${spotAssignment.duration_minutes} minutes` : undefined,
          specialInstructions: undefined
        }
      };
    } catch (error) {
      console.error('Failed to get spot assignment details:', error);
      return null;
    }
  }

  private async createSpotAssignmentRecord(assignmentData: SpotAssignmentData): Promise<void> {
    // Find an existing spot or create a new one
    const { data: existingSpot, error: findError } = await supabase
      .from('event_spots')
      .select('*')
      .eq('event_id', assignmentData.eventId)
      .eq('spot_name', assignmentData.spotType)
      .is('comedian_id', null)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (existingSpot) {
      // Update existing spot with comedian assignment
      const { error } = await supabase
        .from('event_spots')
        .update({
          comedian_id: assignmentData.comedianId,
          is_filled: false, // pending confirmation
          duration_minutes: assignmentData.performanceDuration ? parseInt(assignmentData.performanceDuration) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSpot.id);

      if (error) throw error;
    } else {
      // Create new spot with assignment
      const { error } = await supabase
        .from('event_spots')
        .insert([{
          event_id: assignmentData.eventId,
          comedian_id: assignmentData.comedianId,
          spot_name: assignmentData.spotType,
          duration_minutes: assignmentData.performanceDuration ? parseInt(assignmentData.performanceDuration) : null,
          payment_amount: 0,
          currency: 'AUD',
          spot_order: 1,
          is_filled: false, // pending confirmation
          is_paid: false
        }]);

      if (error) throw error;
    }
  }

  private async updateSpotConfirmationRecord(confirmationData: SpotConfirmationData): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (confirmationData.confirmed) {
      updateData.is_filled = true;
    } else {
      updateData.is_filled = false;
      updateData.comedian_id = null; // Clear assignment when declined
    }

    const { error } = await supabase
      .from('event_spots')
      .update(updateData)
      .eq('event_id', confirmationData.eventId)
      .eq('comedian_id', confirmationData.comedianId);

    if (error) throw error;
  }

  private async scheduleDeadlineReminder(assignmentData: SpotAssignmentData): Promise<void> {
    // In a real implementation, this would schedule a background job
    // For now, we'll just log that a reminder should be scheduled
    console.log('Scheduling deadline reminder for:', {
      eventId: assignmentData.eventId,
      comedianId: assignmentData.comedianId,
      deadline: assignmentData.confirmationDeadline
    });
  }

  private async updateEventLineupStatus(eventId: string): Promise<void> {
    try {
      // Get event with total spots and confirmed spots
      const { data: eventData, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          promoter_id
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Get total spots and confirmed spots count
      const [totalSpotsResult, confirmedSpotsResult] = await Promise.all([
        supabase
          .from('event_spots')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId),
        supabase
          .from('event_spots')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('is_filled', true)
      ]);

      const totalSpots = totalSpotsResult.count || 0;
      const confirmedSpots = confirmedSpotsResult.count || 0;

      if (totalSpots > 0) {
        // Notify promoter about lineup progress
        await notificationService.notifyEventLineupComplete(
          eventData.promoter_id,
          eventId,
          eventData.title || 'Event',
          eventData.event_date || new Date().toISOString(),
          totalSpots,
          confirmedSpots
        );
      }
    } catch (error) {
      console.error('Failed to update event lineup status:', error);
    }
  }
}

export const spotConfirmationService = new SpotConfirmationService();