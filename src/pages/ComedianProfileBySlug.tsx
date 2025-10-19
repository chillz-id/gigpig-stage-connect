
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ComedianProfileLoader from '@/components/comedian-profile/ComedianProfileLoader';
import ComedianProfileError from '@/components/comedian-profile/ComedianProfileError';
import ComedianProfileLayout from '@/components/comedian-profile/ComedianProfileLayout';
import { SEOHead, generateComedianMetaTags, generatePersonSchema, generateBreadcrumbSchema } from '@/utils/seo';

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
      
      // If no match found in database, return null to show error
      
      throw new Error(`Comedian not found: ${slug}`);
    },
    enabled: !!slug,
  });

  const comedianId = comedian?.id;

  // Fetch upcoming shows for structured data
  const { data: upcomingShows } = useQuery({
    queryKey: ['comedian-upcoming-shows', comedianId],
    queryFn: async () => {
      const { data } = await supabase
        .from('applications')
        .select(`
          event:events (
            id,
            title,
            start_time,
            end_time,
            venue_name,
            venue_address,
            ticket_url
          )
        `)
        .eq('profile_id', comedianId)
        .eq('status', 'confirmed');

      const events = data?.map(app => app.event).filter(Boolean) || [];

      // Filter and sort client-side since PostgREST doesn't support filtering/ordering by joined table columns
      const now = new Date().toISOString();
      return events
        .filter(event => event.start_time && event.start_time >= now)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
        .slice(0, 10);
    },
    enabled: !!comedianId
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
  
  // Build social media object for structured data
  const socialMedia: any = {};
  if (comedian.twitter_url) socialMedia.twitter = comedian.twitter_url.replace('https://twitter.com/', '');
  if (comedian.instagram_url) socialMedia.instagram = comedian.instagram_url.replace('https://instagram.com/', '');
  if (comedian.facebook_url) socialMedia.facebook = comedian.facebook_url.replace('https://facebook.com/', '');
  if (comedian.youtube_url) socialMedia.youtube = comedian.youtube_url.replace('https://youtube.com/', '');
  if (comedian.tiktok_url) socialMedia.tiktok = comedian.tiktok_url.replace('https://tiktok.com/@', '');
  
  // Generate SEO meta tags
  const metaTags = generateComedianMetaTags({
    ...comedian,
    profile_picture: comedian.avatar_url,
    social_media: socialMedia,
    slug: comedian.profile_slug || slug
  });
  
  // Generate structured data
  const personSchema = generatePersonSchema({
    ...comedian,
    profile_picture: comedian.avatar_url,
    social_media: socialMedia,
    upcoming_shows: upcomingShows,
    slug: comedian.profile_slug || slug
  });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Comedians', url: '/comedians' },
    { name: comedian.stage_name || comedian.name }
  ]);
  
  return (
    <>
      <SEOHead
        {...metaTags}
        structuredData={[personSchema, breadcrumbSchema]}
      />
      <ComedianProfileLayout comedian={comedian} />
    </>
  );
};

export default ComedianProfileBySlug;
