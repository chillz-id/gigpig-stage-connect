import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface ActiveProfile {
  id: string;
  type: 'comedian' | 'manager' | 'organization' | 'venue' | 'photographer';
  slug: string;
  name: string;
  avatarUrl?: string;
}

interface ActiveProfileContextType {
  activeProfile: ActiveProfile | null;
  setActiveProfile: (profile: ActiveProfile) => void;
  clearActiveProfile: () => void;
  getProfileUrl: (page?: string) => string;
}

const ActiveProfileContext = createContext<ActiveProfileContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'activeProfile';

const isValidProfileType = (
  type: string
): type is ActiveProfile['type'] => {
  return ['comedian', 'manager', 'organization', 'venue', 'photographer'].includes(type);
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

export function ActiveProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile | null>(
    () => {
      // Load from localStorage on mount
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (isValidActiveProfile(parsed)) {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Failed to load active profile from localStorage:', error);
      }
      return null;
    }
  );

  const setActiveProfile = useCallback((profile: ActiveProfile) => {
    setActiveProfileState(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save active profile to localStorage:', error);
    }
  }, []);

  const clearActiveProfile = useCallback(() => {
    setActiveProfileState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove active profile from localStorage:', error);
    }
  }, []);

  const getProfileUrl = useCallback((page?: string): string => {
    if (!activeProfile) {
      return '/';
    }

    // Map 'organization' to 'org' for shorter URLs
    const urlType = activeProfile.type === 'organization' ? 'org' : activeProfile.type;
    const basePath = `/${urlType}/${activeProfile.slug}`;
    const pagePath = page || 'dashboard';

    return `${basePath}/${pagePath}`;
  }, [activeProfile]);

  const value: ActiveProfileContextType = useMemo(() => ({
    activeProfile,
    setActiveProfile,
    clearActiveProfile,
    getProfileUrl,
  }), [activeProfile, setActiveProfile, clearActiveProfile, getProfileUrl]);

  return (
    <ActiveProfileContext.Provider value={value}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile(): ActiveProfileContextType {
  const context = useContext(ActiveProfileContext);

  if (context === undefined) {
    throw new Error(
      'useActiveProfile must be used within an ActiveProfileProvider'
    );
  }

  return context;
}
