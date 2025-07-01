
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ComedianProfileLoader from '@/components/comedian-profile/ComedianProfileLoader';
import ComedianProfileError from '@/components/comedian-profile/ComedianProfileError';
import ComedianProfileLayout from '@/components/comedian-profile/ComedianProfileLayout';

const ComedianProfileBySlug = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: comedian, isLoading, error } = useQuery({
    queryKey: ['comedian-profile-by-slug', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No comedian slug provided');
      
      // Query by profile_slug first
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
      
      if (dbError && dbError.code !== 'PGRST116') {
        throw dbError;
      }
      
      // Fallback: try to find by name-based slug for backward compatibility
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
      
      throw new Error(`Comedian not found: ${slug}`);
    },
    enabled: !!slug,
  });

  // Handle loading state
  if (isLoading) {
    return <ComedianProfileLoader />;
  }

  // Handle error state
  if (error || !comedian) {
    console.error('Error loading comedian:', error);
    return <ComedianProfileError slug={slug} />;
  }

  return <ComedianProfileLayout comedian={comedian} />;
};

export default ComedianProfileBySlug;
