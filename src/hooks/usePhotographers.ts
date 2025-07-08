import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  PhotographerProfile, 
  PhotographerFilters, 
  PhotographerAvailability,
  PortfolioItem,
  PhotographerVouchStats,
  PhotographerVouch
} from '@/types/photographer';

export const usePhotographers = (filters?: PhotographerFilters) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['photographers', filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          photographer_profile:photographer_profiles!id(*)
        `)
        .in('role', ['photographer', 'videographer']);

      // Apply filters
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`name.ilike.${searchTerm},stage_name.ilike.${searchTerm}`);
      }

      if (filters?.available_for_events !== undefined) {
        query = query.eq('photographer_profile.available_for_events', filters.available_for_events);
      }

      if (filters?.max_rate) {
        query = query.or(`photographer_profile.rate_per_hour.lte.${filters.max_rate},photographer_profile.rate_per_event.lte.${filters.max_rate}`);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'experience':
          query = query.order('photographer_profile.experience_years', { ascending: false });
          break;
        case 'rate':
          query = query.order('photographer_profile.rate_per_hour', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by specialties and services if provided
      let filteredData = data || [];
      
      // Get vouch stats for all photographers
      if (filteredData.length > 0) {
        const photographerIds = filteredData.map(p => p.id);
        const { data: vouchStats, error: statsError } = await supabase
          .from('photographer_vouch_stats')
          .select('*')
          .in('photographer_id', photographerIds);
        
        if (!statsError && vouchStats) {
          const statsMap = new Map(vouchStats.map(stat => [stat.photographer_id, stat]));
          filteredData = filteredData.map(photographer => ({
            ...photographer,
            vouch_stats: statsMap.get(photographer.id) || {
              photographer_id: photographer.id,
              total_vouches: 0,
              unique_vouchers: 0,
              average_rating: 0,
              recent_vouches: 0
            }
          }));
        }
      }
      
      if (filters?.specialties && filters.specialties.length > 0) {
        filteredData = filteredData.filter(photographer => 
          photographer.photographer_profile?.specialties?.some(specialty => 
            filters.specialties?.includes(specialty)
          )
        );
      }

      if (filters?.services && filters.services.length > 0) {
        filteredData = filteredData.filter(photographer => 
          photographer.photographer_profile?.services_offered?.some(service => 
            filters.services?.includes(service)
          )
        );
      }

      // Apply vouch sorting if needed (after fetching vouch stats)
      if (filters?.sortBy === 'vouches') {
        filteredData.sort((a, b) => {
          const aVouches = (a as any).vouch_stats?.total_vouches || 0;
          const bVouches = (b as any).vouch_stats?.total_vouches || 0;
          return bVouches - aVouches;
        });
      }

      return filteredData as PhotographerProfile[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    photographers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const usePhotographer = (photographerId: string) => {
  const query = useQuery({
    queryKey: ['photographer', photographerId],
    queryFn: async () => {
      // Get photographer profile with portfolio
      const { data: photographerData, error: photographerError } = await supabase
        .from('profiles')
        .select(`
          *,
          photographer_profile:photographer_profiles!id(*),
          portfolio:photographer_portfolio!photographer_id(*)
        `)
        .eq('id', photographerId)
        .single();

      if (photographerError) throw photographerError;

      // Get vouch stats from the view
      const { data: vouchStats, error: vouchError } = await supabase
        .from('photographer_vouch_stats')
        .select('*')
        .eq('photographer_id', photographerId)
        .single();

      if (vouchError && vouchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching vouch stats:', vouchError);
      }

      return {
        ...photographerData,
        vouch_stats: vouchStats || {
          photographer_id: photographerId,
          total_vouches: 0,
          unique_vouchers: 0,
          average_rating: 0,
          recent_vouches: 0
        }
      } as PhotographerProfile & { vouch_stats: PhotographerVouchStats };
    },
    enabled: !!photographerId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    photographer: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const usePhotographerAvailability = (photographerId: string, startDate?: string, endDate?: string) => {
  const query = useQuery({
    queryKey: ['photographer-availability', photographerId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('photographer_availability')
        .select('*')
        .eq('photographer_id', photographerId);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PhotographerAvailability[];
    },
    enabled: !!photographerId,
  });

  return {
    availability: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useUpdatePhotographerProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<PhotographerProfile['photographer_profile']> & { id: string }) => {
      const { id, ...profileData } = updates;
      
      const { data, error } = await supabase
        .from('photographer_profiles')
        .upsert({
          id,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['photographer', data.id] });
      queryClient.invalidateQueries({ queryKey: ['photographers'] });
      toast({
        title: 'Profile updated',
        description: 'Your photographer profile has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });
};

export const usePhotographerPortfolio = (photographerId: string) => {
  const query = useQuery({
    queryKey: ['photographer-portfolio', photographerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photographer_portfolio')
        .select('*')
        .eq('photographer_id', photographerId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as PortfolioItem[];
    },
    enabled: !!photographerId,
  });

  return {
    portfolio: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useAddPortfolioItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('photographer_portfolio')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['photographer-portfolio', data.photographer_id] });
      toast({
        title: 'Portfolio item added',
        description: 'Your portfolio item has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add item',
        description: error instanceof Error ? error.message : 'Failed to add portfolio item',
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePortfolioItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, photographerId }: { id: string; photographerId: string }) => {
      const { error } = await supabase
        .from('photographer_portfolio')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, photographerId };
    },
    onSuccess: ({ photographerId }) => {
      queryClient.invalidateQueries({ queryKey: ['photographer-portfolio', photographerId] });
      toast({
        title: 'Item deleted',
        description: 'Portfolio item has been deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete item',
        variant: 'destructive',
      });
    },
  });
};

export const usePhotographerVouches = (photographerId: string) => {
  const query = useQuery({
    queryKey: ['photographer-vouches', photographerId],
    queryFn: async () => {
      // Call the database function to get vouches with voucher details
      const { data, error } = await supabase
        .rpc('get_photographer_vouches', { photographer_id: photographerId });

      if (error) throw error;
      return data as PhotographerVouch[];
    },
    enabled: !!photographerId,
  });

  return {
    vouches: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const usePhotographerVouchStats = (photographerId: string) => {
  const query = useQuery({
    queryKey: ['photographer-vouch-stats', photographerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photographer_vouch_stats')
        .select('*')
        .eq('photographer_id', photographerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || {
        photographer_id: photographerId,
        total_vouches: 0,
        unique_vouchers: 0,
        average_rating: 0,
        recent_vouches: 0
      } as PhotographerVouchStats;
    },
    enabled: !!photographerId,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};