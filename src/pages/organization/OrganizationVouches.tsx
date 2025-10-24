import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';

export default function OrganizationVouches() {
  const { organization } = useOrganization();

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Vouches</h1>
        <p className="mt-1 text-gray-600">{organization.organization_name}'s vouches and recommendations</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Award className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium">Vouches Module</h3>
          <p className="mb-4 text-sm text-gray-600">
            Organization vouches and testimonials will be available here
          </p>
          <Button>Give Vouch</Button>
        </CardContent>
      </Card>
    </div>
  );
}
