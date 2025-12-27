/**
 * useLineupStats Hook
 *
 * Fetches and calculates lineup statistics for an event:
 * - Total spots count (performers only)
 * - Filled spots count
 * - Total duration (minutes) - performers only, excludes extras
 * - Payment breakdown (gross, tax, net) - separated by performer vs production
 * - Total paid amount
 * - Line items breakdown per spot
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GstType } from '@/types/spot';
import { GST_RATE } from '@/types/spot';

interface SpotData {
  id: string;
  is_filled: boolean;
  is_paid: boolean;
  duration_minutes: number | null;
  payment_amount: number | null;
  payment_gross: number | null;
  payment_tax: number | null;
  payment_net: number | null;
  payment_gst_type: GstType | null;
  payment_status: 'unpaid' | 'pending' | 'paid' | null;
  spot_type: 'act' | 'extra' | null;
  spot_category: 'act' | 'doors' | 'intermission' | 'custom' | null;
  start_time_mode: 'included' | 'before' | null;
}

interface LineItemData {
  id: string;
  event_spot_id: string;
  label: string;
  amount: number;
  gst_type: GstType;
}

interface LineupStats {
  // Total counts
  totalSpots: number;
  filledSpots: number;
  totalDuration: number; // in minutes - performers only (excludes extras and breaks)
  showDuration: number; // in minutes - total show runtime (performers + included breaks)
  breakDuration: number; // in minutes - breaks with start_time_mode='included'

  // Performer payment breakdown (base payment + line items)
  performerGross: number;
  performerTax: number;
  performerNet: number;
  performerPaid: number;

  // Production/Extra staff payment breakdown (base payment + line items)
  productionGross: number;
  productionTax: number;
  productionNet: number;
  productionPaid: number;

  // Line items breakdown (included in performer/production totals)
  lineItemsGross: number;
  lineItemsTax: number;
  lineItemsNet: number;
  lineItemsCount: number;

  // Combined totals (for backwards compatibility)
  totalGross: number;
  totalTax: number;
  totalNet: number;
  totalPaid: number;

  // Counts by type
  performerCount: number;
  extraCount: number;
}

/**
 * Calculate GST breakdown for a single amount based on GST type
 */
function calculateGstBreakdown(amount: number, gstType: GstType | null): { gross: number; tax: number; net: number } {
  if (!gstType || gstType === 'excluded') {
    // No GST - amount is the net/gross
    return { gross: amount, tax: 0, net: amount };
  } else if (gstType === 'included') {
    // GST is included in the amount
    const net = amount / (1 + GST_RATE);
    const tax = amount - net;
    return { gross: amount, tax, net };
  } else {
    // GST is added on top (addition)
    const tax = amount * GST_RATE;
    return { gross: amount + tax, tax, net: amount };
  }
}

export function useLineupStats(eventId: string) {
  return useQuery<LineupStats>({
    queryKey: ['lineup-stats', eventId],
    queryFn: async () => {
      // First fetch spots
      const { data: spotsData, error: spotsError } = await supabase
        .from('event_spots')
        .select('id, is_filled, is_paid, duration_minutes, payment_amount, payment_gross, payment_tax, payment_net, payment_gst_type, payment_status, spot_type, spot_category, start_time_mode')
        .eq('event_id', eventId);

      if (spotsError) {
        console.error('Failed to fetch lineup stats:', spotsError);
        throw new Error(`Failed to fetch lineup stats: ${spotsError.message}`);
      }

      const spots = (spotsData || []) as SpotData[];
      const spotIds = spots.map(s => s.id);

      // Fetch line items for all spots (if there are spots)
      let lineItems: LineItemData[] = [];
      if (spotIds.length > 0) {
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('event_spot_line_items')
          .select('id, event_spot_id, label, amount, gst_type')
          .in('event_spot_id', spotIds);

        if (lineItemsError) {
          console.error('Failed to fetch line items:', lineItemsError);
          // Don't throw - line items are optional, continue with empty
        } else {
          lineItems = (lineItemsData || []) as LineItemData[];
        }
      }

      // Group line items by spot ID
      const lineItemsBySpot: Record<string, LineItemData[]> = {};
      for (const item of lineItems) {
        if (!lineItemsBySpot[item.event_spot_id]) {
          lineItemsBySpot[item.event_spot_id] = [];
        }
        lineItemsBySpot[item.event_spot_id].push(item);
      }

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

      // Helper function to calculate line items totals for a spot
      const calculateLineItemsTotals = (spotId: string) => {
        const items = lineItemsBySpot[spotId] || [];
        let gross = 0;
        let tax = 0;
        let net = 0;

        for (const item of items) {
          const breakdown = calculateGstBreakdown(item.amount, item.gst_type);
          gross += breakdown.gross;
          tax += breakdown.tax;
          net += breakdown.net;
        }

        return { gross, tax, net, count: items.length };
      };

      // Helper function to calculate payment totals (base payment + line items)
      const calculatePaymentTotals = (spotList: SpotData[]) => {
        let gross = 0;
        let tax = 0;
        let net = 0;
        let paid = 0;

        for (const spot of spotList) {
          // Base payment (recalculate using GST type if available)
          const baseAmount = spot.payment_amount ?? 0;
          if (baseAmount > 0) {
            // If we have pre-calculated values, use them; otherwise calculate from GST type
            if (spot.payment_gross !== null && spot.payment_gross !== undefined) {
              gross += spot.payment_gross;
              tax += spot.payment_tax ?? 0;
              net += spot.payment_net ?? baseAmount;
            } else {
              // Calculate from GST type
              const breakdown = calculateGstBreakdown(baseAmount, spot.payment_gst_type);
              gross += breakdown.gross;
              tax += breakdown.tax;
              net += breakdown.net;
            }
          }

          // Add line items for this spot
          const lineItemTotals = calculateLineItemsTotals(spot.id);
          gross += lineItemTotals.gross;
          tax += lineItemTotals.tax;
          net += lineItemTotals.net;

          // Track paid amounts (base + line items if marked as paid)
          if (spot.payment_status === 'paid' || (spot.is_paid && !spot.payment_status)) {
            const spotGross = spot.payment_gross ?? baseAmount;
            paid += spotGross + lineItemTotals.gross;
          }
        }

        return { gross, tax, net, paid };
      };

      // Calculate total line items stats (for display)
      let totalLineItemsGross = 0;
      let totalLineItemsTax = 0;
      let totalLineItemsNet = 0;
      let totalLineItemsCount = 0;

      for (const spotId of Object.keys(lineItemsBySpot)) {
        const totals = calculateLineItemsTotals(spotId);
        totalLineItemsGross += totals.gross;
        totalLineItemsTax += totals.tax;
        totalLineItemsNet += totals.net;
        totalLineItemsCount += totals.count;
      }

      // Calculate performer payments (includes line items)
      const performerPayments = calculatePaymentTotals(performers);

      // Calculate production/extra payments (includes line items)
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

        // Performer breakdown (includes line items)
        performerGross: performerPayments.gross,
        performerTax: performerPayments.tax,
        performerNet: performerPayments.net,
        performerPaid: performerPayments.paid,

        // Production breakdown (includes line items)
        productionGross: productionPayments.gross,
        productionTax: productionPayments.tax,
        productionNet: productionPayments.net,
        productionPaid: productionPayments.paid,

        // Line items breakdown (already included in performer/production totals)
        lineItemsGross: totalLineItemsGross,
        lineItemsTax: totalLineItemsTax,
        lineItemsNet: totalLineItemsNet,
        lineItemsCount: totalLineItemsCount,

        // Combined totals
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
