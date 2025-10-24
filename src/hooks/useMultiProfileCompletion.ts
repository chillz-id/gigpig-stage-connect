import { useMemo } from 'react';
import type { ProfileTypeValue } from '@/contexts/ProfileContext';

/**
 * Multi-Profile Completion Tracking Hook
 *
 * Enhanced version of useProfileCompletion that supports all profile types.
 * Calculates completion percentage based on profile-specific required fields.
 *
 * Usage:
 * const completion = useMultiProfileCompletion('comedian', comedianData);
 */

export interface ProfileCompletionResult {
  percentage: number;
  status: 'complete' | 'in_progress' | 'incomplete';
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  missingRequiredFields: string[];
  missingOptionalFields: string[];
  completedFields: number;
  totalRequiredFields: number;
  totalOptionalFields: number;
}

// Define required and optional fields for each profile type
const PROFILE_REQUIREMENTS: Record<ProfileTypeValue, {
  required: string[];
  optional: string[];
  labels: Record<string, string>;
}> = {
  comedian: {
    required: ['name', 'bio'],
    optional: ['avatar_url', 'location', 'instagram_url', 'twitter_url', 'facebook_url', 'youtube_url'],
    labels: {
      name: 'Stage Name',
      bio: 'Bio',
      avatar_url: 'Profile Photo',
      location: 'Location',
      instagram_url: 'Instagram',
      twitter_url: 'Twitter',
      facebook_url: 'Facebook',
      youtube_url: 'YouTube'
    }
  },
  promoter: {
    required: ['name'],
    optional: ['bio', 'avatar_url', 'location', 'website_url'],
    labels: {
      name: 'Organization Name',
      bio: 'Description',
      avatar_url: 'Logo',
      location: 'Location',
      website_url: 'Website'
    }
  },
  manager: {
    required: ['agency_name'],
    optional: ['bio', 'commission_rate', 'phone', 'linkedin_url'],
    labels: {
      agency_name: 'Agency Name',
      bio: 'Bio',
      commission_rate: 'Commission Rate',
      phone: 'Phone',
      linkedin_url: 'LinkedIn'
    }
  },
  photographer: {
    required: ['specialties'],
    optional: ['experience_years', 'portfolio_url', 'rate_per_hour', 'instagram_portfolio'],
    labels: {
      specialties: 'Specialties',
      experience_years: 'Experience',
      portfolio_url: 'Portfolio',
      rate_per_hour: 'Hourly Rate',
      instagram_portfolio: 'Instagram'
    }
  },
  videographer: {
    required: ['specialties'],
    optional: ['experience_years', 'video_reel_url', 'rate_per_hour', 'youtube_channel'],
    labels: {
      specialties: 'Specialties',
      experience_years: 'Experience',
      video_reel_url: 'Video Reel',
      rate_per_hour: 'Hourly Rate',
      youtube_channel: 'YouTube'
    }
  }
};

function isFieldFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

export function useMultiProfileCompletion(
  profileType: ProfileTypeValue,
  profileData: Record<string, any> | null | undefined
): ProfileCompletionResult {
  return useMemo(() => {
    const requirements = PROFILE_REQUIREMENTS[profileType];

    if (!profileData) {
      return {
        percentage: 0,
        status: 'incomplete',
        label: 'Not Created',
        variant: 'destructive',
        missingRequiredFields: requirements.required,
        missingOptionalFields: requirements.optional,
        completedFields: 0,
        totalRequiredFields: requirements.required.length,
        totalOptionalFields: requirements.optional.length
      };
    }

    const filledRequired = requirements.required.filter(f => isFieldFilled(profileData[f]));
    const missingRequired = requirements.required.filter(f => !isFieldFilled(profileData[f]));
    const filledOptional = requirements.optional.filter(f => isFieldFilled(profileData[f]));
    const missingOptional = requirements.optional.filter(f => !isFieldFilled(profileData[f]));

    // 70% weight for required, 30% for optional
    const reqPct = requirements.required.length > 0
      ? (filledRequired.length / requirements.required.length) * 70
      : 70;
    const optPct = requirements.optional.length > 0
      ? (filledOptional.length / requirements.optional.length) * 30
      : 30;

    const percentage = Math.round(reqPct + optPct);

    let status: ProfileCompletionResult['status'];
    let label: string;
    let variant: ProfileCompletionResult['variant'];

    if (missingRequired.length === 0 && percentage >= 80) {
      status = 'complete';
      label = 'Complete';
      variant = 'default';
    } else if (missingRequired.length === 0) {
      status = 'in_progress';
      label = 'In Progress';
      variant = 'secondary';
    } else {
      status = 'incomplete';
      label = 'Incomplete';
      variant = 'destructive';
    }

    return {
      percentage,
      status,
      label,
      variant,
      missingRequiredFields: missingRequired,
      missingOptionalFields: missingOptional,
      completedFields: filledRequired.length + filledOptional.length,
      totalRequiredFields: requirements.required.length,
      totalOptionalFields: requirements.optional.length
    };
  }, [profileType, profileData]);
}

export function getFieldLabel(profileType: ProfileTypeValue, fieldName: string): string {
  return PROFILE_REQUIREMENTS[profileType].labels[fieldName] || fieldName;
}
