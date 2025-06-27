
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VenueCost {
  id: string;
  event_id: string;
  cost_type: string;
  description: string | null;
  amount: number;
  cost_date: string;
  payment_status: string;
}

interface MarketingCost {
  id: string;
  event_id: string | null;
  campaign_name: string | null;
  platform: string | null;
  cost_type: string;
  amount: number;
  spend_date: string;
  impressions: number | null;
  clicks: number | null;
}

interface ComedianCost {
  id: string;
  event_id: string | null;
  performance_fee: number | null;
  payment_status: string | null;
  performance_notes: string | null;
}

export const useCostManagement = () => {
  const { data: venueCosts, isLoading: venueLoading } = useQuery({
    queryKey: ['venue-costs'],
    queryFn: async (): Promise<VenueCost[]> => {
      const { data, error } = await supabase
        .from('venue_costs')
        .select('*')
        .order('cost_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: marketingCosts, isLoading: marketingLoading } = useQuery({
    queryKey: ['marketing-costs'],
    queryFn: async (): Promise<MarketingCost[]> => {
      const { data, error } = await supabase
        .from('marketing_costs')
        .select('*')
        .order('spend_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: comedianCosts, isLoading: comedianLoading } = useQuery({
    queryKey: ['comedian-costs'],
    queryFn: async (): Promise<ComedianCost[]> => {
      const { data, error } = await supabase
        .from('comedian_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return {
    venueCosts,
    marketingCosts,
    comedianCosts,
    isLoading: venueLoading || marketingLoading || comedianLoading,
  };
};
