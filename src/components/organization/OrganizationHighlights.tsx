import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface OrganizationHighlightsProps {
  organizationId: string;
  isOwnProfile: boolean;
}

const OrganizationHighlights: React.FC<OrganizationHighlightsProps> = ({
  organizationId,
  isOwnProfile
}) => {
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-2xl">
          <Trophy className="w-6 h-6 text-purple-400" />
          Highlights & Reviews
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">Company Highlights</h3>
          <p className="text-gray-300">
            Organization highlights and reviews coming soon!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationHighlights;
