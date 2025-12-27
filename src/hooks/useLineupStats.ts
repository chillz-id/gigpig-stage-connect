/**
 * useLineupStats Hook
 *
 * Fetches and calculates lineup statistics for an event:
 * - Total spots count (performers only)
 * - Filled spots count
 * - Total duration (minutes) - performers only, excludes extras
 * - Payment breakdown (gross, tax, net) - separated by performer vs production
 * - Total paid amount
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SpotData {
  id: string;
  is_filled: boolean;
  is_paid: boolean;
  duration_minutes: number | null;
  payment_amount: number | null;
  payment_gross: number | null;
  payment_tax: number | null;
  payment_net: number | null;
  payment_status: 'unpaid' | 'pending' | 'paid' | null;
  spot_type: 'act' | 'extra' | null;
  spot_category: 'act' | 'doors' | 'intermission' | 'custom' | null;
  start_time_mode: 'included' | 'before' | null;
}

interface LineupStats {
  // Total counts
  totalSpots: number;
  filledSpots: number;
  totalDuration: number; // in minutes - performers only (excludes extras and breaks)
  showDuration: number; // in minutes - total show runtime (performers + included breaks)
  breakDuration: number; // in minutes - breaks with start_time_mode='included'

  // Performer payment breakdown
  performerGross: number;
  performerTax: number;
  performerNet: number;
  performerPaid: number;

  // Production/Extra staff payment breakdown
  productionGross: number;
  productionTax: number;
  productionNet: number;
  productionPaid: number;

  // Combined totals (for backwards compatibility)
  totalGross: number;
  totalTax: number;
  totalNet: number;
  totalPaid: number;

  // Counts by type
  performerCount: number;
  extraCount: number;
}

export function useLineupStats(eventId: string) {
  return useQuery<LineupStats>({
    queryKey: ['lineup-stats', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_spots')
        .select('id, is_filled, is_paid, duration_minutes, payment_amount, payment_gross, payment_tax, payment_net, payment_status, spot_type, spot_category, start_time_mode')
        .eq('event_id', eventId);

      if (error) {
        console.error('Failed to fetch lineup stats:', error);
        throw new Error(`Failed to fetch lineup stats: ${error.message}`);
      }

      const spots = (data || []) as SpotData[];

      // Separate performers from extras
      // Performers: spot_type is 'act' or null (legacy), and category is 'act' or null
      const performers = spots.filter(
        (spot) => (spot.spot_type === 'act' || spot.spot_type === null) &&
                  (spot.spot_category === 'act' || spot.spot_category === null)
      );

      // Extras: spot_type is 'extra'
      const extras = spots.filter((spot) => spot.spot_type === 'extra');

      // Breaks: category is not 'act' and spot_type is not 'extra'
      // Only count breaks with start_time_mode='included' (or null, defaulting to included)
      const includedBreaks = spots.filter(
        (spot) => spot.spot_category !== 'act' &&
                  spot.spot_category !== null &&
                  spot.spot_type !== 'extra' &&
                  (spot.start_time_mode === 'included' || spot.start_time_mode === null)
      );

      // Calculate performer statistics
      const performerCount = performers.length;
      const filledSpots = performers.filter((spot) => spot.is_filled === true).length;

      // Duration only from performers (not extras, not breaks)
      const totalDuration = performers.reduce(
        (sum, spot) => sum + (spot.duration_minutes || 0),
        0
      );

      // Break duration (included breaks only)
      const breakDuration = includedBreaks.reduce(
        (sum, spot) => sum + (spot.duration_minutes || 0),
        0
      );

      // Total show duration (performers + included breaks)
      const showDuration = totalDuration + breakDuration;

      // Helper function to calculate payment totals
      const calculatePaymentTotals = (spotList: SpotData[]) => {
        const gross = spotList.reduce(
          (sum, spot) => sum + (spot.payment_gross ?? spot.payment_amount ?? 0),
          0
        );
        const tax = spotList.reduce(
          (sum, spot) => sum + (spot.payment_tax ?? 0),
          0
        );
        const net = spotList.reduce(
          (sum, spot) => sum + (spot.payment_net ?? spot.payment_amount ?? 0),
          0
        );
        const paid = spotList.reduce((sum, spot) => {
          if (spot.payment_status === 'paid' || (spot.is_paid && !spot.payment_status)) {
            return sum + (spot.payment_gross ?? spot.payment_amount ?? 0);
          }
          return sum;
        }, 0);
        return { gross, tax, net, paid };
      };

      // Calculate performer payments
      const performerPayments = calculatePaymentTotals(performers);

      // Calculate production/extra payments
      const productionPayments = calculatePaymentTotals(extras);

      return {
        // Counts
        totalSpots: performerCount,
        filledSpots,
        performerCount,
        extraCount: extras.length,

        // Duration
        totalDuration, // performers only
        showDuration, // performers + included breaks
        breakDuration, // included breaks only

        // Performer breakdown
        performerGross: performerPayments.gross,
        performerTax: performerPayments.tax,
        performerNet: performerPayments.net,
        performerPaid: performerPayments.paid,

        // Production breakdown
        productionGross: productionPayments.gross,
        productionTax: productionPayments.tax,
        productionNet: productionPayments.net,
        productionPaid: productionPayments.paid,

        // Combined totals (for backwards compatibility)
        totalGross: performerPayments.gross + productionPayments.gross,
        totalTax: performerPayments.tax + productionPayments.tax,
        totalNet: performerPayments.net + productionPayments.net,
        totalPaid: performerPayments.paid + productionPayments.paid,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Format duration in minutes to human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string like "30 min", "1h", or "1h 30m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Format a time range based on start time and duration
 * @param startTime - Event start time (ISO string or Date)
 * @param durationMinutes - Duration in minutes
 * @returns Formatted string like "7:00-7:50pm" or "7:00pm-8:30pm"
 */
export function formatTimeRange(startTime: string | Date | undefined, durationMinutes: number): string | null {
  if (!startTime || durationMinutes <= 0) return null;

  try {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).toLowerCase();
    };

    const startStr = formatTime(start);
    const endStr = formatTime(end);

    // If same AM/PM, only show it once at the end
    const startAmPm = start.getHours() < 12 ? 'am' : 'pm';
    const endAmPm = end.getHours() < 12 ? 'am' : 'pm';

    if (startAmPm === endAmPm) {
      // Remove am/pm from start time
      const startTimeOnly = startStr.replace(/\s?(am|pm)$/i, '');
      return `${startTimeOnly}-${endStr}`;
    }

    return `${startStr}-${endStr}`;
  } catch {
    return null;
  }
}

/**
 * Calculate the start time for a specific spot based on event start and preceding spots
 * @param eventStartTime - Event start time (ISO string or Date)
 * @param precedingDurationMinutes - Total duration of spots before this one
 * @returns Date object for the calculated start time
 */
export function calculateSpotStartTime(eventStartTime: string | Date | undefined, precedingDurationMinutes: number): Date | null {
  if (!eventStartTime) return null;

  try {
    const start = new Date(eventStartTime);
    return new Date(start.getTime() + precedingDurationMinutes * 60 * 1000);
  } catch {
    return null;
  }
}
