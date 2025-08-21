import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  percentage: number;
  missingFields: string[];
  completedFields: string[];
}

export const useProfileCompletion = () => {
  const { profile, user } = useAuth();
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus>({
    isComplete: false,
    percentage: 0,
    missingFields: [],
    completedFields: []
  });
  
  // Calculate completion status based on profile data
  const status = useMemo(() => {
    if (!profile || !user) {
      return {
        isComplete: false,
        percentage: 0,
        missingFields: ['Profile not found'],
        completedFields: []
      };
    }

    const requiredFields = [
      { key: 'name', label: 'Name', check: () => Boolean(profile.name?.trim()) },
      { key: 'avatar_url', label: 'Profile Photo', check: () => Boolean(profile.avatar_url) },
      { key: 'bio', label: 'Bio', check: () => Boolean(profile.bio?.trim()) },
      { key: 'location', label: 'Location', check: () => Boolean(profile.location?.trim()) },
      { 
        key: 'social_media', 
        label: 'Social Media', 
        check: () => Boolean(
          profile.instagram_url || 
          profile.twitter_url || 
          profile.facebook_url || 
          profile.youtube_url || 
          profile.tiktok_url
        )
      }
    ];

    const completedFields: string[] = [];
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      if (field.check()) {
        completedFields.push(field.label);
      } else {
        missingFields.push(field.label);
      }
    });

    const percentage = Math.round((completedFields.length / requiredFields.length) * 100);
    const isComplete = percentage === 100;

    return {
      isComplete,
      percentage,
      missingFields,
      completedFields
    };
  }, [profile, user]);

  useEffect(() => {
    setCompletionStatus(status);
  }, [status]);

  // Check if this is a first-time user (profile created recently)
  const isFirstTimeUser = useMemo(() => {
    if (!profile?.created_at) return false;
    
    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    // Consider user as first-time if profile was created less than 7 days ago
    return daysDiff < 7;
  }, [profile?.created_at]);

  // Check if user should be redirected to profile page
  const shouldRedirectToProfile = useMemo(() => {
    // Don't redirect if profile is already complete
    if (completionStatus.isComplete) return false;
    
    // Don't redirect if profile doesn't exist yet
    if (!profile) return false;
    
    // Check if this is stored as first login in localStorage
    const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true';
    
    // Redirect if it's first login OR if profile is significantly incomplete
    return isFirstLogin || completionStatus.percentage < 40;
  }, [completionStatus, profile]);

  // Mark first login as completed
  const markFirstLoginComplete = () => {
    localStorage.setItem('isFirstLogin', 'false');
  };

  // Set first login flag (called from auth context on new login)
  const setFirstLogin = () => {
    localStorage.setItem('isFirstLogin', 'true');
  };

  return {
    completionStatus,
    isFirstTimeUser,
    shouldRedirectToProfile,
    markFirstLoginComplete,
    setFirstLogin
  };
};