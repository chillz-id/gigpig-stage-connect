import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useOrganizationProfiles } from '@/hooks/useOrganizationProfiles';
import {
  Briefcase,
  Camera,
  Drama,
  Video,
  Users,
  Building2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Base profile types (user roles)
export type BaseProfileType = 'comedian' | 'manager' | 'photographer' | 'videographer';

// Profile types include base profiles AND organization profiles (org:{uuid})
export type ProfileTypeValue = BaseProfileType | `org:${string}`;

export interface ProfileType {
  type: ProfileTypeValue;
  label: string;
  icon: LucideIcon;
}

export const PROFILE_TYPES: Record<ProfileTypeValue, ProfileType> = {
  comedian: {
    type: 'comedian',
    label: 'Comedian Profile',
    icon: Drama,
  },
  manager: {
    type: 'manager',
    label: 'Manager Profile',
    icon: Briefcase,
  },
  photographer: {
    type: 'photographer',
    label: 'Photographer Profile',
    icon: Camera,
  },
  videographer: {
    type: 'videographer',
    label: 'Videographer Profile',
    icon: Video,
  },
};

interface ProfileContextValue {
  activeProfile: ProfileTypeValue | null;
  availableProfiles: ProfileTypeValue[];
  switchProfile: (type: ProfileTypeValue) => void;
  isLoading: boolean;
  hasProfile: (type: ProfileTypeValue) => boolean;
  error: string | null;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const STORAGE_KEY = 'active-profile-type';

// Map user roles to profile types
const ROLE_TO_PROFILE_MAP: Record<string, ProfileTypeValue> = {
  'comedian': 'comedian',
  'comedian_lite': 'comedian', // Map to comedian profile (same structure)
  'manager': 'manager',
  'photographer': 'photographer',
  'videographer': 'videographer',
};

// Stable empty array to prevent infinite loops from new array references
const EMPTY_PROFILES: ProfileTypeValue[] = [];

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user } = useAuth();
  const [activeProfile, setActiveProfile] = useState<ProfileTypeValue | null>(null);

  // Fetch user roles
  const { data: userRoles, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      console.log('[ProfileContext] Fetching user roles for user:', user?.id);
      if (!user) return EMPTY_PROFILES;

      // Fetch user roles from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        throw rolesError;
      }

      // Map roles to profile types
      const profiles: ProfileTypeValue[] = [];
      userRoles?.forEach((userRole) => {
        const profileType = ROLE_TO_PROFILE_MAP[userRole.role];
        if (profileType && !profiles.includes(profileType)) {
          profiles.push(profileType);
        }
      });

      console.log('[ProfileContext] User roles fetched:', profiles);
      return profiles;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // CRITICAL: Prevent refetch on window focus
    refetchOnMount: false, // CRITICAL: Don't refetch on every mount
    refetchOnReconnect: true, // Only refetch on network reconnect
  });

  // Fetch user's organizations
  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useOrganizationProfiles();

  // Merge user roles and organization profiles into availableProfiles
  const availableProfiles = useMemo(() => {
    const profiles: ProfileTypeValue[] = [...(userRoles || EMPTY_PROFILES)];

    // Add organization profiles in format "org:{uuid}"
    if (organizations) {
      Object.keys(organizations).forEach((orgId) => {
        profiles.push(`org:${orgId}` as ProfileTypeValue);
      });
    }

    console.log('[ProfileContext] Available profiles:', profiles);
    return profiles;
  }, [userRoles, organizations]);

  const isLoading = rolesLoading || orgsLoading;
  const error = rolesError || orgsError;

  // Set active profile when availableProfiles changes
  useEffect(() => {
    if (isLoading) return;

    // Don't reset if we already have a valid active profile
    // This prevents flickering/resetting when availableProfiles array reference changes
    if (activeProfile && availableProfiles.includes(activeProfile)) {
      console.log('[ProfileContext] Active profile already valid, skipping reset:', activeProfile);
      return;
    }

    // Set active profile from localStorage or default to first available
    const savedProfile = localStorage.getItem(STORAGE_KEY) as ProfileTypeValue | null;
    if (savedProfile && availableProfiles.includes(savedProfile)) {
      console.log('[ProfileContext] Setting active profile from localStorage:', savedProfile);
      setActiveProfile(savedProfile);
    } else if (availableProfiles.length > 0) {
      // Default to first available profile
      const defaultProfile = availableProfiles[0];
      if (defaultProfile) {
        console.log('[ProfileContext] Setting default active profile:', defaultProfile);
        setActiveProfile(defaultProfile);
        localStorage.setItem(STORAGE_KEY, defaultProfile);
      }
    } else {
      // User has no comedy profiles - clear any stale localStorage
      setActiveProfile(null);
      localStorage.removeItem(STORAGE_KEY);
      console.log('[ProfileContext] User has no comedy profiles - profile creation required');
    }
  }, [availableProfiles, isLoading, activeProfile]);

  const switchProfile = useCallback((type: ProfileTypeValue) => {
    if (!availableProfiles.includes(type)) {
      console.error(`Profile type "${type}" not available for user`);
      return;
    }

    setActiveProfile(type);
    localStorage.setItem(STORAGE_KEY, type);

    // Announce profile switch for screen readers
    const announcement = document.getElementById('platform-status-announcements');
    if (announcement) {
      // Get profile label (handle both base profiles and organizations)
      let label = 'Profile';
      if (type.startsWith('org:')) {
        const orgId = type.substring(4);
        const org = organizations?.[orgId];
        label = org ? `${org.organization_name} Organization` : 'Organization Profile';
      } else {
        label = PROFILE_TYPES[type as BaseProfileType]?.label || 'Profile';
      }
      announcement.textContent = `Profile switched to ${label}`;
    }
  }, [availableProfiles, organizations]);

  const hasProfile = useCallback((type: ProfileTypeValue) => {
    return availableProfiles.includes(type);
  }, [availableProfiles]);

  const value = useMemo(() => ({
    activeProfile,
    availableProfiles,
    switchProfile,
    isLoading,
    hasProfile,
    error: error ? (error instanceof Error ? error.message : 'Failed to load profiles') : null,
  }), [activeProfile, availableProfiles, switchProfile, isLoading, hasProfile, error]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

/**
 * Helper type for base profile types
 * Note: BaseProfileType is already defined at the top of the file
 */

/**
 * Check if a profile type string represents an organization profile
 * Organization profiles are in the format: "org:{uuid}"
 */
export function isOrganizationProfile(profileType: string): boolean {
  return profileType.startsWith('org:');
}

/**
 * Extract organization ID from an organization profile type string
 * @param profileType - Profile type string in format "org:{uuid}"
 * @returns Organization ID or null if not an organization profile
 */
export function getOrganizationId(profileType: string): string | null {
  if (!isOrganizationProfile(profileType)) {
    return null;
  }

  // Extract UUID from format "org:uuid"
  return profileType.substring(4); // Remove "org:" prefix
}

/**
 * Get profile type information (label, icon) for any profile type
 * @param profileType - Profile type (base profile or org:{uuid})
 * @param organizationName - Optional organization name for org profiles
 * @returns ProfileType object with type, label, and icon
 */
export function getProfileTypeInfo(
  profileType: ProfileTypeValue,
  organizationName?: string
): ProfileType {
  if (isOrganizationProfile(profileType)) {
    return {
      type: profileType,
      label: organizationName ? `${organizationName} Organization` : 'Organization Profile',
      icon: Building2,
    };
  }

  return PROFILE_TYPES[profileType as BaseProfileType] || {
    type: profileType,
    label: 'Profile',
    icon: Users,
  };
}
