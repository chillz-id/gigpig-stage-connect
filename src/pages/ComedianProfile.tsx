
import React from 'react';
import { useComedianProfile } from '@/hooks/useComedianProfile';
import ComedianProfileLoader from '@/components/comedian-profile/ComedianProfileLoader';
import ComedianProfileError from '@/components/comedian-profile/ComedianProfileError';
import ComedianProfileLayout from '@/components/comedian-profile/ComedianProfileLayout';

const ComedianProfile = () => {
  const { comedian, isLoading, error, slug } = useComedianProfile();

  // Handle loading state
  if (isLoading) {
    return <ComedianProfileLoader />;
  }

  // Handle error state
  if (error || !comedian) {
    console.error('Error loading comedian:', error);
    return <ComedianProfileError slug={slug} />;
  }

  return <ComedianProfileLayout comedian={comedian} />;
};

export default ComedianProfile;
