import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TicketProviderData {
  provider: string;
  ticketsSold: number;
  revenue: number;
  percentage: number;
  growth: number;
}

export interface SuburbData {
  suburb: string;
  ticketsSold: number;
  revenue: number;
  percentage: number;
  coordinates?: { lat: number; lng: number };
}

export interface FacebookAdsData {
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

export interface AdminAnalyticsData {
  totalTicketsSold: number;
  totalRevenue: number;
  eventsThisMonth: number;
  ticketProviders: TicketProviderData[];
  suburbData: SuburbData[];
  facebookAds: FacebookAdsData | null;
  revenueGrowth: Array<{ month: string; revenue: number; tickets: number }>;
}

interface DateRange {
  start: Date;
  end: Date;
}

export const useAdminAnalytics = (dateRange?: DateRange) => {
  const { user, hasRole } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(hasRole('admin'));
  }, [hasRole]);

  // Set default date range to current month if none provided
  const defaultDateRange = {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  };
  
  const selectedDateRange = dateRange || defaultDateRange;

  // Fetch ticket analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['admin-analytics', selectedDateRange.start, selectedDateRange.end],
    queryFn: async (): Promise<AdminAnalyticsData> => {
      if (!user?.id || !isAdmin) {
        throw new Error('Unauthorized access');
      }

      // Since we don't have actual ticket sales data yet, let's create mock data
      // that represents the structure we'd have with real ticketing providers
      
      // Mock ticket provider data
      const ticketProviders: TicketProviderData[] = [
        {
          provider: 'Humanitix',
          ticketsSold: 1250,
          revenue: 31250,
          percentage: 42.5,
          growth: 15.2
        },
        {
          provider: 'Eventbrite',
          ticketsSold: 890,
          revenue: 22250,
          percentage: 30.2,
          growth: 8.7
        },
        {
          provider: 'TryBooking',
          ticketsSold: 540,
          revenue: 13500,
          percentage: 18.3,
          growth: -2.1
        },
        {
          provider: 'Direct Sales',
          ticketsSold: 260,
          revenue: 6500,
          percentage: 8.8,
          growth: 22.3
        }
      ];

      // Mock suburb data (top Sydney suburbs for comedy events)
      const suburbData: SuburbData[] = [
        {
          suburb: 'Surry Hills',
          ticketsSold: 450,
          revenue: 11250,
          percentage: 15.3,
          coordinates: { lat: -33.8886, lng: 151.2094 }
        },
        {
          suburb: 'Newtown',
          ticketsSold: 380,
          revenue: 9500,
          percentage: 12.9,
          coordinates: { lat: -33.8971, lng: 151.1793 }
        },
        {
          suburb: 'Paddington',
          ticketsSold: 320,
          revenue: 8000,
          percentage: 10.9,
          coordinates: { lat: -33.8857, lng: 151.2294 }
        },
        {
          suburb: 'Bondi',
          ticketsSold: 280,
          revenue: 7000,
          percentage: 9.5,
          coordinates: { lat: -33.8908, lng: 151.2743 }
        },
        {
          suburb: 'Manly',
          ticketsSold: 220,
          revenue: 5500,
          percentage: 7.5,
          coordinates: { lat: -33.7969, lng: 151.2864 }
        },
        {
          suburb: 'Glebe',
          ticketsSold: 190,
          revenue: 4750,
          percentage: 6.5,
          coordinates: { lat: -33.8814, lng: 151.1886 }
        },
        {
          suburb: 'Balmain',
          ticketsSold: 160,
          revenue: 4000,
          percentage: 5.4,
          coordinates: { lat: -33.8611, lng: 151.1797 }
        },
        {
          suburb: 'Double Bay',
          ticketsSold: 140,
          revenue: 3500,
          percentage: 4.8,
          coordinates: { lat: -33.8773, lng: 151.2408 }
        },
        {
          suburb: 'Leichhardt',
          ticketsSold: 120,
          revenue: 3000,
          percentage: 4.1,
          coordinates: { lat: -33.8836, lng: 151.1564 }
        },
        {
          suburb: 'Rozelle',
          ticketsSold: 100,
          revenue: 2500,
          percentage: 3.4,
          coordinates: { lat: -33.8622, lng: 151.1711 }
        }
      ];

      // Mock Facebook Ads data (if we had API integration)
      const facebookAds: FacebookAdsData = {
        spend: 2500,
        revenue: 8750,
        roas: 3.5,
        impressions: 125000,
        clicks: 2800,
        conversions: 175,
        ctr: 2.24,
        cpc: 0.89
      };

      // Mock revenue growth data
      const revenueGrowth = [
        { month: 'Jan', revenue: 15200, tickets: 580 },
        { month: 'Feb', revenue: 18400, tickets: 720 },
        { month: 'Mar', revenue: 22100, tickets: 850 },
        { month: 'Apr', revenue: 26800, tickets: 1020 },
        { month: 'May', revenue: 31500, tickets: 1180 },
        { month: 'Jun', revenue: 35200, tickets: 1340 },
      ];

      // Calculate totals
      const totalTicketsSold = ticketProviders.reduce((sum, provider) => sum + provider.ticketsSold, 0);
      const totalRevenue = ticketProviders.reduce((sum, provider) => sum + provider.revenue, 0);
      
      // Get events count for current month (mock data for now)
      const eventsThisMonth = 28;

      return {
        totalTicketsSold,
        totalRevenue,
        eventsThisMonth,
        ticketProviders,
        suburbData,
        facebookAds,
        revenueGrowth
      };
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProviderData = () => {
    if (analyticsData?.ticketProviders) {
      exportToCSV(analyticsData.ticketProviders, 'tickets-by-provider');
    }
  };

  const exportSuburbData = () => {
    if (analyticsData?.suburbData) {
      exportToCSV(analyticsData.suburbData, 'tickets-by-suburb');
    }
  };

  const exportRevenueData = () => {
    if (analyticsData?.revenueGrowth) {
      exportToCSV(analyticsData.revenueGrowth, 'revenue-growth');
    }
  };

  return {
    analyticsData,
    isLoading,
    error,
    isAdmin,
    exportProviderData,
    exportSuburbData,
    exportRevenueData
  };
};