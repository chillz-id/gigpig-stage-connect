import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostSignupFlowHandler } from '@/components/auth/PostSignupFlowHandler';
import { ClaimProfileModal } from '@/components/auth/ClaimProfileModal';
import { claimDirectoryProfile } from '@/services/directory/claim-service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ClaimableProfile } from '@/types/directory';

/**
 * Page wrapper for post-signup flow
 * Shown after initial authentication to setup additional profiles
 * Also handles directory profile claiming if applicable
 */
const PostSignupSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimableProfiles, setClaimableProfiles] = useState<ClaimableProfile[]>([]);

  // Check for pending claims on mount
  useEffect(() => {
    const pendingClaim = sessionStorage.getItem('pendingClaim');
    const storedProfiles = sessionStorage.getItem('claimableProfiles');

    if (pendingClaim === 'true' && storedProfiles) {
      try {
        const profiles = JSON.parse(storedProfiles) as ClaimableProfile[];
        if (profiles.length > 0) {
          setClaimableProfiles(profiles);
          setShowClaimModal(true);
        }
      } catch (e) {
        console.error('Error parsing claimable profiles:', e);
      }
    }
  }, []);

  const handleClaim = async (profileId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to claim a profile.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First, check if user has a comedian profile to link to
      const { data: comedian } = await supabase
        .from('comedians')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!comedian) {
        // Create a basic comedian profile first
        const { data: newComedian, error: createError } = await supabase
          .from('comedians')
          .insert({
            user_id: user.id,
            stage_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Comedian',
          })
          .select('id')
          .single();

        if (createError || !newComedian) {
          throw new Error('Failed to create comedian profile');
        }

        // Now claim the directory profile
        const result = await claimDirectoryProfile(profileId, newComedian.id, user.id);

        if (result.success) {
          toast({
            title: 'Profile Claimed!',
            description: `Successfully imported ${result.photos_copied || 0} photos to your profile.`,
          });
        } else {
          throw new Error(result.error || 'Failed to claim profile');
        }
      } else {
        // User already has a comedian profile, link to it
        const result = await claimDirectoryProfile(profileId, comedian.id, user.id);

        if (result.success) {
          toast({
            title: 'Profile Claimed!',
            description: `Successfully imported ${result.photos_copied || 0} photos to your profile.`,
          });
        } else {
          throw new Error(result.error || 'Failed to claim profile');
        }
      }

      // Clear session storage and close modal
      sessionStorage.removeItem('pendingClaim');
      sessionStorage.removeItem('claimableProfiles');
      setShowClaimModal(false);

      // Navigate to gigs page after claiming
      navigate('/gigs');
    } catch (error) {
      console.error('Claim error:', error);
      toast({
        title: 'Claim Failed',
        description: error instanceof Error ? error.message : 'Unable to claim profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClaimSkip = () => {
    // Clear session storage
    sessionStorage.removeItem('pendingClaim');
    sessionStorage.removeItem('claimableProfiles');
    setShowClaimModal(false);
  };

  return (
    <>
      <PostSignupFlowHandler />
      {showClaimModal && claimableProfiles.length > 0 && (
        <ClaimProfileModal
          profiles={claimableProfiles}
          onClaim={handleClaim}
          onSkip={handleClaimSkip}
          isOpen={showClaimModal}
        />
      )}
    </>
  );
};

export default PostSignupSetup;
