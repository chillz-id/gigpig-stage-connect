import { useState } from 'react';
import { useProfile, PROFILE_TYPES, type ProfileTypeValue, type BaseProfileType, isOrganizationProfile, getOrganizationId } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileCreationWizard } from '@/components/profile/ProfileCreationWizard';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { useMultiProfileCompletion } from '@/hooks/useMultiProfileCompletion';
import { useOrganizationProfiles, getOrganizationDisplayName } from '@/hooks/useOrganizationProfiles';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper hook to fetch profile-specific data for all profile types
function useProfileData(profileType: ProfileTypeValue, userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-data', profileType, userId],
    queryFn: async () => {
      if (!userId) return null;

      // Handle organization profiles separately (use org ID, not user ID)
      if (isOrganizationProfile(profileType)) {
        const orgId = getOrganizationId(profileType);
        if (!orgId) return null;

        const { data: orgProfile } = await supabase
          .from('organization_profiles')
          .select('*')
          .eq('id', orgId)
          .single();

        return orgProfile;
      }

      // Fetch base profile data for base profile types
      const { data: baseProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!baseProfile) return null;

      // For comedian and promoter, return base profile
      if (profileType === 'comedian' || profileType === 'promoter') {
        return baseProfile;
      }

      // Fetch profile-specific data for manager and visual_artist
      const tableMap: Record<string, string> = {
        manager: 'manager_profiles',
        visual_artist: 'visual_artist_profiles',
      };

      const tableName = tableMap[profileType];
      if (!tableName) return baseProfile;

      // For other types, fetch from profile-specific table
      const { data: specificProfile } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', userId)
        .single();

      // Merge base profile with specific profile data
      return specificProfile ? { ...baseProfile, ...specificProfile } : baseProfile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Profile card component with completion tracking
function ProfileCard({
  profileType,
  isActive,
  onSwitch,
  onEdit,
  onDelete,
  canDelete,
}: {
  profileType: ProfileTypeValue;
  isActive: boolean;
  onSwitch: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const { user } = useAuth();
  const { data: organizations } = useOrganizationProfiles();
  const { data: profileData, isLoading } = useProfileData(profileType, user?.id);
  const completion = useMultiProfileCompletion(profileType, profileData);

  // Get icon and label based on profile type
  const isOrg = isOrganizationProfile(profileType);
  let Icon;
  let profileLabel;
  let profileDescription;

  if (isOrg) {
    Icon = Building2;
    const orgId = getOrganizationId(profileType);
    const org = orgId && organizations ? organizations[orgId] : null;
    profileLabel = org ? getOrganizationDisplayName(org) : 'Organization';
    profileDescription = 'Team-based organization with full promoter capabilities';
  } else {
    const profileConfig = PROFILE_TYPES[profileType as BaseProfileType];
    Icon = profileConfig.icon;
    profileLabel = profileConfig.label;
    profileDescription = getProfileTypeDescription(profileType);
  }

  if (isLoading) {
    return (
      <Card className="relative">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "relative transition-all hover:shadow-md",
        isActive && "border-purple-500 shadow-purple-100 dark:shadow-purple-900/20"
      )}
    >
      {isActive && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-purple-600 hover:bg-purple-700 shadow-md">
            <Check className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-lg",
            isActive ? "bg-purple-100 dark:bg-purple-900" : "bg-muted"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              isActive ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">{profileLabel}</CardTitle>
            <CardDescription className="mt-1">
              {profileDescription}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Completion Status */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Profile Completion</span>
              <Badge variant={completion.variant} className="text-xs">
                {completion.label}
              </Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  completion.percentage >= 80 ? "bg-green-500" :
                  completion.percentage >= 50 ? "bg-yellow-500" :
                  "bg-red-500"
                )}
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {completion.percentage}% complete
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isActive && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onSwitch}
              >
                Switch To
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={isActive ? "flex-1" : ""}
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={onDelete}
              disabled={!canDelete}
              title={!canDelete ? "Cannot delete your only profile" : "Delete profile"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Profile Management Page
 *
 * Centralized page for managing all user profiles:
 * - View all available profiles
 * - See active profile indicator
 * - Edit existing profiles
 * - Create new profiles
 * - Delete profiles with confirmation
 * - Profile completion status
 *
 * Located at: /settings/profiles
 */
export function ProfileManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeProfile, availableProfiles, switchProfile } = useProfile();
  const { data: organizations } = useOrganizationProfiles();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<ProfileTypeValue | null>(null);
  const [profileToEdit, setProfileToEdit] = useState<ProfileTypeValue | null>(null);

  const handleEditProfile = (profileType: ProfileTypeValue) => {
    setProfileToEdit(profileType);
  };

  const handleEditSuccess = () => {
    // Optionally refetch profile data or show success message
    // The ProfileEditDialog handles its own success toast
  };

  const handleDeleteProfile = (profileType: ProfileTypeValue) => {
    setProfileToDelete(profileType);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete || !user?.id) return;

    try {
      // Delete from profile-specific tables
      if (profileToDelete === 'manager') {
        // Delete manager-specific data
        const { error: relationshipsError } = await supabase
          .from('manager_comedian_relationships')
          .delete()
          .eq('manager_id', user.id);

        if (relationshipsError) throw relationshipsError;

        const { error: profileError } = await supabase
          .from('manager_profiles')
          .delete()
          .eq('id', user.id);

        if (profileError) throw profileError;
      } else if (profileToDelete === 'visual_artist') {
        // Delete visual artist-specific data
        const { error: portfolioError } = await supabase
          .from('visual_artist_portfolio')
          .delete()
          .eq('visual_artist_id', user.id);

        if (portfolioError) throw portfolioError;

        const { error: availabilityError } = await supabase
          .from('visual_artist_availability')
          .delete()
          .eq('visual_artist_id', user.id);

        if (availabilityError) throw availabilityError;

        const { error: profileError } = await supabase
          .from('visual_artist_profiles')
          .delete()
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // Handle organization deletion separately (organizations don't have user_roles)
      if (isOrganizationProfile(profileToDelete)) {
        const orgId = getOrganizationId(profileToDelete);
        if (!orgId) throw new Error('Invalid organization ID');

        // Delete team members
        const { error: teamError } = await supabase
          .from('organization_team_members')
          .delete()
          .eq('organization_id', orgId);

        if (teamError) throw teamError;

        // Delete organization profile
        const { error: profileError } = await supabase
          .from('organization_profiles')
          .delete()
          .eq('id', orgId);

        if (profileError) throw profileError;
      } else {
        // Delete user role for base profiles only
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role', profileToDelete);

        if (roleError) throw roleError;
      }

      // If deleting active profile, switch to first available
      if (profileToDelete === activeProfile && availableProfiles.length > 1) {
        const remainingProfiles = availableProfiles.filter(p => p !== profileToDelete);
        if (remainingProfiles[0]) {
          switchProfile(remainingProfiles[0]);
        }
      }

      const profileLabel = isOrganizationProfile(profileToDelete)
        ? 'organization'
        : PROFILE_TYPES[profileToDelete as BaseProfileType].label.toLowerCase();

      toast({
        title: 'Profile Deleted',
        description: `Your ${profileLabel} has been permanently deleted.`,
      });

      setProfileToDelete(null);

      // Invalidate queries to trigger refetch
      await queryClient.invalidateQueries({ queryKey: ['user-profiles', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['organization-profiles', user.id] });
    } catch (error) {
      console.error('Failed to delete profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profiles and switch between different roles on the platform
          </p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availableProfiles.map((profileType) => (
          <ProfileCard
            key={profileType}
            profileType={profileType}
            isActive={profileType === activeProfile}
            onSwitch={() => switchProfile(profileType)}
            onEdit={() => handleEditProfile(profileType)}
            onDelete={() => handleDeleteProfile(profileType)}
            canDelete={availableProfiles.length > 1}
          />
        ))}

        {/* Empty State - Create First Profile */}
        {availableProfiles.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Profiles Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first profile to get started on the platform
                  </p>
                </div>
                <Button onClick={() => setIsWizardOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Profile Creation Wizard */}
      <ProfileCreationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      {/* Profile Edit Dialog */}
      {profileToEdit && (
        <ProfileEditDialog
          isOpen={profileToEdit !== null}
          onClose={() => setProfileToEdit(null)}
          profileType={profileToEdit}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={profileToDelete !== null} onOpenChange={() => setProfileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your{' '}
              {profileToDelete && (
                isOrganizationProfile(profileToDelete)
                  ? (() => {
                      const orgId = getOrganizationId(profileToDelete);
                      const org = orgId && organizations ? organizations[orgId] : null;
                      return org ? getOrganizationDisplayName(org) : 'organization';
                    })()
                  : PROFILE_TYPES[profileToDelete as BaseProfileType].label.toLowerCase()
              )}?
              This action cannot be undone and will permanently delete all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProfile}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper function to get detailed profile descriptions
function getProfileTypeDescription(type: ProfileTypeValue): string {
  const descriptions: Record<ProfileTypeValue, string> = {
    comedian: 'Manage your comedy performances and bookings',
    promoter: 'Organize events and book talent',
    manager: 'Represent and manage comedian clients',
    visual_artist: 'Capture events through photography and videography',
    organization: 'Operate as a comedy organization or venue'
  };
  return descriptions[type];
}
