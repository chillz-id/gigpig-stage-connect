
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ComedianProfileLoader from '@/components/comedian-profile/ComedianProfileLoader';
import ComedianProfileError from '@/components/comedian-profile/ComedianProfileError';
import ComedianEPKLayout from '@/components/comedian-profile/ComedianEPKLayout';
import { SEOHead, generateComedianMetaTags, generatePersonSchema, generateBreadcrumbSchema } from '@/utils/seo';

const ComedianProfileBySlug = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: comedian, isLoading, error } = useQuery({
    queryKey: ['comedian-profile-by-slug', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No comedian slug provided');

      // Check if slug is a UUID (fallback when profile_slug is not set)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

      if (isUUID) {
        // Query directly by ID
        const { data: uuidData, error: uuidError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            stage_name,
            bio,
            location,
            avatar_url,
            banner_url,
            banner_position,
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
          .eq('id', slug)
          .single();

        if (uuidData) {
          return uuidData;
        }

        if (uuidError && uuidError.code !== 'PGRST116') {
          throw uuidError;
        }
      }

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
          banner_url,
          banner_position,
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

      // No fallback - if profile_slug doesn't match, profile doesn't exist
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
      <ComedianEPKLayout comedian={comedian} />
    </>
  );
};

export default ComedianProfileBySlug;
