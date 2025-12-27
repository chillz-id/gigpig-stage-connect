import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';

interface OrganizationMediaProps {
  organizationId: string;
  isOwnProfile: boolean;
  trackInteraction?: (action: string, details?: any) => void;
  mediaLayout?: 'grid' | 'masonic' | 'list';
}

const OrganizationMedia: React.FC<OrganizationMediaProps> = ({
  organizationId,
  isOwnProfile,
  trackInteraction,
  mediaLayout = 'grid'
}) => {
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-2xl">
            <ImageIcon className="w-6 h-6 text-purple-400" />
            Media Gallery
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">Media Gallery</h3>
          <p className="text-gray-300">
            Organization media showcase coming soon!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationMedia;
