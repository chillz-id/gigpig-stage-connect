import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useActiveProfile } from '@/contexts/ProfileContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NotFoundHandler } from '@/components/profile/NotFoundHandler';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiveVouchForm } from '@/components/GiveVouchForm';
import { VouchHistory } from '@/components/VouchHistory';
import { Crown } from 'lucide-react';
import { OrganizationProfileWrapper } from '@/components/organization/OrganizationProfileWrapper';

// Lazy load organization pages
const OrganizationProfileEditorLayout = lazy(() => import('@/components/organization/OrganizationProfileEditorLayout').then(m => ({ default: m.OrganizationProfileEditorLayout })));
const OrganizationDashboard = lazy(() => import('@/pages/organization/OrganizationDashboard'));
const OrganizationEvents = lazy(() => import('@/pages/organization/OrganizationEvents'));
const OrganizationTeam = lazy(() => import('@/pages/organization/OrganizationTeam'));
const OrganizationTasks = lazy(() => import('@/pages/organization/OrganizationTasks'));
const OrganizationAnalytics = lazy(() => import('@/pages/organization/OrganizationAnalytics'));
const OrganizationMediaLibrary = lazy(() => import('@/pages/organization/OrganizationMediaLibrary'));
const OrganizationInvoices = lazy(() => import('@/pages/organization/OrganizationInvoices'));
const OrganizationBookComedian = lazy(() => import('@/pages/organization/OrganizationBookComedian'));
const CreateOrganizationEvent = lazy(() => import('@/pages/organization/CreateOrganizationEvent'));
const OrganizationEventTours = lazy(() => import('@/pages/organization/OrganizationEventTours'));

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
  organization: 'organization_profiles',
  venue: 'venues',
} as const;

export default function PublicProfile({ type }: PublicProfileProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  // Subscribe to location to ensure re-renders on navigation
  const location = useLocation();
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

        // Build select query based on profile type (organizations use different column names)
        const selectFields = type === 'organization'
          ? 'id, organization_name, url_slug, logo_url'
          : 'id, name, url_slug, avatar_url';

        // First, try to fetch profile directly by slug
        const { data, error } = await supabase
          .from(tableName)
          .select(selectFields)
          .eq('url_slug', slug)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Map organization columns to ProfileData interface
          const profileData: ProfileData = type === 'organization'
            ? {
                id: data.id,
                name: (data as any).organization_name,
                url_slug: data.url_slug,
                avatar_url: (data as any).logo_url,
              }
            : data as ProfileData;

          // Profile found - set as active profile
          setProfile(profileData);
          setActiveProfile({
            id: profileData.id,
            type,
            slug: profileData.url_slug,
            name: profileData.name,
            avatarUrl: profileData.avatar_url || undefined,
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

  // Suspense wrapper for lazy-loaded components
  const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-pink-700 via-purple-600 to-purple-800 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  );

  // For organization profiles, use the full organization pages with OrganizationProvider
  if (type === 'organization') {
    // Extract the sub-path for route matching (e.g., "events" or "events/create")
    const basePath = `/org/${slug}`;
    const subPath = location.pathname.replace(basePath, '').replace(/^\//, '') || 'index';

    // Debug: Log current location to verify re-renders on navigation
    console.log('[PublicProfile] Rendering org routes, pathname:', location.pathname, 'subPath:', subPath);

    return (
      <OrganizationProvider key={subPath}>
        <ErrorBoundary>
          <Routes>
            <Route index element={<OrganizationProfileWrapper />} />
            <Route path="edit" element={<SuspenseWrapper><OrganizationProfileEditorLayout /></SuspenseWrapper>} />
            <Route path="dashboard" element={<SuspenseWrapper><OrganizationDashboard /></SuspenseWrapper>} />
            <Route path="events" element={<SuspenseWrapper><OrganizationEvents /></SuspenseWrapper>} />
            <Route path="events/create" element={<SuspenseWrapper><CreateOrganizationEvent /></SuspenseWrapper>} />
            <Route path="events/tours" element={<SuspenseWrapper><OrganizationEventTours /></SuspenseWrapper>} />
            <Route path="team" element={<SuspenseWrapper><OrganizationTeam /></SuspenseWrapper>} />
            <Route path="tasks" element={<SuspenseWrapper><OrganizationTasks /></SuspenseWrapper>} />
            <Route path="analytics" element={<SuspenseWrapper><OrganizationAnalytics /></SuspenseWrapper>} />
            <Route path="media" element={<SuspenseWrapper><OrganizationMediaLibrary /></SuspenseWrapper>} />
            <Route path="invoices" element={<SuspenseWrapper><OrganizationInvoices /></SuspenseWrapper>} />
            <Route path="book-comedian" element={<SuspenseWrapper><OrganizationBookComedian /></SuspenseWrapper>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </OrganizationProvider>
    );
  }

  // For other profile types (comedian, manager, venue), use generic profile pages
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
            path="vouches"
            element={
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Give a Vouch
                    </CardTitle>
                    <CardDescription>
                      Endorse someone in your network by giving them a vouch
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GiveVouchForm userId={profile.id} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Vouch History
                    </CardTitle>
                    <CardDescription>
                      View vouches you've received and given
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="received" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="received">Received</TabsTrigger>
                        <TabsTrigger value="given">Given</TabsTrigger>
                      </TabsList>
                      <TabsContent value="received" className="space-y-4 mt-4">
                        <VouchHistory userId={profile.id} mode="received" />
                      </TabsContent>
                      <TabsContent value="given" className="space-y-4 mt-4">
                        <VouchHistory userId={profile.id} mode="given" />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
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
