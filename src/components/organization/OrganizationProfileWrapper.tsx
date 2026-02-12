import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import OrganizationProfileLayout from './OrganizationProfileLayout';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Wrapper component that fetches organization data from context
 * and passes it to OrganizationProfileLayout
 */
export function OrganizationProfileWrapper() {
  const { organization, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#131b2b] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-[#131b2b] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Organization Not Found</h1>
          <p>Could not load organization details.</p>
        </div>
      </div>
    );
  }

  return <OrganizationProfileLayout organization={organization} />;
}
