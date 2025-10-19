import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Camera,
  Drama,
  Video,
  Users
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ProfileTypeValue = 'comedian' | 'promoter' | 'manager' | 'photographer' | 'videographer';

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
  promoter: {
    type: 'promoter',
    label: 'Promoter Profile',
    icon: Users,
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
  'promoter': 'promoter',
  'manager': 'manager',
  'photographer': 'photographer',
  'videographer': 'videographer',
};

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user } = useAuth();
  const [activeProfile, setActiveProfile] = useState<ProfileTypeValue | null>(null);

  // Use React Query to cache user roles data
  const { data: availableProfiles = [], isLoading, error } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];

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

      return profiles;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Set active profile when availableProfiles changes
  useEffect(() => {
    if (isLoading) return;

    // Set active profile from localStorage or default to first available
    const savedProfile = localStorage.getItem(STORAGE_KEY) as ProfileTypeValue | null;
    if (savedProfile && availableProfiles.includes(savedProfile)) {
      setActiveProfile(savedProfile);
    } else if (availableProfiles.length > 0) {
      // Default to first available profile
      const defaultProfile = availableProfiles[0];
      if (defaultProfile) {
        setActiveProfile(defaultProfile);
        localStorage.setItem(STORAGE_KEY, defaultProfile);
      }
    } else {
      // User has no comedy profiles - clear any stale localStorage
      setActiveProfile(null);
      localStorage.removeItem(STORAGE_KEY);
      console.log('User has no comedy profiles - profile creation required');
    }
  }, [availableProfiles, isLoading]);

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
      announcement.textContent = `Profile switched to ${PROFILE_TYPES[type].label}`;
    }
  }, [availableProfiles]);

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
