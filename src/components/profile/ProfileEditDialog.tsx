import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { type ProfileTypeValue, PROFILE_TYPES } from '@/contexts/ProfileContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import {
  ComedianProfileForm,
  PromoterProfileForm,
  ManagerProfileForm,
  PhotographerProfileForm,
  VideographerProfileForm,
  type ComedianProfileFormData,
  type PromoterProfileFormData,
  type ManagerProfileFormData,
  type PhotographerProfileFormData,
  type VideographerProfileFormData,
} from './forms';

interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileType: ProfileTypeValue;
  onSuccess?: () => void;
}

type ProfileFormData =
  | ComedianProfileFormData
  | PromoterProfileFormData
  | ManagerProfileFormData
  | PhotographerProfileFormData
  | VideographerProfileFormData;

/**
 * Profile Edit Dialog Component
 *
 * Modal dialog for editing existing profiles.
 * Fetches current profile data and displays the appropriate form.
 * Reuses form components from the Profile Creation Wizard.
 */
export function ProfileEditDialog({
  isOpen,
  onClose,
  profileType,
  onSuccess,
}: ProfileEditDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData | null>(null);

  // Fetch profile data when dialog opens
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isOpen || !user?.id) return;

      setIsLoading(true);
      try {
        // Fetch base profile data
        const { data: baseProfile, error: baseError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (baseError) throw baseError;

        // For comedian and promoter, use base profile data
        if (profileType === 'comedian' || profileType === 'promoter') {
          setProfileData(baseProfile);
        } else {
          // Fetch profile-specific data
          const tableMap: Record<ProfileTypeValue, string> = {
            comedian: 'profiles',
            promoter: 'profiles',
            manager: 'manager_profiles',
            photographer: 'photographer_profiles',
            videographer: 'videographer_profiles',
          };

          const { data: specificProfile, error: specificError } = await supabase
            .from(tableMap[profileType])
            .select('*')
            .eq('id', user.id)
            .single();

          if (specificError) {
            // Profile doesn't exist yet, set default values
            setProfileData({} as ProfileFormData);
          } else {
            // Merge base profile with specific profile
            setProfileData({ ...baseProfile, ...specificProfile });
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [isOpen, user?.id, profileType, toast]);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Update base profile data for comedian and promoter
      if (profileType === 'comedian' || profileType === 'promoter') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // Update profile-specific data for manager, photographer, videographer
      if (profileType === 'manager') {
        const { error } = await supabase
          .from('manager_profiles')
          .upsert({
            id: user.id,
            ...(data as ManagerProfileFormData)
          });

        if (error) throw error;
      } else if (profileType === 'photographer') {
        const { error } = await supabase
          .from('photographer_profiles')
          .upsert({
            id: user.id,
            ...(data as PhotographerProfileFormData)
          });

        if (error) throw error;
      } else if (profileType === 'videographer') {
        const { error } = await supabase
          .from('videographer_profiles')
          .upsert({
            id: user.id,
            ...(data as VideographerProfileFormData)
          });

        if (error) throw error;
      }

      toast({
        title: 'Profile Updated',
        description: `Your ${PROFILE_TYPES[profileType].label.toLowerCase()} has been successfully updated.`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Edit {PROFILE_TYPES[profileType].label}
          </DialogTitle>
          <DialogDescription>
            Update your profile information
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {profileType === 'comedian' && profileData && (
                <ComedianProfileForm
                  initialData={profileData as ComedianProfileFormData}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                  submitLabel={isSaving ? 'Saving...' : 'Save Changes'}
                />
              )}

              {profileType === 'promoter' && profileData && (
                <PromoterProfileForm
                  initialData={profileData as PromoterProfileFormData}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                  submitLabel={isSaving ? 'Saving...' : 'Save Changes'}
                />
              )}

              {profileType === 'manager' && profileData && (
                <ManagerProfileForm
                  initialData={profileData as ManagerProfileFormData}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                  submitLabel={isSaving ? 'Saving...' : 'Save Changes'}
                />
              )}

              {profileType === 'photographer' && profileData && (
                <PhotographerProfileForm
                  initialData={profileData as PhotographerProfileFormData}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                  submitLabel={isSaving ? 'Saving...' : 'Save Changes'}
                />
              )}

              {profileType === 'videographer' && profileData && (
                <VideographerProfileForm
                  initialData={profileData as VideographerProfileFormData}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                  submitLabel={isSaving ? 'Saving...' : 'Save Changes'}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
