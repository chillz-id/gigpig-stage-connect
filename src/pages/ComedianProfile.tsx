
import React from 'react';
import { useComedianProfile } from '@/hooks/useComedianProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ComedianProfileLoader from '@/components/comedian-profile/ComedianProfileLoader';
import ComedianProfileError from '@/components/comedian-profile/ComedianProfileError';
import ComedianProfileLayout from '@/components/comedian-profile/ComedianProfileLayout';
import { SEOHead, generateComedianMetaTags, generatePersonSchema, generateBreadcrumbSchema } from '@/utils/seo';

const ComedianProfile = () => {
  const { comedian, isLoading, error, slug } = useComedianProfile();
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
        .eq('status', 'confirmed')
        .gte('events.start_time', new Date().toISOString())
        .order('events.start_time', { ascending: true })
        .limit(10);
      
      return data?.map(app => app.event).filter(Boolean) || [];
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
    social_media: socialMedia
  });
  
  // Generate structured data
  const personSchema = generatePersonSchema({
    ...comedian,
    profile_picture: comedian.avatar_url,
    social_media: socialMedia,
    upcoming_shows: upcomingShows
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

export default ComedianProfile;
