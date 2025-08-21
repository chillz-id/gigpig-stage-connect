import { z } from 'zod';
import { EventFormData, RecurringSettings, CustomDate } from '@/types/eventTypes';
import { format, isAfter, isBefore, addHours, parseISO, startOfDay } from 'date-fns';

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

// Individual field validators
export const eventValidators = {
  // Title validation
  title: (value: string): string[] => {
    const errors: string[] = [];
    if (!value || value.trim().length === 0) {
      errors.push('Event title is required');
    } else if (value.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    } else if (value.trim().length > 100) {
      errors.push('Title must be less than 100 characters');
    }
    return errors;
  },

  // Date validation
  date: (value: string): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!value) {
      errors.push('Event date is required');
      return { errors, warnings };
    }

    try {
      const eventDate = parseISO(value);
      const today = startOfDay(new Date());
      
      // Check if date is in the past
      if (isBefore(eventDate, today)) {
        errors.push('Event date cannot be in the past');
      }
      
      // Warn if event is too far in the future
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      if (isAfter(eventDate, sixMonthsFromNow)) {
        warnings.push('Event is scheduled more than 6 months in the future');
      }
      
      // Warn if event is very soon
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (isAfter(eventDate, today) && isBefore(eventDate, tomorrow)) {
        warnings.push('Event is scheduled for tomorrow - ensure venue and performers are confirmed');
      }
    } catch (e) {
      errors.push('Invalid date format');
    }
    
    return { errors, warnings };
  },

  // Time validation
  time: (startTime: string, endTime?: string): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!startTime) {
      errors.push('Event start time is required');
      return { errors, warnings };
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      errors.push('Invalid start time format (use HH:MM)');
    }

    if (endTime && !timeRegex.test(endTime)) {
      errors.push('Invalid end time format (use HH:MM)');
    }

    // Check if end time is after start time
    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        errors.push('End time must be after start time');
      }
      
      // Warn if event is very long
      const duration = endMinutes - startMinutes;
      if (duration > 360) { // 6 hours
        warnings.push('Event duration is over 6 hours - is this intentional?');
      }
    }

    // Warn about late night events
    if (startTime) {
      const [hour] = startTime.split(':').map(Number);
      if (hour >= 22 || hour < 6) {
        warnings.push('Event starts very late/early - ensure venue availability');
      }
    }

    return { errors, warnings };
  },

  // Venue validation
  venue: (venue: string, address: string): string[] => {
    const errors: string[] = [];
    
    if (!venue || venue.trim().length === 0) {
      errors.push('Venue name is required');
    }
    
    if (!address || address.trim().length === 0) {
      errors.push('Venue address is required');
    } else if (address.trim().length < 10) {
      errors.push('Please provide a complete address');
    }
    
    return errors;
  },

  // Capacity validation
  capacity: (capacity: number, spots: number): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (capacity <= 0) {
      errors.push('Capacity must be greater than 0');
    }
    
    if (capacity < spots) {
      errors.push('Venue capacity cannot be less than the number of performer spots');
    }
    
    if (capacity > 1000) {
      warnings.push('Large venue capacity - ensure adequate facilities and staffing');
    }
    
    if (capacity < 20) {
      warnings.push('Small venue capacity - consider if this meets your event needs');
    }
    
    return { errors, warnings };
  },

  // Ticketing validation
  ticketing: (ticketingType: string, externalUrl?: string, tickets?: any[]): string[] => {
    const errors: string[] = [];
    
    if (ticketingType === 'external' && (!externalUrl || !externalUrl.trim())) {
      errors.push('External ticket URL is required when using external ticketing');
    }
    
    if (ticketingType === 'external' && externalUrl) {
      try {
        new URL(externalUrl);
      } catch {
        errors.push('Please provide a valid ticket URL');
      }
    }
    
    if (ticketingType === 'internal' && (!tickets || tickets.length === 0)) {
      errors.push('At least one ticket type is required for internal ticketing');
    }
    
    return errors;
  },

  // Recurring events validation
  recurring: (settings: RecurringSettings): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!settings.isRecurring) return { errors, warnings };
    
    if (settings.pattern !== 'custom' && !settings.endDate) {
      errors.push('End date is required for recurring events');
    }
    
    if (settings.pattern === 'custom' && settings.customDates.length === 0) {
      errors.push('At least one date must be selected for custom recurring events');
    }
    
    // Check custom dates
    if (settings.pattern === 'custom') {
      const today = startOfDay(new Date());
      const pastDates = settings.customDates.filter(cd => 
        isBefore(parseISO(cd.date.toString()), today)
      );
      
      if (pastDates.length > 0) {
        errors.push(`${pastDates.length} selected date(s) are in the past`);
      }
    }
    
    // Warn about many recurring events
    if (settings.pattern === 'weekly' && settings.endDate) {
      const start = new Date();
      const end = parseISO(settings.endDate);
      const weeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      if (weeks > 26) {
        warnings.push(`This will create ${weeks} events over 6+ months`);
      }
    }
    
    return { errors, warnings };
  }
};

// Main validation function
export const validateEventFormEnhanced = (
  formData: EventFormData,
  recurringSettings: RecurringSettings
): ValidationResult => {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  
  // Title validation
  const titleErrors = eventValidators.title(formData.title);
  if (titleErrors.length > 0) errors.title = titleErrors;
  
  // Date validation
  const dateValidation = eventValidators.date(formData.date);
  if (dateValidation.errors.length > 0) errors.date = dateValidation.errors;
  if (dateValidation.warnings.length > 0) warnings.date = dateValidation.warnings;
  
  // Time validation
  const timeValidation = eventValidators.time(formData.time, formData.endTime);
  if (timeValidation.errors.length > 0) errors.time = timeValidation.errors;
  if (timeValidation.warnings.length > 0) warnings.time = timeValidation.warnings;
  
  // Venue validation
  const venueErrors = eventValidators.venue(formData.venue, formData.address);
  if (venueErrors.length > 0) errors.venue = venueErrors;
  
  // Capacity validation
  if (formData.capacity > 0) {
    const capacityValidation = eventValidators.capacity(formData.capacity, formData.spots);
    if (capacityValidation.errors.length > 0) errors.capacity = capacityValidation.errors;
    if (capacityValidation.warnings.length > 0) warnings.capacity = capacityValidation.warnings;
  }
  
  // Ticketing validation
  const ticketingErrors = eventValidators.ticketing(
    formData.ticketingType,
    formData.externalTicketUrl,
    formData.tickets
  );
  if (ticketingErrors.length > 0) errors.ticketing = ticketingErrors;
  
  // Recurring events validation
  const recurringValidation = eventValidators.recurring(recurringSettings);
  if (recurringValidation.errors.length > 0) errors.recurring = recurringValidation.errors;
  if (recurringValidation.warnings.length > 0) warnings.recurring = recurringValidation.warnings;
  
  // Check for duplicate events (warning)
  if (formData.title && formData.date && formData.venue) {
    warnings.duplicate = [
      'Tip: Check if a similar event already exists to avoid duplicates'
    ];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
};

// Real-time field validation helper
export const validateField = (
  fieldName: keyof EventFormData,
  value: any,
  formData?: EventFormData,
  recurringSettings?: RecurringSettings
): { errors: string[], warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  switch (fieldName) {
    case 'title':
      return { errors: eventValidators.title(value as string), warnings: [] };
      
    case 'date':
      return eventValidators.date(value as string);
      
    case 'time':
      return eventValidators.time(value as string, formData?.endTime);
      
    case 'endTime':
      return eventValidators.time(formData?.time || '', value as string);
      
    case 'venue':
      return { 
        errors: eventValidators.venue(value as string, formData?.address || ''), 
        warnings: [] 
      };
      
    case 'address':
      return { 
        errors: eventValidators.venue(formData?.venue || '', value as string), 
        warnings: [] 
      };
      
    case 'capacity':
      return eventValidators.capacity(value as number, formData?.spots || 0);
      
    case 'externalTicketUrl':
      if (formData?.ticketingType === 'external') {
        return { 
          errors: eventValidators.ticketing('external', value as string), 
          warnings: [] 
        };
      }
      break;
  }
  
  return { errors, warnings };
};

// Check if form has unsaved changes
export const hasUnsavedChanges = (
  currentData: EventFormData,
  originalData: EventFormData,
  currentSpots: any[],
  originalSpots: any[],
  currentRecurring: RecurringSettings,
  originalRecurring: RecurringSettings
): boolean => {
  // Compare form data
  const formChanged = JSON.stringify(currentData) !== JSON.stringify(originalData);
  
  // Compare spots
  const spotsChanged = JSON.stringify(currentSpots) !== JSON.stringify(originalSpots);
  
  // Compare recurring settings
  const recurringChanged = JSON.stringify(currentRecurring) !== JSON.stringify(originalRecurring);
  
  return formChanged || spotsChanged || recurringChanged;
};