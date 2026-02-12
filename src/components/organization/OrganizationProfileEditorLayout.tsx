import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getProfileConfig } from '@/utils/profileConfig';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalProfileTabs } from '@/components/profile/UniversalProfileTabs';
import { ProfileCalendarView } from '@/components/ProfileCalendarView';
import { GiveVouchForm } from '@/components/GiveVouchForm';
import { VouchHistory } from '@/components/VouchHistory';
import OrganizationHeader from './OrganizationHeader';
import OrganizationSettings from './OrganizationSettings';
import OrganizationInvoicesContent from '@/pages/organization/OrganizationInvoices';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  User,
  Calendar,
  Receipt,
  Crown,
  Settings,
  CalendarDays,
  Users,
  ExternalLink,
} from 'lucide-react';

// Available tabs for organization editor - defined outside component for stable reference
const AVAILABLE_TABS = ['profile', 'calendar', 'invoices', 'events', 'vouches', 'team', 'settings'];

/**
 * Organization Profile Editor Layout
 *
 * Renders the organization profile edit page with:
 * 1. Banner header (logo, name, location, actions)
 * 2. Horizontal navigation tabs
 * 3. Tab content (Profile accordion, Calendar, Invoices, Events, Vouches, Team, Settings)
 */
export const OrganizationProfileEditorLayout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { organization, isLoading: orgLoading, isOwner, isAdmin } = useOrganization();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  // State for profile data (for save operations)
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Get tab from URL parameter or default to 'profile'
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab state from URL when location.search changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab') || 'profile';

    if (AVAILABLE_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('profile');
    }
  }, [location.search]);

  // Load organization profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!organization?.id) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organization_profiles')
          .select('*')
          .eq('id', organization.id)
          .single();

        if (error) throw error;
        setProfileData(data);
      } catch (error) {
        console.error('Error loading organization profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load organization profile',
          variant: 'destructive',
        });
      } finally {
        setProfileLoading(false);
      }
    };

    if (organization) {
      loadProfileData();
    }
  }, [organization, toast]);

  // Handle tab changes with URL update
  const handleTabChange = (newTab: string) => {
    // For external pages, navigate to them directly
    if (newTab === 'events') {
      navigate(`/org/${slug}/events`);
      return;
    }
    if (newTab === 'team') {
      navigate(`/org/${slug}/team`);
      return;
    }

    // For internal tabs, update URL and state
    if (AVAILABLE_TABS.includes(newTab)) {
      setActiveTab(newTab);

      const searchParams = new URLSearchParams(location.search);
      if (newTab === 'profile') {
        searchParams.delete('tab');
      } else {
        searchParams.set('tab', newTab);
      }

      const newSearch = searchParams.toString();
      navigate(
        {
          pathname: location.pathname,
          search: newSearch ? `?${newSearch}` : '',
        },
        { replace: true }
      );
    }
  };

  // Handle profile save
  const handleSaveProfile = async (data: any) => {
    if (!organization?.id) {
      throw new Error('Organization not found');
    }

    // Map form fields to database columns
    const mappedData: Record<string, any> = {};

    // Personal Information mappings
    if (data.firstName !== undefined) mappedData.organization_name = data.firstName;
    // For organizations, "Legal Name" field uses stageName in the form
    // Use stageName if provided, otherwise fall back to lastName (for backwards compat)
    const legalNameValue = data.stageName !== undefined && data.stageName !== ''
      ? data.stageName
      : data.lastName;
    if (legalNameValue !== undefined) mappedData.legal_name = legalNameValue;
    if (data.nameDisplayPreference !== undefined) mappedData.display_name_preference = data.nameDisplayPreference;
    if (data.email !== undefined) mappedData.contact_email = data.email;
    if (data.phone !== undefined) mappedData.contact_phone = data.phone;
    if (data.bio !== undefined) mappedData.bio = data.bio;
    if (data.location !== undefined) mappedData.state = data.location; // Map location to state
    if (data.country !== undefined) mappedData.country = data.country;

    // Social media mappings
    if (data.instagramUrl !== undefined) mappedData.instagram_url = data.instagramUrl;
    if (data.twitterUrl !== undefined) mappedData.twitter_url = data.twitterUrl;
    if (data.websiteUrl !== undefined) mappedData.website_url = data.websiteUrl;
    if (data.youtubeUrl !== undefined) mappedData.youtube_url = data.youtubeUrl;
    if (data.facebookUrl !== undefined) mappedData.facebook_url = data.facebookUrl;
    if (data.tiktokUrl !== undefined) mappedData.tiktok_url = data.tiktokUrl;
    if (data.linkedinUrl !== undefined) mappedData.linkedin_url = data.linkedinUrl;

    // Also update display_name when organization_name changes
    if (mappedData.organization_name) {
      mappedData.display_name = mappedData.organization_name;
    }

    const { error } = await supabase
      .from('organization_profiles')
      .update(mappedData)
      .eq('id', organization.id);

    if (error) throw error;

    // Reload profile data
    const { data: updatedData } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('id', organization.id)
      .single();

    if (updatedData) {
      setProfileData(updatedData);
    }
  };

  // Share handler for header
  const handleShare = async () => {
    const url = window.location.origin + `/org/${slug}`;
    const title = `${organization?.organization_name} - Organization Profile`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        navigator.clipboard.writeText(url);
        toast({
          title: 'Link Copied',
          description: 'Organization profile link has been copied to clipboard',
        });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Organization profile link has been copied to clipboard',
      });
    }
  };

  // Contact handler for header
  const handleContact = () => {
    // Handled internally by OrganizationHeader
  };

  const getBackgroundStyles = () => {
    return 'bg-[#131b2b]';
  };

  // Loading state
  if (orgLoading || profileLoading) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', getBackgroundStyles())}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Not found or no access
  if (!organization) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', getBackgroundStyles())}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Organization Not Found</CardTitle>
            <CardDescription>
              The organization you're looking for doesn't exist or you don't have access.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check access - must be owner or admin to edit
  if (!isOwner && !isAdmin) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', getBackgroundStyles())}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to edit this organization's profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const config = getProfileConfig('organization');

  // Build organization data object for header
  const headerOrgData = {
    id: organization.id,
    organization_name: organization.organization_name,
    bio: organization.bio,
    tagline: organization.tagline,
    location: organization.location,
    logo_url: organization.logo_url,
    banner_url: organization.banner_url,
    banner_position: organization.banner_position,
    is_verified: organization.is_verified || false,
    email: organization.contact_email,
    instagram_url: organization.instagram_url,
    twitter_url: organization.twitter_url,
    facebook_url: organization.facebook_url,
    youtube_url: organization.youtube_url,
    tiktok_url: organization.tiktok_url,
    linkedin_url: organization.linkedin_url,
    url_slug: organization.url_slug,
  };

  return (
    <div className={cn('min-h-screen', getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Organization Header / Banner */}
        <div className="mb-6">
          <OrganizationHeader
            organization={headerOrgData}
            isOwnProfile={isOwner || isAdmin}
            onShare={handleShare}
            onContact={handleContact}
          />
        </div>

        {/* Horizontal Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full mb-8 grid-cols-7">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 relative">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
              <ExternalLink className="w-3 h-3 hidden sm:inline text-muted-foreground" />
            </TabsTrigger>
            <TabsTrigger value="vouches" className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="hidden sm:inline">Vouches</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Team</span>
              <ExternalLink className="w-3 h-3 hidden sm:inline text-muted-foreground" />
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab - Accordion sections */}
          <TabsContent value="profile" className="space-y-6">
            <UniversalProfileTabs
              profileType="organization"
              config={config}
              user={profileData}
              onSave={handleSaveProfile}
              organizationId={organization.id}
            />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <ProfileCalendarView />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <OrganizationInvoicesContent />
          </TabsContent>

          {/* Events Tab - External link, content won't render but needed for routing */}
          <TabsContent value="events">
            {/* This content shouldn't render - tab navigates to /org/:slug/events */}
          </TabsContent>

          {/* Vouches Tab */}
          <TabsContent value="vouches" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Give a Vouch
                </CardTitle>
                <CardDescription>Endorse someone in your network by giving them a vouch</CardDescription>
              </CardHeader>
              <CardContent>
                <GiveVouchForm userId={organization.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Vouch History
                </CardTitle>
                <CardDescription>View vouches you've received and given</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="received" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="received">Received</TabsTrigger>
                    <TabsTrigger value="given">Given</TabsTrigger>
                  </TabsList>
                  <TabsContent value="received" className="space-y-4 mt-4">
                    <VouchHistory userId={organization.id} mode="received" />
                  </TabsContent>
                  <TabsContent value="given" className="space-y-4 mt-4">
                    <VouchHistory userId={organization.id} mode="given" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab - External link, content won't render but needed for routing */}
          <TabsContent value="team">
            {/* This content shouldn't render - tab navigates to /org/:slug/team */}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <OrganizationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationProfileEditorLayout;
