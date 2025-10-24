import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useOrganizationProfiles, type OrganizationProfile } from '@/hooks/useOrganizationProfiles';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Organization Context
 *
 * Provides organization-scoped data and operations for organization routes.
 * - Extracts orgId from URL params (/org/:orgId/*)
 * - Provides current organization data
 * - Provides permission helpers (isOwner, isAdmin, isMember)
 * - Used by all organization pages and components
 *
 * Usage:
 * ```tsx
 * function OrganizationDashboard() {
 *   const { organization, isOwner, isAdmin } = useOrganization();
 *
 *   if (!organization) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h1>{organization.organization_name}</h1>
 *       {isOwner && <button>Owner Actions</button>}
 *     </div>
 *   );
 * }
 * ```
 */

interface OrganizationContextValue {
  // Current organization ID from URL
  orgId: string | undefined;

  // Organization data (null if loading, undefined if not found)
  organization: OrganizationProfile | null | undefined;

  // Loading state
  isLoading: boolean;

  // Permission helpers
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;

  // Error state
  error: Error | null;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider = ({ children }: OrganizationProviderProps) => {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useAuth();
  const { data: organizations, isLoading, error } = useOrganizationProfiles();

  // Get organization data for current orgId - memoize to prevent re-renders
  const organization = useMemo(() => {
    return orgId && organizations ? organizations[orgId] : undefined;
  }, [orgId, organizations]);

  // Permission checks - memoize to prevent re-renders
  const { isOwner, isAdmin, isMember } = useMemo(() => {
    const owner = organization?.is_owner ?? false;
    const admin = organization?.member_role === 'admin' || owner;
    const member = !!organization;
    return { isOwner: owner, isAdmin: admin, isMember: member };
  }, [organization]);

  const value: OrganizationContextValue = useMemo(() => ({
    orgId,
    organization: isLoading ? null : organization,
    isLoading,
    isOwner,
    isAdmin,
    isMember,
    error,
  }), [orgId, organization, isLoading, isOwner, isAdmin, isMember, error]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

/**
 * Hook to access organization context
 *
 * @throws {Error} If used outside OrganizationProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { organization, isOwner } = useOrganization();
 *
 *   if (!organization) return <div>Organization not found</div>;
 *
 *   return <div>{organization.organization_name}</div>;
 * }
 * ```
 */
export const useOrganization = (): OrganizationContextValue => {
  const context = useContext(OrganizationContext);

  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }

  return context;
};

/**
 * Hook to require organization context (throws if organization not found)
 *
 * Useful for pages that absolutely require an organization to be loaded.
 * Will throw an error if organization is not found, which will be caught
 * by the nearest error boundary.
 *
 * @example
 * ```tsx
 * function OrganizationSettings() {
 *   const { organization, isOwner } = useRequiredOrganization();
 *
 *   // organization is guaranteed to be defined here
 *   return <div>{organization.organization_name}</div>;
 * }
 * ```
 */
export const useRequiredOrganization = (): Omit<OrganizationContextValue, 'organization'> & {
  organization: OrganizationProfile;
} => {
  const context = useOrganization();

  if (!context.organization && !context.isLoading) {
    throw new Error('Organization not found');
  }

  if (context.isLoading) {
    throw new Promise(() => {}); // Suspend until loaded
  }

  return {
    ...context,
    organization: context.organization!,
  };
};
