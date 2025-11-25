import { useState, useEffect, useRef, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Plus, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useProfile,
  PROFILE_TYPES,
  isOrganizationProfile,
  getOrganizationId,
  type ProfileTypeValue,
  type BaseProfileType,
} from '@/contexts/ProfileContext';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { ProfileCreationWizard } from '@/components/profile/ProfileCreationWizard';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayName } from '@/utils/nameDisplay';
import { useOrganizationProfiles, getOrganizationDisplayName } from '@/hooks/useOrganizationProfiles';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

/**
 * Profile Switcher Component
 *
 * Allows users to switch between their available profile types.
 * Displays above Dashboard in the sidebar.
 *
 * Features:
 * - Shows active profile with checkmark indicator
 * - Dropdown menu with all available profiles
 * - "+ Create New Profile" option
 * - Supports collapsed sidebar state (icon only)
 * - Keyboard navigable
 * - Screen reader friendly
 */
// Map of profile types to their table names and slug compatibility
const PROFILE_TABLE_MAP = {
  comedian: 'comedians',
  manager: 'manager_profiles',
  photographer: 'photographers',
  videographer: 'videographers',
} as const;

interface ProfileWithSlug {
  id: string;
  name: string;
  url_slug?: string;
  avatar_url?: string;
  logo_url?: string;
}

export function ProfileSwitcher() {
  const { activeProfile, availableProfiles, switchProfile, isLoading } = useProfile();
  const { profile, user, hasRole } = useAuth();
  const { data: organizations, isLoading: orgsLoading } = useOrganizationProfiles();
  const { activeProfile: activeProfileData, setActiveProfile } = useActiveProfile();
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, ProfileWithSlug | null>>({});
  const [isPending, startTransition] = useTransition();

  // Check if user is comedian_lite (restricted from creating new profiles)
  const isComedianLite = hasRole('comedian_lite');

  // Use ref to track previous profiles to prevent infinite loops from array reference changes
  const prevProfilesRef = useRef<string>('');

  // Fetch profile data with slugs for available profiles
  useEffect(() => {
    // Create stable string key from profiles array to prevent infinite loops
    const profilesKey = JSON.stringify([...availableProfiles].sort());

    // Only fetch if profiles actually changed (not just new array reference)
    if (profilesKey === prevProfilesRef.current) {
      return;
    }

    prevProfilesRef.current = profilesKey;

    const fetchProfileData = async () => {
      if (!user?.id || availableProfiles.length === 0) return;

      console.log('[ProfileSwitcher] Fetching profile data for profiles:', availableProfiles);

      const dataMap: Record<string, ProfileWithSlug | null> = {};

      for (const profileType of availableProfiles) {
        const tableName = PROFILE_TABLE_MAP[profileType as keyof typeof PROFILE_TABLE_MAP];

        if (!tableName) {
          dataMap[profileType] = null;
          continue;
        }

        try {
          // Fetch profile data with slug
          const { data, error } = await supabase
            .from(tableName as string)
            .select('id, name, url_slug, avatar_url, logo_url')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && data) {
            dataMap[profileType] = data as ProfileWithSlug;
          } else {
            dataMap[profileType] = null;
          }
        } catch (err) {
          console.error(`Error fetching ${profileType} profile:`, err);
          dataMap[profileType] = null;
        }
      }

      setProfileData(dataMap);
      console.log('[ProfileSwitcher] Profile data fetched:', Object.keys(dataMap));
    };

    fetchProfileData();
  }, [user?.id, availableProfiles]);

  // Handle profile selection with ActiveProfileContext integration
  const handleProfileSelect = (profileType: ProfileTypeValue) => {
    startTransition(() => {
      // Switch the profile type in ProfileContext (existing behavior)
      switchProfile(profileType);

      // Handle organization profiles differently
      if (isOrganizationProfile(profileType)) {
        const orgId = getOrganizationId(profileType);
        const org = orgId && organizations ? organizations[orgId] : null;

        if (org && org.url_slug) {
          // Set active profile in ActiveProfileContext
          setActiveProfile({
            id: org.id,
            type: 'organization',
            slug: org.url_slug,
            name: org.organization_name,
            avatarUrl: org.logo_url || undefined,
          });

          // Navigate to organization profile URL
          navigate(`/org/${org.url_slug}/dashboard`);
        }
      } else {
        // Handle base profiles (comedian, manager, etc.)
        const profileInfo = profileData[profileType];

        // Only certain profile types support profile URLs (comedian, manager, venue, photographer)
        // Others are roles without profile pages
        const supportsProfileUrls = ['comedian', 'manager', 'venue', 'photographer'].includes(profileType);

        if (supportsProfileUrls) {
          // Use profile-specific data if available, otherwise fall back to auth profile
          const slug = profileInfo?.url_slug || profile?.profile_slug || profile?.id;
          const profileId = profileInfo?.id || user?.id;
          const displayName = profileInfo?.name || profile?.name || profile?.stage_name || profile?.display_name;
          const avatar = profileInfo?.avatar_url || profileInfo?.logo_url || profile?.avatar_url;

          if (slug && profileId && displayName) {
            // Set active profile in ActiveProfileContext
            setActiveProfile({
              id: profileId,
              type: profileType as 'comedian' | 'manager' | 'venue' | 'photographer',
              slug: slug,
              name: displayName,
              avatarUrl: avatar || undefined,
            });

            // Comedians use the main /dashboard route (full-featured dashboard)
            // Other profile types use their profile-specific dashboard routes
            const destination = profileType === 'comedian'
              ? '/dashboard'
              : `/${profileType}/${slug}/dashboard`;

            navigate(destination);
          } else {
            console.warn(`[ProfileSwitcher] Cannot switch to ${profileType}: missing slug or profile data`);
          }
        } else {
          // For roles without profile pages, just navigate to main dashboard
          navigate('/dashboard');
        }
      }
    });
  };

  if (isLoading || orgsLoading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-lg">
        <div className="h-10 w-10 animate-pulse bg-gray-700 rounded-full" />
        <div className="h-4 flex-1 animate-pulse bg-gray-700 rounded group-data-[collapsible=icon]:hidden" />
      </div>
    );
  }

  if (!activeProfile || availableProfiles.length === 0) {
    return null;
  }

  // Get active profile icon and display name
  const isOrgProfile = isOrganizationProfile(activeProfile);
  const ActiveIcon = isOrgProfile ? Building2 : PROFILE_TYPES[activeProfile as BaseProfileType].icon;

  // Get display name based on profile type
  let displayName: string;
  let avatarUrl: string | undefined;

  if (isOrgProfile) {
    const orgId = getOrganizationId(activeProfile);
    const org = orgId && organizations ? organizations[orgId] : null;
    displayName = org ? getOrganizationDisplayName(org) : 'Organization';
    avatarUrl = org?.logo_url;
  } else {
    // For base profiles (comedian, promoter, etc), use user's display name
    displayName = profile?.display_name || getDisplayName({
      firstName: profile?.first_name,
      lastName: profile?.last_name,
      stageName: profile?.stage_name,
      nameDisplayPreference: profile?.name_display_preference || 'real',
    });
    avatarUrl = profile?.avatar_url;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 pl-0 pr-3 py-3 bg-gray-800/60 hover:bg-gray-700",
            "text-gray-100 group-data-[collapsible=icon]:justify-center"
          )}
          aria-label={`Active profile: ${displayName}. Click to switch profiles.`}
        >
          <OptimizedAvatar
            src={avatarUrl}
            name={displayName}
            size="sm"
            className="h-10 w-10 flex-shrink-0"
          />
          <div className="flex-1 text-left group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-medium text-gray-100">{displayName}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 group-data-[collapsible=icon]:hidden" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[280px] bg-gray-800 border-gray-700"
        align="start"
        side="right"
      >
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Switch Profile
        </div>

        {availableProfiles.map((profileType) => {
          const isActive = profileType === activeProfile;
          const isOrg = isOrganizationProfile(profileType);

          // Get icon and display name for this profile
          let ProfileIcon;
          let profileDisplayName;

          if (isOrg) {
            ProfileIcon = Building2;
            const orgId = getOrganizationId(profileType);
            const org = orgId && organizations ? organizations[orgId] : null;
            profileDisplayName = org ? getOrganizationDisplayName(org) : 'Organization';
          } else {
            const profileData = PROFILE_TYPES[profileType as BaseProfileType];
            ProfileIcon = profileData.icon;
            // Use custom display name if set, otherwise use computed name
            profileDisplayName = profile?.display_name || getDisplayName({
              firstName: profile?.first_name,
              lastName: profile?.last_name,
              stageName: profile?.stage_name,
              nameDisplayPreference: profile?.name_display_preference || 'real',
            });
          }

          // Determine if this profile is active - use ActiveProfileContext as source of truth
          // Only fall back to ProfileContext if ActiveProfileContext is not set
          const isActiveProfile = activeProfileData
            ? activeProfileData.type === profileType ||
              (isOrganizationProfile(profileType) && activeProfileData.type === 'organization')
            : profileType === activeProfile;

          return (
            <DropdownMenuItem
              key={profileType}
              onClick={() => handleProfileSelect(profileType)}
              className={cn(
                "flex items-center gap-3 px-2 py-2 cursor-pointer",
                "text-gray-100 hover:bg-gray-700 focus:bg-gray-700",
                isActiveProfile && "bg-purple-600/20 hover:bg-purple-600/30"
              )}
              aria-current={isActiveProfile ? 'true' : undefined}
            >
              <ProfileIcon className={cn(
                "h-5 w-5",
                isActiveProfile ? "text-purple-400" : "text-gray-400"
              )} />
              <span className="flex-1 text-sm font-medium">
                {profileDisplayName}
              </span>
              {isActiveProfile && (
                <Check className="h-4 w-4 text-purple-400" aria-label="Active profile" />
              )}
            </DropdownMenuItem>
          );
        })}

        {/* Only show "Create New Profile" option if user is not comedian_lite */}
        {!isComedianLite && (
          <>
            <DropdownMenuSeparator className="bg-gray-700" />

            <DropdownMenuItem
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-3 px-2 py-2 cursor-pointer text-gray-100 hover:bg-gray-700 focus:bg-gray-700"
            >
              <Plus className="h-5 w-5 text-gray-400" />
              <span className="flex-1 text-sm font-medium">Create New Profile</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>

      {/* Profile Creation Wizard Dialog */}
      <ProfileCreationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </DropdownMenu>
  );
}
