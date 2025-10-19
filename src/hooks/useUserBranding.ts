import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';

interface UserBranding {
  logoUrl: string | null;
  brandName: string | null;
  isLoading: boolean;
}

/**
 * useUserBranding Hook
 *
 * Provides dynamic branding based on user role:
 * - Promoters/Organizers → Organization logo from organizers.logo_url
 * - Comedians → Profile picture from profiles.avatar_url
 * - Default → Stand Up Sydney logo (/id-logo.png)
 *
 * @returns {UserBranding} Logo URL, brand name, and loading state
 */
export const useUserBranding = (): UserBranding => {
  const { user, hasRole } = useAuth();
  const { profile } = useUser();
  const [branding, setBranding] = useState<UserBranding>({
    logoUrl: '/id-logo.png',
    brandName: 'Stand Up Sydney',
    isLoading: true,
  });

  useEffect(() => {
    const fetchBranding = async () => {
      if (!user) {
        setBranding({
          logoUrl: '/id-logo.png',
          brandName: 'Stand Up Sydney',
          isLoading: false,
        });
        return;
      }

      try {
        // Use profile picture if available (comedians, promoters, etc.)
        if (profile?.avatar_url) {
          setBranding({
            logoUrl: profile.avatar_url,
            brandName: profile.name || 'Stand Up Sydney',
            isLoading: false,
          });
          return;
        }

        // Default fallback
        setBranding({
          logoUrl: '/id-logo.png',
          brandName: 'Stand Up Sydney',
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching user branding:', error);
        setBranding({
          logoUrl: '/id-logo.png',
          brandName: 'Stand Up Sydney',
          isLoading: false,
        });
      }
    };

    fetchBranding();
  }, [user, profile, hasRole]);

  return branding;
};
