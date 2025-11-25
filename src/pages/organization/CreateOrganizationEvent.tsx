import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

export default function CreateOrganizationEvent() {
  const { organization } = useOrganization();
  const navigate = useNavigate();

  // Use slug-based URLs for navigation
  const orgSlug = organization?.url_slug;

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Create Event</h1>
        <p className="mt-1 text-gray-600">Create a new event for {organization.organization_name}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium">Event Creation Form</h3>
          <p className="mb-4 text-sm text-gray-600">
            Organization event creation form will be available here
          </p>
          <div className="flex gap-3">
            <Button className="professional-button" onClick={() => navigate(`/org/${orgSlug}/events`)}>
              Cancel
            </Button>
            <Button>Create Event</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
