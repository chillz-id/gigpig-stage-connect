/**
 * @deprecated This file is deprecated. Use '@/types/events.unified' instead.
 * 
 * This file re-exports from the unified event types for backward compatibility.
 * All new code should import directly from events.unified.ts
 */

export { 
  EventFormData,
  EventTicket,
  EventSpot,
  PerformanceType 
} from './events.unified';

// Legacy types maintained for backward compatibility
export interface CustomDate {
  date: Date;
  times: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export interface RecurringSettings {
  isRecurring: boolean;
  pattern: string;
  endDate: string;
  customDates: CustomDate[];
}

// Legacy EventSpot interface with old field names
// New code should use EventSpot from events.unified.ts
export interface LegacyEventSpot {
  spot_name: string;
  is_paid: boolean;
  payment_amount?: number;
  currency: string;
  duration_minutes?: number;
  payment_type?: 'flat_fee' | 'percentage_ticket_sales' | 'percentage_door_sales';
}

export interface EventCost {
  cost_name: string;
  is_percentage: boolean;
  amount: number;
  currency: string;
}