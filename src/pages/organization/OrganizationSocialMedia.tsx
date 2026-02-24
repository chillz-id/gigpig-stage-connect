import { useOrganization } from '@/contexts/OrganizationContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import SocialMedia from '@/pages/SocialMedia';

export default function OrganizationSocialMedia() {
  const { organization, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  return <SocialMedia organizationId={organization.id} />;
}
