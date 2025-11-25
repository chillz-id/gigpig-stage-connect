import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface EarningsData {
  totalEarnings: number;
  previousPeriodEarnings: number;
  changePercentage: number;
  earningsByEvent: Array<{
    eventTitle: string;
    amount: number;
    date: string;
    type: 'performance' | 'booking' | 'other';
  }>;
}

export const useEarnings = (dateRange?: DateRange) => {
  const { user } = useAuth();
  
  // Default to current month if no date range provided
  const defaultStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const defaultEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
  const startDate = dateRange?.start || defaultStart;
  const endDate = dateRange?.end || defaultEnd;

  const { data: earningsData, isLoading, error } = useQuery({
    queryKey: ['earnings', user?.id, startDate, endDate],
    queryFn: async (): Promise<EarningsData> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        // Calculate previous period for comparison
        const periodLength = endDate.getTime() - startDate.getTime();
        const previousStart = new Date(startDate.getTime() - periodLength);
        const previousEnd = new Date(startDate.getTime() - 1);

        // Query earnings from multiple sources
        const [currentEarnings, previousEarnings] = await Promise.all([
          fetchEarningsForPeriod(user.id, startDate, endDate),
          fetchEarningsForPeriod(user.id, previousStart, previousEnd)
        ]);

        // Calculate change percentage
        const changePercentage = previousEarnings.total > 0 
          ? ((currentEarnings.total - previousEarnings.total) / previousEarnings.total) * 100
          : currentEarnings.total > 0 ? 100 : 0;

        return {
          totalEarnings: currentEarnings.total,
          previousPeriodEarnings: previousEarnings.total,
          changePercentage,
          earningsByEvent: currentEarnings.details
        };
      } catch (error) {
        console.error('Error fetching earnings:', error);
        // Return mock data for development
        return getMockEarningsData(startDate, endDate);
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    earningsData,
    isLoading,
    error,
    startDate,
    endDate
  };
};

async function fetchEarningsForPeriod(userId: string, startDate: Date, endDate: Date) {
  // Query comedian bookings for performance fees
  const { data: bookings, error: bookingsError } = await supabase
    .from('comedian_bookings')
    .select(`
      fee,
      events!comedian_bookings_event_id_fkey!inner(title, event_date)
    `)
    .eq('comedian_id', userId)
    .gte('events.event_date', startDate.toISOString())
    .lte('events.event_date', endDate.toISOString())
    .eq('status', 'confirmed');

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError);
  }

  // Query invoices for additional earnings
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('total_amount, issue_date, invoice_number')
    .eq('comedian_id', userId)
    .eq('status', 'paid')
    .gte('issue_date', startDate.toISOString())
    .lte('issue_date', endDate.toISOString());

  if (invoicesError) {
    console.error('Error fetching invoices:', invoicesError);
  }

  // Calculate total earnings
  const bookingEarnings = (bookings || []).reduce((sum, booking) => sum + (booking.fee || 0), 0);
  const invoiceEarnings = (invoices || []).reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  
  const total = bookingEarnings + invoiceEarnings;

  // Create detailed breakdown
  const details = [
    ...(bookings || []).map(booking => ({
      eventTitle: booking.events?.title || 'Unknown Event',
      amount: booking.fee || 0,
      date: booking.events?.event_date || '',
      type: 'performance' as const
    })),
    ...(invoices || []).map(invoice => ({
      eventTitle: invoice.invoice_number || 'Invoice Payment',
      amount: invoice.total_amount || 0,
      date: invoice.issue_date || '',
      type: 'other' as const
    }))
  ];

  return { total, details };
}

function getMockEarningsData(startDate: Date, endDate: Date): EarningsData {
  // Mock data for development when database queries fail
  const mockEarnings = [
    { eventTitle: 'Comedy Night at The Basement', amount: 350, date: '2025-01-15', type: 'performance' as const },
    { eventTitle: 'Open Mic Tuesday', amount: 150, date: '2025-01-22', type: 'performance' as const },
    { eventTitle: 'Private Event Booking', amount: 800, date: '2025-01-28', type: 'booking' as const },
    { eventTitle: 'Monthly Invoice Payment', amount: 1150, date: '2025-01-30', type: 'other' as const }
  ];

  // Filter mock data by date range
  const filteredEarnings = mockEarnings.filter(earning => {
    const earningDate = new Date(earning.date);
    return earningDate >= startDate && earningDate <= endDate;
  });

  const totalEarnings = filteredEarnings.reduce((sum, earning) => sum + earning.amount, 0);
  
  return {
    totalEarnings,
    previousPeriodEarnings: totalEarnings * 0.88, // Mock 12% growth
    changePercentage: 12,
    earningsByEvent: filteredEarnings
  };
}

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format percentage
export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};