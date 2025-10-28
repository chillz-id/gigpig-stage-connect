/**
 * useLineupStats Hook
 *
 * Fetches and calculates lineup statistics for an event:
 * - Total spots count
 * - Filled spots count
 * - Total duration (minutes)
 * - Payment breakdown (gross, tax, net)
 * - Total paid amount
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SpotData {
  id: string;
  is_filled: boolean;
  duration_minutes: number | null;
  payment_gross: number | null;
  payment_tax: number | null;
  payment_net: number | null;
  payment_status: 'unpaid' | 'pending' | 'paid';
}

interface LineupStats {
  totalSpots: number;
  filledSpots: number;
  totalDuration: number; // in minutes
  totalGross: number;
  totalTax: number;
  totalNet: number;
  totalPaid: number;
}

export function useLineupStats(eventId: string) {
  return useQuery<LineupStats>({
    queryKey: ['lineup-stats', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_spots')
        .select('id, is_filled, duration_minutes, payment_gross, payment_tax, payment_net, payment_status')
        .eq('event_id', eventId);

      if (error) {
        console.error('Failed to fetch lineup stats:', error);
        throw new Error(`Failed to fetch lineup stats: ${error.message}`);
      }

      const spots = (data || []) as SpotData[];

      // Calculate statistics
      const totalSpots = spots.length;

      const filledSpots = spots.filter(
        (spot) => spot.is_filled === true
      ).length;

      const totalDuration = spots.reduce(
        (sum, spot) => sum + (spot.duration_minutes || 0),
        0
      );

      const totalGross = spots.reduce(
        (sum, spot) => sum + (spot.payment_gross || 0),
        0
      );

      const totalTax = spots.reduce(
        (sum, spot) => sum + (spot.payment_tax || 0),
        0
      );

      const totalNet = spots.reduce(
        (sum, spot) => sum + (spot.payment_net || 0),
        0
      );

      const totalPaid = spots.reduce((sum, spot) => {
        if (spot.payment_status === 'paid') {
          return sum + (spot.payment_gross || 0);
        }
        return sum;
      }, 0);

      return {
        totalSpots,
        filledSpots,
        totalDuration,
        totalGross,
        totalTax,
        totalNet,
        totalPaid,
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
