
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mockApplications } from '@/services/applicationService';
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
      
      // Final fallback: check if this matches a comedian from mock applications
      const mockApplication = mockApplications.find(app => {
        const appSlug = app.comedian_name.toLowerCase().replace(/\s+/g, '-');
        return appSlug === slug;
      });
      
      if (mockApplication) {
        // Create a mock comedian profile from the application data with better bio
        const experienceYears = parseInt(mockApplication.comedian_experience.split(' ')[0]) || 1;
        const bioText = experienceYears >= 3 
          ? `Stand-up comedian with ${mockApplication.comedian_experience} performing across Australia. Known for engaging storytelling and crowd work that keeps audiences laughing throughout the night.`
          : `Rising comedian with ${mockApplication.comedian_experience} in the comedy scene. Bringing fresh perspectives and energetic performances to stages across the country.`;
        
        return {
          id: mockApplication.comedian_id,
          name: mockApplication.comedian_name,
          stage_name: null,
          bio: bioText,
          location: null,
          avatar_url: mockApplication.comedian_avatar,
          is_verified: false,
          email: null,
          created_at: new Date().toISOString(),
          phone: null,
          website_url: null,
          instagram_url: null,
          twitter_url: null,
          youtube_url: null,
          facebook_url: null,
          tiktok_url: null,
          show_contact_in_epk: false,
          custom_show_types: null,
          profile_slug: slug
        };
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
