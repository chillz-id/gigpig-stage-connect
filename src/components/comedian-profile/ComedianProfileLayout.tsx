import { createContext, useContext, useEffect } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ComedianProfileError from '@/components/comedian-profile/ComedianProfileError';

// Context to share comedian data with nested routes
interface ComedianData {
  id: string;
  name: string;
  stage_name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  banner_position: string | null;
  is_verified: boolean;
  email: string;
  created_at: string;
  phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  show_contact_in_epk: boolean;
  custom_show_types: string[] | null;
  profile_slug: string | null;
}

const ComedianProfileContext = createContext<ComedianData | null>(null);

export const useComedianProfile = () => {
  const context = useContext(ComedianProfileContext);
  if (!context) {
    throw new Error('useComedianProfile must be used within ComedianProfileLayout');
  }
  return context;
};

/**
 * ComedianProfileLayout
 *
 * Parent layout component for all comedian profile routes.
 * Fetches comedian data once and provides it to nested routes via context.
 *
 * Nested routes render via <Outlet />
 */
export const ComedianProfileLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { setActiveProfile } = useActiveProfile();
  const { user } = useAuth();

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
      throw new Error('Comedian not found');
    },
    enabled: !!slug,
  });

  // Only set active profile when viewing OWN profile (not other comedians' profiles)
  // The comedian.id matches the user's auth ID when it's their own profile
  const isOwnProfile = user?.id === comedian?.id;

  useEffect(() => {
    if (comedian && isOwnProfile) {
      setActiveProfile({
        id: comedian.id,
        type: 'comedian',
        slug: comedian.profile_slug || comedian.id,
        name: comedian.stage_name || comedian.name,
        avatarUrl: comedian.avatar_url || undefined,
      });
    }
  }, [comedian, isOwnProfile, setActiveProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-700 via-purple-600 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !comedian) {
    return <ComedianProfileError error={error} />;
  }

  // Provide comedian data to nested routes
  // Key on pathname forces Outlet re-render when navigating between nested routes
  return (
    <ComedianProfileContext.Provider value={comedian}>
      <Outlet key={location.pathname} />
    </ComedianProfileContext.Provider>
  );
};
