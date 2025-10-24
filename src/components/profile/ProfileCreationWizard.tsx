import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, PROFILE_TYPES, type ProfileTypeValue, type BaseProfileType, isOrganizationProfile } from '@/contexts/ProfileContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Building2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ComedianProfileForm,
  PromoterProfileForm,
  ManagerProfileForm,
  VisualArtistProfileForm,
  OrganizationProfileForm,
  type ComedianProfileFormData,
  type PromoterProfileFormData,
  type ManagerProfileFormData,
  type VisualArtistProfileFormData,
  type OrganizationProfileFormData,
} from './forms';

/**
 * Profile Creation Wizard
 *
 * Multi-step wizard for creating new user profiles:
 * Step 1: Select profile type
 * Step 2: Fill out profile-specific form
 * Step 3: Review and create
 *
 * Features:
 * - Profile type selection with icons
 * - Profile-specific form validation
 * - Progress tracking
 * - Save progress to localStorage
 * - Cancel and resume later
 */

interface ProfileCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProfileType?: ProfileTypeValue;
}

type ProfileFormData =
  | ComedianProfileFormData
  | PromoterProfileFormData
  | ManagerProfileFormData
  | VisualArtistProfileFormData
  | OrganizationProfileFormData;

export function ProfileCreationWizard({
  isOpen,
  onClose,
  defaultProfileType
}: ProfileCreationWizardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { availableProfiles, switchProfile } = useProfile();
  const { toast } = useToast();
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedType, setSelectedType] = useState<ProfileTypeValue | 'organization' | null>(defaultProfileType || null);
  const [formData, setFormData] = useState<ProfileFormData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Get base profile types that user doesn't have yet
  const availableBaseProfileTypes = Object.values(PROFILE_TYPES).filter(
    profile => !availableProfiles.includes(profile.type)
  );

  // Organization is always available to create (can have multiple)
  const canCreateOrganization = true;

  const handleSelectProfileType = (type: ProfileTypeValue | 'organization') => {
    setSelectedType(type);
    setStep('form');
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('select');
      setSelectedType(null);
      setFormData(null);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedType(null);
    setFormData(null);
    onClose();
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    if (!selectedType || !user?.id) return;

    setIsCreating(true);
    try {
      let newProfileId: ProfileTypeValue;

      // Organizations are team-based entities, not user roles
      if (selectedType === 'organization') {
        const orgData = data as OrganizationProfileFormData;

        // Generate independent UUID for organization
        const { data: newOrg, error } = await supabase
          .from('organization_profiles')
          .insert({
            owner_id: user.id,
            organization_name: orgData.organization_name,
            display_name: orgData.display_name,
            legal_name: orgData.legal_name,
            display_name_preference: orgData.display_name_preference,
            organization_type: orgData.organization_type,
            abn: orgData.abn,
            bio: orgData.bio,
            contact_email: orgData.contact_email,
            contact_phone: orgData.contact_phone,
            website_url: orgData.website_url,
            instagram_url: orgData.instagram_url,
            facebook_url: orgData.facebook_url,
            twitter_url: orgData.twitter_url,
          })
          .select()
          .single();

        if (error) throw error;
        if (!newOrg) throw new Error('Failed to create organization');

        // New profile ID is org:{uuid}
        newProfileId = `org:${newOrg.id}` as ProfileTypeValue;
      } else {
        // For base profiles (comedian, promoter, manager, visual_artist)
        // Create user role if it doesn't exist
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: selectedType,
          }, {
            onConflict: 'user_id,role'
          });

        if (roleError) throw roleError;

        // Update base profile data for comedian and promoter
        if (selectedType === 'comedian' || selectedType === 'promoter') {
          const { error: profileError } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', user.id);

          if (profileError) throw profileError;
        }

        // Create profile-specific data for manager, visual_artist
        if (selectedType === 'manager') {
          const { error } = await supabase
            .from('manager_profiles')
            .insert({
              id: user.id,
              ...(data as ManagerProfileFormData)
            });

          if (error) throw error;
        } else if (selectedType === 'visual_artist') {
          const visualArtistData = data as VisualArtistProfileFormData;
          const { error } = await supabase
            .from('visual_artist_profiles')
            .insert({
              id: user.id,
              specialties: visualArtistData.specialties,
              experience_years: visualArtistData.experience_years,
              portfolio_url: visualArtistData.portfolio_url,
              video_reel_url: visualArtistData.video_reel_url,
              rate_per_hour: visualArtistData.rate_per_hour,
              instagram_portfolio: visualArtistData.instagram_portfolio,
              youtube_channel: visualArtistData.youtube_channel,
              is_videographer: visualArtistData.services?.includes('videography') || false,
            });

          if (error) throw error;
        }

        newProfileId = selectedType;
      }

      // Switch to new profile
      switchProfile(newProfileId);

      const profileLabel = selectedType === 'organization'
        ? 'organization'
        : PROFILE_TYPES[selectedType as BaseProfileType].label.toLowerCase();

      toast({
        title: 'Profile Created',
        description: `Your ${profileLabel} has been successfully created.`,
      });

      // Close wizard
      handleClose();

      // Navigate to profile page
      navigate('/settings/profiles');
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 'select' && 'Create New Profile'}
            {step === 'form' && selectedType && (
              selectedType === 'organization'
                ? 'Create Organization'
                : `Create ${PROFILE_TYPES[selectedType as BaseProfileType].label}`
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Choose the type of profile you want to create'}
            {step === 'form' && 'Fill in your profile details to get started'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Step 1: Profile Type Selection */}
          {step === 'select' && (
            <div className="space-y-6">
              {availableBaseProfileTypes.length === 0 && !canCreateOrganization ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    You've already created all available profile types!
                  </p>
                  <Button onClick={handleClose}>Close</Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Select the type of profile you want to create. You can create multiple profiles and switch between them anytime.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Base Profile Types */}
                    {availableBaseProfileTypes.map((profileType) => {
                      const Icon = profileType.icon;
                      return (
                        <button
                          key={profileType.type}
                          onClick={() => handleSelectProfileType(profileType.type)}
                          className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all",
                            "hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950",
                            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                          )}
                        >
                          <Icon className="h-12 w-12 mb-3 text-purple-600 dark:text-purple-400" />
                          <h3 className="font-semibold text-lg mb-1">{profileType.label}</h3>
                          <p className="text-sm text-muted-foreground text-center">
                            {getProfileDescription(profileType.type)}
                          </p>
                        </button>
                      );
                    })}

                    {/* Organization Option - Always Available */}
                    {canCreateOrganization && (
                      <button
                        onClick={() => handleSelectProfileType('organization')}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all",
                          "hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950",
                          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        )}
                      >
                        <Building2 className="h-12 w-12 mb-3 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-semibold text-lg mb-1">Organization</h3>
                        <p className="text-sm text-muted-foreground text-center">
                          {getProfileDescription('organization')}
                        </p>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Profile-Specific Form */}
          {step === 'form' && selectedType && (
            <div>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-4"
              >
                ← Back to Profile Selection
              </Button>

              {selectedType === 'comedian' && (
                <ComedianProfileForm
                  onSubmit={handleFormSubmit}
                  submitLabel={isCreating ? 'Creating...' : 'Create Profile'}
                />
              )}

              {selectedType === 'promoter' && (
                <PromoterProfileForm
                  onSubmit={handleFormSubmit}
                  submitLabel={isCreating ? 'Creating...' : 'Create Profile'}
                />
              )}

              {selectedType === 'manager' && (
                <ManagerProfileForm
                  onSubmit={handleFormSubmit}
                  submitLabel={isCreating ? 'Creating...' : 'Create Profile'}
                />
              )}

              {selectedType === 'visual_artist' && (
                <VisualArtistProfileForm
                  onSubmit={handleFormSubmit}
                  submitLabel={isCreating ? 'Creating...' : 'Create Profile'}
                />
              )}

              {selectedType === 'organization' && (
                <OrganizationProfileForm
                  onSubmit={handleFormSubmit}
                  submitLabel={isCreating ? 'Creating...' : 'Create Profile'}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get profile type descriptions
function getProfileDescription(type: ProfileTypeValue | 'organization'): string {
  const descriptions: Record<string, string> = {
    comedian: 'Perform at shows, manage bookings, and build your comedy career',
    promoter: 'Organize events, book talent, and manage venues',
    manager: 'Represent comedians, negotiate bookings, and manage client rosters',
    visual_artist: 'Capture events and create content through photography and videography',
    organization: 'Create team-based organization with full promoter capabilities'
  };
  return descriptions[type] || 'Unknown profile type';
}
