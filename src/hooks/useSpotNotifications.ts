import { useState, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { spotConfirmationService, SpotAssignmentData, SpotConfirmationData } from '@/services/spotConfirmationService';
import { toast } from '@/hooks/use-toast';

export interface UseSpotNotificationsReturn {
  // Loading states
  isAssigning: boolean;
  isConfirming: boolean;
  isSendingReminder: boolean;
  
  // Actions
  assignSpot: (data: SpotAssignmentData) => Promise<void>;
  confirmSpot: (data: SpotConfirmationData) => Promise<void>;
  sendDeadlineReminder: (eventId: string, comedianId: string) => Promise<void>;
  sendPendingReminders: () => Promise<void>;
  
  // Bulk actions
  assignMultipleSpots: (assignments: SpotAssignmentData[]) => Promise<void>;
}

export function useSpotNotifications(): UseSpotNotificationsReturn {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const assignSpot = useCallback(async (data: SpotAssignmentData) => {
    setIsAssigning(true);
    try {
      await spotConfirmationService.assignSpot(data);
      toast({
        title: "Spot Assigned",
        description: "The comedian has been notified about their spot assignment.",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to assign spot:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign spot. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsAssigning(false);
    }
  }, []);

  const confirmSpot = useCallback(async (data: SpotConfirmationData) => {
    setIsConfirming(true);
    try {
      await spotConfirmationService.confirmSpot(data);
      const message = data.confirmed 
        ? "Spot confirmed successfully. The promoter has been notified."
        : "Spot declined. The promoter has been notified.";
      
      toast({
        title: data.confirmed ? "Spot Confirmed" : "Spot Declined",
        description: message,
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to confirm spot:', error);
      toast({
        title: "Confirmation Failed",
        description: "Failed to process spot confirmation. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsConfirming(false);
    }
  }, []);

  const sendDeadlineReminder = useCallback(async (eventId: string, comedianId: string) => {
    setIsSendingReminder(true);
    try {
      await spotConfirmationService.sendDeadlineReminder(eventId, comedianId);
      toast({
        title: "Reminder Sent",
        description: "Deadline reminder has been sent to the comedian.",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to send reminder:', error);
      toast({
        title: "Reminder Failed",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSendingReminder(false);
    }
  }, []);

  const sendPendingReminders = useCallback(async () => {
    setIsSendingReminder(true);
    try {
      await spotConfirmationService.sendPendingReminders();
      toast({
        title: "Reminders Sent",
        description: "All pending reminders have been sent.",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to send pending reminders:', error);
      toast({
        title: "Reminders Failed",
        description: "Failed to send some reminders. Please check the logs.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSendingReminder(false);
    }
  }, []);

  const assignMultipleSpots = useCallback(async (assignments: SpotAssignmentData[]) => {
    setIsAssigning(true);
    try {
      await spotConfirmationService.assignMultipleSpots(assignments);
      toast({
        title: "Spots Assigned",
        description: `${assignments.length} spot assignments have been sent out.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to assign multiple spots:', error);
      toast({
        title: "Bulk Assignment Failed",
        description: "Failed to assign some spots. Please check the logs.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsAssigning(false);
    }
  }, []);

  return {
    isAssigning,
    isConfirming,
    isSendingReminder,
    assignSpot,
    confirmSpot,
    sendDeadlineReminder,
    sendPendingReminders,
    assignMultipleSpots
  };
}

// Additional utility hooks for specific use cases

export function useSpotAssignment() {
  const { assignSpot, assignMultipleSpots, isAssigning } = useSpotNotifications();
  
  return {
    assignSpot,
    assignMultipleSpots,
    isAssigning
  };
}

export function useSpotConfirmation() {
  const { confirmSpot, isConfirming } = useSpotNotifications();
  
  return {
    confirmSpot,
    isConfirming
  };
}

export function useSpotReminders() {
  const { sendDeadlineReminder, sendPendingReminders, isSendingReminder } = useSpotNotifications();
  
  return {
    sendDeadlineReminder,
    sendPendingReminders,
    isSendingReminder
  };
}