import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield } from 'lucide-react';

interface OrganizationBasicInfoProps {
  organization_name: string | null;
  location: string | null;
  tagline?: string | null;
  is_verified: boolean;
  url_slug: string | null;
}

const OrganizationBasicInfo: React.FC<OrganizationBasicInfoProps> = ({
  organization_name,
  location,
  tagline,
  is_verified,
  url_slug
}) => {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
          {organization_name || 'Unknown Organization'}
        </h1>
        {is_verified && (
          <div className="flex items-center gap-1">
            <Shield className="w-5 h-5 text-blue-400" />
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs">
              Verified
            </Badge>
          </div>
        )}
      </div>

      {/* URL slug */}
      {url_slug && (
        <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-gray-300">
          <span className="text-sm">standupsydney.com/org/{url_slug}</span>
        </div>
      )}

      {/* Location */}
      {location && (
        <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-gray-300">
          <MapPin className="w-4 h-4" />
          <span className="text-base">{location}</span>
        </div>
      )}

      {/* Tagline */}
      {tagline && (
        <p className="text-lg text-gray-200 max-w-2xl font-light leading-relaxed">
          {tagline}
        </p>
      )}
    </div>
  );
};

export default OrganizationBasicInfo;
