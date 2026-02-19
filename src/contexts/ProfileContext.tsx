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

// Active profile entity types (merged from ActiveProfileContext)
export type ActiveProfileType = 'comedian' | 'comedian_lite' | 'manager' | 'organization' | 'venue' | 'photographer' | 'videographer';

export interface ActiveProfile {
  id: string;
  type: ActiveProfileType;
  slug: string;
  name: string;
  avatarUrl?: string;
}

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
  // Profile type state (legacy - for backwards compatibility)
  activeProfile: ProfileTypeValue | null;
  availableProfiles: ProfileTypeValue[];
  switchProfile: (type: ProfileTypeValue) => void;
  isLoading: boolean;
  hasProfile: (type: ProfileTypeValue) => boolean;
  error: string | null;

  // Active profile entity state (merged from ActiveProfileContext)
  activeProfileEntity: ActiveProfile | null;
  setActiveProfile: (profile: ActiveProfile) => void;
  clearActiveProfile: () => void;
  getProfileUrl: (page?: string) => string;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const STORAGE_KEY = 'active-profile-type';
const ENTITY_STORAGE_KEY = 'activeProfile';

// Validation helpers for localStorage entity
const isValidProfileType = (type: string): type is ActiveProfileType => {
  return ['comedian', 'comedian_lite', 'manager', 'organization', 'venue', 'photographer', 'videographer'].includes(type);
};

const isValidActiveProfile = (data: unknown): data is ActiveProfile => {
  if (!data || typeof data !== 'object') return false;

  const profile = data as Record<string, unknown>;

  return (
    typeof profile.id === 'string' &&
    typeof profile.type === 'string' &&
    isValidProfileType(profile.type) &&
    typeof profile.slug === 'string' &&
    typeof profile.name === 'string' &&
    (profile.avatarUrl === undefined || typeof profile.avatarUrl === 'string')
  );
};

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
  const [activeProfileType, setActiveProfileType] = useState<ProfileTypeValue | null>(null);

  // Active profile entity state (merged from ActiveProfileContext)
  const [activeProfileEntity, setActiveProfileEntityState] = useState<ActiveProfile | null>(
    () => {
      // Load from localStorage on mount
      try {
        const stored = localStorage.getItem(ENTITY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (isValidActiveProfile(parsed)) {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Failed to load active profile entity from localStorage:', error);
      }
      return null;
    }
  );

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

  // Set active profile type when availableProfiles changes
  useEffect(() => {
    if (isLoading) return;

    // Don't reset if we already have a valid active profile type
    // This prevents flickering/resetting when availableProfiles array reference changes
    if (activeProfileType && availableProfiles.includes(activeProfileType)) {
      console.log('[ProfileContext] Active profile type already valid, skipping reset:', activeProfileType);
      return;
    }

    // Set active profile type from localStorage or default to first available
    const savedProfile = localStorage.getItem(STORAGE_KEY) as ProfileTypeValue | null;
    if (savedProfile && availableProfiles.includes(savedProfile)) {
      console.log('[ProfileContext] Setting active profile type from localStorage:', savedProfile);
      setActiveProfileType(savedProfile);
    } else if (availableProfiles.length > 0) {
      // Default to first available profile
      const defaultProfile = availableProfiles[0];
      if (defaultProfile) {
        console.log('[ProfileContext] Setting default active profile type:', defaultProfile);
        setActiveProfileType(defaultProfile);
        localStorage.setItem(STORAGE_KEY, defaultProfile);
      }
    } else {
      // User has no comedy profiles - clear any stale localStorage
      setActiveProfileType(null);
      localStorage.removeItem(STORAGE_KEY);
      console.log('[ProfileContext] User has no comedy profiles - profile creation required');
    }
  }, [availableProfiles, isLoading, activeProfileType]);

  // Sync state with URL when landing on an org page directly
  // This ensures the profile state matches the URL on initial page load or direct navigation
  useEffect(() => {
    if (isLoading || !organizations) return;

    const path = window.location.pathname;
    const orgMatch = path.match(/^\/org\/([^/]+)/);

    if (orgMatch) {
      const slug = orgMatch[1];
      // Find the organization by slug
      const org = Object.values(organizations).find(o => o.url_slug === slug);

      if (org) {
        const expectedProfileType = `org:${org.id}` as ProfileTypeValue;

        // Only update if state doesn't match URL
        if (activeProfileType !== expectedProfileType) {
          console.log('[ProfileContext] Syncing state with URL, org slug:', slug);
          setActiveProfileType(expectedProfileType);
          localStorage.setItem(STORAGE_KEY, expectedProfileType);
        }

        // Also sync the entity state if it doesn't match
        if (!activeProfileEntity || activeProfileEntity.id !== org.id) {
          setActiveProfileEntityState({
            id: org.id,
            type: 'organization',
            slug: org.url_slug,
            name: org.organization_name,
            avatarUrl: org.logo_url || undefined,
          });
          try {
            localStorage.setItem(ENTITY_STORAGE_KEY, JSON.stringify({
              id: org.id,
              type: 'organization',
              slug: org.url_slug,
              name: org.organization_name,
              avatarUrl: org.logo_url || undefined,
            }));
          } catch (err) {
            console.error('Failed to save synced profile entity to localStorage:', err);
          }
        }
      }
    }
  }, [isLoading, organizations, activeProfileType, activeProfileEntity]);

  const switchProfile = useCallback((type: ProfileTypeValue) => {
    if (!availableProfiles.includes(type)) {
      console.error(`Profile type "${type}" not available for user`);
      return;
    }

    setActiveProfileType(type);
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

  // Entity management functions (merged from ActiveProfileContext)
  const setActiveProfile = useCallback((profile: ActiveProfile) => {
    setActiveProfileEntityState(profile);
    try {
      localStorage.setItem(ENTITY_STORAGE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.error('Failed to save active profile entity to localStorage:', err);
    }

    // Announce profile switch for screen readers
    const announcement = document.getElementById('platform-status-announcements');
    if (announcement) {
      announcement.textContent = `Profile switched to ${profile.name}`;
    }
  }, []);

  const clearActiveProfile = useCallback(() => {
    setActiveProfileEntityState(null);
    try {
      localStorage.removeItem(ENTITY_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to remove active profile entity from localStorage:', err);
    }
  }, []);

  const getProfileUrl = useCallback((page?: string): string => {
    if (!activeProfileEntity) {
      return '/';
    }

    // Map profile types to URL paths
    // - 'organization' -> 'org' for shorter URLs
    // - 'comedian_lite' -> 'comedian' (they share routes)
    let urlType: string;
    switch (activeProfileEntity.type) {
      case 'organization':
        urlType = 'org';
        break;
      case 'comedian_lite':
        urlType = 'comedian';
        break;
      default:
        urlType = activeProfileEntity.type;
    }

    const basePath = `/${urlType}/${activeProfileEntity.slug}`;
    const pagePath = page || 'dashboard';

    return `${basePath}/${pagePath}`;
  }, [activeProfileEntity]);

  const value = useMemo(() => ({
    // Profile type state (legacy - for backwards compatibility)
    activeProfile: activeProfileType,
    availableProfiles,
    switchProfile,
    isLoading,
    hasProfile,
    error: error ? (error instanceof Error ? error.message : 'Failed to load profiles') : null,
    // Active profile entity state (merged from ActiveProfileContext)
    activeProfileEntity,
    setActiveProfile,
    clearActiveProfile,
    getProfileUrl,
  }), [activeProfileType, availableProfiles, switchProfile, isLoading, hasProfile, error, activeProfileEntity, setActiveProfile, clearActiveProfile, getProfileUrl]);

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
 * Hook for accessing active profile entity state.
 * This is the preferred API for components that need full profile entity data.
 * Provides backwards compatibility with the former ActiveProfileContext.
 */
export function useActiveProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useActiveProfile must be used within a ProfileProvider');
  }

  // Return only the entity-related fields (API compatible with former ActiveProfileContext)
  return {
    activeProfile: context.activeProfileEntity,
    setActiveProfile: context.setActiveProfile,
    clearActiveProfile: context.clearActiveProfile,
    getProfileUrl: context.getProfileUrl,
  };
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
