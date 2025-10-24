import { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationProfiles } from '@/hooks/useOrganizationProfiles';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { Loader2 } from 'lucide-react';

/**
 * Organization Route Protection Component
 *
 * Wraps organization routes to ensure:
 * 1. User is authenticated
 * 2. Organization exists
 * 3. User is a member of the organization
 * 4. Provides OrganizationContext to children
 *
 * Usage in App.tsx:
 * ```tsx
 * <Route
 *   path="/org/:orgId/*"
 *   element={
 *     <OrganizationRoute>
 *       <OrganizationLayout />
 *     </OrganizationRoute>
 *   }
 * >
 *   <Route path="dashboard" element={<OrganizationDashboard />} />
 *   <Route path="events" element={<OrganizationEvents />} />
 * </Route>
 * ```
 */

interface OrganizationRouteProps {
  children: ReactNode;
}

export const OrganizationRoute = ({ children }: OrganizationRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { orgId } = useParams<{ orgId: string }>();
  const { data: organizations, isLoading: orgsLoading } = useOrganizationProfiles();

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for organizations to load
  if (orgsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Check if organization exists and user is a member
  const organization = orgId && organizations ? organizations[orgId] : undefined;

  if (!organization) {
    // Organization not found or user is not a member
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
        <p className="text-gray-600">
          You don't have access to this organization or it doesn't exist.
        </p>
        <a href="/dashboard" className="text-purple-600 hover:underline">
          Return to Dashboard
        </a>
      </div>
    );
  }

  // Wrap children with OrganizationProvider
  return <OrganizationProvider>{children}</OrganizationProvider>;
};
