import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  const [availableProfiles, setAvailableProfiles] = useState<ProfileTypeValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available profiles from user_roles
  useEffect(() => {
    const fetchAvailableProfiles = async () => {
      if (!user) {
        setAvailableProfiles([]);
        setActiveProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

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

        setAvailableProfiles(profiles);

        // Set active profile from localStorage or default to first available
        const savedProfile = localStorage.getItem(STORAGE_KEY) as ProfileTypeValue | null;
        if (savedProfile && profiles.includes(savedProfile)) {
          setActiveProfile(savedProfile);
        } else if (profiles.length > 0) {
          // Default to first available profile
          const defaultProfile = profiles[0];
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
      } catch (err) {
        console.error('Error fetching available profiles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profiles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableProfiles();
  }, [user]);

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
    error,
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
