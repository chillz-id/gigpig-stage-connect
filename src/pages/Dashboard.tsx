
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, isOrganizationProfile, getOrganizationId } from '@/contexts/ProfileContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useOrganizationProfiles } from '@/hooks/useOrganizationProfiles';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ComedianDashboard,
  ManagerDashboard,
  PhotographerDashboard,
  VideographerDashboard
} from '@/components/dashboard';
/**
 * Dashboard Component
 *
 * Main dashboard that renders profile-specific dashboard views based on active profile.
 * Uses ProfileContext to determine which dashboard to display.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const { activeProfile, isLoading: profileLoading } = useProfile();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { data: organizations, isLoading: orgsLoading } = useOrganizationProfiles();
  // Handle unauthenticated users
  if (!user) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", 
        theme === 'pleasure' 
          ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
          : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
      )}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to access your dashboard.</p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle loading state
  if (profileLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center",
        theme === 'pleasure'
          ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
          : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
      )}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle no active profile - redirect to profile creation
  if (!activeProfile) {
    // Automatically redirect to profile creation wizard
    navigate('/post-signup-setup', { replace: true });

    return (
      <div className={cn("min-h-screen flex items-center justify-center",
        theme === 'pleasure'
          ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
          : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
      )}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Redirecting to profile setup...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle organization profiles - redirect to organization profile URL
  if (isOrganizationProfile(activeProfile)) {
    const orgId = getOrganizationId(activeProfile);

    // Wait for organizations to load before attempting redirect
    if (orgsLoading) {
      return (
        <div className={cn("min-h-screen flex items-center justify-center",
          theme === 'pleasure'
            ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
            : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
        )}>
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground mt-4">Loading organization...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const org = orgId && organizations ? organizations[orgId] : null;

    if (org?.url_slug) {
      // Redirect to organization profile URL
      navigate(`/org/${org.url_slug}/dashboard`, { replace: true });
      return (
        <div className={cn("min-h-screen flex items-center justify-center",
          theme === 'pleasure'
            ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
            : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
        )}>
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    // Fallback if organization not found or missing url_slug
    console.error('[Dashboard] Organization not found or missing url_slug:', { orgId, org, organizations });
    return (
      <div className={cn("min-h-screen flex items-center justify-center",
        theme === 'pleasure'
          ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
          : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
      )}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Organization Profile Issue</h2>
            <p className="text-muted-foreground mb-6">
              Your organization profile is missing a URL slug. Please contact support or recreate your organization profile.
            </p>
            <Button onClick={() => navigate('/post-signup-setup')} className="w-full">
              Manage Profiles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render profile-specific dashboard based on activeProfile
  return (
    <>
      {(() => {
        switch (activeProfile) {
          case 'comedian':
            return <ComedianDashboard />;

          case 'manager':
            return <ManagerDashboard />;

          case 'photographer':
            return <PhotographerDashboard />;

          case 'videographer':
            return <VideographerDashboard />;

          default:
            // Fallback for unknown profile types
            return (
              <div className={cn("min-h-screen flex items-center justify-center",
                theme === 'pleasure'
                  ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
                  : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
              )}>
                <Card className="max-w-md w-full mx-4">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-xl font-bold mb-4">Unknown Profile Type</h2>
                    <p className="text-muted-foreground mb-6">
                      The profile type "{activeProfile}" is not recognized.
                    </p>
                    <Button onClick={() => navigate('/post-signup-setup')} className="w-full">
                      Manage Profiles
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
        }
      })()}
    </>
  );
};

export default Dashboard;
