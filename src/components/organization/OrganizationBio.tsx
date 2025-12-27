import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface OrganizationBioProps {
  organization: {
    id: string;
    organization_name: string | null;
    bio: string | null;
    location: string | null;
    created_at?: string | null;
  };
}

const OrganizationBio: React.FC<OrganizationBioProps> = ({ organization }) => {
  if (!organization.bio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">
            No information available yet. Check back soon for more information about this organization.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          About
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Bio Text */}
        <div className="prose prose-gray max-w-none">
          <p className="text-base leading-relaxed whitespace-pre-line">
            {organization.bio}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationBio;
