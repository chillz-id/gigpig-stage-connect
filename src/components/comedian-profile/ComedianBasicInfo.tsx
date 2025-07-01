
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface ComedianBasicInfoProps {
  name: string | null;
  location: string | null;
  bio: string | null;
  is_verified: boolean;
}

const ComedianBasicInfo: React.FC<ComedianBasicInfoProps> = ({ 
  name, 
  location, 
  bio, 
  is_verified 
}) => {
  return (
    <div className="flex-1 text-center md:text-left">
      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
        <h1 className="text-3xl font-bold">{name || 'Unknown Comedian'}</h1>
        {is_verified && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Verified
          </Badge>
        )}
      </div>
      
      {/* Location */}
      {location && (
        <div className="flex items-center justify-center md:justify-start gap-1 mb-4 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
      )}
      
      {/* Quick tagline - extracted from first line of bio */}
      {bio && (
        <p className="text-lg text-muted-foreground mb-6 max-w-md">
          {bio.split('\n')[0].substring(0, 100)}
          {bio.split('\n')[0].length > 100 ? '...' : ''}
        </p>
      )}
    </div>
  );
};

export default ComedianBasicInfo;
