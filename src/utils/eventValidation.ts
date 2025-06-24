
import { EventFormData, RecurringSettings } from '@/types/eventTypes';

export const validateEventForm = (
  formData: EventFormData,
  recurringSettings: RecurringSettings
): { isValid: boolean; error?: string } => {
  if (!formData.title || !formData.venue || !formData.date || !formData.time) {
    return {
      isValid: false,
      error: "Please fill in all required fields."
    };
  }

  if (recurringSettings.isRecurring && recurringSettings.pattern !== 'custom' && !recurringSettings.endDate) {
    return {
      isValid: false,
      error: "Please specify when the recurring events should end."
    };
  }

  if (recurringSettings.isRecurring && recurringSettings.pattern === 'custom' && recurringSettings.customDates.length === 0) {
    return {
      isValid: false,
      error: "Please select at least one date for custom recurring events."
    };
  }

  return { isValid: true };
};
