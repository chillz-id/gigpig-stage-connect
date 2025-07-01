
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { mockComedians } from '@/data/mockComedians';

export const useComedianProfile = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: comedian, isLoading, error } = useQuery({
    queryKey: ['comedian-profile', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No comedian slug provided');
      
      // First try to find by profile_slug
      const { data: dbData, error: dbError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          stage_name,
          bio,
          location,
          avatar_url,
          is_verified,
          email,
          created_at,
          phone,
          website_url,
          instagram_url,
          twitter_url,
          youtube_url,
          facebook_url,
          tiktok_url,
          show_contact_in_epk,
          custom_show_types,
          profile_slug
        `)
        .eq('profile_slug', slug)
        .single();
      
      if (dbData) {
        return dbData;
      }
      
      // If not found by profile_slug, try by name-based slug for backward compatibility
      if (dbError && dbError.code === 'PGRST116') {
        // Convert slug back to name for database query
        const name = slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            stage_name,
            bio,
            location,
            avatar_url,
            is_verified,
            email,
            created_at,
            phone,
            website_url,
            instagram_url,
            twitter_url,
            youtube_url,
            facebook_url,
            tiktok_url,
            show_contact_in_epk,
            custom_show_types,
            profile_slug
          `)
          .or(`name.ilike.%${name}%,stage_name.ilike.%${name}%`)
          .single();
        
        if (fallbackData) {
          return fallbackData;
        }
        
        // If not found in database, check mock data and add missing fields
        const mockComedian = mockComedians.find(comedian => {
          if (!comedian.name) return false;
          const comedianSlug = comedian.name.toLowerCase().replace(/\s+/g, '-');
          return comedianSlug === slug;
        });
        
        if (mockComedian) {
          // Add missing contact fields to mock data
          return {
            ...mockComedian,
            phone: null,
            website_url: null,
            instagram_url: null,
            twitter_url: null,
            youtube_url: null,
            facebook_url: null,
            tiktok_url: null,
            show_contact_in_epk: false,
            profile_slug: null
          };
        }
      }
      
      throw new Error(`Comedian not found: ${slug}`);
    },
    enabled: !!slug,
  });

  return { comedian, isLoading, error, slug };
};
