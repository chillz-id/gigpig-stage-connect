import { useEffect, useState } from 'react';
import { useParams, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NotFoundHandler } from '@/components/profile/NotFoundHandler';

interface PublicProfileProps {
  type: 'comedian' | 'manager' | 'organization' | 'venue';
}

interface ProfileData {
  id: string;
  name: string;
  url_slug: string;
  avatar_url?: string;
}

// Map profile types to table names
const TABLE_MAP = {
  comedian: 'comedians',
  manager: 'manager_profiles',
  organization: 'organizations',
  venue: 'venues',
} as const;

export default function PublicProfile({ type }: PublicProfileProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setActiveProfile } = useActiveProfile();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const tableName = TABLE_MAP[type];

        // First, try to fetch profile directly by slug
        const { data, error } = await supabase
          .from(tableName)
          .select('id, name, url_slug, avatar_url')
          .eq('url_slug', slug)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Profile found - set as active profile
          setProfile(data as ProfileData);
          setActiveProfile({
            id: data.id,
            type,
            slug: data.url_slug,
            name: data.name,
            avatarUrl: data.avatar_url || undefined,
          });
          setNotFound(false);
        } else {
          // Check if this is an old slug that needs redirect
          const { data: historyData, error: historyError } = await supabase
            .from('slug_history')
            .select('new_slug, profile_id')
            .eq('profile_type', type)
            .eq('old_slug', slug)
            .order('changed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (historyError) throw historyError;

          if (historyData) {
            // 301 redirect to new slug
            navigate(`/${type}/${historyData.new_slug}`, { replace: true });
            return;
          }

          // Profile not found - track 404
          setNotFound(true);

          // Record profile request for analytics
          try {
            await supabase.rpc('record_profile_request', {
              p_profile_type: type,
              p_slug: slug,
              p_instagram_handle: null,
              p_user_id: null,
            });
          } catch (trackError) {
            console.error('Failed to track profile request:', trackError);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [slug, type, navigate, setActiveProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-700 via-purple-600 to-purple-800 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (notFound || !profile) {
    return <NotFoundHandler profileType={type} attemptedSlug={slug || ''} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
          <p className="text-muted-foreground">
            {type.charAt(0).toUpperCase() + type.slice(1)} Profile
          </p>
        </div>

        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <div>
                <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
                <p>Dashboard content for {profile.name}</p>
              </div>
            }
          />
          <Route
            path="settings"
            element={
              <div>
                <h2 className="text-2xl font-semibold mb-4">Settings</h2>
                <p>Settings for {profile.name}</p>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
