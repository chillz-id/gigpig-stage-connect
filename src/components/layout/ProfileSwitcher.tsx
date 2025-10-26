import { useState, useEffect } from 'react';
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
  promoter: null, // Promoter doesn't have a profile table with slugs
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
  const { profile, user } = useAuth();
  const { data: organizations, isLoading: orgsLoading } = useOrganizationProfiles();
  const { activeProfile: activeProfileData, setActiveProfile } = useActiveProfile();
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, ProfileWithSlug | null>>({});

  // Fetch profile data with slugs for available profiles
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id || availableProfiles.length === 0) return;

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
    };

    fetchProfileData();
  }, [user?.id, availableProfiles]);

  // Handle profile selection with ActiveProfileContext integration
  const handleProfileSelect = (profileType: ProfileTypeValue) => {
    // Switch the profile type in ProfileContext (existing behavior)
    switchProfile(profileType);

    // Get profile data with slug
    const profileInfo = profileData[profileType];

    if (profileInfo && profileInfo.url_slug) {
      // Map ProfileTypeValue to ActiveProfile type
      const activeProfileType = (['comedian', 'manager', 'organization', 'venue'].includes(profileType))
        ? profileType as 'comedian' | 'manager' | 'organization' | 'venue'
        : 'comedian'; // fallback

      // Set active profile in ActiveProfileContext
      setActiveProfile({
        id: profileInfo.id,
        type: activeProfileType,
        slug: profileInfo.url_slug,
        name: profileInfo.name,
        avatarUrl: profileInfo.avatar_url || profileInfo.logo_url || undefined,
      });

      // Navigate to profile URL
      navigate(`/${activeProfileType}/${profileInfo.url_slug}/dashboard`);
    }
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
            "w-full justify-start gap-3 p-3 bg-gray-800/60 hover:bg-gray-700",
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

          // Check if this profile matches the active profile from ActiveProfileContext
          const isActiveInContext = activeProfileData?.type === profileType;

          return (
            <DropdownMenuItem
              key={profileType}
              onClick={() => handleProfileSelect(profileType)}
              className={cn(
                "flex items-center gap-3 px-2 py-2 cursor-pointer",
                "text-gray-100 hover:bg-gray-700 focus:bg-gray-700",
                (isActive || isActiveInContext) && "bg-purple-600/20 hover:bg-purple-600/30"
              )}
              aria-current={(isActive || isActiveInContext) ? 'true' : undefined}
            >
              <ProfileIcon className={cn(
                "h-5 w-5",
                (isActive || isActiveInContext) ? "text-purple-400" : "text-gray-400"
              )} />
              <span className="flex-1 text-sm font-medium">
                {profileDisplayName}
              </span>
              {(isActive || isActiveInContext) && (
                <Check className="h-4 w-4 text-purple-400" aria-label="Active profile" />
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuItem
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center gap-3 px-2 py-2 cursor-pointer text-gray-100 hover:bg-gray-700 focus:bg-gray-700"
        >
          <Plus className="h-5 w-5 text-gray-400" />
          <span className="flex-1 text-sm font-medium">Create New Profile</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Profile Creation Wizard Dialog */}
      <ProfileCreationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </DropdownMenu>
  );
}
