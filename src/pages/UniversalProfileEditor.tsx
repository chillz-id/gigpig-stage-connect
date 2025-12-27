import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getProfileConfig } from '@/utils/profileConfig';
import type { ProfileType } from '@/types/universalProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';
import { UniversalProfileTabs } from '@/components/profile/UniversalProfileTabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UniversalProfileEditorProps {
  /**
   * The type of profile being edited
   * If not provided, will be determined from user's primary role
   */
  profileType?: ProfileType;

  /**
   * Optional organization ID for organization profiles
   * If provided, will edit organization profile instead of user profile
   */
  organizationId?: string;
}

export const UniversalProfileEditor: React.FC<UniversalProfileEditorProps> = ({
  profileType: propProfileType,
  organizationId
}) => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Determine profile type
        let type: ProfileType;

        if (propProfileType) {
          // Use explicit prop if provided
          type = propProfileType;
        } else if (organizationId) {
          // Organization profile
          type = 'organization';
        } else {
          // Determine from user roles (priority order)
          if (hasRole('comedian')) {
            type = 'comedian';
          } else if (hasRole('photographer')) {
            type = 'photographer';
          } else if (hasRole('videographer')) {
            type = 'videographer';
          } else if (hasRole('comedy_manager')) {
            type = 'manager';
          } else {
            throw new Error('No valid profile type found for user');
          }
        }

        setProfileType(type);

        // Load profile data based on type
        const config = getProfileConfig(type);
        const tableName = organizationId ? config.tables.main : 'profiles';
        const idColumn = organizationId ? 'id' : 'id';
        const idValue = organizationId || user.id;

        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq(idColumn, idValue)
          .single();

        if (error) throw error;
        setUserData(data);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error Loading Profile',
          description: error instanceof Error ? error.message : 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
    // Note: hasRole and toast are stable references from context, not included to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, propProfileType, organizationId]);

  const handleSaveProfile = async (data: any) => {
    if (!user?.id || !profileType) {
      throw new Error('User not authenticated or profile type not set');
    }

    const config = getProfileConfig(profileType);
    const tableName = organizationId ? config.tables.main : 'profiles';
    const idColumn = organizationId ? 'id' : 'id';
    const idValue = organizationId || user.id;

    const { error } = await supabase
      .from(tableName)
      .update(data)
      .eq(idColumn, idValue);

    if (error) throw error;

    // Reload data
    const { data: updatedData } = await supabase
      .from(tableName)
      .select('*')
      .eq(idColumn, idValue)
      .single();

    if (updatedData) {
      setUserData(updatedData);
    }
  };

  const bgClass = cn("min-h-screen",
    theme === 'pleasure'
      ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
      : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
  );

  if (loading) {
    return (
      <div className={cn(bgClass, "flex items-center justify-center")}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileType || !userData) {
    return (
      <div className={cn(bgClass, "flex items-center justify-center")}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Not Found
            </CardTitle>
            <CardDescription>
              Unable to load profile information. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const config = getProfileConfig(profileType);

  return (
    <div className={bgClass}>
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {config.labels.personal || 'Profile Settings'}
          </h1>
          <p className="text-gray-300 mt-2">
            Manage your {profileType === 'organization' ? 'organization' : 'professional'} profile information
          </p>
        </div>

        <UniversalProfileTabs
          profileType={profileType}
          config={config}
          user={userData}
          onSave={handleSaveProfile}
          organizationId={organizationId}
        />
      </div>
    </div>
  );
};
