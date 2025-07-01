
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield } from 'lucide-react';

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
    <div className="flex-1">
      <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
          {name || 'Unknown Comedian'}
        </h1>
        {is_verified && (
          <div className="flex items-center gap-1">
            <Shield className="w-6 h-6 text-blue-400" />
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-400/30">
              Verified
            </Badge>
          </div>
        )}
      </div>
      
      {/* Location */}
      {location && (
        <div className="flex items-center justify-center lg:justify-start gap-2 mb-4 text-gray-300">
          <MapPin className="w-5 h-5" />
          <span className="text-lg">{location}</span>
        </div>
      )}
      
      {/* Compelling tagline - extracted from first line of bio */}
      {bio && (
        <p className="text-xl text-gray-200 mb-6 max-w-2xl font-light leading-relaxed">
          {bio.split('\n')[0].substring(0, 150)}
          {bio.split('\n')[0].length > 150 ? '...' : ''}
        </p>
      )}
    </div>
  );
};

export default ComedianBasicInfo;
